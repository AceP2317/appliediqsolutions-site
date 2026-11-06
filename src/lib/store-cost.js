/* ============================================================================
   STORE COST — the arithmetic under /stores/.

   THE HARD PART WAS DECIDING WHAT TO ADD UP, NOT HOW TO ADD IT. A store costs
   four different things and they are paid in three different currencies:

     1. A PLAN FEE, published, monthly, sometimes tiered.
     2. THE PLATFORM'S OWN CUT of what you sell, which is 0% on most of them and
        6.5% on a marketplace.
     3. CARD PROCESSING, which every one of them also charges.
     4. THE OWNER'S OWN HOURS, which is the largest term and which nothing here
        can compute.

   ADDING ALL FOUR PRODUCES A NUMBER THAT CANNOT BE COMPARED ACROSS THE SHEET,
   and that is the trap this file exists to avoid. Some platforms bundle
   processing into their own rate and some leave you to pick a processor, so a
   total including processing compares a bundle against a bundle on one row and
   a bundle against a component on the next. Every published store comparison
   does this, and it is why they all disagree with each other.

   SO THIS PRICES ONE THING: WHAT THE PLATFORM ITSELF TAKES, before any
   processor's cut. Plan fee, plus the platform's own percentage, plus per-item
   listing fees. On that rule every card is comparable, a $39 plan can be held
   against a 6.5% marketplace cut, and the crossover between them is a real
   number rather than an assembled one. Card processing is named on every card
   and sent to /getting-paid/, which is the sheet that already answers it and
   already carries every processor's rate with a read date on it.

   THE HOURS ARE TAKEN AS AN INPUT AND NEVER CONVERTED TO MONEY. Pricing them
   needs an hourly figure for the owner's own time, and this repo may not invent
   one — a suggested rate is the exact shape the honesty contract in CLAUDE.md
   refuses, and src/lib/check-*.js already refuses it in the free check, where
   the payback is measured against the hours alone and never the total. So
   hoursCost() returns the hours untouched with a sentence saying why there is no
   dollar figure beside them. Each card then says IN WORDS what that platform
   does to the number, because that part is real and nothing can compute it.

   IT REFUSES FOUR SHAPES RATHER THAN GUESSING THEM:

     1. A PLATFORM PUBLISHING NO FEE A READER COULD CHECK. TikTok Shop's fee
        schedule sits behind a seller login that returns 401. The number that
        circulates comes from summaries of pages nobody here could open, so the
        card prints that it is not publicly readable — which is true, useful,
        and better than a figure nobody checked.
     2. A COST PUBLISHED AS A RANGE. WooCommerce's own pricing page puts hosting
        at $25 to $350 a month. That is their figure and not an estimate of ours,
        and collapsing it to a midpoint would invent a number the vendor
        deliberately did not publish. A ranged answer prints both ends.
     3. A PLATFORM WITH NOTHING TO PRICE. Facebook and Instagram Shops stopped
        taking the payment in September 2025 and send the buyer to the seller's
        own website, so there is no store fee to compute. The refusal IS the
        finding on that card.
     4. AN OPTION THAT ADDS NOTHING OF ITS OWN. A page I build takes no
        percentage of anything sold through it, so printing a figure there would
        invent a fee.

   PURE ESM, NO REACT, on the split stated in CLAUDE.md: a .mjs gate imports this
   natively and checks the same function the page runs, rather than a copy of it
   that agrees with its own bugs.

   EVERYTHING IS INTEGER CENTS AND HUNDREDTHS OF A PERCENT. 6.5% is 650. Money
   arithmetic in floats produces a figure that is wrong in the last cent and
   right everywhere a test looks, which is how a wrong number survives review.
   ============================================================================ */

/* usd() AND pct() ARE IMPORTED RATHER THAN WRITTEN AGAIN, and the import is the
   point. Both sheets print money the same way — whole dollars where the cents
   are zero, because a column of ".00" is harder to scan — and a third copy of a
   money formatter is how one sheet starts rounding differently from the other
   while each is correct read alone. src/lib/format.js holds a money() that takes
   DOLLARS and is wired into the free check's asserted strings, so it is not the
   one to reach for here. */
export { usd, pct } from './payment-cost.js';

/** How many orders a month of that size adds up to. Rounded rather than floored,
    for the same reason payment-cost.js rounds: a month is not a whole number of
    average orders, and flooring quietly understates every per-item fee. */
export function ordersPerMonth(monthlyVolumeCents, averageOrderCents) {
  if (!(monthlyVolumeCents > 0) || !(averageOrderCents > 0)) return null;
  return Math.round(monthlyVolumeCents / averageOrderCents);
}

/** Percent of an amount, in hundredths of a percent, to the nearest cent. */
export function pctOf(cents, hundredths) {
  return Math.round((cents * hundredths) / 10000);
}

/** Which plan the owner's own numbers land on.

    TWO PLATFORMS TIER AND THEY TIER ON DIFFERENT THINGS. Ecwid charges by how
    many products are listed and BigCommerce by how much goes through the store,
    so the tier is resolved from the input rather than named in the data. A sheet
    that printed one tier's price for every business would be wrong for most of
    them and would look right for all of them.

    Returns `{ cents, name }`, or null where the fee declaration names no plan at
    all. `tiers` are tried in order and the first whose ceiling is not exceeded
    wins, so the last entry must have no ceiling. */
export function resolvePlan(fees, input) {
  if (Array.isArray(fees.itemTiers)) {
    const items = input.listedItems ?? 0;
    for (const t of fees.itemTiers) {
      if (t.maxItems === undefined || items <= t.maxItems) return { cents: t.cents, name: t.name };
    }
    return null;
  }
  if (Array.isArray(fees.volumeTiers)) {
    const v = input.monthlyVolumeCents ?? 0;
    for (const t of fees.volumeTiers) {
      if (t.maxMonthlyCents === undefined || v <= t.maxMonthlyCents) return { cents: t.cents, name: t.name };
    }
    return null;
  }
  if (typeof fees.planMonthlyCents === 'number') {
    return { cents: fees.planMonthlyCents, name: fees.planName ?? null };
  }
  return null;
}

/** What one platform takes for one month, before any processor's cut.

    Returns `{ cents, ... }` when it can be worked out, `{ cents: null, problem }`
    when it cannot, and `{ cents: null, lowCents, highCents, problem }` for the
    ranged case — which is a refusal that still carries two real numbers, because
    "between $25 and $350" is more useful than either end alone and far more
    honest than their average.

    `problem` is a sentence a reader can act on rather than a code, because it
    gets printed where the figure would have been. */
export function storeMonthlyCost(fees, input) {
  /* `listedItems` is not destructured here on purpose — it reaches resolvePlan()
     through `input`, because it selects a TIER rather than adding a term. */
  const { monthlyVolumeCents, averageOrderCents } = input;

  if (fees.passThrough) {
    return {
      cents: null,
      problem:
        fees.passThroughReason
        || 'Nothing is added on top here, so this costs whatever the platform underneath it costs. Read the row for whichever one you are on.',
    };
  }

  if (fees.nothingToPrice) {
    return {
      cents: null,
      problem:
        fees.nothingToPriceReason
        || 'There is no store fee to work out, because the sale does not happen here.',
    };
  }

  if (fees.unpublished) {
    return {
      cents: null,
      problem:
        fees.unpublishedReason
        || 'This one publishes no fee a reader can check, so there is nothing here to work a cost out from. You have to ask them.',
    };
  }

  const orders = ordersPerMonth(monthlyVolumeCents, averageOrderCents);
  if (orders === null) {
    return {
      cents: null,
      problem: 'A month of store sales and an average order are both needed, and one of them is missing or zero.',
    };
  }

  const plan = resolvePlan(fees, input);
  if (!plan) {
    return {
      cents: null,
      problem: 'No plan price is registered for this one, so its monthly fee cannot be worked out.',
    };
  }

  const cutCents = pctOf(monthlyVolumeCents, fees.cutHundredths ?? 0);

  /* THERE IS NO PER-LISTING TERM HERE AND ITS ABSENCE IS DELIBERATE. Etsy
     charges twenty cents when a listing is created and the same again on every
     automatic renewal, which would be real arithmetic if the renewal PERIOD had
     been read on 2026-09-11. It was not. Computing it from a renewal interval
     nobody checked would put an invented number on the one sheet whose claim is
     that every figure came off a vendor's own page — so Etsy's card names the
     listing fee in words and its figure is stated as a floor. An engine carrying
     the term with no caller would be the same guess one layer down. */

  /* THE RANGE IS APPLIED LAST, so both ends carry the same cut and differ only
     in the term the vendor published as a range. */
  if (fees.rangedMonthly) {
    const { lowCents, highCents, reason } = fees.rangedMonthly;
    return {
      cents: null,
      lowCents: plan.cents + lowCents + cutCents,
      highCents: plan.cents + highCents + cutCents,
      planName: plan.name,
      orders,
      problem: reason,
    };
  }

  return {
    cents: plan.cents + cutCents,
    planCents: plan.cents,
    planName: plan.name,
    cutCents,
    orders,
  };
}

/** The platform's take as a share of what went through the store, in hundredths
    of a percent. This is the number that actually compares a flat plan fee
    against a marketplace percentage, because it folds the monthly fee and the
    per-item fees back into one rate. */
export function takeRate(costCents, monthlyVolumeCents) {
  if (costCents === null || !(monthlyVolumeCents > 0)) return null;
  return Math.round((costCents / monthlyVolumeCents) * 10000);
}

/** Every card costed against one set of inputs, cheapest first, with the ones
    that cannot be computed kept at the end rather than dropped.

    THEY ARE KEPT DELIBERATELY. Dropping a platform that publishes no fee would
    make the table look complete while hiding the single most useful thing the
    sheet has to say about it. */
export function compareStores(cards, input) {
  const rows = cards.map((c) => {
    const cost = storeMonthlyCost(c.fees, input);
    return {
      id: c.id,
      name: c.name,
      problem: cost.problem ?? null,
      takeHundredths: takeRate(cost.cents, input.monthlyVolumeCents),
      annualCents: cost.cents === null ? null : cost.cents * 12,
      lowAnnualCents: cost.lowCents === undefined ? null : cost.lowCents * 12,
      highAnnualCents: cost.highCents === undefined ? null : cost.highCents * 12,
      ...cost,
    };
  });

  const priced = rows.filter((r) => r.cents !== null).sort((a, b) => a.cents - b.cents);
  const unpriced = rows.filter((r) => r.cents === null);
  return [...priced, ...unpriced];
}

/** The spread between the cheapest and the dearest platform that could be
    priced, over a year. Returns null below two priced rows, because a spread of
    one number is not a spread. */
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

/** The owner's own hours, handed back untouched.

    THIS FUNCTION EXISTS TO REFUSE, and that is its whole job. Every instinct
    says to multiply the hours by a rate and add them to the money column, and
    doing it would need an hourly figure for the owner's time that nobody here
    may invent. So the hours are printed on their own, beside the money rather
    than inside it, and the sentence says why.

    It still returns the hours, because the number is real and it is the largest
    term on the sheet. What it never returns is a dollar figure. */
export function hoursCost(input) {
  const hours = input.ownerHoursPerMonth;
  if (!(hours > 0)) {
    return {
      hours: null,
      pricedCents: null,
      problem: 'No hours were given, so there is nothing to put beside the money.',
    };
  }
  return {
    hours,
    annualHours: hours * 12,
    pricedCents: null,
    problem:
      'These hours are not turned into money anywhere on this sheet. Doing that needs a figure for what an hour of your own time is worth, and inventing one for you would be the only made-up number on the page.',
  };
}
