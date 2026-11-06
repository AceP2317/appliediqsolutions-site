/* ============================================================================
   PAYMENT COST — the arithmetic under /getting-paid/.

   THE FIGURE EVERY PROCESSOR PUBLISHES IS A RATE, AND A RATE IS NOT A PRICE.
   2.9% + 30c and 2.6% + 15c cannot be ranked without knowing the size of the
   sale: at a $4 coffee the fixed part is most of the cost, and at a $900 invoice
   it rounds to nothing. Every headline on every pricing page read for this page
   is therefore unrankable on its own, and a comparison that ranked them anyway
   would be inventing the missing number.

   SO THIS TAKES THE OWNER'S THREE NUMBERS AND NOTHING ELSE. What goes through
   the card in a month, what an average sale is, and how much of it happens in
   person. From those, what each option costs that month. No benchmark, no
   industry average, no suggested rate — the honesty contract in CLAUDE.md, and
   the same rule chair-split.js and consignment.js already hold.

   IT REFUSES FOUR SHAPES RATHER THAN GUESSING THEM, and the refusals are the
   point rather than a gap:

     1. A VENDOR THAT PUBLISHES NO RATE. Toast's own pricing page says "custom
        pricing" and "simple, flat rate" with no number anywhere on it, and a
        Clover sold through a bank is not the rate Clover publishes online. A
        comparison that filled those in from a review site would be quoting one
        company's sales copy back as a fact.
     2. AN ONLINE-ONLY OPTION ASKED TO PRICE MONEY TAKEN AT A COUNTER. Charging
        the online rate on an in-person sale is the silent way this arithmetic
        goes wrong, because the answer still looks like a number.
     3. AN OPTION THAT ADDS NOTHING OF ITS OWN. It costs whatever the processor
        underneath it costs, and printing a figure there would invent a fee.
     4. ANYTHING CROSSING A BORDER. Currency conversion is charged on top, and
        the spread differs by more than three points across the options here, so
        it cannot be computed without a currency mix nobody has given us. That
        one is named on the page rather than computed, because no input here
        carries a currency mix to compute it from.

   PURE ESM, NO REACT, on the split stated in CLAUDE.md: a .mjs gate imports this
   natively and checks the same function the page runs, rather than a copy of it
   that agrees with its own bugs.

   EVERYTHING IS INTEGER CENTS AND HUNDREDTHS OF A PERCENT. 2.9% is 290. Money
   arithmetic in floats produces a figure that is wrong in the last cent and
   right everywhere a test looks, which is how a wrong number survives review.
   ============================================================================ */

/* Rates are declared by each option in hundredths of a percent (2.9% -> 290),
   with fixed parts and monthly fees in whole cents.

   `quoteOnly` is the refusal flag. It means the vendor publishes no rate a
   reader could check — NOT that the rate is unknown to us. That distinction is
   load-bearing: the first is a fact about the vendor and belongs on the page,
   the second would be a hole in our reading and would belong nowhere. */

/** How many card sales a month of that size adds up to. Rounded rather than
    floored, because a month is not a whole number of average tickets and
    flooring would quietly understate the fixed-fee half of every option. */
export function transactionsPerMonth(monthlyVolumeCents, averageTicketCents) {
  if (!(monthlyVolumeCents > 0) || !(averageTicketCents > 0)) return null;
  return Math.round(monthlyVolumeCents / averageTicketCents);
}

/** The split of a month's volume between the counter and the internet, in cents.
    `inPersonShare` is a fraction from 0 to 1, so an online-only business passes
    0 and a shop with no website passes 1. */
export function splitVolume(monthlyVolumeCents, inPersonShare) {
  const share = Math.min(1, Math.max(0, inPersonShare));
  const inPerson = Math.round(monthlyVolumeCents * share);
  return { inPerson, online: monthlyVolumeCents - inPerson };
}

/** Percent of an amount, in hundredths of a percent, to the nearest cent. */
export function pctOf(cents, hundredths) {
  return Math.round((cents * hundredths) / 10000);
}

/** What one option costs for one month.

    Returns `{ cents, monthlyFeeCents, perSaleCents, transactions }` when it can
    be worked out, and `{ cents: null, problem }` when it cannot. `problem` is a
    sentence a reader can act on rather than a code, because it gets printed. */
export function optionMonthlyCost(rates, input) {
  const { monthlyVolumeCents, averageTicketCents, inPersonShare = 0 } = input;

  if (rates.passThrough) {
    return {
      cents: null,
      problem:
        rates.passThroughReason
        || 'This one costs whatever the processor underneath it costs, because nothing is added on top. Read the row for whichever one you picked.',
    };
  }

  if (rates.quoteOnly) {
    return {
      cents: null,
      problem:
        rates.quoteReason
        || 'This one publishes no rate, so there is nothing here to work a cost out from. You have to ask them for a number.',
    };
  }

  if (rates.onlineOnly && inPersonShare > 0) {
    return {
      cents: null,
      problem:
        rates.onlineOnlyReason
        || 'This one only takes money on a website, and some of yours comes over a counter. The in-person half needs a different answer.',
    };
  }

  const transactions = transactionsPerMonth(monthlyVolumeCents, averageTicketCents);
  if (transactions === null) {
    return {
      cents: null,
      problem: 'A month of card volume and an average sale are both needed, and one of them is missing or zero.',
    };
  }

  const share = Math.min(1, Math.max(0, inPersonShare));
  const { inPerson, online } = splitVolume(monthlyVolumeCents, share);

  /* THE FIXED FEE IS CHARGED PER SALE, SO THE SALES SPLIT THE SAME WAY THE MONEY
     DOES. Charging every sale the online fixed fee would overstate a shop that
     takes most of its money at the counter, and that is the direction this kind
     of arithmetic drifts when nobody checks it. */
  const inPersonSales = Math.round(transactions * share);
  const onlineSales = transactions - inPersonSales;

  /* An option with no in-person product charges its online rate on everything.
     Saying so here rather than in the data keeps every declaration one shape. */
  const inPersonPct = rates.inPersonPct ?? rates.onlinePct;
  const inPersonFixed = rates.inPersonFixedCents ?? rates.onlineFixedCents;

  const perSaleCents =
    pctOf(online, rates.onlinePct)
    + onlineSales * rates.onlineFixedCents
    + pctOf(inPerson, inPersonPct)
    + inPersonSales * inPersonFixed;

  const monthlyFeeCents = rates.monthlyUsd ? Math.round(rates.monthlyUsd * 100) : 0;

  return {
    cents: perSaleCents + monthlyFeeCents,
    monthlyFeeCents,
    perSaleCents,
    transactions,
    inPersonSales,
    onlineSales,
  };
}

/** The same cost as a share of what went through the card, in hundredths of a
    percent. This is the number that actually compares two options, because it
    folds the monthly fee and the per-sale fixed fee back into one rate the owner
    can hold against the headline he was quoted. */
export function effectiveRate(costCents, monthlyVolumeCents) {
  if (costCents === null || !(monthlyVolumeCents > 0)) return null;
  return Math.round((costCents / monthlyVolumeCents) * 10000);
}

/** Every option costed against one set of inputs, cheapest first, with the ones
    that cannot be computed kept at the end rather than dropped.

    THEY ARE KEPT DELIBERATELY. Dropping an option that publishes no rate would
    make the table look complete while hiding the single most useful thing the
    page has to say about that option. */
export function compareOptions(options, input) {
  const rows = options.map((o) => {
    const cost = optionMonthlyCost(o.rates, input);
    return {
      id: o.id,
      name: o.name,
      problem: cost.problem ?? null,
      effectiveHundredths: effectiveRate(cost.cents, input.monthlyVolumeCents),
      annualCents: cost.cents === null ? null : cost.cents * 12,
      ...cost,
    };
  });

  const priced = rows.filter((r) => r.cents !== null).sort((a, b) => a.cents - b.cents);
  const unpriced = rows.filter((r) => r.cents === null);
  return [...priced, ...unpriced];
}

/** The spread between the cheapest and the dearest option that could be priced,
    over a year. This answers "does any of this matter", and for a business doing
    real volume the answer is usually larger than the reader expects.

    Returns null below two priced options, because a spread of one number is not
    a spread. */
export function annualSpread(rows) {
  const priced = rows.filter((r) => r.cents !== null);
  if (priced.length < 2) return null;
  const low = priced[0];
  const high = priced[priced.length - 1];
  return {
    lowId: low.id,
    highId: high.id,
    lowAnnualCents: low.annualCents,
    highAnnualCents: high.annualCents,
    differenceCents: high.annualCents - low.annualCents,
  };
}

/** Money for printing. Whole dollars where the cents are zero, because a column
    of ".00" is harder to scan and the precision is not real at this level. */
export function usd(cents) {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString('en-US')}`
    : `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A rate in hundredths of a percent, printed the way a pricing page prints it. */
export function pct(hundredths) {
  if (hundredths === null) return null;
  return `${Math.round((hundredths / 100) * 100) / 100}%`;
}
