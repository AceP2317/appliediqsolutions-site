/* ============================================================================
   NEW BERN AND CRAVEN COUNTY — THE DATES THAT CATCH PEOPLE OUT.

   THIS FILE IS DIFFERENT FROM EVERY TOOL ON THE SHELF, and the difference is
   the whole reason it needs its own rules.

   Every tool computes from the visitor's own numbers, so it cannot be wrong
   about the world. This one makes CLAIMS ABOUT THE WORLD — that a form is due
   on a date, that a threshold is a particular number of employees — and those
   claims rot on a calendar rather than on a code change. Nothing here errors
   when a rule changes. It simply becomes false and keeps looking confident.

   SO EVERY ROW CARRIES ITS AUTHORITY, A LIVE LINK, AND THE DATE IT WAS LAST
   READ. DECISIONS D19 requires a primary source behind every local claim, and
   `npm run gate` refuses to ship a row missing any of the three or verified
   longer ago than MAX_AGE_DAYS. A stale row becomes a red build rather than a
   quiet wrong answer.

   WHAT IS DELIBERATELY NOT HERE. The NC LLC annual report date is missing, and
   its absence is the rule working. Every source found for it was a registered-
   agent service rather than the Secretary of State, and a filing deadline taken
   from a company that sells filing services is not a primary source. It goes in
   when somebody has read it off the state's own page.

   THIS IS NOT LEGAL OR TAX ADVICE. It is a list of published dates with links
   to who published them. Which ones apply to a particular business, and what to
   do about them, is a conversation with an accountant.
   ============================================================================ */

export interface Deadline {
  id: string;
  /** What is due, in the words the business would use. */
  what: string;
  /** When, as published. Free text because "the 20th of the following month"
   *  is a real answer and turning it into a date would be inventing precision. */
  when: string;
  /** Who says so. Never an aggregator, never a service that sells filings. */
  authority: string;
  /** The page it was read off. */
  source: string;
  /** ISO day it was last read. The gate ages this. */
  verified: string;
  /** Which of the eight answers pull this row in. */
  appliesTo: string[];
  /** The part that actually costs money if it slips. Empty when there is none
   *  published — never invented to make a row feel urgent. */
  teeth?: string;
}

/** A row read longer ago than this fails `npm run gate`. */
export const MAX_AGE_DAYS = 180;

export const QUESTIONS = [
  { id: 'sells', label: 'Do you sell goods or prepared food?' },
  { id: 'employs', label: 'Do you pay anyone wages?' },
  { id: 'tenPlus', label: 'Ten or more people on the payroll?' },
  { id: 'twentyFivePlus', label: 'Twenty-five or more?' },
  { id: 'equipment', label: 'Do you own equipment, furniture or fixtures in Craven County?' },
  { id: 'food', label: 'Do you serve food to the public?' },
  { id: 'alcohol', label: 'Do you hold an ABC permit?' },
  { id: 'events', label: 'Do you work festivals or events off your own premises?' },
  { id: 'contractor', label: 'Do you hold a NC general contractor licence?' },
];

export const DEADLINES: Deadline[] = [
  {
    id: 'sales-tax',
    what: 'Sales and use tax return',
    when: 'Monthly or quarterly depending on how much tax you collect — quarterly returns are due the last day of January, April, July and October. Above $20,000 a month it becomes monthly with a prepayment, due the 20th.',
    authority: 'NC Department of Revenue',
    source: 'https://www.ncdor.gov/taxes-forms/sales-and-use-tax/sales-and-use-tax-filing-requirements-payment-options/filing-frequency-and-due-dates',
    verified: '2026-08-25',
    appliesTo: ['sells'],
  },
  {
    id: 'nc3',
    what: 'Annual withholding reconciliation (NC-3) with your W-2s',
    when: '31 January, for the year just ended.',
    authority: 'NC Department of Revenue',
    source: 'https://www.ncdor.gov/taxes-forms/withholding-tax/withholding-tax-forms-and-instructions/instructions-form-nc-3-annual-withholding-reconciliation',
    verified: '2026-08-25',
    appliesTo: ['employs'],
  },
  {
    id: 'ncui101',
    what: 'Quarterly unemployment tax and wage report (NCUI 101)',
    when: '30 April, 31 July, 31 October and 31 January.',
    authority: 'NC Division of Employment Security',
    source: 'https://www.des.nc.gov/employers/file-adjust-or-review-quarterly-tax-wage-report',
    verified: '2026-08-25',
    appliesTo: ['employs'],
  },
  {
    id: 'ncui101-efile',
    what: 'That quarterly report has to be filed electronically',
    when: 'Same four dates. The paper option stops being available at ten employees.',
    authority: 'NC Division of Employment Security',
    source: 'https://www.des.nc.gov/employers/file-adjust-or-review-quarterly-tax-wage-report',
    verified: '2026-08-25',
    appliesTo: ['tenPlus'],
  },
  {
    id: 'everify',
    what: 'E-Verify on new hires',
    when: 'Ongoing, not a date. It became mandatory at this size on 1 July 2013, and it excludes anyone employed for under nine months in a calendar year.',
    authority: 'NC Department of Labor',
    source: 'https://www.labor.nc.gov/workplace-rights/e-verify/e-verify-information',
    verified: '2026-08-25',
    appliesTo: ['twentyFivePlus'],
  },
  {
    id: 'personal-property',
    what: 'Business personal property listing',
    when: 'On or before 31 January, valued as of 1 January. Filed at 226 Pollock Street or through the county portal.',
    authority: 'Craven County Tax Administration',
    source: 'https://www.cravencountync.gov/2239/Business-Personal-Property',
    verified: '2026-08-25',
    appliesTo: ['equipment'],
  },
  {
    id: 'abc-renewal',
    what: 'ABC permit renewal',
    when: 'The permit year runs 1 May to 30 April, so renewal is due by 30 April.',
    authority: 'NC Alcoholic Beverage Control Commission',
    source: 'https://www.abc.nc.gov/permits/renewal-and-registration',
    verified: '2026-08-25',
    appliesTo: ['alcohol'],
    teeth: 'A 25% late fee after 30 April, and the permit is permanently cancelled if it is not renewed before 1 June. That is the hardest edge on this page.',
  },
  {
    id: 'cfpm',
    what: 'A certified food protection manager on staff',
    when: 'Ongoing, not a date. Required since 1 January 2014.',
    authority: 'NC Department of Health and Human Services',
    source: 'https://ehs.dph.ncdhhs.gov/docs/position/CertifiedFoodProtectionManagerRequirementFINAL.pdf',
    verified: '2026-08-25',
    appliesTo: ['food'],
  },
  {
    id: 'temp-food',
    what: 'Temporary food establishment permit',
    when: 'The application is due 15 days before the event.',
    authority: 'Craven County Environmental Health',
    source: 'https://www.cravencountync.gov/FAQ.aspx?QID=237',
    verified: '2026-08-25',
    appliesTo: ['events'],
    teeth: 'The permit costs $75, and 15 days before is a deadline rather than a suggestion.',
  },
  {
    id: 'gc-ce',
    what: 'Contractor continuing education, 8 hours',
    when: 'The CE year runs 1 January to 30 November — nothing is offered in December, so a licence left to the last month cannot be brought current.',
    authority: 'NC Licensing Board for General Contractors',
    source: 'https://www.nclbgc.org/continuing-education/',
    verified: '2026-08-25',
    appliesTo: ['contractor'],
  },
];

/* HELD BACK, on purpose, and listed so the absence is visible rather than
   looking like an oversight. Each goes in when somebody reads it off the
   authority's own page rather than off a service that sells filings. */
export const HELD = [
  {
    what: 'The NC LLC annual report and its due date',
    why: 'Every source found was a registered-agent company rather than the Secretary of State. A filing deadline taken from a business that sells filing services is not a primary source.',
  },
  {
    what: 'Whether Craven County levies a prepared-meals tax',
    why: 'These exist in North Carolina only where the General Assembly has authorised them. No evidence was found either way for Craven, and "probably not" is not a thing to publish about somebody’s tax return.',
  },
];
