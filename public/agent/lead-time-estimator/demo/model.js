// Lead-time estimator: k-nearest-neighbor regression over past purchase orders.
// An instance-based model: it keeps the past orders and averages the most similar ones.
// Plain script, no build. Loaded by index.html in a browser and by test.mjs in node.
// Input rows: { origin, carrier, peak (0 or 1), distanceNm, days }.
var LeadTimeModel = (function () {
  var COLUMNS = ['origin', 'carrier', 'peak', 'distance_nm', 'lead_days'];

  // CSV with a header line in COLUMNS order. Returns rows, or throws on a bad line.
  // Blank lines are skipped, but error messages keep the line number in the original text.
  function parseCsv(text) {
    var lines = String(text).split(/\r?\n/);
    var numbered = lines
      .map(function (l, i) { return { text: l, no: i + 1 }; })
      .filter(function (l) { return l.text.trim() !== ''; });
    if (numbered.length < 2) throw new Error('need a header line and at least one row');
    var header = numbered[0].text.split(',').map(function (h) { return h.trim(); });
    if (header.join(',') !== COLUMNS.join(',')) {
      throw new Error('header must be: ' + COLUMNS.join(','));
    }
    return numbered.slice(1).map(function (line) {
      var f = line.text.split(',').map(function (v) { return v.trim(); });
      var bad = 'bad row on line ' + line.no + ': ' + line.text;
      if (f.length !== 5 || f.some(function (v) { return v === ''; })) throw new Error(bad);
      var row = {
        origin: f[0],
        carrier: f[1],
        peak: Number(f[2]),
        distanceNm: Number(f[3]),
        days: Number(f[4])
      };
      if ((row.peak !== 0 && row.peak !== 1) ||
          !isFinite(row.distanceNm) || row.distanceNm < 0 ||
          !isFinite(row.days) || row.days < 0) {
        throw new Error(bad);
      }
      return row;
    });
  }

  // Distance between two orders: one unit per categorical mismatch, plus the
  // distance gap scaled by the range of distances in the history.
  function distance(a, b, range) {
    var d = 0;
    if (a.origin !== b.origin) d += 1;
    if (a.carrier !== b.carrier) d += 1;
    if (a.peak !== b.peak) d += 1;
    d += Math.abs(a.distanceNm - b.distanceNm) / range;
    return d;
  }

  function rangeOf(history) {
    var lo = Infinity, hi = -Infinity;
    history.forEach(function (r) {
      if (r.distanceNm < lo) lo = r.distanceNm;
      if (r.distanceNm > hi) hi = r.distanceNm;
    });
    return hi > lo ? hi - lo : 1;
  }

  // Predict days for one query from the k most similar past orders.
  // k is floored to a whole number, then clamped to 1..history length.
  function predict(history, query, k) {
    if (!history.length) throw new Error('empty history');
    var range = rangeOf(history);
    var kk = Math.max(1, Math.min(Math.floor(k) || 1, history.length));
    var scored = history.map(function (r, i) {
      return { row: r, i: i, d: distance(r, query, range) };
    });
    scored.sort(function (x, y) { return x.d - y.d || x.i - y.i; });
    var near = scored.slice(0, kk);
    var sum = 0, low = Infinity, high = -Infinity;
    near.forEach(function (n) {
      sum += n.row.days;
      if (n.row.days < low) low = n.row.days;
      if (n.row.days > high) high = n.row.days;
    });
    return { days: sum / kk, low: low, high: high, k: kk, neighbors: near.map(function (n) { return n.row; }) };
  }

  // Baseline 1: the same number for every order.
  function meanBaseline(history) {
    var sum = 0;
    history.forEach(function (r) { sum += r.days; });
    return sum / history.length;
  }

  // Baseline 2: the average for the order's own origin (lane). This is the bar that matters.
  function laneBaseline(history, query) {
    var same = history.filter(function (r) { return r.origin === query.origin; });
    if (!same.length) return meanBaseline(history);
    return meanBaseline(same);
  }

  // Leave each order out in turn, predict it from the rest, and compare mean absolute errors.
  // Needs at least two orders; returns null for fewer.
  // Returns the k actually used: each held-out fold has n - 1 orders to choose from.
  function leaveOneOut(history, k) {
    var n = history.length;
    if (n < 2) return null;
    var kk = Math.max(1, Math.min(Math.floor(k) || 1, n - 1));
    var mKnn = 0, mMean = 0, mLane = 0;
    history.forEach(function (row, i) {
      var rest = history.filter(function (_, j) { return j !== i; });
      mKnn += Math.abs(predict(rest, row, kk).days - row.days);
      mMean += Math.abs(meanBaseline(rest) - row.days);
      mLane += Math.abs(laneBaseline(rest, row) - row.days);
    });
    return { n: n, k: kk, knnMae: mKnn / n, meanMae: mMean / n, laneMae: mLane / n };
  }

  return {
    COLUMNS: COLUMNS,
    parseCsv: parseCsv,
    distance: distance,
    predict: predict,
    meanBaseline: meanBaseline,
    laneBaseline: laneBaseline,
    leaveOneOut: leaveOneOut
  };
})();
