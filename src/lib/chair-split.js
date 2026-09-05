/* ============================================================================
   CHAIR SPLIT — a salon or barber shop's week, settled per chair.

   Every shop in this trade runs one of two arrangements and usually both at
   once. A stylist on BOOTH RENT pays the shop a flat amount for the chair and
   keeps what they take. A stylist on COMMISSION keeps a share of their services
   and the shop keeps the rest. On top of that sit a product charge for colour
   and supply, and a card fee the shop either absorbs or passes on.

   NOT ONE OF THOSE IS STANDARD. The rent, the split, the product charge and who
   carries the card fee are four decisions each shop made once and kept, which is
   why this is still a Sunday-afternoon spreadsheet and why no platform has taken
   it: a platform can absorb a rule that is the same across a trade, and every
   one of these is one owner's invention.

   Money is integer cents throughout, and the card fee is shared out by largest
   remainder — the same splitCents the tip-out uses — so the pennies land
   somewhere real rather than vanishing into a rounding.

   THE HONESTY CONTRACT. Every rate here is the shop's own. There is no suggested
   rent, no usual split, no typical product charge, and nothing compared against
   what any other shop in town charges. Where the arithmetic leaves a stylist
   owing the shop money, it says so on the line rather than printing a negative
   take-home and moving on.
   ============================================================================ */

import { splitCents } from './tip-out.js';

/**
 * @param {object} input
 * @param {object} input.rules
 *   rentCents        flat weekly chair rent, for stylists on rent
 *   serviceSplitPct  hundredths of a percent the STYLIST keeps of services
 *   retailSplitPct   hundredths of a percent the STYLIST keeps of retail
 *   productPct       hundredths of a percent of services taken for product
 *   cardFeeCents     the week's total card processing fee, in cents
 *   passCardFee      true when the fee is shared out across the chairs
 * @param {Array} input.chairs
 *   [{id, name, arrangement: 'rent'|'commission', services, retail, tips, cardShareBasis?}]
 *   services / retail / tips are all integer cents
 */
export function computeChairSplit(input) {
  const { rules, chairs } = input;
  const {
    rentCents = 0,
    serviceSplitPct = 0,
    retailSplitPct = 0,
    productPct = 0,
    cardFeeCents = 0,
    passCardFee = false,
  } = rules;

  /* THE FEE IS SHARED ON SERVICES PLUS RETAIL, because that is what was actually
     run through the card reader. Splitting it evenly would charge the quiet
     chair the same as the busy one for money it never took. */
  const basis = chairs.map((c) => Math.max(0, (c.services || 0) + (c.retail || 0)));
  const basisTotal = basis.reduce((a, b) => a + b, 0);
  /* splitCents RETURNS AN OBJECT, not an array — `{ shares, pennies }`. Reading
     it as an array gives undefined on every index, which falls through a `|| 0`
     and charges nobody anything, and the sheet still adds up perfectly because
     zero is a valid share. Caught by the gate on the first run. */
  const split = passCardFee && cardFeeCents > 0 && basisTotal > 0
    ? splitCents(cardFeeCents, basis)
    : { shares: chairs.map(() => 0), pennies: [] };
  const feeShares = split.shares;

  const rows = chairs.map((c, i) => {
    const services = c.services || 0;
    const retail = c.retail || 0;
    const tips = c.tips || 0;
    const onRent = c.arrangement === 'rent';

    /* THE PRODUCT CHARGE COMES OFF SERVICES BEFORE THE SPLIT, and the order
       matters: taking it after would charge the stylist a share of a deduction
       they have already carried in full. */
    const product = Math.round((services * productPct) / 10000);
    const servicesAfterProduct = services - product;

    const rent = onRent ? rentCents : 0;
    const serviceKeep = onRent
      ? servicesAfterProduct
      : Math.round((servicesAfterProduct * serviceSplitPct) / 10000);
    const retailKeep = onRent
      ? retail
      : Math.round((retail * retailSplitPct) / 10000);

    const fee = feeShares[i] || 0;
    /* Which chairs picked up an odd penny, so the sheet can say so out loud
       rather than leaving somebody to find a cent they cannot account for. */
    const gotPenny = split.pennies.includes(i);
    /* TIPS ARE NOT SPLIT AND NOT DEDUCTED FROM. They are the customer's money
       for the person who did the work, and a shop that took a cut of them would
       be making a decision this tool has no business making silently. */
    const takeHome = serviceKeep + retailKeep + tips - rent - fee;
    const shopKeeps = (services - product - serviceKeep) + (retail - retailKeep) + rent + product;

    return {
      ...c,
      services, retail, tips, onRent,
      product, servicesAfterProduct,
      rent, serviceKeep, retailKeep, fee, gotPenny,
      takeHome, shopKeeps,
      owesShop: takeHome < 0,
    };
  });

  const totals = {
    services: rows.reduce((a, r) => a + r.services, 0),
    retail: rows.reduce((a, r) => a + r.retail, 0),
    tips: rows.reduce((a, r) => a + r.tips, 0),
    product: rows.reduce((a, r) => a + r.product, 0),
    rent: rows.reduce((a, r) => a + r.rent, 0),
    fee: rows.reduce((a, r) => a + r.fee, 0),
    takeHome: rows.reduce((a, r) => a + r.takeHome, 0),
    shopKeeps: rows.reduce((a, r) => a + r.shopKeeps, 0),
  };

  const problems = [];
  /* A CHAIR ON RENT THAT DID NOT COVER IT. The arithmetic is perfectly happy to
     print a negative take-home, and a settlement sheet that quietly hands
     somebody a minus figure is how a stylist finds out at the till. */
  for (const r of rows.filter((x) => x.owesShop)) {
    problems.push(`${r.name} comes out at less than nothing this week and would owe the shop ${(Math.abs(r.takeHome) / 100).toFixed(2)}.`);
  }
  /* A SPLIT OVER 100% pays out more than came in, and it looks like an ordinary
     generous week until the shop's own column goes negative. */
  if (serviceSplitPct > 10000) {
    problems.push('The service split gives the chair more than the whole service, so the shop is paying to do the work.');
  }
  if (retailSplitPct > 10000) {
    problems.push('The retail split gives the chair more than the retail came to.');
  }
  /* PRODUCT AND SPLIT TOGETHER CAN EXCEED THE SERVICE. Each is reasonable on its
     own and nothing anywhere compares them. */
  if (productPct > 10000) {
    problems.push('The product charge takes more than the whole service before anything is split.');
  }
  for (const name of [...new Set(rows.map((r) => r.name))]) {
    if (rows.filter((r) => r.name === name).length > 1) {
      problems.push(`There is more than one chair called “${name}”, so two lines on this sheet are the same person as far as anybody reading it can tell.`);
    }
  }
  for (const r of rows.filter((x) => x.services < 0 || x.retail < 0)) {
    problems.push(`${r.name} has a negative figure on the week, which cannot be a week's takings.`);
  }
  /* THE FEE HAS NOWHERE TO GO. A shop that passes the card fee on and had a week
     with no card takings would silently absorb it, which is the opposite of the
     rule they set. */
  if (passCardFee && cardFeeCents > 0 && basisTotal === 0) {
    problems.push('The card fee is set to be shared out, but nothing was taken this week, so there is nothing to share it against and the shop carries all of it.');
  }

  return { rows, totals, problems, feeShared: passCardFee ? cardFeeCents : 0 };
}
