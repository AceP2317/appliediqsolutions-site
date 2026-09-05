/**
 * house-terms.js — the standing commercial terms, written down once.
 *
 * WHY THIS FILE EXISTS. Before it, every one of these numbers was typed by hand into as many as
 * seven documents. The venue appeared in seven, the deposit in six, the payment window in four —
 * and nothing recomputed any of them. Changing the deposit from 50% to 40% meant finding six files
 * by hand, and missing one would have been silent: two signed documents disagreeing about when
 * money is due, with no error anywhere.
 *
 * That is LEDGER L-144's class — a value derivable from one place, transcribed into several.
 * `FLOOR_USD` in pricing.js already had the treatment; these did not.
 *
 * HOW IT IS ENFORCED. The markdown documents cannot interpolate a value, because they are read and
 * signed as prose rather than built. So the direction is inverted: the documents state the number
 * in words, and `scripts/check-paperwork.mjs` reads THIS file and refuses any document stating a
 * different one. The source of truth is here; the documents are checked against it.
 *
 * CHANGING A TERM: edit it here, run `npm run check:paperwork`, and it will name every document
 * that still says the old thing.
 */

/** Deposit taken on signature, as a percentage of the fixed price. The balance falls due on
 *  acceptance. 50/50 is the web-build norm and each half does a different job — the deposit makes
 *  a client real, the balance makes finishing worth something. */
export const DEPOSIT_PCT = 50;

/** Days from invoice date to payment being late. Shorter windows get paid faster at this size;
 *  thirty is what larger companies expect and their accounts departments rarely beat. */
export const PAYMENT_DAYS = 15;

/** Days after acceptance during which material defects are corrected at no charge. */
export const WARRANTY_DAYS = 30;

/** Business days from delivery in which the client must report material nonconformance. After
 *  that, or on production use, the delivery is accepted. */
export const NONCONFORMANCE_DAYS = 10;

/** Days of written notice to terminate the agreement or an SOW for convenience. */
export const TERMINATION_NOTICE_DAYS = 30;

/** Years confidentiality survives termination. Trade secrets survive as long as they stay secret,
 *  which is stated separately in the clause itself and is not a number. */
export const CONFIDENTIALITY_YEARS = 3;

/** Days a written quote stays open. */
export const QUOTE_VALID_DAYS = 30;

/** Days either party confers in good faith before starting a legal proceeding. */
export const CONFER_DAYS = 15;

/** Business days a client-side dependency may run late before work may be suspended. */
export const STOP_WORK_DAYS = 15;

/** Aggregate liability cap on a NO-FEE founding build, in whole US dollars. A cap at "fees paid"
 *  would be zero here — a total exclusion, and the shape a court is most willing to strike down
 *  entirely, leaving no cap at all. A small real number is likelier to survive than nothing.
 *  On the attorney list. Paid engagements cap at fees paid under the SOW, which is not a figure. */
export const FREE_BUILD_LIABILITY_CAP_USD = 1000;

/** Governing law and where a dispute is heard. */
export const GOVERNING_STATE = 'North Carolina';
export const VENUE_COUNTY = 'Craven County';

/** The contracting party, from the IRS assignment record and the recorded certificate.
 *  A SOLE PROPRIETORSHIP — there is no LLC. */
export const LEGAL_NAME = 'Ian David Provencher';
export const TRADE_NAME = 'AppliedIQ Solutions';
export const ENTITY_FORM = 'sole proprietorship';
export const SIGNATORY_TITLE = 'Owner, AppliedIQ Solutions';

/* ── ADDED 2026-08-27 (D46), the zero-ambiguity pass ──────────────────────────
   Each of these replaced a phrase in an agreement that stated a standard with no number under it
   — "appropriate to the size of the engagements", "without unreasonable delay", "a timely report".
   A standard with no number is decided later by whoever is arguing, which is the definition of the
   room for interpretation this pass exists to remove. Every one was already typed as a per-client
   [FILL: N] field carrying the same value every time, which is a field nobody was deciding. */

/** Days after an engagement ends within which Consultant deletes or returns every copy of client
 *  data held outside the client's own accounts, and confirms it in writing. */
export const DATA_DELETION_DAYS = 30;

/** Hours from becoming aware of unauthorised access to or loss of client data within which
 *  Consultant must notify the client. North Carolina's own breach duty runs on the CLIENT and is
 *  owed to affected people and the Attorney General; this window is what lets them meet it. */
export const BREACH_NOTICE_HOURS = 72;

/** Days a client-side dependency may run late before the SOW may be treated as terminated for
 *  convenience by the client. Sits beyond STOP_WORK_DAYS, which only suspends. */
export const DELAY_TERMINATION_DAYS = 45;

/** Business days in which a party must answer a written request for consent. Silence past this is
 *  a refusal, stated rather than left open — an unanswered request otherwise stalls indefinitely
 *  and neither party can tell whether it is waiting or refused. */
export const CONSENT_RESPONSE_DAYS = 10;

/** Business days in which a party must give the other notice of a legally compelled disclosure of
 *  confidential information, where giving that notice is itself lawful. */
export const COMPELLED_DISCLOSURE_NOTICE_DAYS = 5;

/* PROFESSIONAL_LIABILITY_USD WAS REMOVED 2026-08-27, deliberately and not by tidying.
   The master agreement briefly committed to carrying errors-and-omissions cover at a named
   limit while no policy existed, which is a promise in breach on the day it is signed. The
   operator struck the commitment instead: §11 now requires no insurance and points a client who
   needs it at the SOW. There is therefore no standing figure, and a value nothing states is not
   a standing term. With no company between a claim and personal assets, the liability cap in §12
   now carries that risk alone. */

/** The accessibility standard deliverables are built toward. Building TOWARD a standard is not a
 *  warranty that any law is met, and no document may claim one. */
export const ACCESSIBILITY_TARGET = 'WCAG 2.1 Level AA';
