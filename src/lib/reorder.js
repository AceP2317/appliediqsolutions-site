/* ============================================================================
   REORDER LIST — the engine. Days of cover, and what to order.

   Shopify's Stocky app was retired on 31 August 2026 — its own words, at
   https://help.shopify.com/en/manual/products/inventory/stocky : "The Stocky app
   will no longer be available after August 31st, 2026." Read 2026-08-25. That is
   a category being VACATED rather than absorbed, which is the inverse of what
   happened to the review console, and it is the whole reason this tool exists.
   A dated claim about another company on a public page carries its source. What does not travel is the rest of it: which
   supplier, how long they actually take, and how much cover this business wants
   to sit on.

   THE HONESTY CONTRACT, and days of cover tests it harder than anything else on
   this shelf, because the number is inherently forward-looking and reads as a
   prediction even when it is pure division.

   IT FORECASTS NOTHING. Usage is a figure the owner supplies from their own
   history — this does not fit a curve, smooth anything, or weight recent weeks
   more heavily. Every answer is one division and it says so beside the number.

   THERE IS NO INVENTED SAFETY STOCK. The buffer is an input and it DEFAULTS TO
   ZERO, because a safety margin nobody chose is a number this page made up.
   No service level, no z-score, no standard deviation of demand.

   AND IT NEVER STATES A RUN-OUT DATE AS FACT. "At the usage you entered, this
   lasts eleven days" is arithmetic. "You will run out on the 4th" is a promise
   about the future, and this makes none.
   ============================================================================ */

/** Days of cover: what is on hand divided by what goes out in a day. */
export function coverDays(onHand, dailyUsage) {
  if (dailyUsage <= 0) return null;
  return onHand / dailyUsage;
}

export function computeReorder(input) {
  const { items, bufferDays, horizonDays } = input;

  const rows = items.map((it) => {
    /* A CELL THAT COULD NOT BE READ IS NOT A ZERO. sheet-read.js returns null
       rather than 0 for a cell it cannot honestly parse — an accounting
       negative, a date in a quantity column, a header row that slipped into the
       data. Treating that as 0 gives an item a real stockout it does not have,
       or a real dead line it does not have, and the row then gets a confident
       message naming a cause that is not the cause. It is named and set aside
       instead. */
    if (it.onHand == null || it.usage == null || it.leadDays == null) {
      const missing = [
        it.onHand == null && 'what is on hand',
        it.usage == null && 'the usage',
        it.leadDays == null && 'the lead time',
      ].filter(Boolean);
      return { ...it, daily: null, cover: null, orderInDays: null, qty: null, state: 'unreadable', missing };
    }
    const daily = it.periodDays > 0 ? it.usage / it.periodDays : 0;
    const cover = coverDays(it.onHand, daily);

    /* When to place the order: cover, less the lead time, less whatever buffer
       the owner asked for. Negative means it should already have gone. */
    const orderInDays = cover == null ? null : cover - it.leadDays - bufferDays;

    /* How much to bring in to reach the horizon the owner set, after the lead
       time has been served out of what is on hand. Rounded UP, because a part
       order does not keep a line running. */
    const needFor = daily * (horizonDays + it.leadDays + bufferDays);
    const qty = Math.max(0, Math.ceil(needFor - it.onHand));

    let state = 'ok';
    if (cover == null) state = 'no usage';
    else if (orderInDays <= 0) state = 'order now';
    else if (orderInDays <= 7) state = 'order this week';

    return { ...it, daily, cover, orderInDays, qty, state };
  });

  const order = rows
    .filter((r) => r.state === 'order now' || r.state === 'order this week')
    .sort((a, b) => a.orderInDays - b.orderInDays);

  const problems = [];
  for (const r of rows.filter((x) => x.state === 'unreadable')) {
    problems.push(
      `${r.name || 'A row'} could not be read: ${r.missing.join(' and ')} did not come through as ${r.missing.length > 1 ? 'numbers' : 'a number'}. It is left out rather than counted as nothing.`,
    );
  }
  /* NAME THE ACTUAL CAUSE. This said "shows no usage over the period" whenever
     the daily rate came out at zero — including when usage was 70 and the PERIOD
     was zero, which is a tool asserting something untrue about the owner's own
     data. Three different causes, three different sentences. */
  for (const r of rows.filter((x) => x.state === 'no usage')) {
    if (r.periodDays <= 0) {
      problems.push(`${r.name} has no number of days on its usage, so there is nothing to divide by. How many days does that usage figure cover?`);
    } else if (r.usage < 0) {
      problems.push(`${r.name} has negative usage on it, which cannot be right.`);
    } else {
      problems.push(`${r.name} shows no usage over the period, so there is nothing to divide by and no cover to work out.`);
    }
  }
  for (const r of rows.filter((x) => x.leadDays < 0)) {
    problems.push(`${r.name} has a negative lead time, which makes it look less urgent than it is.`);
  }
  for (const r of rows.filter((x) => x.onHand < 0)) {
    problems.push(`${r.name} is down as a negative quantity on hand, which cannot be right.`);
  }
  for (const r of rows.filter((x) => x.leadDays === 0 && x.state !== 'no usage')) {
    problems.push(`${r.name} has no lead time on it, so this assumes it arrives the day you ask. Put in how long the supplier actually takes.`);
  }

  return {
    rows, order, bufferDays, horizonDays,
    counts: {
      now: rows.filter((r) => r.state === 'order now').length,
      week: rows.filter((r) => r.state === 'order this week').length,
      ok: rows.filter((r) => r.state === 'ok').length,
      unknown: rows.filter((r) => r.state === 'no usage').length,
      unreadable: rows.filter((r) => r.state === 'unreadable').length,
    },
    problems,
  };
}
