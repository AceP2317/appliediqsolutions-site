/**
 * The flagship — a deployed service, not a browser demo.
 *
 * Deliberately NOT in demos.ts: those seven are client-side React islands at
 * /work/<slug>/, and every consumer (LiveTools, work/index, Hub, Moat, ShipLog,
 * demoSchema, llms.txt) assumes that contract. This one is a Python service on
 * a server. Different claim, different surface — and `toolCount` stays honest.
 *
 * HONESTY, load-bearing: the engine is a conditional probability table of
 * MEASURED FREQUENCIES over observed week-to-week transitions. It is not machine
 * learning and no model is fitted. Copy here must never say "ML", "AI model",
 * "trained", or "forecasting model" — the restraint is the selling point. Nor
 * "recomputes on every request": the predictive tables are baked at image build.
 */
export const flagship = {
  eyebrow: 'Flagship · live service',
  host: 'demo.appliediqsolutions.com',
  name: 'Confirmation Outlook',
  tagline: 'Which orders miss their date next week — measured, not modeled.',
  body:
    'A supply-chain risk service for a fictional manufacturer, built end to end — Python engine, real API, operator console. Every probability is a measured frequency over observed week-to-week transitions: no model is fitted, and none is claimed. The engine is scored against a week it was never shown.',
  facts: [
    { v: '2,400', k: 'materials' },
    { v: '12', k: 'DCs' },
    { v: '53k', k: 'order lines' },
    { v: '100%', k: 'synthetic' },
  ],
  arch: [
    {
      title: 'The image builds itself.',
      body: 'The container generates its own world, scores the engine against it, and checks 42 assertions. One red assertion and the image never ships.',
    },
    {
      title: 'One process, three front doors.',
      body: 'One service answers the REST API, an MCP server AI clients can drive, and the React console — all reading the same validated numbers.',
    },
    {
      title: 'The AI is on a leash.',
      body: 'Answers come only from what the engine computed — rate-limited per visitor, capped by a hard daily spend ceiling.',
    },
  ],
  honesty: 'Validated output served live · warm state baked at build',
  cta: { label: 'Open the live app', href: 'https://demo.appliediqsolutions.com' },
  source: { label: 'Read the source', href: 'https://github.com/AceP2317/confirmation-outlook' },
} as const;
