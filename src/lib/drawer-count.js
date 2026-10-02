/* ============================================================================
   DRAWER COUNT — what the till says against what is in the drawer, on this
   shop's own tolerance.

   ── THE ARITHMETIC IS TRIVIAL AND THE DISCIPLINE IS NOT ─────────────────────

   Expected cash is the float, plus what the till rang as cash, less what was
   paid out of the drawer. Counted cash is the denominations somebody counted.
   The difference is over or short. Every point-of-sale system in the world can
   do that subtraction and most of them do.

   WHAT NONE OF THEM HOLD IS THE TOLERANCE. How far out a drawer may be before
   it is worth stopping the close and looking is a decision a particular shop
   made, and it is not a number: it is usually a floor in cash AND a share of
   the cash rung, whichever is larger, because a dollar out on a forty-dollar
   evening is a different thing from a dollar out on a nine-hundred-dollar
   Saturday. Both halves are the shop's.

   ── AND WHAT THIS DELIBERATELY WILL NOT DO ──────────────────────────────────

   It holds no names. There is no field for who was on the register, no history
   per person, and no ranking. A drawer that is short is a fact about a drawer;
   turning it into a fact about a person is a different product and a worse one,
   and it is the thing that would make somebody stop typing honest counts in.
   The refusal is on the page in those words.

   It also computes no shrink rate, and compares nothing to any published
   figure. A variance is money, and money is the only unit it prints.

   ── THE FLOAT THAT HAS TO BE LEFT IS ITS OWN CHECK ──────────────────────────

   A drawer can balance perfectly and still be unable to open tomorrow, because
   the notes that are left are the wrong ones. So the count is held by
   denomination rather than as a total, and what remains after the deposit is
   checked against the float the shop needs — a thing a single figure cannot
   see.

   Money is integer cents. Denomination counts are whole numbers.
   ============================================================================ */

/** The denominations a drawer is counted in, largest first. Values in cents. */
export const DENOMS = [
  { id: 'b100', label: '$100', cents: 10000 },
  { id: 'b50', label: '$50', cents: 5000 },
  { id: 'b20', label: '$20', cents: 2000 },
  { id: 'b10', label: '$10', cents: 1000 },
  { id: 'b5', label: '$5', cents: 500 },
  { id: 'b1', label: '$1', cents: 100 },
  { id: 'q', label: '25¢', cents: 25 },
  { id: 'd', label: '10¢', cents: 10 },
  { id: 'n', label: '5¢', cents: 5 },
  { id: 'p', label: '1¢', cents: 1 },
];

/**
 * @param {object} input
 * @param {number} input.floatCents            the float this shop opens on
 * @param {number} input.toleranceCents        the cash floor of the tolerance
 * @param {number} input.tolerancePctHundredths a share of cash rung, whichever bigger
 * @param {Array}  input.registers
 *   [{id, name, cashRungCents, paidOutCents, counts: {b100: n, …}}]
 */
export function computeDrawer(input) {
  const floatCents = Math.max(0, Math.round(input.floatCents || 0));
  const tolCash = Math.max(0, Math.round(input.toleranceCents || 0));
  const tolPct = Math.max(0, Math.round(input.tolerancePctHundredths || 0));
  const src = Array.isArray(input.registers) ? input.registers : [];

  const registers = src.map((v) => {
    const counts = v.counts || {};
    const lines = DENOMS.map((d) => {
      const n = Math.max(0, Math.round(counts[d.id] || 0));
      return { ...d, n, value: n * d.cents };
    });
    const counted = lines.reduce((a, l) => a + l.value, 0);

    const rung = Math.max(0, Math.round(v.cashRungCents || 0));
    const paidOut = Math.max(0, Math.round(v.paidOutCents || 0));
    const expected = floatCents + rung - paidOut;
    const variance = counted - expected;

    /* WHICHEVER IS LARGER, and both halves are the shop's. A flat cash floor
       alone punishes a busy day; a percentage alone lets a quiet one hide a
       real problem. */
    const tolFromPct = Math.round((rung * tolPct) / 10000);
    const tolerance = Math.max(tolCash, tolFromPct);
    const outside = Math.abs(variance) > tolerance;

    /* WHAT CAN BE BANKED is everything above the float, and the float that has
       to STAY is checked against what is actually left in notes and coin. */
    const toBank = Math.max(0, counted - floatCents);
    const leftIn = counted - toBank;

    return {
      ...v,
      lines, counted, rung, paidOut, expected, variance,
      tolerance, tolFromPct, outside,
      over: variance > 0,
      short: variance < 0,
      toBank, leftIn,
      cannotMakeFloat: counted < floatCents,
      /* SMALL COIN IS ITS OWN PROBLEM. A drawer can hold the right total and
         still be unable to give change, which no single figure shows. */
      changeValue: lines.filter((l) => l.cents < 500).reduce((a, l) => a + l.value, 0),
    };
  });

  const sum = (f) => registers.reduce((a, r) => a + f(r), 0);
  const totals = {
    registers: registers.length,
    counted: sum((r) => r.counted),
    expected: sum((r) => r.expected),
    variance: sum((r) => r.variance),
    rung: sum((r) => r.rung),
    paidOut: sum((r) => r.paidOut),
    toBank: sum((r) => r.toBank),
    outside: registers.filter((r) => r.outside).length,
    over: registers.filter((r) => r.over).length,
    short: registers.filter((r) => r.short).length,
    floatCents,
  };

  const problems = [];

  for (const r of registers.filter((x) => x.outside)) {
    problems.push(`${r.name} is ${r.over ? 'over' : 'short'} by ${(Math.abs(r.variance) / 100).toFixed(2)}, which is outside the ${(r.tolerance / 100).toFixed(2)} you allow on ${(r.rung / 100).toFixed(2)} of cash.`);
  }
  for (const r of registers.filter((x) => x.cannotMakeFloat)) {
    problems.push(`${r.name} has less in it than the float, so there is nothing to bank and tomorrow opens short.`);
  }
  for (const r of registers.filter((x) => x.rung === 0 && x.counted > 0)) {
    problems.push(`${r.name} has money in it and nothing rung as cash, so the whole drawer reads as a variance.`);
  }
  for (const r of registers.filter((x) => x.paidOut > x.rung && x.rung > 0)) {
    problems.push(`${r.name} paid out more than it rang as cash, which is possible but worth a look.`);
  }
  /* NOT AN ERROR, AND SAID SO. Some shops run no coin at all. But a drawer with
     no change in it cannot trade tomorrow, and the total will not show that. */
  for (const r of registers.filter((x) => x.changeValue === 0 && x.counted > 0)) {
    problems.push(`${r.name} has no coin or singles in it at all, so it balances and still cannot give change.`);
  }
  for (const name of [...new Set(registers.map((r) => r.name).filter(Boolean))]) {
    if (registers.filter((r) => r.name === name).length > 1) {
      problems.push(`There is more than one register called ${name}, so two lines here are the same drawer as far as anybody reading it can tell.`);
    }
  }
  if (tolCash === 0 && tolPct === 0 && registers.length > 0) {
    problems.push('No tolerance is set, so any variance at all counts as outside it — including a penny.');
  }
  if (floatCents === 0 && registers.length > 0) {
    problems.push('No float is set, so the whole of every drawer reads as bankable and nothing is held back to open on.');
  }
  if (registers.length === 0) {
    problems.push('There are no registers entered, so there is nothing to count.');
  }

  return { registers, totals, problems };
}
