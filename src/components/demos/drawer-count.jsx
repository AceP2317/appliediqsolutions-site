// ============================================================================
// DRAWER COUNT — Harbour Market (portfolio demo)
//
// The subtraction is trivial and every point-of-sale system does it. What none
// of them hold is the TOLERANCE: how far out a drawer may be before it is worth
// stopping the close and looking. That is not one number — it is a cash floor
// AND a share of what was rung, whichever is larger, because a dollar out on a
// forty-dollar evening is a different thing from a dollar out on a
// nine-hundred-dollar Saturday. Both halves are the shop's own.
//
// IT HOLDS NO NAMES AND IT NEVER WILL. There is no field for who was on the
// register, no history per person, no ranking. A short drawer is a fact about a
// drawer; turning it into a fact about a person is a different product and a
// worse one, and it is the thing that stops people typing honest counts in.
//
// COUNTED BY DENOMINATION, NOT AS A TOTAL, because a drawer can balance
// perfectly and still be unable to open tomorrow — the right money in the wrong
// notes. A single figure cannot see that; a column of them can.
//
// Built by Ian Provencher · AppliedIQ Solutions
// Public demo — the shop, the registers and every count are invented.
// ============================================================================

import React, { useMemo, useState } from 'react';
import { computeDrawer, DENOMS } from '../../lib/drawer-count.js';
import { T, A, S, FONT_DATA, Panel, Btn, Cell, Field, ToolHeader, Problems, WontDo, useRemembered, toCents, toHundredths, toNumber, cash, uid, wrap, th, thN, td, tdN, exportRows, pageFor, Readout } from '../kit/shelf.jsx';

const SHOP = 'Harbour Market';

// ============================================================================
// THE SAMPLE CLOSE — the same figures scripts/verify-tools.mjs works out by
// hand. One drawer inside the tolerance and one outside it.
// ============================================================================
const SAMPLE = {
  floatCents: 20000,
  toleranceCents: 500,
  tolerancePctHundredths: 25,
  registers: [
    { id: 'g1', name: 'Front', cashRungCents: 84250, paidOutCents: 1500,
      counts: { b100: 5, b50: 4, b20: 12, b10: 5, b5: 6, b1: 4, q: 12, d: 6, n: 4, p: 10 } },
    { id: 'g2', name: 'Back', cashRungCents: 31600, paidOutCents: 0,
      counts: { b100: 2, b50: 2, b20: 8, b10: 3, b5: 3, b1: 4, q: 2, d: 2, n: 0, p: 5 } },
  ],
};

const signed = (c) => (c < 0 ? '−' : '+') + cash(Math.abs(c));

export default function DrawerCount({ mode = 'demo' }) {
  const { state, patch, reset, status, restored, pack } = useRemembered('drawer-count', 1, SAMPLE, mode);
  const [busy, setBusy] = useState(false);
  const r = useMemo(() => computeDrawer(state), [state]);

  const doExport = async () => {
    setBusy(true);
    try {
      await exportRows('drawer-count.xlsx', 'Close',
        r.registers.map((g) => ({
          Register: g.name,
          Cash_rung: Number((g.rung / 100).toFixed(2)),
          Paid_out: Number((g.paidOut / 100).toFixed(2)),
          Expected: Number((g.expected / 100).toFixed(2)),
          Counted: Number((g.counted / 100).toFixed(2)),
          Over_short: Number((g.variance / 100).toFixed(2)),
          Tolerance: Number((g.tolerance / 100).toFixed(2)),
          Outside: g.outside ? 'yes' : '',
          To_bank: Number((g.toBank / 100).toFixed(2)),
        })).concat([{}, {
          Register: 'Counted altogether',
          Counted: Number((r.totals.counted / 100).toFixed(2)),
        }, {
          Register: 'Over or short altogether',
          Over_short: Number((r.totals.variance / 100).toFixed(2)),
        }, {
          Register: 'To bank, above the float',
          To_bank: Number((r.totals.toBank / 100).toFixed(2)),
        }]),
        [18, 12, 11, 11, 11, 12, 11, 9, 11]);
    } finally { setBusy(false); }
  };

  return (
    <div style={pageFor('drawer-count')} data-demo="drawer-count">
      <ToolHeader toolId="drawer-count" house={SHOP} occasion="sample close" name="Register Drawer Count" status={status} restored={restored} pack={pack} remembers="float and your over-and-short tolerance">
        What the till says against what is in the drawer, on the tolerance you set — a cash floor and
        a share of what was rung, whichever is larger. It holds no names and it never will. Nothing
        you type leaves this page.
      </ToolHeader>

      <Readout items={[
        { label: 'Over or short', value: signed(r.totals.variance),
          tone: r.totals.outside > 0 ? 'bad' : 'good',
          note: `— across ${r.totals.registers} ${r.totals.registers === 1 ? 'drawer' : 'drawers'}, ${r.totals.outside} outside your tolerance` },
        { label: 'Counted', value: cash(r.totals.counted),
          note: `— against ${cash(r.totals.expected)} the till expected` },
        { label: 'To bank', value: cash(r.totals.toBank),
          note: `— everything above the ${cash(r.totals.floatCents)} float each drawer opens on` },
        { label: 'Cash rung', value: cash(r.totals.rung),
          note: r.totals.paidOut > 0 ? `— less ${cash(r.totals.paidOut)} paid out of the drawer` : '— with nothing paid out of the drawer' },
      ]} />

      <div style={wrap}>
        <Problems heading="Stop and look at these before you bank anything" items={r.problems} />

        <div className="aiq-split" style={{ '--aiq-split': '2fr' }}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
            {r.registers.map((g, i) => (
              <Panel
                key={g.id}
                title={g.name || `Register ${i + 1}`}
                note="Counted by denomination, because a drawer can balance and still not open tomorrow."
                right={<Btn small onClick={() => patch((n) => { n.registers.splice(i, 1); })}>×</Btn>}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 10 }}>
                  <Field label="Name" w={92} value={g.name} onChange={(v) => patch((n) => { n.registers[i].name = v; })} />
                  <Field label="Cash rung" prefix="$" w={88} value={(g.rung / 100).toFixed(2)} onChange={(v) => patch((n) => { n.registers[i].cashRungCents = toCents(v); })} />
                  <Field label="Paid out" prefix="$" w={80} value={(g.paidOut / 100).toFixed(2)} onChange={(v) => patch((n) => { n.registers[i].paidOutCents = toCents(v); })} />
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={th}>Note</th><th style={thN}>Count</th><th style={thN}>Value</th></tr>
                  </thead>
                  <tbody>
                    {g.lines.map((l) => (
                      <tr key={l.id}>
                        <td style={{ ...td, fontFamily: FONT_DATA }}>{l.label}</td>
                        <td style={tdN}><Cell label={`${l.label} in ${g.name}`} w={44} value={String(l.n)} onChange={(v) => patch((n) => {
                          if (!n.registers[i].counts) n.registers[i].counts = {};
                          n.registers[i].counts[l.id] = Math.max(0, Math.round(toNumber(v)));
                        })} /></td>
                        <td style={{ ...tdN, color: T.textMuted }}>{l.n === 0 ? '—' : cash(l.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `${S.ruleStrong} solid ${T.borderStrong}`, fontSize: 12.5, lineHeight: 1.7, color: T.textSec }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Counted</span><strong style={{ fontFamily: FONT_DATA }}>{cash(g.counted)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Till expected</span><span style={{ fontFamily: FONT_DATA }}>{cash(g.expected)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: g.outside ? A.bad : A.brass, fontWeight: 700 }}>
                    <span>{g.variance === 0 ? 'Level' : (g.over ? 'Over' : 'Short')}</span>
                    <span style={{ fontFamily: FONT_DATA }}>{signed(g.variance)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: T.textMuted }}>
                    <span>You allow</span><span style={{ fontFamily: FONT_DATA }}>{cash(g.tolerance)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: `${S.rule} solid ${T.border}` }}>
                    <span>To bank</span><strong style={{ fontFamily: FONT_DATA }}>{cash(g.toBank)}</strong>
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          <div>
            <Panel title="Your close" note="The float you open on, and how far out a drawer may be before somebody stops.">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Field label="Float" prefix="$" w={88} value={(state.floatCents / 100).toFixed(2)} onChange={(v) => patch((n) => { n.floatCents = toCents(v); })} />
                <Field label="Allow" prefix="$" w={78} value={(state.toleranceCents / 100).toFixed(2)} onChange={(v) => patch((n) => { n.toleranceCents = toCents(v); })} />
                <Field label="or of cash" suffix="%" w={82} value={(state.tolerancePctHundredths / 100).toFixed(2)} onChange={(v) => patch((n) => { n.tolerancePctHundredths = toHundredths(v); })} />
              </div>
              <p style={{ margin: '9px 0 0', fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
                Whichever of the two is larger applies. A flat floor on its own punishes a busy day; a
                percentage on its own lets a quiet one hide something real.
              </p>
              <div style={{ marginTop: 11 }}>
                <Btn small onClick={() => patch((s) => { s.registers.push({ id: uid('g'), name: 'New register', cashRungCents: 0, paidOutCents: 0, counts: {} }); })}>Add a register</Btn>
              </div>
            </Panel>

            <Panel title="This close" right={
              <span style={{ display: 'flex', gap: 8 }}>
                <Btn small onClick={reset}>Reset</Btn>
                <Btn small primary onClick={doExport}>{busy ? 'Building…' : 'Export'}</Btn>
              </span>
            }>
              <p style={{ margin: 0, fontSize: 34, fontWeight: 700, fontFamily: FONT_DATA, lineHeight: 1.1, color: r.totals.outside > 0 ? A.bad : A.brass }}>
                {signed(r.totals.variance)}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.textSec, lineHeight: 1.6 }}>
                on {cash(r.totals.rung)} of cash, with {cash(r.totals.toBank)} to bank
                above {cash(r.totals.floatCents)} of float in each drawer.
              </p>
              <p style={{ margin: '12px 0 0', fontSize: 12, color: T.textMuted, lineHeight: 1.6, paddingTop: 10, borderTop: `${S.rule} solid ${T.border}` }}>
                Two drawers can add to nothing and still both be wrong — one over and one short by the
                same amount. That is why the tolerance is applied per drawer and never to the total,
                and why the count above is by note rather than as one figure.
              </p>
            </Panel>

            <WontDo items={[
              'It holds no names. There is no field for who was on the register, no history per person and no ranking, and there will not be one — a short drawer is a fact about a drawer.',
              'It will not suggest a tolerance or a float. Those come from how much cash you take and how much change you need to open on.',
              'It will not compute a shrink rate or compare you to any published figure. A variance is money, and money is the only unit here.',
              'It will not tell you a drawer was stolen from. Almost every short drawer is a wrong change, a missed paid-out or a mis-key, and a page cannot tell those apart.',
              'It never applies your tolerance to the total. One over and one short cancel to nothing and are still two problems.',
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
