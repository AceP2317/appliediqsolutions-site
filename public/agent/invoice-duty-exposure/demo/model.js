// Invoice duty exposure: a small multinomial naive Bayes text classifier that assigns each
// invoice line description to a two-digit HS chapter, then prices the duty from a rate table.
// Plain script, no build. Loaded by index.html in a browser and by test.mjs in node.
// No LLM, no network. The rates are supplied by the caller and are not HTS rates.
var DutyExposure = (function () {
  var CSV_COLUMNS = ['description', 'value_usd', 'origin'];
  var REVIEW_BELOW = 0.5;

  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  // A count for a key, or 0 when the key is absent. A plain {} inherits keys such as "constructor",
  // so without this a word named that way would read a function, not a count, and give NaN.
  function countOf(o, k) { return hasOwn(o, k) ? o[k] : 0; }

  // Lowercase words of two or more letters or digits.
  function tokenize(text) {
    return String(text).toLowerCase().split(/[^a-z0-9]+/).filter(function (t) { return t.length > 1; });
  }

  // examples: [{ text, chapter }]. Returns the counts the classifier needs.
  function train(examples) {
    var docs = {}, counts = {}, vocab = {};
    examples.forEach(function (ex) {
      var c = String(ex.chapter);
      docs[c] = countOf(docs, c) + 1;
      if (!hasOwn(counts, c)) counts[c] = {};
      tokenize(ex.text).forEach(function (t) {
        vocab[t] = true;
        counts[c][t] = countOf(counts[c], t) + 1;
      });
    });
    var chapters = Object.keys(docs).sort();
    var tokenTotals = {};
    chapters.forEach(function (c) {
      tokenTotals[c] = 0;
      Object.keys(counts[c]).forEach(function (t) { tokenTotals[c] += counts[c][t]; });
    });
    return {
      chapters: chapters,
      docs: docs,
      counts: counts,
      tokenTotals: tokenTotals,
      vocabSize: Object.keys(vocab).length,
      total: examples.length
    };
  }

  // Posterior over chapters, with Laplace (+1) smoothing so an unseen word never zeroes a chapter.
  // An empty description returns the class priors, which is what makes it low confidence.
  function classify(model, text) {
    var tokens = tokenize(text);
    var scores = model.chapters.map(function (c) {
      var logp = Math.log(model.docs[c] / model.total);
      var denom = model.tokenTotals[c] + model.vocabSize;
      tokens.forEach(function (t) {
        logp += Math.log((countOf(model.counts[c], t) + 1) / denom);
      });
      return { chapter: c, logp: logp };
    });
    var top = Math.max.apply(null, scores.map(function (s) { return s.logp; }));
    var sum = 0;
    scores.forEach(function (s) { s.p = Math.exp(s.logp - top); sum += s.p; });
    scores.forEach(function (s) { s.p = s.p / sum; });
    scores.sort(function (a, b) {
      if (b.p !== a.p) return b.p - a.p;
      return a.chapter < b.chapter ? -1 : 1;
    });
    return {
      chapter: scores[0].chapter,
      probability: scores[0].p,
      runnerUp: scores[1] ? scores[1].chapter : null,
      runnerUpProbability: scores[1] ? scores[1].p : 0,
      scores: scores.map(function (s) { return { chapter: s.chapter, probability: s.p }; })
    };
  }

  // Leave-one-out accuracy: each example is classified by a model trained on the others.
  function leaveOneOut(examples) {
    var correct = 0;
    examples.forEach(function (ex, i) {
      var rest = examples.slice(0, i).concat(examples.slice(i + 1));
      var pred = classify(train(rest), ex.text);
      if (pred.chapter === String(ex.chapter)) correct++;
    });
    return { n: examples.length, correct: correct, accuracy: correct / examples.length };
  }

  // CSV with the header in CSV_COLUMNS order. Throws on a bad line, numbered against the original text.
  function parseCsv(text) {
    var numbered = String(text).split(/\r?\n/).map(function (l, i) {
      return { text: l, no: i + 1 };
    }).filter(function (l) { return l.text.trim() !== ''; });
    if (numbered.length < 2) throw new Error('need a header line and at least one line');
    var header = numbered[0].text.split(',').map(function (h) { return h.trim(); });
    if (header.join(',') !== CSV_COLUMNS.join(',')) {
      throw new Error('header must be: ' + CSV_COLUMNS.join(','));
    }
    return numbered.slice(1).map(function (line) {
      var bad = 'bad line ' + line.no + ': ' + line.text;
      var f = line.text.split(',').map(function (v) { return v.trim(); });
      if (f.length !== 3 || f[0] === '' || f[2] === '') throw new Error(bad);
      var value = Number(f[1]);
      if (f[1] === '' || !isFinite(value) || value < 0) throw new Error(bad);
      return { description: f[0], value: value, origin: f[2] };
    });
  }

  function round2(x) { return Math.round(x * 100) / 100; }

  // Classify each line, then price it from rates["chapter|origin"] (percent).
  // A pair with no rate gives ratePct and duty of null, which is not the same as a rate of 0.
  function priceLines(model, lines, rates) {
    return lines.map(function (line) {
      var pred = classify(model, line.description);
      var rate = rates[pred.chapter + '|' + line.origin];
      var priced = typeof rate === 'number';
      return {
        description: line.description,
        value: line.value,
        origin: line.origin,
        chapter: pred.chapter,
        probability: pred.probability,
        review: pred.probability < REVIEW_BELOW,
        ratePct: priced ? rate : null,
        duty: priced ? round2(line.value * rate / 100) : null
      };
    });
  }

  // Review-flagged lines are priced and counted in duty; reviewDuty says how much of it sits on them.
  function totals(priced) {
    var t = { lines: priced.length, value: 0, duty: 0, reviewDuty: 0, unpricedLines: 0, reviewLines: 0 };
    priced.forEach(function (p) {
      t.value += p.value;
      if (p.duty === null) t.unpricedLines++; else t.duty += p.duty;
      if (p.review) {
        t.reviewLines++;
        if (p.duty !== null) t.reviewDuty += p.duty;
      }
    });
    t.value = round2(t.value);
    t.duty = round2(t.duty);
    t.reviewDuty = round2(t.reviewDuty);
    return t;
  }

  // A rate table must map "chapter|origin" to a number from 0 to 100 (percent). Throws otherwise.
  function checkRates(rates) {
    Object.keys(rates).forEach(function (k) {
      var r = rates[k];
      if (typeof r !== 'number' || !isFinite(r) || r < 0 || r > 100) {
        throw new Error('rate for ' + k + ' must be a number from 0 to 100, got ' + JSON.stringify(r));
      }
    });
    return rates;
  }

  return {
    CSV_COLUMNS: CSV_COLUMNS,
    REVIEW_BELOW: REVIEW_BELOW,
    tokenize: tokenize,
    train: train,
    classify: classify,
    leaveOneOut: leaveOneOut,
    parseCsv: parseCsv,
    priceLines: priceLines,
    totals: totals,
    checkRates: checkRates,
    round2: round2
  };
})();
