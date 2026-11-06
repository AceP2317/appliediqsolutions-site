/**
 * state-package.js — what the client is looking at, as a file they choose to send.
 *
 * IT REPLACES "TAKE A PHOTO OF THE SCREEN". A photo shows the problem and cannot
 * be worked with; this reproduces it. `docs/engagement/client-documents/
 * support-and-incidents.md` asked for the photo until this shipped.
 *
 * WHY `state` IS ENOUGH, and it is a measured property rather than a hope. Every
 * engine in this folder is a pure function of its input — the clock included,
 * because the two tools that need a date (`recall.js`, `property-round.js`) take
 * `today` as an ARGUMENT and nothing here calls `new Date()`. So a package does
 * not have to carry a seed, a timestamp or a computation context to replay
 * exactly. It is `useRemembered`'s own storage envelope with a lid on it.
 *
 * WHY IT LIVES HERE RATHER THAN IN THE KIT. `src/components/kit/shelf.jsx`
 * imports React, so a Node gate cannot load it. This module is the same split
 * every engine here already uses: pure ESM, no React, importable by an island, by
 * a `scripts/*.mjs` gate and by the handover build. That is what lets a gate
 * check the very function the page runs instead of a copy of it.
 *
 * IT NEVER SENDS ANYTHING. There is no fetch, no beacon and no route in this
 * file, and that is load-bearing rather than cautious. `WontDo` hardcodes
 * "nothing you type is sent anywhere" and two gates assert it against the
 * rendered page, so a network path here would make the shelf's strongest promise
 * false. It is also what lets the delivered offline copy carry this at all, since
 * that file is checked for making zero requests.
 */

/** The envelope's own version. NOT a tool's state version — see readPackage. */
export const PACKAGE_FORMAT = 1;
export const PACKAGE_KIND = 'aiq.tool-state';

/* THE ALLOWLIST IS THE PRIVACY GUARANTEE, and it is deliberately the same shape
   as ALLOWED_DETAIL in src/scripts/track.js for the same stated reason: a future
   caller cannot accidentally include something by spreading an object in.
   Deliberately absent — document.referrer, document.cookie, location.search, and
   anything that would say where the client had BEEN rather than what their
   browser IS. */
export const ALLOWED_AGENT = new Set(['ua', 'w', 'h', 'dpr', 'lang', 'tz']);

/** How much of the rendered screen text to carry. A 200-row count sheet renders
 *  a lot of it, and none of it is the product — the state is. */
const SHOWN_LIMIT = 20000;

/**
 * Refuse anything that is not a plain value, naming the path that broke it.
 *
 * THIS GUARD EXISTS FOR ONE CONCRETE REASON rather than as hygiene.
 * `reorder-list` holds `dropped.rows` — a raw copy of the client's own
 * spreadsheet, every column included, most of them never mapped to anything. It
 * is separate React state today and so is excluded for free. This is what keeps
 * it excluded on the day somebody folds it into the remembered state.
 *
 * @param {unknown} value
 * @param {string} path where we are, for the message
 */
export function assertPlain(value, path = 'state') {
  if (value === null) return;
  const t = typeof value;
  if (t === 'string' || t === 'boolean') return;
  if (t === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`${path} is ${String(value)}, which JSON cannot carry`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertPlain(v, `${path}[${i}]`));
    return;
  }
  const proto = t === 'object' ? Object.getPrototypeOf(value) : undefined;
  if (t === 'object' && (proto === Object.prototype || proto === null)) {
    for (const k of Object.keys(value)) assertPlain(value[k], `${path}.${k}`);
    return;
  }
  const named = t === 'object'
    ? (value && value.constructor && value.constructor.name) || 'object'
    : t;
  throw new Error(`${path} is a ${named}, which does not belong in a state package`);
}

/**
 * Build the package. Pure — no DOM, no window — which is what lets a Node gate
 * drive it directly.
 *
 * @returns {object} the package, ready to be written as JSON
 */
export function buildPackage({ tool, stateVersion, mode, state, shown, agent, build, savedAt }) {
  if (!tool) throw new Error('a state package must name its tool');
  assertPlain(state);

  const cleanAgent = {};
  if (agent && typeof agent === 'object') {
    for (const key of Object.keys(agent)) {
      if (!ALLOWED_AGENT.has(key)) continue;
      const v = agent[key];
      if (v === null || v === undefined) continue;
      cleanAgent[key] = typeof v === 'number' ? v : String(v).slice(0, 200);
    }
  }

  return {
    kind: PACKAGE_KIND,
    format: PACKAGE_FORMAT,
    tool,
    stateVersion: stateVersion === undefined ? null : stateVersion,
    mode: mode || 'demo',
    build: build || null,
    savedAt: savedAt || new Date().toISOString(),
    agent: cleanAgent,
    shown: typeof shown === 'string' ? shown.slice(0, SHOWN_LIMIT) : '',
    state,
  };
}

/**
 * Read a package back, refusing rather than repairing.
 *
 * SAME RULE AS THE STORAGE READ IN `useRemembered`, and for the same reason:
 * folding a stale shape into a new one is how a tool starts producing confident
 * wrong answers about somebody's money. A mismatch is reported, never migrated.
 *
 * @returns {{ok: true, state: object, pkg: object} | {ok: false, why: string}}
 */
export function readPackage(obj, opts = {}) {
  const { tool, stateVersion } = opts;
  if (!obj || typeof obj !== 'object') {
    return { ok: false, why: 'that file is not a state package' };
  }
  if (obj.kind !== PACKAGE_KIND) {
    return { ok: false, why: `expected ${PACKAGE_KIND}, found ${obj.kind || 'nothing'}` };
  }
  if (obj.format !== PACKAGE_FORMAT) {
    return { ok: false, why: `package format ${obj.format} was written by a different build` };
  }
  if (tool && obj.tool !== tool) {
    return { ok: false, why: `that package is from ${obj.tool}, not ${tool}` };
  }
  if (stateVersion !== undefined && stateVersion !== null && obj.stateVersion !== stateVersion) {
    return {
      ok: false,
      why: `that package holds version ${obj.stateVersion} and this tool is on ${stateVersion}`,
    };
  }
  if (!obj.state || typeof obj.state !== 'object') {
    return { ok: false, why: 'that package carries no state' };
  }
  return { ok: true, state: obj.state, pkg: obj };
}

/** The storage key `useRemembered` reads, so a replay can be pasted straight in. */
export function storageKey(tool, stateVersion) {
  return `aiq:${tool}:v${stateVersion}`;
}
