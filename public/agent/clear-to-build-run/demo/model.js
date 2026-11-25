// Clear-to-build run: time-phased allocation of parts to open orders, in due-date order.
// Reads four small CSV tables (orders, bill of material, stock on hand, inbound purchase orders),
// hands each order its full kit of parts or nothing, and says when each order can be built,
// which orders will be late or are short, and which parts block the most orders.
// Fixed arithmetic, no model call, no network. Plain script, no build.
// Loaded by index.html in a browser and by test.mjs in node.
var ClearToBuild = (function () {
  var DAY_MS = 86400000;
  var EPS = 1e-9;

  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function round6(x) { return Math.round(x * 1e6) / 1e6; }
  // Lookup tables with no prototype, so a part named "constructor" or "__proto__" is just a name.
  function map() { return Object.create(null); }

  // 'YYYY-MM-DD' to a whole day number, or null if it is not a real calendar date.
  function dayNum(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    var t = Date.UTC(y, mo - 1, d);
    var back = new Date(t);
    if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
    return Math.round(t / DAY_MS);
  }

  function isoOf(n) {
    var d = new Date(n * DAY_MS);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  // A plain number: digits with an optional decimal part. No signs, units or thousands commas.
  function num(s) {
    var t = String(s).trim();
    if (!/^\d+(\.\d+)?$/.test(t)) return null;
    return +t;
  }

  // Simple CSV: one row per line, comma-separated, no quoted fields. Blank lines and lines
  // starting with # are skipped. The first remaining line is the header.
  function readTable(text, name, required, optional) {
    var errors = [];
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0 && l.charAt(0) !== '#'; });
    if (lines.length === 0) return { rows: [], cols: {}, errors: [name + ': the table is empty'] };
    var head = lines[0].split(',').map(function (h) { return h.trim().toLowerCase(); });
    var cols = map();
    head.forEach(function (h, i) { if (h && !hasOwn(cols, h)) cols[h] = i; });
    required.forEach(function (c) {
      if (!hasOwn(cols, c)) errors.push(name + ': missing column "' + c + '"');
    });
    if (errors.length) return { rows: [], cols: cols, errors: errors };
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var cells = lines[i].split(',').map(function (c) { return c.trim(); });
      if (cells.length !== head.length) {
        errors.push(name + ' line ' + (i + 1) + ': has ' + cells.length + ' cells, header has ' + head.length);
        continue;
      }
      var row = { _line: i + 1 };
      required.concat(optional || []).forEach(function (c) {
        if (hasOwn(cols, c)) row[c] = cells[cols[c]];
      });
      rows.push(row);
    }
    if (rows.length === 0 && errors.length === 0) errors.push(name + ': no rows under the header');
    return { rows: rows, cols: cols, errors: errors };
  }

  // Turns the four CSV texts and today's date into checked data.
  // input: { orders, bom, stock, inbound, today } (strings). Returns { data, errors, warnings }.
  function readInputs(input) {
    var errors = [], warnings = [];
    var today = dayNum(input.today);
    if (today === null) errors.push('today: "' + input.today + '" is not a date in YYYY-MM-DD form');

    var o = readTable(input.orders, 'orders', ['order', 'item', 'qty', 'due'], ['value']);
    var b = readTable(input.bom, 'bom', ['item', 'component', 'qty_per'], []);
    var s = readTable(input.stock, 'stock', ['part', 'on_hand'], []);
    var n = readTable(input.inbound, 'inbound', ['part', 'qty', 'date'], []);
    errors = errors.concat(o.errors, b.errors, s.errors);
    // An empty inbound table is allowed: no purchase orders on the way.
    n.errors.forEach(function (e) {
      if (!/the table is empty|no rows under the header/.test(e)) errors.push(e);
    });

    var hasValue = hasOwn(o.cols, 'value');
    var orders = [], seenOrder = map();
    o.rows.forEach(function (r) {
      var where = 'orders line ' + r._line + ': ';
      var q = num(r.qty), d = dayNum(r.due), v = hasValue ? num(r.value) : null;
      if (!r.order) { errors.push(where + 'order id is blank'); return; }
      if (hasOwn(seenOrder, r.order)) { errors.push(where + 'order ' + r.order + ' appears twice'); return; }
      seenOrder[r.order] = 1;
      if (!r.item) { errors.push(where + 'item is blank'); return; }
      if (q === null || q <= 0) { errors.push(where + 'qty "' + r.qty + '" is not a number above zero'); return; }
      if (d === null) { errors.push(where + 'due "' + r.due + '" is not a date in YYYY-MM-DD form'); return; }
      if (hasValue && v === null) { errors.push(where + 'value "' + r.value + '" is not a number (leave the whole column out if you have no values)'); return; }
      orders.push({ order: r.order, item: r.item, qty: q, due: d, value: hasValue ? v : null });
    });

    var bom = map(), seenPair = map();
    b.rows.forEach(function (r) {
      var where = 'bom line ' + r._line + ': ';
      var q = num(r.qty_per);
      if (!r.item || !r.component) { errors.push(where + 'item or component is blank'); return; }
      if (r.item === r.component) { errors.push(where + r.item + ' lists itself as a component'); return; }
      if (q === null || q <= 0) { errors.push(where + 'qty_per "' + r.qty_per + '" is not a number above zero'); return; }
      var key = r.item + '\u0000' + r.component;
      if (hasOwn(seenPair, key)) { errors.push(where + r.item + ' lists ' + r.component + ' twice'); return; }
      seenPair[key] = 1;
      if (!hasOwn(bom, r.item)) bom[r.item] = [];
      bom[r.item].push({ part: r.component, per: q });
    });

    var onHand = map();
    s.rows.forEach(function (r) {
      var where = 'stock line ' + r._line + ': ';
      var q = num(r.on_hand);
      if (!r.part) { errors.push(where + 'part is blank'); return; }
      if (hasOwn(onHand, r.part)) { errors.push(where + 'part ' + r.part + ' appears twice'); return; }
      if (q === null) { errors.push(where + 'on_hand "' + r.on_hand + '" is not a number of zero or more'); return; }
      onHand[r.part] = q;
    });

    var inbound = [];
    n.rows.forEach(function (r) {
      var where = 'inbound line ' + r._line + ': ';
      var q = num(r.qty), d = dayNum(r.date);
      if (!r.part) { errors.push(where + 'part is blank'); return; }
      if (q === null || q <= 0) { errors.push(where + 'qty "' + r.qty + '" is not a number above zero'); return; }
      if (d === null) { errors.push(where + 'date "' + r.date + '" is not a date in YYYY-MM-DD form'); return; }
      inbound.push({ part: r.part, qty: q, date: d, line: r._line });
    });

    // Cross-checks between tables.
    var components = map();
    Object.keys(bom).forEach(function (item) {
      bom[item].forEach(function (c) {
        components[c.part] = 1;
        if (hasOwn(bom, c.part)) {
          errors.push('bom: ' + c.part + ' is a component of ' + item + ' and also has its own bill of material; this demo reads one level only');
        }
      });
    });
    orders.forEach(function (ord) {
      if (!hasOwn(bom, ord.item)) errors.push('orders: item ' + ord.item + ' (order ' + ord.order + ') has no rows in the bill of material');
    });
    Object.keys(components).sort().forEach(function (p) {
      if (!hasOwn(onHand, p)) {
        warnings.push('stock: no row for ' + p + ', counted as 0 on hand');
      }
    });
    if (today !== null) {
      inbound.forEach(function (r) {
        if (r.date < today) {
          warnings.push('inbound line ' + r.line + ': ' + r.part + ' was due ' + isoOf(r.date) + ', before today; counted as arriving today');
        }
      });
    }

    return {
      data: { today: today, orders: orders, bom: bom, onHand: onHand, inbound: inbound, hasValue: hasValue },
      errors: errors,
      warnings: warnings
    };
  }

  // Supply events per part: on hand at today, each inbound at its date (a past date counts as today).
  function supplyTimeline(data) {
    var t = map();
    function add(part, day, qty) {
      if (!hasOwn(t, part)) t[part] = [];
      t[part].push({ day: day, qty: qty });
    }
    Object.keys(data.onHand).forEach(function (p) { add(p, data.today, data.onHand[p]); });
    data.inbound.forEach(function (r) { add(r.part, Math.max(r.date, data.today), r.qty); });
    Object.keys(t).forEach(function (p) { t[p].sort(function (a, b) { return a.day - b.day; }); });
    return t;
  }

  function cumBy(events, day) {
    var c = 0;
    (events || []).forEach(function (e) { if (e.day <= day) c += e.qty; });
    return c;
  }

  // First day on which cumulative supply reaches `claim`, or null if known supply never does.
  function coverDay(events, claim, today) {
    if (claim <= EPS) return today;
    var c = 0;
    var ev = events || [];
    for (var i = 0; i < ev.length; i++) {
      c += ev[i].qty;
      if (c + EPS >= claim) return ev[i].day;
    }
    return null;
  }

  function totalSupply(events) { return cumBy(events, Infinity); }

  // Step 2: gross requirement per part over all open orders, against all known supply.
  function explode(data) {
    var gross = map();
    data.orders.forEach(function (o) {
      data.bom[o.item].forEach(function (c) {
        gross[c.part] = round6((gross[c.part] || 0) + o.qty * c.per);
      });
    });
    var inboundTotal = map();
    data.inbound.forEach(function (r) { inboundTotal[r.part] = round6((inboundTotal[r.part] || 0) + r.qty); });
    return Object.keys(gross).sort().map(function (p) {
      var oh = data.onHand[p] || 0, ib = inboundTotal[p] || 0;
      return { part: p, gross: gross[p], onHand: oh, inbound: ib, net: round6(oh + ib - gross[p]) };
    });
  }

  // Priority: earliest due date first, then order id in text order.
  function priorityOrder(orders) {
    return orders.slice().sort(function (a, b) {
      if (a.due !== b.due) return a.due - b.due;
      return a.order < b.order ? -1 : a.order > b.order ? 1 : 0;
    });
  }

  // Step 3: hand out parts. Each order, in priority order, gets its whole kit or nothing.
  // An order whose kit known supply can never complete claims nothing, so it does not hold up
  // the orders behind it. A claimed part stays claimed from the first day it is available.
  function allocate(data) {
    var tl = supplyTimeline(data);
    var claimed = map();
    var today = data.today;
    return priorityOrder(data.orders).map(function (o, idx) {
      var lines = data.bom[o.item].map(function (c) {
        var need = round6(o.qty * c.per);
        var before = claimed[c.part] || 0;
        var cover = coverDay(tl[c.part], before + need, today);
        var shortfall = cover === null ? round6(before + need - totalSupply(tl[c.part])) : 0;
        return { part: c.part, need: need, claimedBefore: before, cover: cover, shortfall: shortfall };
      });
      var isShort = lines.some(function (l) { return l.cover === null; });
      var res = {
        order: o.order, item: o.item, qty: o.qty, due: o.due, value: o.value, priority: idx + 1,
        lines: lines, status: null, clear: null, daysLate: 0, pastDue: 0, binding: [], waitingOn: [], pullIns: []
      };
      var target = Math.max(o.due, today);
      if (isShort) {
        res.status = 'short';
        res.binding = lines.filter(function (l) { return l.cover === null; }).map(function (l) { return l.part; });
      } else {
        lines.forEach(function (l) { claimed[l.part] = round6((claimed[l.part] || 0) + l.need); });
        res.clear = Math.max.apply(null, lines.map(function (l) { return l.cover; }));
        var latest = lines.filter(function (l) { return l.cover === res.clear; }).map(function (l) { return l.part; });
        if (res.clear === today) {
          res.status = 'clear-now';
          res.pastDue = Math.max(0, today - o.due);
        } else if (res.clear <= o.due) {
          res.status = 'on-time';
          res.waitingOn = latest;
        } else {
          res.status = 'late';
          res.daysLate = res.clear - o.due;
          res.binding = latest;
        }
      }
      // For each blocking part: how much more of it would have to arrive by the due date
      // (or today, if the order is already past due) for that part to stop blocking this order,
      // with every order ahead of it keeping what it claimed.
      res.binding.forEach(function (p) {
        var l = lines.filter(function (x) { return x.part === p; })[0];
        var qty = round6(l.claimedBefore + l.need - cumBy(tl[p], target));
        res.pullIns.push({ part: p, qty: qty, by: target });
      });
      return res;
    });
  }

  // Step 4: rank the parts that block late or short orders.
  // An order blocked by two parts at once counts under both, and is marked as shared.
  function rank(results, hasValue) {
    var byPart = map();
    results.forEach(function (r) {
      r.binding.forEach(function (p) {
        if (!hasOwn(byPart, p)) byPart[p] = { part: p, orders: [], late: 0, short: 0, units: 0, value: hasValue ? 0 : null, pullIns: [], shared: [] };
        var e = byPart[p];
        e.orders.push(r.order);
        if (r.status === 'late') e.late++; else e.short++;
        e.units = round6(e.units + r.qty);
        if (hasValue) e.value = round6(e.value + r.value);
        r.pullIns.filter(function (x) { return x.part === p; }).forEach(function (x) {
          e.pullIns.push({ order: r.order, qty: x.qty, by: x.by });
        });
        if (r.binding.length > 1) e.shared.push(r.order);
      });
    });
    var list = Object.keys(byPart).map(function (k) { return byPart[k]; });
    list.forEach(function (e) { e.pullIns.sort(function (a, b) { return a.by - b.by || (a.order < b.order ? -1 : 1); }); });
    list.sort(function (a, b) {
      if (hasValue && a.value !== b.value) return b.value - a.value;
      if (a.orders.length !== b.orders.length) return b.orders.length - a.orders.length;
      if (a.units !== b.units) return b.units - a.units;
      return a.part < b.part ? -1 : a.part > b.part ? 1 : 0;
    });
    return list;
  }

  function counts(results) {
    var c = { total: results.length, 'clear-now': 0, 'on-time': 0, late: 0, short: 0, pastDueClear: 0 };
    results.forEach(function (r) {
      c[r.status]++;
      if (r.status === 'clear-now' && r.pastDue > 0) c.pastDueClear++;
    });
    return c;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  // Step 5: the note for the shortage meeting, as plain text.
  function note(today, results, ranked, hasValue, label) {
    var c = counts(results);
    var out = [];
    out.push('Clear-to-build run for ' + isoOf(today) + (label ? ' (' + label + ')' : ''));
    out.push('');
    out.push(plural(c.total, 'open order', 'open orders') + ': ' +
      c['clear-now'] + ' can be built today, ' +
      c['on-time'] + ' more will be built on time as inbound parts land, ' +
      c.late + ' will be late, and ' +
      c.short + ' cannot be built on the supply we know of.');
    if (c.pastDueClear > 0) {
      out.push(plural(c.pastDueClear, 'order is', 'orders are') + ' already past due but has every part today: build ' + (c.pastDueClear === 1 ? 'it' : 'them') + ' first.');
    }
    if (ranked.length === 0) {
      out.push('');
      out.push('No part is holding up an order past its due date.');
      return out.join('\n');
    }
    out.push('');
    out.push('Expedite first:');
    ranked.slice(0, 3).forEach(function (e, i) {
      var first = e.pullIns[0];
      var line = (i + 1) + '. ' + e.part + ': blocks ' + plural(e.orders.length, 'order', 'orders') +
        ' (' + e.orders.join(', ') + ')';
      if (hasValue) line += ', value ' + e.value;
      line += '. For ' + e.part + ' to stop holding up ' + first.order + ', ' + first.qty + ' more must arrive by ' + isoOf(first.by) + '.';
      if (e.shared.length) line += ' ' + e.shared.join(', ') + (e.shared.length === 1 ? ' is' : ' are') + ' also blocked by another part.';
      out.push(line);
    });
    if (ranked.length > 3) out.push('(' + plural(ranked.length - 3, 'more blocking part', 'more blocking parts') + ' in the full list.)');
    var late = results.filter(function (r) { return r.status === 'late'; });
    if (late.length) {
      out.push('');
      out.push('Late orders, in priority order:');
      late.forEach(function (r) {
        out.push('- ' + r.order + ' (' + r.item + ' x ' + r.qty + '): due ' + isoOf(r.due) + ', buildable ' + isoOf(r.clear) +
          ', ' + plural(r.daysLate, 'day', 'days') + ' late, waiting on ' + r.binding.join(' and ') + '.');
      });
    }
    var short = results.filter(function (r) { return r.status === 'short'; });
    if (short.length) {
      out.push('');
      out.push('Short with no inbound that covers them:');
      short.forEach(function (r) {
        var parts = r.lines.filter(function (l) { return l.cover === null; })
          .map(function (l) { return l.part + ' short ' + l.shortfall; });
        out.push('- ' + r.order + ' (' + r.item + ' x ' + r.qty + '): due ' + isoOf(r.due) + ', ' + parts.join(', ') + '.');
      });
    }
    return out.join('\n');
  }

  // The whole run. Returns { ok, errors, warnings, data, explode, results, ranked, counts, note }.
  function run(input, label) {
    var read = readInputs(input);
    if (read.errors.length) return { ok: false, errors: read.errors, warnings: read.warnings };
    var d = read.data;
    var results = allocate(d);
    var ranked = rank(results, d.hasValue);
    return {
      ok: true, errors: [], warnings: read.warnings, data: d,
      explode: explode(d), results: results, ranked: ranked, counts: counts(results),
      note: note(d.today, results, ranked, d.hasValue, label)
    };
  }

  return {
    dayNum: dayNum, isoOf: isoOf, readTable: readTable, readInputs: readInputs,
    supplyTimeline: supplyTimeline, coverDay: coverDay, explode: explode,
    priorityOrder: priorityOrder, allocate: allocate, rank: rank, counts: counts, note: note, run: run
  };
})();
