// Supplier-notice triage: a multinomial naive Bayes text classifier over supplier delay notices,
// plus a rule-based reader for the new promised date and how many days it sits past the need date.
// Classical machine learning, trained in the browser on the labeled notices it is given. Not an LLM.
// Plain script, no build. Loaded by index.html in a browser and by test.mjs in node.
var NoticeModel = (function () {
  var LABELS = ['slip', 'short', 'quality', 'on_track'];
  var MIN_CONFIDENCE = 0.6;
  var DAY_MS = 86400000;
  var STOP = {
    the: 1, a: 1, an: 1, of: 1, to: 1, and: 1, is: 1, are: 1, be: 1, will: 1, for: 1, on: 1,
    in: 1, at: 1, by: 1, we: 1, our: 1, this: 1, that: 1, it: 1, with: 1, has: 1, have: 1,
    was: 1, were: 1, so: 1, as: 1, from: 1, up: 1, out: 1
  };
  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  // Lower-case words only. Digits and punctuation split words and are dropped; stop words are dropped.
  function tokens(text) {
    return String(text).toLowerCase().split(/[^a-z]+/).filter(function (w) {
      return w.length > 0 && !hasOwn(STOP, w);
    });
  }

  // examples: [{ label, text }]. Every label needs at least one example. Returns the model.
  function train(examples) {
    if (!Array.isArray(examples) || examples.length === 0) {
      throw new Error('need at least one labeled notice');
    }
    var m = { n: 0, docs: {}, words: {}, total: {}, vocab: Object.create(null), vocabSize: 0 };
    LABELS.forEach(function (l) {
      m.docs[l] = 0;
      m.words[l] = Object.create(null);
      m.total[l] = 0;
    });
    examples.forEach(function (ex) {
      if (!ex || !hasOwn(m.docs, ex.label)) throw new Error('unknown label: ' + (ex && ex.label));
      m.n += 1;
      m.docs[ex.label] += 1;
      tokens(ex.text).forEach(function (w) {
        m.words[ex.label][w] = (m.words[ex.label][w] || 0) + 1;
        m.total[ex.label] += 1;
        m.vocab[w] = true;
      });
    });
    LABELS.forEach(function (l) {
      if (m.docs[l] === 0) throw new Error('no training notice for label: ' + l);
    });
    m.vocabSize = Object.keys(m.vocab).length;
    return m;
  }

  // Returns { label, confidence, probs, reason }. label is null when the text has no words to read.
  function classify(m, text) {
    var toks = tokens(text);
    if (toks.length === 0) return { label: null, confidence: 0, probs: {}, reason: 'no words to read' };
    var logs = LABELS.map(function (l) {
      var denom = m.total[l] + m.vocabSize; // Laplace smoothing: every word gets a count of at least 1
      var s = Math.log(m.docs[l] / m.n);
      toks.forEach(function (w) { s += Math.log(((m.words[l][w] || 0) + 1) / denom); });
      return s;
    });
    var max = Math.max.apply(null, logs);
    var exps = logs.map(function (s) { return Math.exp(s - max); });
    var z = exps.reduce(function (a, b) { return a + b; }, 0);
    var probs = {};
    LABELS.forEach(function (l, i) { probs[l] = exps[i] / z; });
    var best = LABELS.reduce(function (a, b) { return probs[b] > probs[a] ? b : a; });
    return { label: best, confidence: probs[best], probs: probs, reason: null };
  }

  // 'YYYY-MM-DD' if the calendar date is real, else null.
  function validDate(y, mo, d) {
    if (!mo || !isFinite(y) || !isFinite(d)) return null;
    var t = new Date(Date.UTC(y, mo - 1, d));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
    return y + '-' + pad(mo) + '-' + pad(d);
  }

  // Replace each match of re with spaces of the same length, so offsets stay true, and call onMatch with the
  // match's groups and its offset. A later pass cannot read words an earlier pass has already taken.
  function take(s, re, onMatch) {
    return s.replace(re, function () {
      var n = arguments.length;
      var g = Array.prototype.slice.call(arguments, 0, n - 2);
      onMatch(g, arguments[n - 2]);
      return new Array(g[0].length + 1).join(' ');
    });
  }

  // The new promised date in a notice. A notice often names the old date and then the new one, so the
  // LAST date-like token decides. A month and day with no year take refYear, unless the notice gives a
  // year ("Nov 24 2027"). A date-like token that is not a real date, or one this rule does not read
  // ("24/11/2026", "24.11.", "Nov/24/2027", "late December"), gives null rather than an earlier date.
  // Two-digit years are not read: "24 Nov 27" is 24 Nov. Returns 'YYYY-MM-DD' or null.
  function extractDate(text, refYear) {
    if (typeof refYear !== 'number') throw new Error('refYear must be a number');
    var found = [];
    var s = String(text);
    function note(at, date) { found.push({ at: at, date: date }); }
    // ISO, also with a time after it ("2026-11-24T10:00Z"). A fourth digit after it ("2026-11-241") is not read.
    s = take(s, /\b(\d{4})-(\d{2})-(\d{2})(?!\d)/g, function (g, at) {
      note(at, validDate(+g[1], +g[2], +g[3]));
    });
    // Month name with slashes or dashes, with or without a year ("Nov/24/2027", "now Nov/24"): not read, so it gives
    // null, and an older date before it is not returned.
    s = take(s, /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/gi, function (g, at) {
      note(at, null);
    });
    // Day first, "24 Nov", "3rd December", "24th of November", "24-Nov-2027", "24/Nov/2027", with an optional
    // year. A dash or slash before the month needs a year after it, so the "24-Dec" in "Nov 24-Dec 3" is not read as a
    // day-first date and the range reads its last day. It runs before the month-first pass, so "24 Nov 27" takes
    // "24 Nov" and not "Nov 27".
    s = take(s, /\b(\d{1,2})(?:st|nd|rd|th)?(?:\s+of\s+|\s+|[\/\-](?=[a-z]{3,9}[\/\-](?:19|20)\d{2}))(january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\b(?:(?:,?\s+|[\/\-])(19\d{2}|20\d{2})(?!\d))?/gi, function (g, at) {
      note(at, validDate(g[3] ? +g[3] : refYear, MONTHS[g[2].slice(0, 3).toLowerCase()], +g[1]));
    });
    // "May" in the day-first form only with a capital M ("ETA 24 May", "24 MAY"). "10 may be late" is not a date.
    s = take(s, /\b(\d{1,2})(?:st|nd|rd|th)?(?:\s+of\s+|\s+|[\/\-])(?:May|MAY)\b(?:(?:,?\s+|[\/\-])(19\d{2}|20\d{2})(?!\d))?/g, function (g, at) {
      note(at, validDate(g[2] ? +g[2] : refYear, MONTHS.may, +g[1]));
    });
    // "May" in the month-first form only with a capital M ("May 2", "MAY 2"). Lower-case "may" is a verb, so
    // "we may 2 shifts late" is not a date.
    s = take(s, /\b(May|MAY)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(19\d{2}|20\d{2}))?(?![\/\-]\d)\b/g, function (g, at) {
      note(at, validDate(g[3] ? +g[3] : refYear, MONTHS.may, +g[2]));
    });
    // Month first, "Nov 24", "Nov 24th", "November 24, 2027". An explicit year replaces refYear. A range such as
    // "Nov 24-25" is not read here (the dash stops it), so the numeric pass below gives it null.
    s = take(s, /\b(january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(19\d{2}|20\d{2}))?(?![\/\-]\d)\b/gi, function (g, at) {
      note(at, validDate(g[3] ? +g[3] : refYear, MONTHS[g[1].slice(0, 3).toLowerCase()], +g[2]));
    });
    // A month with no day ("late December", "end of November") is not a date. It gives null, so an older date
    // before it is not returned.
    s = take(s, /\b(early|mid|late|end|beginning|start)(\s+of)?[\s\-]+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\b/gi, function (g, at) {
      note(at, null);
    });
    // Other numeric dates ("24/11/2026", "24-11-2026", "24/11", "11-24"). None is read, so each gives null. A bare
    // pair of one-digit parts with no year ("part 3/4") is not a date and is not counted. A unit
    // word after the numbers makes them a quantity ("2-3 weeks", "10-20 units"), not a date, and they are skipped.
    s = take(s, /\b(?=\d{2}[\/\-]\d{2}\b|\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}\b)(\d{1,4})([\/\-])(\d{1,2})(?:\2(\d{1,4}))?\b(?!\s*(?:wks?|weeks?|days?|hours?|hrs?|shifts?|units?|pallets?|pcs|pieces?|lots?|boxes|cases|loads|trucks|containers|%))/g, function (g, at) {
      note(at, null);
    });
    // Dotted forms, "24.11.2026" and "24.11.". A decimal such as "10.5 days" is not a date, and neither is a
    // one-digit pair with a full stop at the end of a sentence ("Short by 3.5."): a year-less form needs two-digit parts.
    take(s, /\b(?=\d{2}\.\d{2}\.|\d{1,2}\.\d{1,2}\.\d{4}(?!\d))(\d{1,2})\.(\d{1,2})\.(\d{2,4})?(?!\d)/g, function (g, at) {
      note(at, null);
    });
    found.sort(function (a, b) { return a.at - b.at; });
    // The last date-like token decides, even when it is unreadable: "now 31 Nov" gives null, not the older date.
    return found.length ? found[found.length - 1].date : null;
  }

  // Whole days from b to a (a minus b), both 'YYYY-MM-DD'. Positive means a is later.
  function daysBetween(a, b) {
    return (Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / DAY_MS;
  }

  // c: a classify() result. newDate: extractDate() result or null. late: daysBetween(newDate, need) or null.
  function verdict(c, newDate, late) {
    if (c.label === null) return 'REVIEW: no readable words';
    if (c.confidence < MIN_CONFIDENCE) return 'REVIEW: low confidence (' + c.label + ')';
    if (c.label === 'quality') return 'HOLD: quality, escalate';
    if (c.label === 'short') return 'SHORT: confirm the quantity';
    if (c.label === 'slip') {
      if (newDate === null) return 'SLIP: no usable date, ask the supplier';
      if (late === null) return 'SLIP to ' + newDate + ': no need date to compare';
      if (late > 0) return 'LATE by ' + late + ' days vs need date';
      return 'SLIP, still in time (' + (-late) + ' days spare)';
    }
    // on_track. With no readable date there is nothing to check, so it is not an OK.
    if (newDate === null) return 'REVIEW: on track, but no readable date to check';
    if (late === null) return 'ON TRACK to ' + newDate + ': no need date to compare';
    if (late > 0) return 'CONFLICT: says on track but date is ' + late + ' days after need';
    return 'OK';
  }

  // One notice against one PO. po = { need: 'YYYY-MM-DD' } or null. refYear sets the year for "Nov 24".
  function assess(m, text, po, refYear) {
    var c = classify(m, text);
    var newDate = extractDate(text, refYear);
    var late = (newDate !== null && po && po.need) ? daysBetween(newDate, po.need) : null;
    return {
      label: c.label,
      confidence: c.confidence,
      newDate: newDate,
      daysVsNeed: late,
      verdict: verdict(c, newDate, late)
    };
  }

  return {
    LABELS: LABELS,
    MIN_CONFIDENCE: MIN_CONFIDENCE,
    tokens: tokens,
    train: train,
    classify: classify,
    extractDate: extractDate,
    daysBetween: daysBetween,
    verdict: verdict,
    assess: assess
  };
})();
