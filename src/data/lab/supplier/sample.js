/* AN INVENTED SUPPLIER, for the sample reading. No real company, part or buyer stands behind any
   of these figures. It is shaped so a reading has something on each side: a price over target, a
   lead time a week long, a record under the bar, and ground it will give on some terms and not
   others. */
export const SAMPLE = {
  quote: {
    supplier: 'Supplier S-104', part: 'BRK-220', description: 'machined mounting bracket, 6061 aluminum',
    quantity: 5000, unitPrice: 4.2, leadTimeWeeks: 9, moq: 2500, paymentDays: 30, validDays: 30,
  },
  record: { onTimeRate: 0.86, defectPpm: 420, years: 6, certifications: ['ISO 9001'] },
  brief: {
    quantity: 5000, needByWeeks: 8, targetPrice: 3.95, paymentDays: 45,
    onTimeBar: 0.92, defectPpmBar: 500, essential: ['leadTimeWeeks'],
  },
  /* The steps it would move by, in order. Price stops above the target; the lead time meets the
     need in one step; payment meets the brief in one. */
  ground: { unitPrice: [4.1, 4.02], leadTimeWeeks: [8], moq: [2000, 1500], paymentDays: [45] },
};
