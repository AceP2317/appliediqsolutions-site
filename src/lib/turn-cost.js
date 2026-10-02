/* ============================================================================
   TURN COST — what it costs to make a room ready, on this house's own standard.

   ── THE FINDING IS THE SECOND FIGURE, NOT THE FIRST ─────────────────────────

   A turn costs what it costs whatever the length of the stay. The linens, the
   hour of housekeeping, the coffee and the soap are the same for a two-night
   booking as for a seven-night one.

   So the cost PER STAY is a fixed number and the cost PER NIGHT is not — it
   falls as the stay lengthens, and it falls fast. On the sample, the room with
   the CHEAPEST turn is the dearest per night, because it turns twice as often.
   Almost nobody works that out, because the turn cost sits in one place and the
   length of stay sits in another.

   Both figures are printed and the page says which one moves. A tool showing
   only the per-stay cost hides the whole insight; one showing only the
   per-night cost invites the reader to think a turn got cheaper.

   ── WHAT THE HOUSE OWNS ─────────────────────────────────────────────────────

   The housekeeping rate, how long a turn takes in each room, what goes on the
   bed, what gets left out for a guest, how often the things that are not
   replaced every stay actually get replaced, and what is held back per stay
   against a deep clean. Every one is a standard this house set, and two houses
   on the same street will not share them.

   ── WHAT IS RESTOCKED EVERY FEW STAYS IS AMORTIZED, NOT IGNORED ─────────────

   A bottle of washing-up liquid lasts six turns. Charging it to one turn
   overstates that stay and understates the other five; leaving it out entirely
   is how a turn cost ends up thirty percent light. It is divided across the
   stays it actually covers.

   Money is integer cents. Times are whole minutes.

   THE HONESTY CONTRACT. Every rate, every minute and every consumable is the
   house's own. Nothing here suggests how long a turn should take, what to pay
   for housekeeping, what to charge a guest, or how any of it compares to a
   published cleaning fee.
   ============================================================================ */

/**
 * @param {object} input
 * @param {number} input.housekeepingCentsPerHour  what this house pays
 * @param {Array}  input.rooms
 *   [{id, name, units, turnMinutes, linenCents, consumableCents,
 *     restockCents, restockEveryStays, reserveCents, staysThisMonth, avgNights}]
 */
export function computeTurnCost(input) {
  const rate = Math.max(0, Math.round(input.housekeepingCentsPerHour || 0));
  const src = Array.isArray(input.rooms) ? input.rooms : [];

  const rooms = src.map((v) => {
    const minutes = Math.max(0, Math.round(v.turnMinutes || 0));
    const linen = Math.max(0, Math.round(v.linenCents || 0));
    const consumable = Math.max(0, Math.round(v.consumableCents || 0));
    const restock = Math.max(0, Math.round(v.restockCents || 0));
    const every = Math.max(0, Math.round(v.restockEveryStays || 0));
    const reserve = Math.max(0, Math.round(v.reserveCents || 0));
    const stays = Math.max(0, Math.round(v.staysThisMonth || 0));
    const nights = Math.max(0, Number(v.avgNights) || 0);

    const labor = Math.round((minutes / 60) * rate);
    /* AMORTIZED ACROSS THE STAYS IT COVERS. Charged to one turn it overstates
       that stay; left out it understates every one of them. */
    const restockPerStay = every > 0 ? Math.round(restock / every) : 0;
    const perStay = labor + linen + consumable + restockPerStay + reserve;

    /* NULL WHEN THERE IS NO LENGTH TO DIVIDE BY. A zero would read as a turn
       that costs nothing a night. */
    const perNight = nights > 0 ? Math.round(perStay / nights) : null;

    return {
      ...v,
      units: Math.max(0, Math.round(v.units || 0)),
      minutes, linen, consumable, restock, every, reserve, stays, nights,
      labor, restockPerStay, perStay, perNight,
      monthly: perStay * stays,
      nightsThisMonth: Math.round(stays * nights),
      noTurnTime: minutes === 0,
      restockWithNoInterval: restock > 0 && every === 0,
      noLength: nights <= 0,
    };
  });

  const sum = (f) => rooms.reduce((a, x) => a + f(x), 0);
  const stays = sum((r) => r.stays);
  const nights = sum((r) => r.nightsThisMonth);
  const monthly = sum((r) => r.monthly);

  const totals = {
    rooms: rooms.length,
    units: sum((r) => r.units),
    stays,
    nights,
    monthly,
    labor: sum((r) => r.labor * r.stays),
    linen: sum((r) => r.linen * r.stays),
    consumable: sum((r) => (r.consumable + r.restockPerStay) * r.stays),
    reserve: sum((r) => r.reserve * r.stays),
    /* WEIGHTED ON THE SAME ROWS THE MONEY IS SUMMED ON, never an average of the
       per-room figures — one room turning nine times is not one room turning
       five. */
    perStay: stays > 0 ? Math.round(monthly / stays) : null,
    perNight: nights > 0 ? Math.round(monthly / nights) : null,
    rate,
  };

  const problems = [];

  for (const r of rooms.filter((x) => x.noTurnTime)) {
    problems.push(`${r.name || 'A room'} has no turn time on it, so its turn costs only what is left out for the guest.`);
  }
  for (const r of rooms.filter((x) => x.restockWithNoInterval)) {
    problems.push(`${r.name} has something restocked with no interval, so it is spread across nothing and is in no turn cost at all.`);
  }
  for (const r of rooms.filter((x) => x.noLength && x.stays > 0)) {
    problems.push(`${r.name} has no average length of stay, so it has a cost per stay and no cost per night.`);
  }
  for (const r of rooms.filter((x) => x.stays === 0 && x.perStay > 0)) {
    problems.push(`${r.name} has no stays this month, so its turn cost is real and none of it is in the month below.`);
  }
  for (const r of rooms.filter((x) => x.units === 0)) {
    problems.push(`${r.name} has no units, so nothing here says how much of the house it is.`);
  }
  for (const name of [...new Set(rooms.map((r) => r.name).filter(Boolean))]) {
    if (rooms.filter((r) => r.name === name).length > 1) {
      problems.push(`There is more than one room called ${name}, so two lines here are the same room as far as anybody reading it can tell.`);
    }
  }
  if (rate === 0 && rooms.some((r) => r.minutes > 0)) {
    problems.push('No housekeeping rate is set, so the hours in every turn below cost nothing.');
  }
  if (rooms.length === 0) {
    problems.push('There are no rooms entered, so there is nothing to work out.');
  }

  return { rooms, totals, problems };
}
