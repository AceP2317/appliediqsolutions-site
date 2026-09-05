// ============================================================================
// CHAIR SPLIT — The Bight Chair (portfolio demo)
//
// A salon or barber shop settles up once a week, chair by chair. Some chairs
// are on booth rent and keep what they take. Some are on commission and split
// it with the shop. A product charge comes off services before anything is
// divided, and the card fee is either absorbed by the shop or shared across the
// chairs that actually took the money.
//
// NOT ONE OF THOSE FOUR IS STANDARD, which is exactly why no platform has taken
// this and why it is still a Sunday spreadsheet. A platform absorbs a rule that
// is the same across a whole trade; every one of these is one owner's invention.
//
// THE PENNIES COME FROM THE TIP-OUT. The card fee is shared by largest
// remainder using splitCents out of src/lib/tip-out.js, the same routine that
// hands out the odd cents on a night's tips, so the shares add back up to the
// fee rather than drifting a cent at a time.
//
// THE HONESTY CONTRACT. Every rate is the shop's own. There is no suggested
// rent, no usual split, no typical product charge, and nothing compared against
// what any other shop in town charges. Where a chair comes out owing the shop
// money, it says so on the line rather than printing a minus and moving on.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the shop, the chairs and the week are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeChairSplit } from '../../lib/chair-split.js';
import { T, A, S, FONT_DATA, FONT_HEAD, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const SHOP = 'The Bight Chair';

// ============================================================================
// THE SAMPLE WEEK — the same figures scripts/verify-tools.mjs works out by
// hand, so the gate and the page check one arithmetic rather than two that
// happen to agree. Everything is integer cents.
// ============================================================================
const SAMPLE = {
  rules: {
    rentCents: 22500, serviceSplitPct: 6000, retailSplitPct: 1500,
    productPct: 800, cardFeeCents: 8640, passCardFee: true,
  },
  chairs: [
    { id: 'c1', name: 'Dana', arrangement: 'commission', services: 142000, retail: 18600, tips: 31500 },
    { id: 'c2', name: 'Marisol', arrangement: 'commission', services: 98500, retail: 9400, tips: 22000 },
    { id: 'c3', name: 'Tobe', arrangement: 'rent', services: 176000, retail: 24000, tips: 38000 },
    { id: 'c4', name: 'Kesi', arrangement: 'rent', services: 41000, retail: 0, tips: 9500 },
  ],
};

const ARRANGEMENTS = [
  { value: 'commission', label: 'Commission' },
  { value: 'rent', label: 'Booth rent' },
];

export default function ChairSplit({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('chair-split', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeChairSplit({ rules: state.rules, chairs: state.chairs }), [state]);

  const rule = (k, v) => patch((n) => { n.rules[k] = v; });

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('chair-split.xlsx', 'Week',
        r.rows.map((c) => ({
          Chair: c.name,
          On: c.onRent ? 'booth rent' : 'commission',
          Services: Number((c.services / 100).toFixed(2)),
          Product: Number((c.product / 100).toFixed(2)),
          Retail: Number((c.retail / 100).toFixed(2)),
          Tips: Number((c.tips / 100).toFixed(2)),
          Rent: Number((c.rent / 100).toFixed(2)),
          Card_fee: Number((c.fee / 100).toFixed(2)),
          Take_home: Number((c.takeHome / 100).toFixed(2)),
          Shop_keeps: Number((c.shopKeeps / 100).toFixed(2)),
        })).concat([{}, {
          Chair: 'The week',
          Take_home: Number((r.totals.takeHome / 100).toFixed(2)),
          Shop_keeps: Number((r.totals.shopKeeps / 100).toFixed(2)),
        }]),
        [14, 12, 11, 10, 10, 9, 9, 10, 11, 12]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('chair-split')} data-demo="chair-split">
      <ToolHeader toolId="chair-split" house={SHOP} occasion="sample week" name="Chair Split" status={status} restored={restored} pack={pack} remembers="rules and chairs">
        Booth rent on some chairs, commission on others, the product charge off the top, and the card
        fee shared across the chairs that actually took the money — to the cent. Nothing here suggests
        a rent or a split, and nothing is compared against what any other shop charges. Nothing you
        type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'The chairs take home', value: cash(r.totals.takeHome),
          note: r.rows.length + ' ' + (r.rows.length === 1 ? 'chair' : 'chairs') + ' this week' },
        { label: 'The shop keeps', value: cash(r.totals.shopKeeps),
          note: 'rent, product and the shop’s share' },
        { label: 'Tips, untouched', value: cash(r.totals.tips),
          note: 'nothing here takes a cut of these' },
        { label: 'Owing the shop', value: r.rows.filter((x) => x.owesShop).length,
          tone: r.rows.some((x) => x.owesShop) ? 'bad' : undefined,
          note: r.rows.some((x) => x.owesShop) ? 'a chair that did not cover its rent' : 'every chair cleared its week' },
      ]} />

      <div style={wrap}>
        <Problems heading="Look at these before you settle up" items={r.problems} />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'minmax(0, 1.9fr) minmax(290px, 1fr)', alignItems: 'start' }}>
          <div>
            <Panel
              title="The week, chair by chair"
              note="Services and retail are what they rang. Tips are theirs and nothing on this page touches them."
              right={<Btn small onClick={() => patch((s) => { s.chairs.push({ id: uid('c'), name: 'New chair', arrangement: 'commission', services: 0, retail: 0, tips: 0 }); })}>Add a chair</Btn>}
            >
              <div style={{ overflowX: 'auto' }}>
                {/* SEVEN COLUMNS, NOT TEN. Product, rent and the card fee each had
                    a column of their own and pushed TAKES HOME — the answer — off
                    the right edge of the panel, where the table's own scrollbar
                    hid it. Caught by looking at the rendered page rather than the
                    markup. They are stacked inside one deduction column now, so
                    the working is all still on the page and the answer is on it
                    too. */}
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                  <thead>
                    <tr>
                      <th style={th}>Chair</th><th style={th}>On</th><th style={thN}>Services</th>
                      <th style={thN}>Retail</th><th style={thN}>Tips</th><th style={thN}>Comes off</th>
                      <th style={thN}>Takes home</th><th style={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.rows.map((c, i) => (
                      <tr key={c.id} style={{ background: c.owesShop ? A.badTint : 'transparent' }}>
                        <td style={td}><Cell label={`name of ${c.name}`} mono={false} w={104} value={c.name} onChange={(v) => patch((n) => { n.chairs[i].name = v; })} /></td>
                        <td style={td}>
                          <select aria-label={`what ${c.name} is on`} value={c.arrangement} onChange={(e) => patch((n) => { n.chairs[i].arrangement = e.target.value; })}
                            style={{ background: T.bg, color: T.text, border: `${S.rule} solid ${T.border}`, borderRadius: S.radiusSm, padding: '5px 6px', fontSize: 12.5 }}>
                            {ARRANGEMENTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                          </select>
                        </td>
                        <td style={tdN}><Cell label={`services for ${c.name}`} w={72} value={(c.services / 100).toFixed(2)} onChange={(v) => patch((n) => { n.chairs[i].services = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`retail for ${c.name}`} w={64} value={(c.retail / 100).toFixed(2)} onChange={(v) => patch((n) => { n.chairs[i].retail = toCents(v); })} /></td>
                        <td style={tdN}><Cell label={`tips for ${c.name}`} w={64} value={(c.tips / 100).toFixed(2)} onChange={(v) => patch((n) => { n.chairs[i].tips = toCents(v); })} /></td>
                        {/* THE DEDUCTIONS, TOTALLED AND THEN BROKEN OUT. The total is
                            what the chair asks about; the three lines under it are why.
                            THE ODD PENNY IS SAID OUT LOUD — somebody comparing two
                            chairs' fees will find a one-cent difference, and a sheet
                            that cannot explain it is a sheet nobody trusts. */}
                        <td style={{ ...tdN, color: T.textSec }}>
                          −{cash(c.product + c.rent + c.fee)}
                          {/* whiteSpace HAS TO BE RESET HERE. tdN sets nowrap so a
                              money column never breaks mid-figure, and this line
                              inherited it — the breakdown then held the column open
                              at its full one-line width and pushed TAKES HOME off
                              the panel a second time. It wraps; the figures above
                              it still do not. */}
                          <span style={{
                            display: 'block', fontSize: 10, color: T.textMuted, lineHeight: 1.5,
                            whiteSpace: 'normal', maxWidth: 132, marginLeft: 'auto',
                          }}>
                            {cash(c.product)} product
                            {c.rent > 0 && <> · {cash(c.rent)} chair</>}
                            {' · '}{cash(c.fee)} card{c.gotPenny && <> (a spare penny)</>}
                          </span>
                        </td>
                        <td style={{ ...tdN, fontWeight: 700, color: c.owesShop ? A.bad : A.brass }}>
                          {cash(c.takeHome)}
                          {c.owesShop && <span style={{ display: 'block', fontSize: 10, color: A.bad }}>owes the shop</span>}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}><Btn small onClick={() => patch((n) => { n.chairs.splice(i, 1); })}>×</Btn></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Where the money went" note="Every figure on this row is the same week read from the shop's side.">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={td}>Services rung</td><td style={tdN}>{cash(r.totals.services)}</td></tr>
                  <tr><td style={td}>Retail rung</td><td style={tdN}>{cash(r.totals.retail)}</td></tr>
                  <tr><td style={td}>Tips, straight through</td><td style={tdN}>{cash(r.totals.tips)}</td></tr>
                  <tr><td style={td}>Product charge, into the shop</td><td style={tdN}>{cash(r.totals.product)}</td></tr>
                  <tr><td style={td}>Chair rent, into the shop</td><td style={tdN}>{cash(r.totals.rent)}</td></tr>
                  <tr><td style={td}>Card fee, out of the building</td><td style={tdN}>−{cash(r.totals.fee)}</td></tr>
                  <tr>
                    <td style={{ ...td, borderTop: `${S.ruleStrong} solid ${T.text}`, fontFamily: FONT_HEAD, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' }}>The chairs / the shop</td>
                    <td style={{ ...tdN, borderTop: `${S.ruleStrong} solid ${T.text}`, fontFamily: FONT_DATA, fontWeight: 700 }}>
                      {cash(r.totals.takeHome)} / {cash(r.totals.shopKeeps)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Panel>
          </div>

          <div>
            <Panel title="Your rules" note="Four decisions your shop made once and kept. Nothing here is a default anybody else uses.">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10 }}>
                <Field label="Chair rent" prefix="$" w={84} value={(state.rules.rentCents / 100).toFixed(2)} onChange={(v) => rule('rentCents', toCents(v))} />
                <Field label="Product charge" suffix="%" w={78} value={(state.rules.productPct / 100).toFixed(2)} onChange={(v) => rule('productPct', toCents(v))} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10 }}>
                <Field label="Chair keeps, services" suffix="%" w={92} value={(state.rules.serviceSplitPct / 100).toFixed(2)} onChange={(v) => rule('serviceSplitPct', toCents(v))} />
                <Field label="Chair keeps, retail" suffix="%" w={86} value={(state.rules.retailSplitPct / 100).toFixed(2)} onChange={(v) => rule('retailSplitPct', toCents(v))} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Field label="Card fee, the week" prefix="$" w={92} value={(state.rules.cardFeeCents / 100).toFixed(2)} onChange={(v) => rule('cardFeeCents', toCents(v))} />
              </div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, fontSize: 12.5, color: T.textSec, lineHeight: 1.55 }}>
                <input
                  type="checkbox"
                  checked={!!state.rules.passCardFee}
                  onChange={(e) => rule('passCardFee', e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span>Share the card fee across the chairs, on what each one actually ran through the reader. Off means the shop carries all of it.</span>
              </label>
            </Panel>

            <Panel title="This week" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, fontFamily: FONT_DATA, color: A.brass, lineHeight: 1.1 }}>
                {cash(r.totals.takeHome)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                out to {r.rows.length} {r.rows.length === 1 ? 'chair' : 'chairs'}, with {cash(r.totals.shopKeeps)} staying
                in the shop and {cash(r.totals.fee)} going to the card processor.
              </p>
            </Panel>

            <WontDo items={[
              'It will not tell you what to charge for a chair, or what the split should be. Those are the decisions that make your shop yours.',
              'It does not know what any other shop in town charges, and it will never compare you to them.',
              'It takes no cut of tips, ever. If your shop does, that is a decision you make out loud rather than one a page makes quietly.',
              'It will not tell you whether a chair is worth keeping. It shows you the week; what that means is yours.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
