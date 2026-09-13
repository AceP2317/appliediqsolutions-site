/* ============================================================================
   RENT ROLL AND OWNER STATEMENT — a month of units, per owner, and what
   actually goes out to each of them.

   ── WHY THIS BELONGS TO THE OWNER OF THE BUSINESS AND NOT TO A PLATFORM ─────

   Property management software collects rent, records a repair and prints a
   statement. What it cannot hold is the management agreement, because no two of
   them are written the same way and they are signed one owner at a time. Three
   things in that agreement decide the whole answer and every one of them is
   negotiated per owner:

     THE PERCENTAGE, which everybody knows.
     WHAT IT IS TAKEN ON — rent CHARGED or rent COLLECTED, which almost nobody
     has looked at since the day they signed.
     THE RESERVE — a float the manager holds back so there is money in the
     account when a water heater goes, and a target that is this owner's number
     rather than a policy.

   ── THE FIRST FINDING: THE SAME PERCENTAGE IS TWO DIFFERENT AMOUNTS ─────────

   A fee on rent CHARGED is paid on rent that never arrived. A fee on rent
   COLLECTED is not. In a month where everything is paid the two are the same
   figure to the cent, which is exactly why nobody notices — the difference only
   appears when a tenant is late, and that is the month nobody is reading the
   statement carefully.

   THE GAP IS THE INCENTIVE, and it points in opposite directions. On charged,
   chasing arrears earns the manager nothing they are not already being paid. On
   collected, every dollar recovered is a dollar of fee. This engine takes no
   view on which is fairer — it prints both figures for every owner, on their own
   units, so the difference is a number instead of an argument.

   ── THE SECOND FINDING: DISBURSED IS NOT WHAT THE PROPERTY EARNED ───────────

   Money held to reserve has not been spent. It is still the owner's money,
   sitting in the manager's account with the owner's name against it. Fold it
   into the same figure as the fee and the repairs and an owner reads a good
   month as a bad one, then rings up to ask what went wrong. So the top-up and
   the disbursement stay two numbers here, and the sheet says which one is still
   theirs.

   AND THE RESERVE CANNOT OVERDRAW THE MONTH. The top-up is capped at what is
   left after fees and deductions, because a manager cannot hold back money that
   did not arrive. That cap is why a negative month is always a fees-and-repairs
   problem and never a reserve one.

   ── WHY THE FEE IS NOT computeRateCard() ────────────────────────────────────

   rate-card.js already serves four tools and its `percent` basis is the same one
   line of arithmetic — round(quantity x hundredths / 10000). It was read before
   this was written, and it is the wrong fit, for reasons that are about SHAPE
   rather than about the multiplication:

     A rate card prices a LINE against a rate and then compares it to what was
     actually charged. There is no `actual` here and no variance: a management
     fee is not a priced line somebody might have got wrong, it is a deduction
     from a pot of money that arrived.

     THE FEE BASIS IS THE TOOL. Every unit needs the SAME percentage applied to
     TWO different quantities, because printing both is the whole point. That is
     one rate against two bases, which computeRateCard can only express as two
     items pretending to be two lines, on two separate calls.

     ITS REFUSALS ARE A RATE CARD'S. Every problem it raises is worded for a rate
     card — "there is no rate on the card for that", "more than one on the rate
     card" — and every refusal below is a different shape. All of them would be
     discarded, and matching another module's wording to filter them is the
     mistake book-time.js records making first.

     AND NOT-SET WOULD BECOME ZERO. An owner with no percentage entered has to
     stay distinguishable from an owner on nothing; a rate whose perUnit is 0
     prices happily at zero and says nothing.

   So the percentage is one expression here, which is what consignment.js,
   chair-split.js, provider-split.js, tuition-sheet.js and night-net.js each
   concluded for the same reason. rate-card is reused where the line/rate/variance
   SHAPE repeats, not everywhere a percentage appears.

   Money is integer cents. Percentages are integer hundredths, so 8.50% is 850
   and a hundred units do not drift.

   THE HONESTY CONTRACT. Every percentage, every basis and every reserve target
   is typed in off the agreement that was signed. Nothing here suggests a
   management fee, suggests a reserve, takes a view on which basis is fairer,
   chases or predicts arrears, compares anything to a published management rate,
   or has an opinion on what a reserve should be spent on.
   ============================================================================ */

/* THE PROBLEMS PANEL PRINTS MONEY THE SAME WAY THE TABLES ABOVE IT DO, which it
   did not until 2026-09-07: this file hand-rolled a dollar sign concatenated
   onto toFixed(2), and printed `$1100.00` two inches under a column that
   grouped it. See the note in src/lib/unit-turn.js, where it was caught, and
   LEDGER L-379. */
import { money as usd } from './format.js';

/** The only two answers a management agreement can give for what the fee is on. */
const BASES = new Set(['charged', 'collected']);

/**
 * @param {object} input
 * @param {Array}  input.owners
 *   [{id, name, feePctHundredths, feeBasis, reserveTargetCents, reserveHeldCents}]
 *   feePctHundredths  850 = 8.50%. NULL means nobody has entered one, which is
 *                     a different state from 0 and is treated as one.
 *   feeBasis          'charged' | 'collected', off their agreement
 * @param {Array}  input.units
 *   [{id, ownerId, ref, rentChargedCents, rentCollectedCents, deductions}]
 *   deductions        [{id, note, cents}] — repairs, a bill the manager paid
 */
export function computeRentRoll(input) {
  const srcO = Array.isArray(input.owners) ? input.owners : [];
  const srcU = Array.isArray(input.units) ? input.units : [];

  const owners = srcO.map((o) => {
    /* NOT SET AND ZERO ARE DIFFERENT STATES AND THEY ARE SPELLED DIFFERENTLY.
       An owner nobody has entered a percentage for cannot have a statement
       worked out at all; an owner on 0.00% is a real arrangement — a landlord
       who does their own management and only uses the trust account. Reading
       both as zero would put a confident $0.00 fee on the first, which is the
       flattering answer and the wrong one. */
    const raw = o.feePctHundredths;
    const feeSet = raw != null && raw !== '' && Number.isFinite(Number(raw));
    const basisGiven = o.feeBasis;
    const basisOk = BASES.has(basisGiven);
    return {
      ...o,
      feePct: feeSet ? Math.max(0, Math.round(Number(raw))) : null,
      feeSet,
      basisGiven,
      basisOk,
      /* COLLECTED IS THE FALLBACK, NOT CHARGED, and it is chosen rather than
         arbitrary: it is the basis that never bills an owner for money that did
         not arrive. Where the tool has to guess, it guesses in the direction
         that cannot overcharge somebody. The problems array says it guessed. */
      feeBasis: basisOk ? basisGiven : 'collected',
      reserveTarget: Math.max(0, Math.round(o.reserveTargetCents || 0)),
      reserveHeld: Math.max(0, Math.round(o.reserveHeldCents || 0)),
    };
  });
  const byId = new Map(owners.map((o) => [o.id, o]));

  const units = srcU.map((u) => {
    const charged = Math.max(0, Math.round(u.rentChargedCents || 0));
    const collected = Math.max(0, Math.round(u.rentCollectedCents || 0));
    const deductions = Array.isArray(u.deductions) ? u.deductions : [];
    const deductionTotal = deductions.reduce((a, d) => a + Math.max(0, Math.round(d.cents || 0)), 0);
    const o = byId.get(u.ownerId) || null;

    /* ARREARS IS REPORTED AND IS NEVER INCOME. It is the money that did not
       arrive, so nothing below adds it to anything — it exists here to be
       named, and to be the quantity the fee-basis gap is made of.

       A NEGATIVE ARREARS IS A REAL STATE, not an error: a tenant clearing last
       month's balance collects more than this month's charge. It is left signed
       rather than clamped, because clamping would quietly print a paid-ahead
       unit as square. */
    const arrears = charged - collected;

    const pct = o && o.feeSet ? o.feePct : null;
    /* ONE EXPRESSION, APPLIED TWICE. Both figures come off the same line so the
       comparison the tool exists for cannot drift between them. */
    const feeOnCharged = pct == null ? null : Math.round((charged * pct) / 10000);
    const feeOnCollected = pct == null ? null : Math.round((collected * pct) / 10000);
    const onCharged = !!o && o.feeBasis === 'charged';
    const fee = pct == null ? null : (onCharged ? feeOnCharged : feeOnCollected);
    const feeOther = pct == null ? null : (onCharged ? feeOnCollected : feeOnCharged);

    return {
      ...u,
      charged, collected, arrears, deductions, deductionTotal,
      owner: o, ownerName: o ? o.name : null, feeBasis: o ? o.feeBasis : null,
      feeOnCharged, feeOnCollected, fee, feeOther,
      /* SIGNED, because the direction is the finding. Positive means their
         stated basis pays the manager MORE than the other one would. */
      feeDifference: fee == null ? null : fee - feeOther,
      noOwner: !o,
      /* UNPRICED covers both ways a unit cannot be worked out — no owner at all,
         or an owner with no percentage entered — because both have to be out of
         the footing for the same reason. */
      unpriced: !o || !o.feeSet,
      nothingCollected: charged > 0 && collected === 0,
      feeDueOnNothing: charged > 0 && collected === 0 && onCharged && (fee || 0) > 0,
      deductionsOverCollected: deductionTotal > collected,
    };
  });

  const statements = owners.map((o) => {
    const rows = units.filter((u) => u.owner === o);
    const sum = (f) => rows.reduce((a, x) => a + f(x), 0);

    const charged = sum((x) => x.charged);
    const collected = sum((x) => x.collected);
    const deductions = sum((x) => x.deductionTotal);
    const feesOnCharged = o.feeSet ? sum((x) => x.feeOnCharged) : null;
    const feesOnCollected = o.feeSet ? sum((x) => x.feeOnCollected) : null;
    const fees = o.feeSet ? (o.feeBasis === 'charged' ? feesOnCharged : feesOnCollected) : null;
    const feesOther = o.feeSet ? (o.feeBasis === 'charged' ? feesOnCollected : feesOnCharged) : null;

    /* WHAT IS LEFT BEFORE THE RESERVE IS TOUCHED. Kept as its own figure rather
       than folded into the next line, because it is the quantity the reserve is
       capped against and a cap nobody can see is a cap nobody trusts. */
    const afterFees = o.feeSet ? collected - fees - deductions : null;
    const reserveNeeded = Math.max(0, o.reserveTarget - o.reserveHeld);
    /* YOU CANNOT HOLD BACK MONEY THAT IS NOT THERE. The top-up is whichever is
       smaller of what the target still wants and what the month actually left,
       and never below zero — so a bad month tops up nothing rather than digging
       the hole deeper. */
    const reserveTopUp = o.feeSet ? Math.min(reserveNeeded, Math.max(0, afterFees)) : null;
    const disbursed = o.feeSet ? afterFees - reserveTopUp : null;

    return {
      ...o,
      units: rows.length,
      charged, collected, arrears: charged - collected, deductions,
      fees, feesOnCharged, feesOnCollected, feesOther,
      feeDifference: o.feeSet ? fees - feesOther : null,
      afterFees, reserveNeeded, reserveTopUp, disbursed,
      reserveAfter: o.reserveHeld + (reserveTopUp || 0),
      /* A TARGET ALREADY MET IS NOT AN ERROR AND IS NOT A ZERO SETTING EITHER,
         and the two look identical from the outside — both print a top-up of
         nothing. A target of zero means no reserve was ever asked for. */
      reserveMet: o.reserveTarget > 0 && o.reserveHeld >= o.reserveTarget,
      noReserve: o.reserveTarget === 0,
      /* THE RESERVE CANNOT CAUSE THIS. Because the top-up is capped at what the
         month left, disbursed is negative exactly when afterFees is, which is a
         fees-and-deductions answer every time. */
      negative: disbursed != null && disbursed < 0,
      unpriced: !o.feeSet,
    };
  });

  /* THE TOTALS ARE FOOTED OVER THE OWNERS WHOSE FEE IS ACTUALLY KNOWN. An owner
     with no percentage entered has no fee, so folding their collected rent in as
     though it were fully disbursable would overstate what goes out the door by
     the whole of a fee nobody has worked out. Same reason night-net.js keeps an
     unknown platform out of its footing. */
  const priced = statements.filter((s) => !s.unpriced);
  const foot = (f) => priced.reduce((a, s) => a + f(s), 0);

  const totals = {
    owners: owners.length,
    pricedOwners: priced.length,
    units: units.length,
    pricedUnits: units.filter((u) => !u.unpriced).length,
    charged: foot((s) => s.charged),
    collected: foot((s) => s.collected),
    arrears: foot((s) => s.arrears),
    fees: foot((s) => s.fees),
    /* THE WHOLE SHEET BOTH WAYS. Not the sum of the signed per-owner
       differences — that nets a charged-basis owner against a collected-basis
       one and comes out looking small. These two are what the same set of
       agreements would take if every one of them said the same thing. */
    feesOnCharged: foot((s) => s.feesOnCharged),
    feesOnCollected: foot((s) => s.feesOnCollected),
    deductions: foot((s) => s.deductions),
    reserveTopUp: foot((s) => s.reserveTopUp),
    reserveAfter: foot((s) => s.reserveAfter),
    disbursed: foot((s) => s.disbursed),
  };
  totals.feeGap = totals.feesOnCharged - totals.feesOnCollected;

  const problems = [];
  const money = (c) => usd(Math.abs(c) / 100, { cents: true });
  const uname = (u) => u.ref || 'A unit';
  const oname = (o) => o.name || 'An owner';

  for (const u of units.filter((x) => x.noOwner)) {
    problems.push(`${uname(u)} is down against an owner who is not on your list, so nothing on it is worked out and it is in none of the totals.`);
  }
  for (const o of statements.filter((x) => x.unpriced)) {
    problems.push(`${oname(o)} has no management fee entered — an empty box rather than a fee of nothing — so their statement is not worked out and their units are in none of the totals.`);
  }
  for (const o of owners.filter((x) => !x.basisOk)) {
    const said = basisPhrase(o.basisGiven);
    problems.push(`The agreement for ${oname(o)} ${said}, which is neither rent charged nor rent collected. It has been worked out on rent COLLECTED here, which is the answer that never bills anybody for money that did not arrive.`);
  }
  for (const u of units.filter((x) => x.nothingCollected)) {
    const base = `${uname(u)} was charged ${money(u.charged)} and none of it arrived, so that is ${money(u.arrears)} in arrears.`;
    problems.push(u.feeDueOnNothing
      ? `${base} And ${oname(u.owner)} pays you on rent CHARGED, so a management fee of ${money(u.fee)} is due on that unit — on money nobody has.`
      : base);
  }
  for (const u of units.filter((x) => x.deductionsOverCollected && !x.noOwner)) {
    problems.push(`${uname(u)} has ${money(u.deductionTotal)} paid out against it and only ${money(u.collected)} collected, so ${oname(u.owner)} owes you ${money(u.deductionTotal - u.collected)} on that unit rather than being paid on it.`);
  }
  for (const o of statements.filter((x) => x.negative)) {
    problems.push(`${oname(o)} comes out at minus ${money(o.disbursed)} once the fees and what you paid out are off the month, so nothing goes out to them and nothing can be held to reserve either.`);
  }
  /* NOT AN ERROR, AND THE SENTENCE HAS TO SAY SO. A top-up of nothing reads
     exactly like a reserve setting that is switched off, and an owner ringing to
     ask why nothing was held back is the ordinary consequence of not saying it. */
  for (const o of statements.filter((x) => x.reserveMet && !x.unpriced)) {
    problems.push(`${oname(o)} is already holding ${money(o.reserveHeld)} against a ${money(o.reserveTarget)} reserve, so nothing more is held back this month. That is the target being met rather than a setting that is off.`);
  }
  for (const n of [...new Set(owners.map((o) => o.name).filter(Boolean))]) {
    if (owners.filter((o) => o.name === n).length > 1) {
      problems.push(`There is more than one owner called ${n}, so two statements here go to the same name as far as anybody reading them can tell.`);
    }
  }
  if (units.length === 0) {
    problems.push('There are no units on this roll, so there is nothing to work out.');
  }

  return { units, statements, owners, totals, problems };
}

/* An empty basis and a wrong one are different mistakes, and a sentence reading
   `a fee basis of "undefined"` is the tell of a template nobody read. */
function basisPhrase(given) {
  return given == null || given === ''
    ? 'does not say what the fee is taken on'
    : `says the fee is taken on “${given}”`;
}
