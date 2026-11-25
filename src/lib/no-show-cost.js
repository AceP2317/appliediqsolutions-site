/* ============================================================================
   NO-SHOW COST — a practice's own policy, against the week that actually
   happened.

   A physical therapy clinic books in series: an hour, twice a week, for six
   weeks. When somebody does not come, three separate things happen and a
   practice usually only ever sees the first one. The visit is not billed. The
   room and the therapist sit there anyway. And a fee may or may not go on the
   account, depending on a rule the practice wrote and a decision somebody made
   at the desk that morning.

   ── THE RULE IS THE PRACTICE'S, WHICH IS WHY THIS IS NOT A PLATFORM FEATURE ──

   Three things here belong to the practice and to nobody else: how much notice
   counts as late, whether a late cancel is charged like a no-show, and how much
   the fee is. Scheduling software has all three as settings and none of them as
   arithmetic — it will charge the card and it will not tell you what the week
   cost, because the thing it cannot know is what the visit would have billed.

   ── THE TWO FIGURES ARE NEVER ADDED, AND THAT IS THE WHOLE HONESTY POINT ─────

   Money not billed and the cost of an empty room are both real and they are NOT
   summed here. The room is a fixed cost: the lease, the therapist's salary and
   the equipment were paid whether or not that hour was used, so adding them to
   the missed billing counts one hour of overhead twice and produces a number
   bigger than anything that actually happened.

   They are reported side by side instead, because they answer different
   questions. What was not billed is money that did not arrive. The idle room
   cost is what that hour was already costing while nothing came in against it.
   A tool that added them would print a larger, more alarming figure — which is
   exactly why it would be the wrong tool.

   ── REFILLING IS A RECOVERY, NOT AN ERASURE ─────────────────────────────────

   A slot that gets refilled recovers whatever the replacement billed, which is
   often less than the original — a thirty-minute follow-up dropped into an hour
   of evaluation time. So the loss is the DIFFERENCE, never zero by default, and
   a refill that billed more than the original is reported rather than shown as
   a negative loss.

   Money is integer cents. Time is whole minutes.

   THE HONESTY CONTRACT. The fee, the window, the room cost and what each visit
   would have billed are all typed in by the practice. Nothing here suggests a
   fee, compares this week to any published no-show rate, or says anything at all
   about any individual — there is no name field, and a booking reference is as
   far as it goes, for the same reason the Recall Due List holds a call list
   rather than a record. Whether to charge somebody is a conversation at a desk.
   ============================================================================ */

/**
 * @param {object} input
 * @param {number}  input.feeCents            the practice's own no-show fee
 * @param {number}  input.lateWindowHours     notice under this counts as late
 * @param {boolean} input.chargeLateCancels   does the fee apply to a late cancel
 * @param {number}  input.roomCostPerHourCents what an hour of that room costs to
 *                                            keep open — the practice's figure
 * @param {Array}   input.rows
 *   [{id, ref, kind: 'no-show'|'cancel', noticeHours, minutes, valueCents,
 *     refilled, refilledValueCents, feeChargedCents}]
 */
export function computeNoShowCost(input) {
  const {
    feeCents = 0,
    lateWindowHours = 0,
    chargeLateCancels = false,
    roomCostPerHourCents = 0,
    rows: input_rows,
  } = input;
  const src = Array.isArray(input_rows) ? input_rows : [];

  const rows = src.map((v) => {
    const kind = v.kind === 'cancel' ? 'cancel' : 'no-show';
    const notice = Number.isFinite(v.noticeHours) ? v.noticeHours : 0;
    const minutes = Math.max(0, Math.round(v.minutes || 0));
    const value = Math.max(0, Math.round(v.valueCents || 0));
    const refilled = v.refilled === true;
    /* NULL, NOT ZERO, when a refilled slot has no figure against it. Zero is a
       claim that the replacement billed nothing; null is the absence of an
       answer, and the two must not be spelled the same way. */
    const refillValue = refilled
      ? (Number.isFinite(v.refilledValueCents) ? Math.max(0, Math.round(v.refilledValueCents)) : null)
      : 0;
    const feeCharged = Math.max(0, Math.round(v.feeChargedCents || 0));

    /* THE PRACTICE'S OWN WINDOW. A no-show gives no notice at all, so it is
       always inside any window; a cancel is late only if it came in under it. */
    const late = notice < lateWindowHours;
    const feeDue = kind === 'no-show' || (late && chargeLateCancels) ? feeCents : 0;

    /* AN UNKNOWN REFILL IS TREATED AS RECOVERING NOTHING, and the row says so.
       Assuming it recovered the full value would quietly delete a real loss. */
    const recovered = refilled && refillValue != null ? Math.min(refillValue, value) : 0;
    const notBilled = Math.max(0, value - recovered);
    /* A REFILLED SLOT IS NOT AN EMPTY ROOM. The hour was used, so no idle cost
       lands on it however much less the replacement billed. */
    const minutesIdle = refilled ? 0 : minutes;
    const idleCost = Math.round((minutesIdle / 60) * roomCostPerHourCents);

    return {
      ...v,
      kind, notice, minutes, value, refilled, refillValue, feeCharged,
      late, feeDue, recovered, notBilled, minutesIdle, idleCost,
      waived: Math.max(0, feeDue - feeCharged),
      overCharged: feeCharged > feeDue,
      refillUnknown: refilled && refillValue == null,
      refillOver: refilled && refillValue != null && refillValue > value,
    };
  });

  const sum = (f) => rows.reduce((a, r) => a + f(r), 0);
  const notBilled = sum((r) => r.notBilled);
  const feesCollected = sum((r) => r.feeCharged);

  const totals = {
    visits: rows.length,
    noShows: rows.filter((r) => r.kind === 'no-show').length,
    lateCancels: rows.filter((r) => r.kind === 'cancel' && r.late).length,
    inTimeCancels: rows.filter((r) => r.kind === 'cancel' && !r.late).length,
    notBilled,
    recovered: sum((r) => r.recovered),
    feesDue: sum((r) => r.feeDue),
    feesCollected,
    waived: sum((r) => r.waived),
    /* THE SHORTFALL IS BILLING MINUS FEES AND NOTHING ELSE. The idle room cost
       is deliberately absent from it — see the header. */
    shortfall: notBilled - feesCollected,
    minutesIdle: sum((r) => r.minutesIdle),
    idleCost: sum((r) => r.idleCost),
  };

  const problems = [];

  /* A VISIT WITH NO VALUE ON IT cannot be priced, and a zero would read as a
     visit that was worth nothing rather than one nobody filled in. */
  for (const r of rows.filter((x) => x.value === 0)) {
    problems.push(`${r.ref || 'A visit with no reference'} has nothing entered for what it would have billed, so it is counted as costing nothing.`);
  }
  for (const r of rows.filter((x) => x.refillUnknown)) {
    problems.push(`${r.ref} is marked refilled with no figure for what the replacement billed, so it is counted as recovering nothing.`);
  }
  for (const r of rows.filter((x) => x.refillOver)) {
    problems.push(`${r.ref} refilled for more than the original visit would have billed, so nothing was lost on it — the extra is not counted as a gain here.`);
  }
  for (const r of rows.filter((x) => x.notice < 0)) {
    problems.push(`${r.ref} has negative notice, which is not a length of time this can work with.`);
  }
  for (const r of rows.filter((x) => x.overCharged)) {
    problems.push(`${r.ref} was charged more than your own policy makes due on it.`);
  }
  for (const ref of [...new Set(rows.map((r) => r.ref).filter(Boolean))]) {
    if (rows.filter((r) => r.ref === ref).length > 1) {
      problems.push(`There is more than one line for ${ref}, so two rows here are the same visit as far as anybody reading it can tell.`);
    }
  }

  /* SETTINGS THAT MAKE A HALF OF THE ANSWER ZERO BY CONSTRUCTION. Each of these
     produces a perfectly ordinary-looking figure that is not measuring what a
     reader assumes it is. */
  if (chargeLateCancels && lateWindowHours <= 0) {
    problems.push('Your window is zero hours, so no cancellation can ever count as late and the late-cancel fee never applies.');
  }
  if (roomCostPerHourCents === 0) {
    problems.push('No room cost per hour is set, so the empty-room figure is zero because nothing was entered rather than because no time was lost.');
  }
  if (feeCents === 0 && rows.length > 0) {
    problems.push('Your fee is zero, so nothing is due on any of these and the whole shortfall is unbilled visits.');
  }
  if (rows.length === 0) {
    problems.push('There are no missed visits entered, so there is nothing to work out.');
  }

  return { rows, totals, problems };
}
