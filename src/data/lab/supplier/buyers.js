/* THE TWO BUYER STAND-INS, as the written instructions a general model receives. Nothing else
   tells the model who it is: each prompt is these instructions, the supplier's quote and record,
   the buyer's brief, and for the bargainer the conversation so far. */
import { TERMS, CRITERIA } from './protocol.js';
import { money, percent } from '../../../lib/format.js';

const value = (term, v) => {
  const k = TERMS[term].kind;
  return k === 'money' ? money(v, { cents: true }) : k === 'weeks' ? `${v} week${v === 1 ? '' : 's'}` : k === 'days' ? `net ${v} days` : `${v.toLocaleString('en-US')} units`;
};
export const show = value;

/** The quote, the record and the brief, written out the same way for both buyers. The supplier's
 *  copy in the reading says the same brief about the buyer rather than to it. */
export function facts({ quote, record, brief }, { reader = 'buyer' } = {}) {
  const b = {
    quantity: brief.quantity.toLocaleString('en-US'), target: value('unitPrice', brief.targetPrice), pay: value('paymentDays', brief.paymentDays),
    onTime: percent(brief.onTimeBar), ppm: brief.defectPpmBar.toLocaleString('en-US'), essential: brief.essential.map((t) => TERMS[t].label).join(' or the '),
  };
  const said = reader === 'buyer'
    ? `Your brief: you need ${b.quantity} by week ${brief.needByWeeks} from today. Your target price is ${b.target} each and you want payment ${b.pay}. Your bars on a supplier's record are ${b.onTime} on time and at most ${b.ppm} defective parts per million. You cannot give up the ${b.essential}.`
    : `The buyer's brief: it needs ${b.quantity} by week ${brief.needByWeeks} from today. Its target price is ${b.target} each and it wants payment ${b.pay}. Its bars on a supplier's record are ${b.onTime} on time and at most ${b.ppm} defective parts per million. It cannot give up the ${b.essential}.`;
  return [
    `The quote, from ${quote.supplier}: ${quote.quantity.toLocaleString('en-US')} of part ${quote.part} (${quote.description}) at ${value('unitPrice', quote.unitPrice)} each, lead time ${value('leadTimeWeeks', quote.leadTimeWeeks)}, minimum order ${value('moq', quote.moq)}, payment ${value('paymentDays', quote.paymentDays)}. The quote holds for ${quote.validDays} days.`,
    `The supplier's record over the last twelve months: ${percent(record.onTimeRate)} of orders on time, ${record.defectPpm.toLocaleString('en-US')} defective parts per million, ${record.years} years supplying, certified ${record.certifications.join(' and ')}.`,
    said,
  ].join('\n\n');
}

export const SCORER = {
  id: 'scorer',
  name: 'The scoring buyer',
  instructions: [
    'You are a buyer at a manufacturing plant. A supplier has quoted for a part you need, and you are scoring the quote before you decide whether to award it. Work only from the quote, the record and your brief below, and assume nothing they do not say.',
    `Score five things from 1, unacceptable, to 5, fully meets your brief:\n${Object.entries(CRITERIA).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`,
    'For every score under 3, give the reason in one sentence that quotes the figure you relied on. Then say whether you would award the quote: yes, no, or conditional.',
    'Reply with JSON only, in exactly this shape: {"scores":{"price":1,"leadTime":1,"moq":1,"payment":1,"record":1},"reasons":{"price":"one sentence"},"award":"yes"}',
  ].join('\n\n'),
};

export const BARGAINER = {
  id: 'bargainer',
  name: 'The bargaining buyer',
  instructions: (turnCap) => [
    'You are a buyer at a manufacturing plant, negotiating a supplier\'s quote for a part you need. Work only from the quote, the record, your brief and the conversation so far.',
    `Each turn, do exactly one of three things:\n- ask for one change to one term (${Object.entries(TERMS).map(([k, t]) => `${k} for the ${t.label}`).join(', ')}), naming the value you want;\n- accept the quote as it now stands;\n- walk away.`,
    'Press for what your brief needs and no more. Do not ask again on a term the supplier has refused to move on. Accept once every term meets your brief or has been refused. Walk away only when a term you cannot give up has been refused short of your brief.',
    `You have at most ${turnCap} turns.`,
    'Reply with JSON only, in exactly this shape: {"action":"ask","term":"unitPrice","value":3.95,"say":"one sentence to the supplier"}. Leave out term and value when you accept or walk away.',
  ].join('\n\n'),
};

export function scorerPrompt(sent) {
  return `${SCORER.instructions}\n\n${facts(sent)}`;
}

export function bargainerPrompt(sent, { standing, transcript, turn, turnCap }) {
  const now = Object.keys(TERMS).map((t) => `${TERMS[t].label} ${value(t, standing[t])}`).join(', ');
  const said = transcript.length ? transcript.map((l) => `${l.who}: ${l.text}`).join('\n') : 'Nothing yet; this is your first turn.';
  return `${BARGAINER.instructions(turnCap)}\n\n${facts(sent)}\n\nThe conversation so far:\n${said}\n\nThe quote now stands at: ${now}.\n\nThis is turn ${turn} of ${turnCap}.`;
}
