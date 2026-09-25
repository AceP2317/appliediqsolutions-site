/* ============================================================================
   THE FOUNDING BUILDS — the count held ONCE, and every sentence derived.

   ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────

   Until 2026-08-26 the word "three" was typed as plain prose in five separate
   sentences inside main-street.astro, and NOTHING anywhere knew whether any of
   them had been claimed. The playbook's plan for the end state was that a person
   remembers to delete the whole band. That is a checklist, and this repo has
   already been bitten twice by exactly that shape: D22 forbids typing the tool
   count for the same reason, and L-144 records a set of page heights written in
   prose that were wrong the day a tool shipped.

   The failure mode here is worse than a stale number, because this one is an
   OFFER. A band still saying "the first three are free" after all three are
   gone teaches a reader that nothing on the site is current — and that reader is
   a local business owner deciding whether to trust a stranger with no reviews.

   ── WHAT THE OPERATOR ASKED FOR, 2026-08-26 ──────────────────────────────────

   Not just a remaining count. He wants a visitor to see how many there WERE
   and that they are going. So both numbers are public. The remainder moves as
   claims land; the copy below always names the original alongside what is
   left, because "one founding build" and "the last of them" are the same fact
   told with very different weight.

   ── THE TOTAL MOVED ONCE, 2026-09-20, AND HERE IS WHY IT WAS ALLOWED TO ──────
   This header used to say the total never moves. It moved from three to two on
   D118, on a real event: the operator withdrew one of the offers when he dropped
   the prospect holding the second slot as a client, before any paperwork had
   been sent, so nobody held anything and nothing was unwound. The remainder
   stayed at one; what changed is how many were ever offered. A total that moves
   to manufacture pressure is exactly what the honesty line below forbids, which
   is why this move is recorded in DECISIONS.md rather than made quietly, and
   why the next one has to be too.

   ── THE HONESTY LINE, AND IT IS NOT NEGOTIABLE ───────────────────────────────

   `CLAIMED` IS SET BY HAND, BY THE OPERATOR, ONLY WHEN A CLAIM IS REAL. There is
   no order system behind this site and nothing counts anything automatically, so
   any number here is his word. That is fine — his word is what the whole band is
   made of — but it means the number must never be moved to create pressure. A
   site saying "one left" while both are open is manufactured scarcity, and this
   is the one practice on earth that cannot afford it: every other page argues
   that its figures are the visitor's own numbers through printed arithmetic.
   Scarcity a reader later discovers was staged does not cost you the band, it
   costs you the contract the whole site rests on.

   So: move this number when a build is genuinely spoken for, and not before.
   ============================================================================ */
import { countWord as spell } from '../lib/count-words.js';

/** How many were offered. A visitor is meant to see the original, which is what
 *  makes "one left" mean anything. Moved once, from three, on D118; see the
 *  header for the only condition under which it moves again. */
export const TOTAL = 2;

/** How many are genuinely spoken for. THE ONE NUMBER TO EDIT. Set it only when
 *  a claim is real; see the honesty note above. At TOTAL the band retires
 *  itself and no page needs touching. Moved back from 2 to 1 on D118 when the
 *  second claim was withdrawn. */
export const CLAIMED = 1;

export const remaining = Math.max(0, TOTAL - CLAIMED);

/* ── THE SLOTS, ONE PER BUILD, FOR DRAWING ───────────────────────────────────
   The operator asked for this loud, 2026-08-26, on the day the first build was
   spoken for. A sentence saying "one left" is read; a row of boxes with one
   struck through is SEEN, and it is the same fact — which is the only kind of
   loud this site is allowed, because every other page argues that its figures
   are checkable.

   Numbered from one and ordered so the taken ones come first, which is how a
   row of anything gets filled in real life. The label is the whole content of
   each box, held here rather than in the markup so the page cannot word a slot
   differently from the sentence above it. */
export const slots = Array.from({ length: TOTAL }, (_, i) => {
  const n = i + 1;
  const taken = n <= CLAIMED;
  return {
    n,
    taken,
    label: `${String(n).padStart(2, '0')} · ${taken ? 'SPOKEN FOR' : 'OPEN'}`,
  };
});

/** Whether the offer is still live. main-street.astro renders nothing when this
 *  is false, so the band cannot outlive the offer by however long it takes
 *  somebody to remember it. */
export const isOpen = remaining > 0;

/** A small count spelled out.
 *
 *  THE WORD LIST MOVED OUT ON 2026-09-13, to src/lib/count-words.js. This
 *  comment used to read "the same shape as tradeCountWord() in
 *  src/lib/trades.js" — a copy announcing itself as a copy and doing nothing
 *  about it. THIS ONE STOPPED AT SIX AND WAS TYPED `as const`, so it silently
 *  returned digits from seven upward while the other two kept spelling; the
 *  shared list goes to twenty, so this gains words rather than losing any.
 *
 *  The positional `capital` argument is kept so the six call sites below are
 *  untouched by the move. */
export function countWord(n: number, capital = false): string {
  return spell(n, { capital });
}

export const totalWord = countWord(TOTAL);
export const remainingWord = countWord(remaining);

/* ── THE SENTENCES, DERIVED ───────────────────────────────────────────────────
   Each of these was a hand-typed line. They read differently at every count on
   purpose: a last remaining slot should not be announced in the same voice as
   an untouched offer, and writing that by hand is how five sentences drift out
   of step with each other. */

/** The small label above the band. Names the original AND what is left. */
export const eyebrow = CLAIMED === 0
  ? `${countWord(TOTAL, true)} founding builds · New Bern only`
  : `${countWord(TOTAL, true)} founding builds · ${remainingWord} left`;

/** The headline. */
export const headline = CLAIMED === 0
  ? `The first ${totalWord} are free.`
  : remaining === 1
    ? `One of the ${totalWord} is still free.`
    : `${countWord(remaining, true)} of the ${totalWord} are still free.`;

/** The opening sentence of the offer body.

    IT SAYS "THE BUILD", NOT "THE TOOL", AND THAT CHANGED ON 2026-08-30. The offer was written when
    a founding build meant fitting a tool from the shelf, and docs/founding-builds.md ruled a website
    out by name — a website needs more than one page with two to four inputs, so it failed the fit
    test at the door. The claimed slot is a website, so the narrower word had stopped
    describing what was actually being built. Widening it was the honest direction: a promise that
    undersells what gets delivered is still a promise that does not match the work. What each
    founding build actually covers is written down per client in
    docs/engagement/agreements/founding-website-scope.md. */
export const offerLine = CLAIMED === 0
  ? `I am building for ${totalWord} New Bern businesses at no charge. You get the build, you own it outright, and there is no invoice at the end of it.`
  : `I am building for ${totalWord} New Bern businesses at no charge, and ${countWord(CLAIMED)} ${CLAIMED === 1 ? 'is' : 'are'} already spoken for. You get the build, you own it outright, and there is no invoice at the end of it.`;

/** The button, accurate at every count.

    IT MUST NOT SAY "one of the two" ONCE ONE IS GONE. The eyebrow and the
    headline keep the original total in view deliberately, because that is what
    makes "one left" mean something — but a BUTTON naming the original total
    while fewer remain tells the visitor all of them are available, which is the
    one sentence in this band that would be untrue. Naming what is actually left
    is also the stronger read: "the last one" carries the pressure that "the
    two" cannot. */
export const claimLabel = remaining === 1
  ? 'Claim the last one →'
  : CLAIMED === 0
    ? `Claim one of the ${totalWord} →`
    : `Claim one of the last ${remainingWord} →`;

/** The closing line. True at every count, so it is derived rather than fixed
 *  only to keep the whole band reading from one place. */
export const closingLine = `${countWord(TOTAL, true)}, then the price is the price.`;

/** The naming ask — what the founding builds actually buy since D43, which is a
 *  named story on a page we control rather than a review.

    IT WAS THE ONE COUNT STILL TYPED BY HAND, found 2026-08-31. It sat in
    main-street.astro reading "Three businesses willing to be named is worth more to me than three
    invoices", inside the one band whose entire design is that no count is typed. It was never
    WRONG, because it names the total rather than the remainder and the total had not moved — which
    is exactly why nothing caught it and why it would have gone silently wrong on the day TOTAL
    did move, which came on 2026-09-20. A count that is correct for a reason nobody checks is a
    count waiting. */
export const namingLine =
  `${countWord(TOTAL, true)} businesses willing to be named is worth more to me than ${totalWord} invoices.`;
