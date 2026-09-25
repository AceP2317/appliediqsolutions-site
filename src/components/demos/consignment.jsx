// ============================================================================
// CONSIGNMENT PAYOUT — Second Berth Consignment (portfolio demo)
//
// Four rules, all the shop's: the split per consignor, a price band above which
// they get a better share, where the card fee lands, and who bears a markdown.
//
// THE SHOP'S OWN SHARE IS COMPUTED FROM WHAT ARRIVED, NEVER FROM THE SPLIT, and
// that is the part that goes wrong elsewhere. If the consignor is paid on the
// LISTED price and the item sold for less, the shop's half is not "the other
// percentage" — it is whatever is left of the money that actually came in, and
// that can be negative. A tool computing the shop's side as a percentage would
// print a comfortable positive number for a sale that lost money.
//
// PENNIES BY LARGEST REMAINDER, from tip-out.js. The same routine the Tip Out
// Calculator and the Booth Rent Calculator use: three tools, one rounding rule,
// and the two halves always add back to what arrived.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the shop, the consignors and every item are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeConsignment } from '../../lib/consignment.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toHundredths, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const SHOP = 'Second Berth Consignment';

// ============================================================================
// THE SAMPLE FLOOR — the same figures scripts/verify-tools.mjs works out by
// hand. THE AS-OF DATE IS FIXED so the ages never drift under the check.
// ============================================================================
const SAMPLE = {
  asOf: '2026-09-07',
  termDays: 60,
  cardPctHundredths: 290,
  feeOffTop: true,
  markdownFromConsignor: true,
  bandCents: 5000,
  bandBonusHundredths: 500,
  consignors: [
    { id: 'c1', name: 'H. Odell', pctHundredths: 5000 },
    { id: 'c2', name: 'M. Pike', pctHundredths: 5500 },
    { id: 'c3', name: 'R. Vance', pctHundredths: 5000 },
  ],
  items: [
    { id: 'i1', ref: 'Oil jacket', consignorId: 'c1', listedOn: '2026-07-20', listedCents: 7500, soldCents: 6800, card: true },
    { id: 'i2', ref: 'Brass lamp', consignorId: 'c2', listedOn: '2026-06-14', listedCents: 12000, soldCents: 12000, card: true },
    { id: 'i3', ref: 'Chart table', consignorId: 'c3', listedOn: '2026-05-30', listedCents: 24000, soldCents: null, card: false },
    { id: 'i4', ref: 'Wool blanket', consignorId: 'c1', listedOn: '2026-08-15', listedCents: 4500, soldCents: 4500, card: false },
    { id: 'i5', ref: 'Sextant', consignorId: 'c2', listedOn: '2026-08-02', listedCents: 18000, soldCents: null, card: false },
  ],
};

const pctText = (h) => (h == null ? '—' : `${(h / 100).toFixed(1)}%`);

export default function Consignment({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('consignment', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeConsignment(state), [state]);

  const cyclePerson = (i) => patch((n) => {
    const ids = n.consignors.map((c) => c.id);
    const at = ids.indexOf(n.items[i].consignorId);
    n.items[i].consignorId = ids[(at + 1) % Math.max(1, ids.length)];
  });

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('consignment.xlsx', 'Floor',
        r.items.map((i) => ({
          Item: i.ref,
          Consignor: i.consignorName || 'not on the list',
          Listed_on: i.listedOn,
          Days_listed: i.age,
          Tag: Number((i.listed / 100).toFixed(2)),
          Sold_for: i.unsold ? '' : Number((i.sold / 100).toFixed(2)),
          Card_fee: Number((i.fee / 100).toFixed(2)),
          Their_split_pct: i.pct == null ? '' : Number((i.pct / 100).toFixed(2)),
          They_get: Number((i.consignorShare / 100).toFixed(2)),
          Shop_keeps: Number((i.shopKeeps / 100).toFixed(2)),
        })).concat([{}, {
          Item: 'Took in',
          They_get: Number((r.totals.gross / 100).toFixed(2)),
        }, {
          Item: 'Owed to consignors',
          They_get: Number((r.totals.owed / 100).toFixed(2)),
        }, {
          Item: 'The shop keeps, of what arrived',
          Shop_keeps: Number((r.totals.shopKeeps / 100).toFixed(2)),
        }]),
        [20, 20, 12, 12, 10, 10, 10, 16, 11, 12]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('consignment')} data-demo="consignment">
      <ToolHeader toolId="consignment" house={SHOP} occasion="sample floor" name="Consignment Payout" status={status} restored={restored} pack={pack} remembers="consignor splits, your band and your term">
        What each consignor is owed and what the shop actually kept — which is not the other half of
        the split, but whatever is left of the money that came in. Nothing here suggests a split or
        predicts what will sell. Nothing you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Took in', value: cash(r.totals.gross),
          note: `across ${r.totals.sold} sold, less ${cash(r.totals.fees)} of card fee` },
        /* EVERY NOTE READS ON FROM ITS LABEL, because the `total` shape sets the
           two inline. Written to sit underneath, they come out as "Owed to
           consignors pennies by largest remainder". */
        { label: 'Owed to consignors', value: cash(r.totals.owed),
          note: '— with the pennies by largest remainder, so the halves add back' },
        { label: 'Past your term', value: String(r.totals.pastTerm),
          tone: r.totals.pastTerm > 0 ? 'bad' : 'good',
          note: r.totals.pastTerm > 0 ? `— ${cash(r.totals.pastTermValue)} of tag, still on the floor` : `— nothing over ${state.termDays} days` },
        { label: 'The shop keeps', value: cash(r.totals.shopKeeps),
          tone: r.totals.shopKeeps < 0 ? 'bad' : 'good',
          note: 'of what arrived — never "the other percentage"' },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before anybody is paid" items={r.problems} />

        {/* FULL WIDTH, for the reason claim-aging is: ten columns in a
            two-thirds grid clips the last of them off the page. */}
        <Panel
          title="The floor"
          note="An unsold item has no sale figure at all, which is a different thing from one that sold for nothing."
          right={<Btn small onClick={() => patch((s) => { s.items.push({ id: uid('i'), ref: 'New item', consignorId: s.consignors[0]?.id || '', listedOn: s.asOf, listedCents: 0, soldCents: null, card: false }); })}>Add an item</Btn>}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={th}>Item</th><th style={th}>Consignor</th><th style={th}>Listed on</th>
                  <th style={thN}>Days</th><th style={thN}>Tag</th><th style={thN}>Sold for</th>
                  <th style={th}>Card</th><th style={thN}>Fee</th><th style={thN}>They get</th>
                  <th style={thN}>Shop keeps</th><th style={th} />
                </tr>
              </thead>
              <tbody>
                {r.items.map((i, ix) => (
                  <tr key={i.id} style={{ background: i.shopLoses || i.orphan ? A.badTint : (i.pastTerm ? A.warnTint : 'transparent') }}>
                    <td style={td}><Cell label={`name of item ${ix + 1}`} mono={false} w={116} value={i.ref} onChange={(v) => patch((n) => { n.items[ix].ref = v; })} /></td>
                    <td style={td}><Btn small onClick={() => cyclePerson(ix)}>{i.consignorName || 'not on the list'}</Btn></td>
                    <td style={td}><Cell label={`date ${i.ref} was listed`} w={104} value={i.listedOn || ''} onChange={(v) => patch((n) => { n.items[ix].listedOn = v; })} /></td>
                    <td style={{ ...tdN, color: i.pastTerm ? A.bad : T.textMuted, fontWeight: i.pastTerm ? 700 : 400 }}>
                      {i.age == null ? '—' : i.age}
                      {i.pastTerm && <span style={{ display: 'block', fontSize: 10 }}>{i.daysOver} over</span>}
                    </td>
                    <td style={tdN}><Cell label={`tag price of ${i.ref}`} w={62} value={(i.listed / 100).toFixed(2)} onChange={(v) => patch((n) => { n.items[ix].listedCents = toCents(v); })} /></td>
                    <td style={tdN}>
                      {i.unsold
                        ? <Btn small onClick={() => patch((n) => { n.items[ix].soldCents = n.items[ix].listedCents; })}>Mark sold</Btn>
                        : <Cell label={`what ${i.ref} sold for`} w={62} value={(i.sold / 100).toFixed(2)} onChange={(v) => patch((n) => { n.items[ix].soldCents = toCents(v); })} />}
                    </td>
                    <td style={td}>
                      {i.unsold ? <span style={{ color: T.textMuted }}>—</span>
                        : <Btn small onClick={() => patch((n) => { n.items[ix].card = !n.items[ix].card; })}>{i.card ? 'Card' : 'Cash'}</Btn>}
                    </td>
                    <td style={{ ...tdN, color: T.textMuted }}>{i.fee === 0 ? '—' : cash(i.fee)}</td>
                    <td style={{ ...tdN, fontWeight: 700, color: A.brass }}>
                      {i.unsold ? '—' : cash(i.consignorShare)}
                      {!i.unsold && i.inBand && <span style={{ display: 'block', fontSize: 10, fontWeight: 400, color: T.textMuted }}>{pctText(i.pct)} · in band</span>}
                    </td>
                    <td style={{ ...tdN, fontWeight: 700, color: i.shopLoses ? A.bad : T.textSec }}>{i.unsold ? '—' : cash(i.shopKeeps)}</td>
                    <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.items.splice(ix, 1); })}>×</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="aiq-split" style={{ '--aiq-split': '1.4fr' }}>
          <div>
            <Panel
              title="Your consignors"
              note="Each split is negotiated with that person. Nothing here suggests one."
              right={<Btn small onClick={() => patch((s) => { s.consignors.push({ id: uid('c'), name: 'New consignor', pctHundredths: 5000 }); })}>Add a consignor</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr>
                      <th style={th}>Consignor</th><th style={thN}>Split</th><th style={thN}>On floor</th>
                      <th style={thN}>Sold</th><th style={thN}>Owed</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.byConsignor.map((c, i) => (
                      <tr key={c.id} style={{ background: !c.pctHundredths ? A.badTint : 'transparent' }}>
                        <td style={td}><Cell label={`name of consignor ${i + 1}`} mono={false} w={128} value={c.name} onChange={(v) => patch((n) => { n.consignors[i].name = v; })} /></td>
                        <td style={tdN}><Cell label={`split for ${c.name}`} w={56} value={((c.pctHundredths || 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.consignors[i].pctHundredths = toHundredths(v); })} /></td>
                        <td style={{ ...tdN, color: T.textSec }}>{c.unsold}</td>
                        <td style={{ ...tdN, color: T.textSec }}>{c.sold}</td>
                        <td style={{ ...tdN, fontWeight: 700, color: A.brass }}>{cash(c.owed)}</td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.consignors.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Your rules" note="Four decisions this shop made once and wrote into its contract.">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Field label="Card rate" suffix="%" w={78} value={(state.cardPctHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { n.cardPctHundredths = toHundredths(v); })} />
                <Field label="Term" suffix="d" w={62} value={String(state.termDays)} onChange={(v) => patch((n) => { n.termDays = Math.round(toNumber(v)); })} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 10 }}>
                <Field label="Band above" prefix="$" w={84} value={((state.bandCents ?? 0) / 100).toFixed(2)} onChange={(v) => patch((n) => { n.bandCents = toCents(v); })} />
                <Field label="Extra share" suffix="%" w={82} value={(state.bandBonusHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { n.bandBonusHundredths = toHundredths(v); })} />
              </div>
              <div style={{ marginTop: 11, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn small onClick={() => patch((n) => { n.feeOffTop = n.feeOffTop === false; })}>
                  {state.feeOffTop === false ? 'Shop carries the card fee' : 'Card fee off the top'}
                </Btn>
                <Btn small onClick={() => patch((n) => { n.markdownFromConsignor = n.markdownFromConsignor === false; })}>
                  {state.markdownFromConsignor === false ? 'Split on the tag price' : 'Split on what it sold for'}
                </Btn>
              </div>
              <p style={{ margin: '9px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                The band is tested on what an item SOLD for, not what it was tagged at. Something that
                only cleared the threshold on its original ticket did not clear it.
              </p>
            </Panel>

            <Panel title="This settlement" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: A.brass }}>
                {cash(r.totals.owed)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                owed across {r.byConsignor.length} consignors, out of {cash(r.totals.received)} that
                actually arrived. The shop keeps {cash(r.totals.shopKeeps)}, and the two add back.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                Split on the tag rather than on what it sold for and the shop can pay out more than it
                took — the consignor's share is a percentage, and the shop's is only ever what is left.
                Switch the rule above and watch which lines turn.
              </p>
            </Panel>

            <WontDo items={[
              'It will not suggest a split, a band or a term. Those are what a consignment contract exists to record, and they are negotiated per person.',
              'It will not predict whether something will sell, or how long it takes. It counts days against the term you set and stops there.',
              'It will not compare your splits to what other shops pay. Somebody else’s contract is somebody else’s floor space.',
              'It will not decide what happens to something past its term. Donate, return or drop the tag is your call and your contract’s.',
              'It never computes the shop’s share as a percentage. It is what arrived less what the consignor is owed, which is the only figure that can go negative and tell you so.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
