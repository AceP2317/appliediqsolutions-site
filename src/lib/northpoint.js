/**
 * NORTHPOINT MANUFACTURING — the fictional company the seven supply-chain
 * demos are set in, written down once.
 *
 * WHY A COMPANY NEEDS A FILE. Northpoint was a string typed into six demo
 * files in three different shapes — a `COMPANY` constant, a `company:` field,
 * and bare text inside a heading — and the world it named had drifted apart
 * underneath it. Measured 2026-08-27, across seven tools that a visitor opens
 * from one gallery page:
 *
 *   · two tools said the plants are 1710 and 1720; a third said P10 and P20
 *   · one named those sites Riverside and Lakeside; another named the same two
 *     codes Assembly and Fabrication
 *
 * None of it is wrong on its own, and all of it is wrong together: open two
 * tabs and Northpoint is two companies. That is the same failure the palette
 * had — seven reasonable local choices summing to something incoherent — and it
 * has the same fix, which is one place to read from.
 *
 * THE RECONCILIATION KEPT ALL FOUR NAMES rather than picking two and deleting
 * two. A real plant is referred to by its code, by where it is, and by what it
 * does, and people use all three in the same conversation. So 1710 is Riverside
 * and it assembles; 1720 is Lakeside and it fabricates. Nothing was thrown away
 * and nothing contradicts.
 *
 * ── THE HOUSE STYLE IS AN ATTRIBUTE OF THE COMPANY ──────────────────────────
 *
 * Northpoint's tools LOOK a particular way, and that is a fact about Northpoint
 * rather than a fact about this website. The values live in
 * `src/components/kit/industrial.js`, which imports this file and hands the
 * world back on every resolved faceplate as `T.world` — so a tool that knows
 * its paint also knows whose plant it is running in, from one import.
 *
 * Three chassis, one per group the /work/ gallery already shows, sharing one
 * brass accent. A new demo built for Northpoint inherits BOTH halves; see
 * DECISIONS D42 and the `portfolio-demo` skill.
 *
 * ── WHAT THIS IS NOT ────────────────────────────────────────────────────────
 *
 * Not a real company, not a real plant, not a real part number, and not a
 * disguised one. The demos are rebuilt from a written capability specification
 * rather than forked from anything, which is what makes the de-identification
 * clean rather than hopeful. Every figure any of them shows is generated from a
 * seed at load.
 */

/** The plants. Code, where it is, what it does — people use all three. */
export const PLANTS = [
  { code: '1710', place: 'Riverside', role: 'Assembly' },
  { code: '1720', place: 'Lakeside', role: 'Fabrication' },
];

export const NORTHPOINT = {
  company: 'Northpoint Manufacturing',
  /** Short form, for a cramped header or a column that has to fit. */
  short: 'Northpoint',
  plants: PLANTS,
  /** Just the codes, which is what a generator and a filter both want. */
  plantCodes: PLANTS.map((p) => p.code),
  /** `{ '1710': 'Riverside', … }` — the shape a lookup table wants. */
  plantNames: Object.fromEntries(PLANTS.map((p) => [p.code, p.place])),
  /** `1710 · Riverside (Assembly)` — the shape a caption wants. */
  plantLabel: (code) => {
    const p = PLANTS.find((x) => x.code === code);
    return p ? `${p.code} · ${p.place} (${p.role})` : code;
  },
  /** Two lines, both at Riverside. Named by the churn console. */
  lines: ['NP-LINE-1', 'NP-LINE-2'],
  /** Where the ocean freight lands. Named by the inbound radar. */
  port: 'Port of Calderon',
  /** Prefix on every generated part number, so a stray real one would stand out. */
  partPrefix: 'NP-',
};

/**
 * WHY THE HOUSE STYLE IS NAMED HERE AND VALUED ELSEWHERE.
 *
 * If the colours lived in this file too, then `src/lib/` — which the repo keeps
 * for pure arithmetic with no React and no design in it — would be holding a
 * design system, and the contrast gate would be reading a company profile. So
 * this states WHICH style is Northpoint's and where to read it; industrial.js
 * holds the values and is what every gate measures.
 */
export const HOUSE_STYLE = {
  name: 'the industrial faceplate',
  module: 'src/components/kit/industrial.js',
  summary: 'three dark chassis, one per /work/ gallery group, sharing one brass accent',
  decision: 'D42',
};
