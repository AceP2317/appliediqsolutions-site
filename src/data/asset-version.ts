/* ============================================================================
   ONE VERSION NUMBER FOR EVERY COMMITTED IMAGE, APPLIED WHERE IT CANNOT BE
   FORGOTTEN.

   ── THE BUG THIS EXISTS TO KILL ──────────────────────────────────────────────

   A committed image is regenerated IN PLACE: the pixels change and the address
   does not. A browser or a scraper holding a cached copy has no way to learn
   that, so it keeps painting the old picture. `public/_headers` gives /og/* and
   every .png a seven-day cache, and LinkedIn pins a scraped preview by URL for
   about as long. The fix has always been a version in the query string — a
   different address cannot be answered from an old cached response (D24).

   The fix was applied BY HAND, per page, and by 2026-08-26 it had drifted into
   this: twenty-one of the /work/<slug>/ pages carried no version at all, and
   the rest were scattered across ?v=1 through ?v=6 with nothing able to notice.
   Every one of those numbers was somebody remembering.

   THE TAB ICON IS THE SAME BUG AND IT COST THE MOST. A pass on 2026-08-26 put
   ?v=2 on every icon link except one — the .ico — on the reasoning that .ico
   falls through to a site-wide header block that sets no Cache-Control and so
   revalidates. That reasoning is correct about the HTTP cache and incomplete
   about the browser: `sizes="any"` marks an icon scalable, which is the
   strongest signal in icon selection, and Chrome keeps a favicon store of its
   own that is keyed by URL and stickier than the HTTP cache. So the one file
   most likely to be the one actually displayed was the one file whose address
   had never changed since the retired brand. The icon was redrawn, production
   served the correct bytes — checked by checksum — and the operator still saw
   the old company in his tab.

   ── WHY A HELPER AND NOT A CONVENTION ────────────────────────────────────────

   A page cannot forget a number it never types. Every page passes a bare path
   and the layout stamps the version on, so "did this one get bumped?" stops
   being a question anybody can answer wrong. That is the same reasoning behind
   src/lib/trades.js and src/lib/career.js: hold the value once, derive it
   everywhere, and the checklist stops being the mechanism.

   ── WHEN TO BUMP ─────────────────────────────────────────────────────────────

   Bump ART_VERSION whenever `npm run og` or `npm run icons` changes what any
   picture LOOKS like. Not on every regeneration — the generators are
   deterministic, so a re-run that changes no pixels needs no bump. One number
   moves everything together, which is the point: a per-file number is a per-file
   opportunity to miss one, and that is exactly what happened.
   ============================================================================ */

/**
 * 9 — set 2026-09-03, when /card/ gained the phone (D65). The share card for
 * that page embeds the QR, the QR switched from encoding a phone-free vCard to
 * the full one, and `public/og/card.png` changed by about 1.9 KB as a result.
 *
 * ── AND IT WAS ALMOST MISSED IN THE SAME COMMIT THAT CHANGED THE PICTURE ─────
 *
 * The card work regenerated that image and shipped it with this number still at
 * 8. Caught in the wrap, not by the build: `npm run gate` refuses a page that
 * references /og/ WITHOUT a version, and every page had one — the correct
 * version of a stale picture. **The gate guards the stamp, not the bump**, and
 * nothing can tell "this regeneration changed no pixels" from "somebody forgot",
 * because both look like an unchanged constant beside a changed file.
 *
 * The upgrade path, not built here: gen-og.mjs already records what it baked
 * into scripts/.og-derived.json for a different check. It could record a hash
 * per output and the gate could refuse a build where a hash moved and this
 * number did not — which is the same trick D24's own reasoning uses, applied to
 * the file that reasoning is written in. See LEDGER L-204.
 *
 * 8 — set 2026-08-27, when the seven supply-chain demos were repainted and all
 * seven of their gallery tiles recaptured (D42).
 *
 * ── AND THE GALLERY TILES HAD NEVER BEEN VERSIONED AT ALL ────────────────────
 *
 * This module was written for /og/ and the icons, and `/shots/*.webp` was
 * simply never wired to it — five render sites, none stamped. The share cards
 * are the artifact people worried about because they are the ones LinkedIn
 * pins; the TILE is the one a returning visitor actually sees first, and it was
 * the one at a fixed address. Repainting seven tools and leaving seven cached
 * dark-slate screenshots on the gallery is L-204 exactly: the source corrected,
 * the address unmoved, the person seeing no change.
 *
 * `npm run gate` now refuses a built page that references /shots/ or /og/
 * without a version, so this cannot be a thing anyone has to remember again.
 */
export const ART_VERSION = 9;

/**
 * Stamp the current version onto a site-relative asset path.
 *
 * REPLACES any version already present rather than appending, because pages
 * historically typed their own and a path arriving as `/og/bio.png?v=3` must
 * still come out on the one number this module holds. Leaves absolute URLs and
 * data URIs alone — those are not ours to version.
 */
export function versioned(path: string): string {
  if (!path.startsWith('/')) return path;
  const [base] = path.split('?');
  return `${base}?v=${ART_VERSION}`;
}
