/* ============================================================================
   TUITION SHEET — what each family owes this week, on the center's own rate
   card, its own sibling rule and its own late-pickup rate.

   ── WHY THIS IS NOT A RATIO CALCULATOR, AND THE DISTINCTION IS THE WHOLE TOOL ─

   The obvious thing to build for a childcare center is staffing ratios. It is
   also the wrong thing, twice over.

   Ratios are set by state rule. They are identical for every center in North
   Carolina, which means a platform can hold them and a tool built on them
   belongs to the trade rather than to the owner — D36's test, failed outright.

   And worse: a page that told an owner their staffing was fine would be making
   a compliance claim about a licensed operation from numbers typed into a
   browser. That is the one thing this shelf must never do. So ratios are
   REFUSED here in the list written to be exhaustive, rather than quietly
   omitted.

   ── WHAT IS ACTUALLY THE OWNER'S ────────────────────────────────────────────

   Four things, and no two centers write them the same way:

     1. THE RATE CARD — a weekly rate per room, and a day rate for part-time,
        which is never simply the weekly rate divided by five.
     2. THE SIBLING RULE — a percentage, and WHICH enrollment it comes off.
        Taking it off the cheapest child and taking it off the dearest are both
        common, and they are different amounts of money.
     3. WHETHER A SUBSIDY GAP IS BILLED — a voucher covers part of a place and
        some centers bill the family the difference while others absorb it.
     4. THE LATE-PICKUP RATE, per minute after close.

   ── THE SIBLING DISCOUNT COMES OFF ONE ENROLLMENT, NOT OFF THE FAMILY ────────

   A percentage applied to a family's whole bill is a different and larger
   number than the same percentage applied to one child's place. Centers write
   the second one, so that is what this computes, and which enrollment it lands
   on is a setting rather than an assumption.

   Money is integer cents; percentages are integer hundredths of a percent.

   THE HONESTY CONTRACT. Every rate, the discount, the rule it follows and the
   late fee are the center's own. Nothing here suggests a rate, compares this
   center to any published tuition figure, computes a ratio, or takes any view
   on whether a family should be billed a subsidy gap.
   ============================================================================ */

/**
 * @param {object} input
 * @param {Array}  input.rooms      [{id, name, weeklyCents, dayCents}]
 * @param {number} input.siblingPctHundredths
 * @param {'cheapest'|'dearest'} input.siblingApplies  which enrollment it comes off
 * @param {number} input.lateCentsPerMinute
 * @param {boolean} input.billSubsidyGap  does the family pay what the voucher leaves
 * @param {Array}  input.families
 *   [{id, name, subsidyCents, lateMinutes,
 *     children: [{id, name, roomId, fullTime, days}]}]
 */
export function computeTuition(input) {
  const rooms = Array.isArray(input.rooms) ? input.rooms : [];
  const src = Array.isArray(input.families) ? input.families : [];
  const pct = Math.max(0, Math.round(input.siblingPctHundredths || 0));
  const applies = input.siblingApplies === 'dearest' ? 'dearest' : 'cheapest';
  const lateRate = Math.max(0, Math.round(input.lateCentsPerMinute || 0));
  const billGap = input.billSubsidyGap !== false;

  const roomOf = (id) => rooms.find((r) => r.id === id) || null;

  const families = src.map((f) => {
    const kids = Array.isArray(f.children) ? f.children : [];

    const children = kids.map((c) => {
      const room = roomOf(c.roomId);
      const fullTime = c.fullTime !== false;
      const days = Math.max(0, Math.min(7, Math.round(c.days || 0)));
      /* A DAY RATE IS NOT THE WEEKLY RATE OVER FIVE, and centers price it
         deliberately higher because a part-time place still holds a space. */
      const gross = room
        ? (fullTime ? Math.max(0, Math.round(room.weeklyCents || 0)) : days * Math.max(0, Math.round(room.dayCents || 0)))
        : 0;
      return {
        ...c,
        roomName: room ? room.name : null,
        fullTime, days, gross,
        noRoom: !room,
        daysOverWeek: !fullTime && days > 5,
      };
    });

    const gross = children.reduce((a, c) => a + c.gross, 0);

    /* ONE ENROLLMENT, NOT THE FAMILY. Applied to the whole bill this would be a
       materially larger discount, and it is not what a center's rule says. */
    const priced = children.filter((c) => c.gross > 0);
    let discountOn = null;
    if (pct > 0 && priced.length > 1) {
      discountOn = priced.reduce(
        (best, c) => (best == null ? c : (applies === 'dearest' ? (c.gross > best.gross ? c : best) : (c.gross < best.gross ? c : best))),
        null,
      );
    }
    const discount = discountOn ? Math.round((discountOn.gross * pct) / 10000) : 0;

    const subsidy = Math.max(0, Math.round(f.subsidyCents || 0));
    const lateMinutes = Math.max(0, Math.round(f.lateMinutes || 0));
    const late = lateMinutes * lateRate;

    const afterDiscount = gross - discount;
    /* THE SUBSIDY COVERS UP TO THE PLACE, never more, and what it leaves is
       either billed to the family or absorbed by the center — the center's
       rule, and the two answers differ by real money. */
    const subsidyApplied = Math.min(subsidy, afterDiscount);
    const gap = afterDiscount - subsidyApplied;
    const familyPays = (billGap ? gap : 0) + late;
    const centerCollects = subsidyApplied + familyPays;

    return {
      ...f,
      children,
      gross, discount,
      discountOnName: discountOn ? (discountOn.name || discountOn.roomName || 'one enrollment') : null,
      afterDiscount,
      subsidy, subsidyApplied, gap,
      lateMinutes, late,
      familyPays, centerCollects,
      subsidyOverPlace: subsidy > afterDiscount,
      absorbed: billGap ? 0 : gap,
    };
  });

  const sum = (f) => families.reduce((a, x) => a + f(x), 0);
  const totals = {
    families: families.length,
    children: families.reduce((a, f) => a + f.children.length, 0),
    gross: sum((f) => f.gross),
    discounts: sum((f) => f.discount),
    subsidy: sum((f) => f.subsidyApplied),
    late: sum((f) => f.late),
    familiesPay: sum((f) => f.familyPays),
    absorbed: sum((f) => f.absorbed),
    centerCollects: sum((f) => f.centerCollects),
  };

  const problems = [];

  for (const f of families) {
    for (const c of f.children.filter((x) => x.noRoom)) {
      problems.push(`${c.name || 'A child'} in ${f.name || 'a family'} is in no room on your rate card, so nothing is charged for them.`);
    }
    for (const c of f.children.filter((x) => x.daysOverWeek)) {
      problems.push(`${c.name || 'A child'} is down for ${c.days} part-time days, which is more than a week has.`);
    }
    if (f.subsidyOverPlace) {
      problems.push(`${f.name}'s subsidy is more than their place costs, so only what the place costs is applied and the rest is not counted as income.`);
    }
    if (f.children.length === 0) {
      problems.push(`${f.name || 'A family'} has no children entered, so there is nothing to bill them for.`);
    }
    if (f.lateMinutes > 0 && lateRate === 0) {
      problems.push(`${f.name} was ${f.lateMinutes} minutes late and your late rate is zero, so nothing is charged for it.`);
    }
  }

  /* A DISCOUNT SET AND NEVER LANDING. Every family here has one child, so the
     rule is on and doing nothing — which reads as a center that gives no
     sibling discount rather than one whose families happen to be single. */
  if (pct > 0 && families.length > 0 && families.every((f) => f.children.filter((c) => c.gross > 0).length < 2)) {
    problems.push('Your sibling discount is set but no family here has two priced places, so it comes off nothing.');
  }
  if (pct === 0 && families.some((f) => f.children.filter((c) => c.gross > 0).length > 1)) {
    problems.push('There are families with more than one place and your sibling discount is zero, so none is being taken off.');
  }
  if (!billGap && totals.absorbed > 0) {
    problems.push(`You are absorbing the subsidy gap rather than billing it, which is ${(totals.absorbed / 100).toFixed(2)} of places filled and not paid for.`);
  }
  for (const name of [...new Set(families.map((f) => f.name).filter(Boolean))]) {
    if (families.filter((f) => f.name === name).length > 1) {
      problems.push(`There is more than one family called ${name}, so two lines here are the same household as far as anybody reading it can tell.`);
    }
  }
  for (const r of rooms.filter((x) => !(x.weeklyCents > 0) && !(x.dayCents > 0))) {
    problems.push(`The ${r.name || 'unnamed'} room has no rate on it, so every place in it is free.`);
  }
  if (families.length === 0) {
    problems.push('There are no families entered, so there is nothing to work out.');
  }

  return { families, totals, problems };
}
