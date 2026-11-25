/* THE MODELS THE PLANNING LAB MAY SCORE, and the reading of each maker's terms that lets it.

   A model is on this list only when its maker's own terms, and the reseller's, were read on two
   points: whether test results may be published, and whether the model may be used in paid client
   work. Each reading is a `human` claim in src/data/external-claims.js carrying the page's address
   and the day it was read, so it ages and warns like every other claim. check-lab.mjs --terms
   refuses a listed model whose maker lacks either reading, and run.mjs refuses a live run on a
   model this list does not hold or whose readings are overdue.

   A maker whose terms forbid publishing, or leave it unclear, is held off the list with its reason
   and goes to the operator in round two (DECISIONS.md D139). */
import { CLAIMS, maxAgeFor } from '../external-claims.js';
import { todayEt } from '../../lib/format.js';

/** Every call goes through this one pay-per-use account. */
export const RESELLER = 'openrouter';

/** The two points every reading answers. */
export const POINTS = ['publishing', 'clientWork'];

/** Readings that let a maker's models be scored. Anything else holds the maker off the list. */
export const PUBLISHING_OK = ['allowed', 'silent'];
export const CLIENT_WORK_OK = ['allowed'];

/** Each party whose terms bind a run: the domain its own pages live on, and what its pages said. */
export const MAKERS = {
  openrouter: {
    name: 'OpenRouter', domain: 'openrouter.ai', publishing: 'silent', clientWork: 'allowed',
    claims: { publishing: 'lab-terms-openrouter-publishing', clientWork: 'lab-terms-openrouter-client-work' },
  },
  anthropic: {
    name: 'Anthropic', domain: 'anthropic.com', publishing: 'silent', clientWork: 'allowed',
    claims: { publishing: 'lab-terms-anthropic-publishing', clientWork: 'lab-terms-anthropic-client-work' },
  },
  openai: {
    name: 'OpenAI', domain: 'openai.com', publishing: 'allowed', clientWork: 'allowed',
    claims: { publishing: 'lab-terms-openai-publishing', clientWork: 'lab-terms-openai-client-work' },
    beforeAPage: "Its Services Agreement bars putting OpenAI's name on a website; whether naming a tested model counts is settled in round two before any scores page.",
  },
  google: {
    name: 'Google', domain: 'google.com', publishing: 'unclear', clientWork: 'allowed',
    claims: { publishing: 'lab-terms-google-publishing', clientWork: 'lab-terms-google-client-work' },
    held: "its APIs Terms bar keeping or publicly showing content returned from its APIs without the owner's permission, and a run file keeps every reply",
  },
};

/* The reseller's exact model names, read from its public model list
   (https://openrouter.ai/api/v1/models) on 2026-11-25. Each maker's top, middle and small models
   of the current line. The "-pro" names are the same OpenAI models run in a costlier reasoning
   mode, so they are left out. */
export const MODELS = [
  { id: 'anthropic/claude-fable-5.2', maker: 'anthropic' },
  { id: 'anthropic/claude-opus-5.5', maker: 'anthropic' },
  { id: 'anthropic/claude-sonnet-5.5', maker: 'anthropic' },
  { id: 'anthropic/claude-haiku-5.5', maker: 'anthropic' },
  { id: 'openai/gpt-6.2-astra', maker: 'openai' },
  { id: 'openai/gpt-6.2-sol', maker: 'openai' },
  { id: 'openai/gpt-6-luna', maker: 'openai' },
];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const daysBetween = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
const hostOf = (u) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };

/** What is wrong with one party's reading, as plain sentences. Empty when it may be relied on. */
export function readingProblems(key, { makers = MAKERS, claims = CLAIMS, today = todayEt() } = {}) {
  const mk = makers[key];
  if (!mk) return [`"${key}" has no reading of its terms in src/data/lab/models.js`];
  const out = [];
  if (mk.held) out.push(`${mk.name} is held off the list: ${mk.held}`);
  if (!PUBLISHING_OK.includes(mk.publishing)) out.push(`${mk.name}'s terms are read as "${mk.publishing}" on publishing results, and only ${PUBLISHING_OK.join(' or ')} may be scored`);
  if (!CLIENT_WORK_OK.includes(mk.clientWork)) out.push(`${mk.name}'s terms are read as "${mk.clientWork}" on paid client work`);
  for (const point of POINTS) {
    const id = mk.claims?.[point];
    const c = id && claims.find((x) => x.id === id);
    if (!id) { out.push(`${mk.name} has no claim for its reading on ${point}`); continue; }
    if (!c) { out.push(`${mk.name}'s ${point} reading names "${id}", which src/data/external-claims.js does not hold`); continue; }
    if (c.kind !== 'human') out.push(`${id} is a "${c.kind}" claim, and a reading of terms is a person's, so it must be "human"`);
    const host = hostOf(c.source || c.url);
    if (!(host === mk.domain || host.endsWith(`.${mk.domain}`))) out.push(`${id} was read off ${host || 'no address'}, which is not ${mk.name}'s own site (${mk.domain})`);
    if (!DAY.test(c.verified || '')) { out.push(`${id} carries no read date`); continue; }
    const age = daysBetween(c.verified, today);
    if (age < 0) out.push(`${id} says it was read on ${c.verified}, after today`);
    else if (age > maxAgeFor(c)) out.push(`${id} was read ${age} days ago, past its ${maxAgeFor(c)}-day limit; read the page again and move the date`);
  }
  return out;
}

/** What is wrong with scoring these models now. Empty when every one may be called. */
export function listProblems({ models = MODELS.map((m) => m.id), listed = MODELS, makers = MAKERS, claims = CLAIMS, today = todayEt() } = {}) {
  if (!models.length) return ['no model was named'];
  const out = readingProblems(RESELLER, { makers, claims, today }).map((p) => `the reseller: ${p}`);
  for (const id of models) {
    const entry = listed.find((m) => m.id === id);
    if (!entry) { out.push(`${id} is not on the list in src/data/lab/models.js`); continue; }
    if (id.split('/')[0] !== entry.maker) out.push(`${id} is listed under ${entry.maker}, which is not the maker its name gives`);
    out.push(...readingProblems(entry.maker, { makers, claims, today }).map((p) => `${id}: ${p}`));
  }
  return [...new Set(out)];
}
