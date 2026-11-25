/* ============================================================================
   PROVIDER SPLIT — what each provider is owed under this practice's own
   agreement, which no two practices write the same way.

   An associate dentist, a hygienist on a percentage, a physician in a group:
   each is paid a share of what they brought in. That sentence hides four
   separate decisions, and every one of them belongs to the practice:

     1. A SHARE OF WHAT — production, meaning what they did, or collection,
        meaning what actually arrived. These are different numbers in the same
        month and the gap between them is the practice's accounts receivable.
     2. AT WHAT PERCENTAGE — which is negotiated, per person.
     3. BEFORE OR AFTER LAB — a crown has a lab bill against it, and whether
        that comes off the top before the split or is the practice's own cost is
        the single most argued line in an associate agreement.
     4. AND WHO CARRIES THE ADJUSTMENTS — the insurance write-off between what
        was billed and what the plan allows.

   ── WHY A PLATFORM CANNOT DO THIS ───────────────────────────────────────────

   Practice management software computes production and collection perfectly and
   then stops, because the split is not in it. The four decisions above live in a
   signed agreement in a drawer, and they differ per provider inside the same
   practice — one associate on 30% of collection net of lab, another on 35% of
   production gross, because that is what each of them agreed to.

   ── PRODUCTION AND COLLECTION ARE NOT A RATIO ───────────────────────────────

   Collection in a month can exceed production in that month, because money
   arrives against work done earlier. That is normal and this reports it as a
   fact rather than as an error — but it also means a "collection rate" computed
   by dividing one by the other is meaningless over a single period, so this
   never computes one.

   Money is integer cents. Percentages are integer hundredths of a percent, so
   32.5% is 3250 and a hundred rows do not drift.

   THE HONESTY CONTRACT. Every percentage, every basis and every lab rule is
   typed in from the agreement that was signed. Nothing here suggests a
   percentage, takes a view on whether production or collection is the fairer
   basis, or compares any of it to what associates are paid anywhere else. It
   also computes no tax and no withholding — that is a payroll question and this
   is not payroll.
   ============================================================================ */

/**
 * @param {object} input
 * @param {Array} input.providers
 *   [{id, name, pctHundredths, basis: 'production'|'collection', labOffTop}]
 * @param {Array} input.rows
 *   [{id, providerId, production, collection, lab, adjustments}]  — all cents
 */
export function computeProviderSplit(input) {
  const providers = Array.isArray(input.providers) ? input.providers : [];
  const src = Array.isArray(input.rows) ? input.rows : [];

  const byProvider = providers.map((p) => {
    const mine = src.filter((r) => r.providerId === p.id);
    const production = mine.reduce((a, r) => a + Math.max(0, Math.round(r.production || 0)), 0);
    const collection = mine.reduce((a, r) => a + Math.max(0, Math.round(r.collection || 0)), 0);
    const lab = mine.reduce((a, r) => a + Math.max(0, Math.round(r.lab || 0)), 0);
    const adjustments = mine.reduce((a, r) => a + Math.max(0, Math.round(r.adjustments || 0)), 0);

    const basis = p.basis === 'collection' ? 'collection' : 'production';
    const basisAmount = basis === 'collection' ? collection : production;
    const labOffTop = p.labOffTop === true;
    /* THE ONE SUBTRACTION THE WHOLE AGREEMENT ARGUES ABOUT. Off the top means
       the provider carries their share of the lab bill; otherwise the practice
       does. Both are ordinary terms and this takes no view. */
    const splitOn = labOffTop ? basisAmount - lab : basisAmount;
    const pct = Math.max(0, Math.round(p.pctHundredths || 0));

    /* ROUNDED ONCE, AT THE END, FROM INTEGER CENTS AND INTEGER HUNDREDTHS.
       Dividing by 10000 rather than multiplying by a float keeps a hundred rows
       from drifting a cent at a time. */
    const pay = Math.round((splitOn * pct) / 10000);

    return {
      ...p,
      basis, labOffTop, pct,
      production, collection, lab, adjustments,
      basisAmount, splitOn, pay,
      rowCount: mine.length,
      /* Money that arrived this period against work not done this period, or
         the other way round. Reported, never turned into a rate. */
      gap: collection - production,
      labOverBasis: labOffTop && lab > basisAmount,
    };
  });

  const sum = (f) => byProvider.reduce((a, p) => a + f(p), 0);
  const totals = {
    providers: byProvider.length,
    production: sum((p) => p.production),
    collection: sum((p) => p.collection),
    lab: sum((p) => p.lab),
    adjustments: sum((p) => p.adjustments),
    pay: sum((p) => p.pay),
    /* What the practice keeps of the collected money after the splits and the
       lab it carried itself. Stated on collection, because that is the money
       that actually arrived. */
    practiceKeeps: sum((p) => p.collection) - sum((p) => p.pay) - sum((p) => (p.labOffTop ? 0 : p.lab)),
  };

  const problems = [];

  for (const p of byProvider.filter((x) => x.pct === 0)) {
    problems.push(`${p.name || 'A provider with no name'} has no percentage entered, so nothing is owed to them here.`);
  }
  for (const p of byProvider.filter((x) => x.pct > 10000)) {
    problems.push(`${p.name} is set to ${(p.pct / 100).toFixed(2)}%, which is more than everything they brought in.`);
  }
  /* LAB BIGGER THAN THE BASIS. The split would be negative, which is a real
     shape — a month of nothing but crowns that have not been paid for yet — and
     it must be named rather than shown as a small positive number. */
  for (const p of byProvider.filter((x) => x.labOverBasis)) {
    problems.push(`${p.name}'s lab bill is more than the ${p.basis} it comes off, so the split goes below zero.`);
  }
  /* PAID ON COLLECTION WITH NOTHING COLLECTED. Not an error and not rare — a new
     associate's first month looks exactly like this — but a zero here means
     "nothing arrived yet" rather than "did no work", and the two must not read
     the same. */
  for (const p of byProvider.filter((x) => x.basis === 'collection' && x.collection === 0 && x.production > 0)) {
    problems.push(`${p.name} is paid on collection and nothing has been collected yet, so their zero is money not arrived rather than work not done.`);
  }
  for (const p of byProvider.filter((x) => x.rowCount === 0)) {
    problems.push(`${p.name} has no lines against them this period.`);
  }
  for (const p of byProvider.filter((x) => x.labOffTop && x.lab === 0 && x.rowCount > 0)) {
    problems.push(`${p.name}'s agreement takes lab off the top and no lab has been entered, so the split is being worked out as though there was none.`);
  }
  for (const name of [...new Set(byProvider.map((p) => p.name).filter(Boolean))]) {
    if (byProvider.filter((p) => p.name === name).length > 1) {
      problems.push(`There is more than one provider called ${name}, so two lines here are the same person as far as anybody reading it can tell.`);
    }
  }
  const orphans = src.filter((r) => !providers.some((p) => p.id === r.providerId));
  if (orphans.length) {
    problems.push(`${orphans.length} line${orphans.length === 1 ? ' is' : 's are'} against a provider who is not on the list, so ${orphans.length === 1 ? 'it is' : 'they are'} in no split at all.`);
  }
  if (byProvider.length === 0) {
    problems.push('There are no providers entered, so there is nothing to split.');
  }

  return { providers: byProvider, totals, problems };
}
