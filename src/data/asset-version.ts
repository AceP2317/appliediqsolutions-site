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
 * 14 — set 2026-09-07, when the Billable Hours Realization sheet was added, and
 * again the bump is not for the new tool.
 *
 * ── THE NEW TILE NEEDS NO VERSION; THE THREE IT DRAGGED WITH IT DO ───────────
 *
 * Looking at the fourteenth tool's captured tile found its days-quiet column
 * toned in the caution color on rows a caution row tint had already marked —
 * three signals for one fact, with the money the tool exists to find left
 * competing against a number of days. Sweeping that class found it shipped in
 * `retainage`, `draw-schedule` and `claim-aging` as well, and all four were
 * repaired together (LEDGER L-382).
 *
 * That column is inside the captured tile, so three tiles the /work/ gallery
 * already references changed pixels. A returning visitor holding a cached copy
 * would otherwise keep seeing the version that pointed at the wrong column.
 *
 * The share cards, the GBP photos and the LinkedIn banner did NOT move: the
 * cards are drawn compositions rather than captures, and the two photos are
 * built from `event-day` and `past-due-order-triage`, neither of which changed.
 * A regeneration that changes no pixels is exactly the case the rule above says
 * needs no bump — checked, not assumed, by running `npm run og` and reading
 * `git status` over `public/`.
 *
 * 13 — set 2026-09-07, when the Unit Turn and Vacancy Cost sheet was added.
 *
 * ── THE BUMP IS NOT FOR THE NEW TOOL, AND THAT IS THE POINT ──────────────────
 *
 * A new tool's tile is at a new address, so no visitor holds a cached copy of
 * it and it needs no version to reach anybody. What needed one is what the new
 * tool DRAGGED WITH IT: widening the smoke test's copy rule found three shipped
 * tools — `claim-aging`, `consignment` and `provider-split` — printing
 * "remembers your each payer" in their storage strip, and that strip is inside
 * the captured tile. Three tiles the /work/ gallery already references changed
 * pixels, so three returning visitors would otherwise keep seeing the sentence
 * that was fixed.
 *
 * The GBP photos and the LinkedIn banner did NOT move — they are built from
 * `event-day` and `past-due-order-triage`, neither of which changed — and a
 * regeneration that changes no pixels is exactly the case the rule above says
 * needs no bump. The three that moved are the reason this number did.
 *
 * 12 — set 2026-09-07, when the No-Show Cost Calculator was added, and for one
 * thing it dragged with it that is worth more than the new card.
 *
 * ── `npm run og` CONSUMES `npm run shots` OUTPUT, AND THE ORDER MATTERS ──────
 *
 * `gen-og.mjs:525` reads `public/shots/<slug>.webp` to build the two Google
 * Business Profile photos — those are real captures of a live tool in a drawn
 * frame, not synthesized scenes. So a tool whose appearance changes moves its
 * TILE, and the tile moves the GBP photo built on top of it.
 *
 * Version 11 ran `og` first and `shots` second, so `gbp/photo-event-day.png`
 * was built from the pre-rename tile and then the tile changed underneath it.
 * Nothing was wrong with the guard: the hash comparison refused the very next
 * `og` run and named the file. But the correct order is SHOTS, THEN CARDS, and
 * it is written down nowhere else.
 *
 * 11 — set 2026-09-07, when all fourteen shelf tools were renamed to the phrase
 * an owner types into a search box rather than the phrase a portfolio would use.
 * Every one of the fourteen share cards carries its tool's name as baked pixels,
 * so all fourteen changed.
 *
 * ── THE NAME WAS TYPED IN THREE PLACES AND NOTHING COMPARED THEM ─────────────
 *
 * `demos.ts` `name` feeds the title tag, the crawlable heading, the gallery card
 * and the structured data. Each demo `.jsx` carried its own hard-coded
 * `name="…"` for the heading a visitor actually sees. And `gen-og.mjs` held a
 * third copy in its `cards` array, importing nothing. `shelf-list.mjs` parses
 * `slug:` rows only, so editing one and not the others shipped a page whose tab,
 * heading and share card disagreed with every gate green. See
 * `scripts/check-tool-names.mjs`, which now refuses exactly that.
 *
 * 10 — set 2026-09-06, when the AI Fit Assessment split into two forms (D81).
 * `public/og/ai-fit.png` carried "I come out, watch the work, and write the
 * list", which stopped being true for half of what is sold. The card names no
 * figure and still does not, so only the subtitle moved.
 *
 * THE GENERATOR REFUSED THE FIRST REPLACEMENT, which is worth recording because
 * it is the guard working rather than a mistake: SVG text does not wrap, so
 * gen-og.mjs measures every string against its column and exits rather than
 * rendering one cut off mid-word. The first draft needed 1096px in a 1078px
 * column and was shortened until it fitted.
 *
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
export const ART_VERSION = 14;

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
