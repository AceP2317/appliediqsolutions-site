/* ============================================================================
   CONSIGNMENT — what each consignor is owed, and what the shop actually kept.

   ── FOUR RULES, ALL THE SHOP'S, AND NO TWO SHOPS WRITE THEM THE SAME ────────

     1. THE SPLIT, per consignor, because it is negotiated per person.
     2. A PRICE BAND — many shops give a better share above a threshold, so the
        consignor is rewarded for bringing in the thing that actually sells.
     3. WHERE THE CARD FEE LANDS — off the top before the split, or carried by
        the shop out of its own half.
     4. WHO BEARS A MARKDOWN. If the shop drops the tag to move something, does
        the consignor's share come off what it SOLD for or off what it was
        LISTED at? Both are ordinary terms, and the second one can leave the
        shop paying out more than it took.

   ── THE SHOP'S OWN SHARE IS COMPUTED FROM WHAT ARRIVED, NEVER FROM THE SPLIT ─

   This is the part that goes wrong. If the consignor's share is worked out on
   the LISTED price and the item sold for less, the shop's half is not "the
   other percentage" — it is whatever is left of the money that actually came
   in. That figure can be negative, and a tool computing the shop's share as a
   percentage would print a comfortable positive number for a sale that lost
   money. So the shop's take here is always `received - consignor's share`.

   ── PENNIES BY LARGEST REMAINDER, REUSING tip-out.js ────────────────────────

   A two-way split of an odd number of cents leaves a penny. `splitCents` from
   src/lib/tip-out.js hands it to the larger share and guarantees the two halves
   add back to what came in — the same routine the Tip Out Calculator and the
   Booth Rent Calculator already use. Three tools, one rounding rule.

   Money is integer cents; percentages are integer hundredths of a percent.

   THE HONESTY CONTRACT. Every split, the band, the card rate, the term and who
   bears a markdown are the shop's own. Nothing here suggests a split, predicts
   whether something will sell, or compares any of it to what other shops pay.
   ============================================================================ */

import { splitCents } from './tip-out.js';
import { daysBetween } from './recall.js';

/**
 * @param {object} input
 * @param {string} input.asOf                 ISO date the term is measured to
 * @param {number} input.termDays             how long the shop lists something
 * @param {number} input.cardPctHundredths    the card processor's rate
 * @param {boolean} input.feeOffTop           fee off before the split, or shop's
 * @param {boolean} input.markdownFromConsignor  split on what it SOLD for
 * @param {number} input.bandCents            a price above which the band applies
 * @param {number} input.bandBonusHundredths  extra points the consignor gets there
 * @param {Array}  input.consignors           [{id, name, pctHundredths}]
 * @param {Array}  input.items
 *   [{id, ref, consignorId, listedOn, listedCents, soldCents, card}]
 */
export function computeConsignment(input) {
  const asOf = typeof input.asOf === 'string' ? input.asOf : '';
  const term = Math.max(0, Math.round(input.termDays || 0));
  const cardPct = Math.max(0, Math.round(input.cardPctHundredths || 0));
  const feeOffTop = input.feeOffTop !== false;
  const fromConsignor = input.markdownFromConsignor !== false;
  const bandCents = Number.isFinite(input.bandCents) ? Math.max(0, Math.round(input.bandCents)) : null;
  const bandBonus = Math.max(0, Math.round(input.bandBonusHundredths || 0));
  const consignors = Array.isArray(input.consignors) ? input.consignors : [];
  const src = Array.isArray(input.items) ? input.items : [];

  const who = (id) => consignors.find((c) => c.id === id) || null;

  const items = src.map((v) => {
    const c = who(v.consignorId);
    const listed = Math.max(0, Math.round(v.listedCents || 0));
    /* NULL IS UNSOLD. Zero would be an item that sold for nothing, and a shop
       needs those two apart — one is stock on a rail, the other is a giveaway. */
    const sold = Number.isFinite(v.soldCents) ? Math.max(0, Math.round(v.soldCents)) : null;
    const card = v.card === true;
    const age = daysBetween(v.listedOn, asOf);

    const base = { ...v, consignorName: c ? c.name : null, listed, sold, card, age };

    if (sold == null) {
      return {
        ...base,
        unsold: true,
        fee: 0, received: 0, splitBase: 0, pct: null, consignorShare: 0, shopKeeps: 0,
        pastTerm: age != null && term > 0 && age > term,
        daysOver: age != null && term > 0 ? age - term : null,
        orphan: !c,
        soldAboveTag: false,
        shopLoses: false,
      };
    }

    const fee = card ? Math.round((sold * cardPct) / 10000) : 0;
    /* WHAT ACTUALLY ARRIVED. The split may be worked out on a different figure,
       but this is the money the shop is holding. */
    const received = sold - fee;

    const rawBase = fromConsignor ? sold : listed;
    const splitBase = feeOffTop ? Math.max(0, rawBase - fee) : rawBase;

    const own = c && Number.isFinite(c.pctHundredths) ? Math.max(0, Math.round(c.pctHundredths)) : 0;
    /* THE BAND IS TESTED ON WHAT IT SOLD FOR, not on what it was listed at. A
       thing that only cleared the threshold on its original tag did not clear
       it. */
    const inBand = bandCents != null && bandBonus > 0 && sold >= bandCents;
    const pct = Math.min(10000, own + (inBand ? bandBonus : 0));

    const { shares } = splitCents(splitBase, [pct, Math.max(0, 10000 - pct)]);
    const consignorShare = shares[0];

    return {
      ...base,
      unsold: false,
      fee, received, splitBase, pct, inBand, consignorShare,
      /* NEVER "the other percentage". See the header. */
      shopKeeps: received - consignorShare,
      shopLoses: received - consignorShare < 0,
      pastTerm: false,
      daysOver: null,
      orphan: !c,
      soldAboveTag: sold > listed,
      unreadableDate: age == null,
    };
  });

  const sold = items.filter((i) => !i.unsold);
  const unsold = items.filter((i) => i.unsold);
  const sum = (list, f) => list.reduce((a, x) => a + f(x), 0);

  const byConsignor = consignors.map((c) => {
    const mine = items.filter((i) => i.consignorId === c.id);
    const mineSold = mine.filter((i) => !i.unsold);
    return {
      ...c,
      items: mine.length,
      sold: mineSold.length,
      unsold: mine.length - mineSold.length,
      pastTerm: mine.filter((i) => i.pastTerm).length,
      owed: sum(mineSold, (i) => i.consignorShare),
      broughtIn: sum(mineSold, (i) => i.sold),
    };
  });

  const totals = {
    items: items.length,
    sold: sold.length,
    unsold: unsold.length,
    gross: sum(sold, (i) => i.sold),
    fees: sum(sold, (i) => i.fee),
    received: sum(sold, (i) => i.received),
    owed: sum(sold, (i) => i.consignorShare),
    shopKeeps: sum(sold, (i) => i.shopKeeps),
    pastTerm: unsold.filter((i) => i.pastTerm).length,
    pastTermValue: sum(unsold.filter((i) => i.pastTerm), (i) => i.listed),
    onTheFloor: sum(unsold, (i) => i.listed),
  };

  const problems = [];

  for (const i of items.filter((x) => x.orphan)) {
    problems.push(`${i.ref || 'An item'} is against a consignor who is not on the list, so nobody is owed for it.`);
  }
  for (const i of items.filter((x) => x.unreadableDate && !x.unsold)) {
    problems.push(`${i.ref} has a listing date this cannot read, so its age is unknown.`);
  }
  for (const i of items.filter((x) => x.soldAboveTag)) {
    problems.push(`${i.ref} sold for more than it was listed at, which is worth a look before anybody is paid on it.`);
  }
  /* THE ONE THAT COSTS MONEY. Splitting on the listed price while the item sold
     for less can leave the shop paying out more than it took, and a tool
     computing the shop's half as a percentage would never show it. */
  for (const i of items.filter((x) => x.shopLoses)) {
    problems.push(`${i.ref} pays out more than it brought in — the shop is ${((i.consignorShare - i.received) / 100).toFixed(2)} down on it, because the split is worked on the listed price rather than what it sold for.`);
  }
  for (const i of unsold.filter((x) => x.pastTerm)) {
    problems.push(`${i.ref} has been listed ${i.age} days, which is ${i.daysOver} past your ${term}-day term.`);
  }
  for (const c of byConsignor.filter((x) => !Number.isFinite(x.pctHundredths) || x.pctHundredths <= 0)) {
    problems.push(`${c.name} has no split entered, so nothing is owed to them on ${c.sold} sold item(s).`);
  }
  for (const c of byConsignor.filter((x) => x.pctHundredths >= 10000)) {
    problems.push(`${c.name} is on ${(c.pctHundredths / 100).toFixed(2)}%, which leaves the shop nothing before the card fee.`);
  }
  if (bandCents != null && bandBonus === 0) {
    problems.push('A price band is set with no extra share above it, so the band does nothing.');
  }
  if (bandCents == null && bandBonus > 0) {
    problems.push('An extra share is set with no price band to apply it above, so it never applies.');
  }
  if (term <= 0 && unsold.length > 0) {
    problems.push(`No term is set, so none of the ${unsold.length} unsold item(s) can ever show as past it.`);
  }
  if (cardPct === 0 && sold.some((i) => i.card)) {
    problems.push('Card sales are marked with a card rate of zero, so no fee is coming off any of them.');
  }
  for (const name of [...new Set(consignors.map((c) => c.name).filter(Boolean))]) {
    if (consignors.filter((c) => c.name === name).length > 1) {
      problems.push(`There is more than one consignor called ${name}, so two lines here are the same person as far as anybody reading it can tell.`);
    }
  }
  if (items.length === 0) {
    problems.push('There is nothing on the floor, so there is nothing to work out.');
  }

  return { items, byConsignor, totals, problems };
}
