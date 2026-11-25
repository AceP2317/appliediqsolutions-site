/* THE SUPPLIER'S-SIDE READING: what a supplier sends, what is run on it, and what comes back.

   A supplier wants to know how a buyer's AI reads its quote before a real buyer does. Two buyer
   stand-ins do the reading. Each is a general model given a buyer's written instructions
   (buyers.js), never a named vendor's system. One scores the quote. The other bargains against it,
   and the supplier's side of that bargaining is answered from the ground the supplier itself said
   it would give, so no model invents the supplier's answers. scripts/lab/supplier-reading.mjs runs
   a session and writes the reading. This round runs on the invented supplier in sample.js with
   stand-in models only (DECISIONS.md D139). Where a real supplier's quote may go is round two's
   decision. */

/** The four terms a quote carries and a buyer can press on, and which way is better for the buyer. */
export const TERMS = {
  unitPrice: { label: 'unit price', better: 'lower', kind: 'money' },
  leadTimeWeeks: { label: 'lead time', better: 'lower', kind: 'weeks' },
  moq: { label: 'minimum order', better: 'lower', kind: 'units' },
  paymentDays: { label: 'payment terms', better: 'higher', kind: 'days' },
};

/** The five things the scoring buyer scores, 1 to 5, and what each is held against. */
export const CRITERIA = {
  price: 'the unit price against the target price',
  leadTime: 'the lead time against the week the parts are needed by',
  moq: 'the minimum order against the quantity needed',
  payment: 'the payment terms against the terms wanted',
  record: "the supplier's on-time rate and defect rate against the buyer's bars",
};

const termList = Object.values(TERMS).map((t) => t.label).join(', ').replace(/, (?=[^,]*$)/, ' and ');

/** What the supplier sends. The buyers see the first three; the ground stays on the supplier's side. */
export const SENDS = [
  ['The quote', `the part, the quantity, its ${termList}, and how long the quote holds`],
  ['Its record', 'its on-time rate and defect rate over the last twelve months, its years supplying, and its certifications'],
  ['The buyer it sells to', 'a brief written with the supplier: the quantity, the week the parts are needed by, the target price, the payment terms wanted, the bars on the record, and which terms the buyer cannot give up'],
  ['The ground it would give', 'for each term, the steps it would move by if pressed, in order; a term with no steps is one it holds. The buyers never see this'],
];

/** How many times each buyer runs per model, and the longest a bargaining session may go. */
export const RUNS = { scorer: 5, bargainer: 3, turnCap: 8 };

/** A criterion is marked down when its median score across the scoring runs is under this. */
export const MARK_DOWN_BELOW = 3;

/** What the reading reports, in the order it reports it. */
export const REPORTS = [
  `Where the scoring buyer marked the supplier down: each criterion whose median score is under ${MARK_DOWN_BELOW} of 5, with every run cited and the reason each run gave.`,
  'Where the supplier gave ground: each term it moved on while bargaining, from what to what, in which sessions and turns.',
  'What it held: each term a buyer pressed on that the supplier would not move.',
  'How each bargaining session ended: agreed, walked away, an unreadable reply, or stopped at the turn cap.',
  'Every run by its id, with the model that ran it and its outcome.',
];
