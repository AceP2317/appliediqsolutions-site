/*
  ASN Update Radar — portfolio demo
  ------------------------------------------------------------------
  A daily worklist that tells an inbound-logistics planner two things per open
  shipment notification: what date to update it to, and which flags matter.

  This is a PUBLIC demo. It runs entirely on self-generated synthetic data for a
  fictional manufacturer ("Northpoint Manufacturing"). No real company, data, or
  process. Rebuilt from the capability spec, not forked from any internal tool.

  Engine is pure and headless-testable between the ENGINE markers below.

  Built by Ian Provencher
*/
import React, { useState, useMemo, useContext, createContext, useRef, useEffect, useCallback } from "react";
// xlsx is loaded lazily inside exportXLSX() to keep its ~480 KB chunk off the
// initial bundle (only fetched when the visitor actually exports).
import {
  Radar, Sun, Moon, Search, X, Filter, Download, Info, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, Ship, PackageX, HelpCircle, RotateCcw, Trash2,
  ArrowDownToLine, CircleSlash, Boxes,
} from "lucide-react";

/* ============================================================================
   DOMAIN CONSTANTS — one editable block (a domain correction is a one-line edit)
   ========================================================================== */
const TUNING = {
  TRANSIT_DAYS: 10,        // port → dock transit added to an Actual-Time-of-Arrival
  BIG_MOVE_DAYS: 7,        // |ASN → recommended| at/over this = a wide-impact reschedule
  MAJOR_VESSEL_MOVE: 7,    // vessel berthing shift at/over this = "major"
  AGED_DAYS: 90,           // ASN older than this gets an informational "aged" flag
  SAME_VOYAGE_WINDOW: 21,  // vessel-date match guard: ignore shifts beyond this (different voyage)
  WIDE_LIST_CAP: 6,        // rows shown before a "+ n more" line in the wide-impact panel
};

/* ============================================================================
   GLOSSARY + FLAG HELP — every term a non-specialist might not know
   ========================================================================== */
const GLOSSARY = {
  ASN: "Advanced Shipping Notice — the supplier's heads-up that a shipment is inbound, carrying the line items, quantity and an expected delivery date that the receiving system plans against.",
  GR: "Goods Receipt — the receiving transaction that books inbound stock against a purchase order. If the scheduled date has passed but the ASN is still open, a GR was likely posted manually (or missed) and the open ASN is stale.",
  ETA: "Estimated Time of Arrival — a forecast date from a tracker or carrier. Softer than a scheduled delivery date.",
  ATA: "Actual Time of Arrival — the recorded date freight actually landed at the port. Firmer than an ETA, but still needs transit time added to reach the dock.",
  ERD: "Earliest Return Date — the first day empties for a vessel can be returned to the terminal; a proxy for when the berth window opens.",
  Basis: "Which source the recommended date came from. Confidence runs Scheduled delivery > Actual arrival + transit > Tracker ETA > Carrier ETA.",
  "Pull in": "Move the ASN date earlier — the freight is arriving sooner than the system currently shows.",
  "Push out": "Move the ASN date later — the freight is arriving later than the system currently shows.",
  "On target": "The recommended date already matches the current ASN date — nothing to change.",
  Container: "The ISO container the line is loaded in. Several lines often share one container; reschedule one and its siblings move together.",
  Vessel: "The ocean vessel carrying the container. Its berthing schedule at the port drives the arrival estimate.",
  Berth: "When the vessel is scheduled to dock and unload at the destination port.",
};

const FLAG_HELP = {
  "Check GR": "Scheduled delivery date is already in the past but the ASN is still open — the freight should already be received. Verify the goods receipt before touching the date; a date edit is not the fix.",
  "Past due": "Recommended arrival is already in the past on an estimate (not a scheduled date) — chase logistics for the real status.",
  "Zero qty": "The ASN carries no quantity — a likely cancelled or duplicate line. A cleanup/delete candidate, not a reschedule.",
  "Aged": "The ASN date is more than 90 days old — a likely leftover from a prior period worth reviewing.",
  "Soft date": "The recommended date rests on a carrier ETA, the softest source. Treat with extra care before mass-updating.",
  "Carrier-sourced": "The only arrival signal is the carrier's track & trace ETA — no tracker or scheduled date confirms it yet.",
  "No source": "No arrival signal on any tracker yet — the line can't be dated until logistics provides one.",
};

/* ============================================================================
   DATE HELPERS
   ========================================================================== */
const MS_DAY = 86400000;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addDays = (d, n) => new Date(d.getTime() + n * MS_DAY);
const dayDelta = (a, b) => Math.round((a.getTime() - b.getTime()) / MS_DAY); // a - b in whole days
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate = (d) => d ? `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : "—";
const fmtShort = (d) => d ? `${MON[d.getMonth()]} ${d.getDate()}` : "—";
const iso = (d) => d ? d.toISOString().slice(0, 10) : "";

/* ============================================================================
   SYNTHETIC SAMPLE DATA — deterministic generator (fictional Northpoint Mfg.)
   ========================================================================== */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUPPLIERS = [
  ["Meridian Components", "SUP-4101"], ["Carrara Metalworks", "SUP-4118"],
  ["Halverson Plastics", "SUP-4133"], ["Tessera Electronics", "SUP-4150"],
  ["Brightwater Castings", "SUP-4162"], ["Northgate Fasteners", "SUP-4177"],
  ["Pacifica Seals & Gaskets", "SUP-4189"], ["Vellora Glassworks", "SUP-4203"],
];
const PARTS = [
  "Door seal assembly", "Control board, main", "Hinge bracket, left", "Drum bearing kit",
  "Wiring harness, rear", "Glass panel, tempered", "Pump motor, 120V", "Detergent tray, molded",
  "Heating element, 1.4kW", "Fan blade, axial", "Gasket ring, silicone", "Display module, LED",
  "Latch mechanism", "Insulation pad, acoustic", "Valve, inlet solenoid", "Compressor mount",
];
const VESSELS = [
  "MV Aurora Crest", "MV Tasman Pioneer", "MV Halcyon Bay", "MV Северный Ветер".replace(/[^\x00-\x7F]/g, "") || "MV Northwind",
  "MV Coral Meridian", "MV Solano Star", "MV Atlas Drift", "MV Verdant Horizon",
];
const PORT = "Port of Calderon";
const DOCKS = ["Dock 3 — Receiving A", "Dock 7 — Receiving B", "Dock 11 — Cross-dock", "Dock 2 — Bulk"];
const CARRIERS = ["Transoceanic Lines", "BlueRoute Freight", "Anchor Cargo", "Continental Drayage"];

export function genSampleData(seed = 20260613) {
  const rnd = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const today = startOfToday();
  const rows = [];

  // Container pool — a few are deliberately shared across multiple lines (siblings)
  const containerPool = [];
  for (let i = 0; i < 34; i++) {
    const pre = pick(["MSKU", "TGHU", "CMAU", "HLXU", "NPNU"]);
    containerPool.push(`${pre}${(2000000 + Math.floor(rnd() * 7999999))}`);
  }
  const sharedContainers = [containerPool[3], containerPool[3], containerPool[3], containerPool[9], containerPool[9]];

  // Per-vessel port berthing schedule (some vessels shift materially vs plan)
  const vesselBerth = {};
  VESSELS.forEach((v) => {
    const base = Math.floor(rnd() * 30) - 4;
    const shift = rnd() < 0.4 ? Math.floor(rnd() * 16) - 4 : Math.floor(rnd() * 4) - 1;
    vesselBerth[v] = {
      planEta: addDays(today, base),
      berthDate: addDays(today, base + shift),
      berth: `B${1 + Math.floor(rnd() * 9)}`,
      status: pick(["Scheduled", "En route", "Arrived", "Working", "Delayed"]),
      erd: addDays(today, base + shift + 2),
    };
  });

  // recipe of intended classifications so the demo always shows a rich worklist
  const recipe = [
    "grcheck", "grcheck", "grcheck",
    "pastdue", "pastdue", "pastdue", "pastdue",
    "pullin", "pullin", "pullin", "pullin", "pullin", "pullin", "pullin", "pullin", "pullin",
    "pushout", "pushout", "pushout", "pushout",
    "ontarget", "ontarget", "ontarget", "ontarget", "ontarget",
    "nosource", "nosource", "nosource", "nosource", "nosource", "nosource",
    "carrieronly", "carrieronly", "carrieronly",
    "zeroqty", "zeroqty",
    "aged", "aged",
    "ata", "ata", "ata",
    "pullin", "pushout", "ontarget", "nosource",
  ];

  let asnSeq = 18030000;
  recipe.forEach((kind, i) => {
    const [supName, supCode] = pick(SUPPLIERS);
    const isOcean = rnd() < 0.7 || ["grcheck", "ata"].includes(kind) === false && rnd() < 0.8;
    const vessel = isOcean ? pick(VESSELS) : null;
    const container = i < sharedContainers.length ? sharedContainers[i] : pick(containerPool);
    const part = pick(PARTS);
    const material = `${10000000 + Math.floor(rnd() * 89999999)}`;
    const po = `45${(100000 + Math.floor(rnd() * 899999))}`;
    const carrier = pick(CARRIERS);
    const dock = pick(DOCKS);
    let qty = 100 + Math.floor(rnd() * 1400);

    // Source signals — what the engine will see
    let deliveryDate = null, ata = null, trackerEta = null, carrierEta = null;
    let currentAsn = addDays(today, Math.floor(rnd() * 24) - 6);

    switch (kind) {
      case "grcheck": // scheduled date in the past, ASN still open
        deliveryDate = addDays(today, -(3 + Math.floor(rnd() * 14)));
        currentAsn = addDays(deliveryDate, Math.floor(rnd() * 6));
        trackerEta = addDays(deliveryDate, -1);
        break;
      case "pastdue": // estimate in the past
        trackerEta = addDays(today, -(2 + Math.floor(rnd() * 9)));
        carrierEta = addDays(trackerEta, 1);
        currentAsn = addDays(today, 4 + Math.floor(rnd() * 10));
        break;
      case "pullin": {
        const rec = addDays(today, 2 + Math.floor(rnd() * 18));
        trackerEta = rec;
        currentAsn = addDays(rec, 6 + Math.floor(rnd() * 16)); // current is later → pull in
        break;
      }
      case "pushout": {
        const rec = addDays(today, 10 + Math.floor(rnd() * 22));
        trackerEta = rec;
        currentAsn = addDays(rec, -(6 + Math.floor(rnd() * 14))); // current is earlier → push out
        break;
      }
      case "ontarget": {
        const rec = addDays(today, 5 + Math.floor(rnd() * 20));
        trackerEta = rec; currentAsn = rec;
        break;
      }
      case "nosource":
        // no signals at all
        currentAsn = addDays(today, Math.floor(rnd() * 30) - 8);
        break;
      case "carrieronly": {
        const rec = addDays(today, 3 + Math.floor(rnd() * 20));
        carrierEta = rec;
        currentAsn = addDays(rec, (rnd() < 0.5 ? 1 : -1) * (3 + Math.floor(rnd() * 10)));
        break;
      }
      case "zeroqty":
        qty = 0;
        currentAsn = addDays(today, Math.floor(rnd() * 20) - 30);
        trackerEta = currentAsn;
        break;
      case "aged": { // last-year leftover
        const rec = addDays(today, 3 + Math.floor(rnd() * 15));
        trackerEta = rec;
        currentAsn = addDays(today, -(100 + Math.floor(rnd() * 80)));
        break;
      }
      case "ata": { // actual arrival recorded; recommended = ata + transit
        ata = addDays(today, -(1 + Math.floor(rnd() * 6)));
        currentAsn = addDays(today, 2 + Math.floor(rnd() * 9));
        break;
      }
      default: break;
    }

    // If ocean and a vessel has a port-schedule shift, let some lines reflect the planEta
    if (isOcean && vessel && (kind === "pullin" || kind === "pushout") && rnd() < 0.5) {
      trackerEta = vesselBerth[vessel].planEta;
    }

    rows.push({
      asnId: `INB-${asnSeq++}`,
      po, material, description: part,
      supplier: supName, supplierCode: supCode,
      qty,
      currentAsn: iso(currentAsn),
      container, vessel, mode: isOcean ? "Ocean" : "Truck", carrier, dock,
      deliveryDate: iso(deliveryDate), ata: iso(ata),
      trackerEta: iso(trackerEta), carrierEta: iso(carrierEta),
    });
  });

  // Port schedule rows (one per vessel actually used)
  const usedVessels = [...new Set(rows.map((r) => r.vessel).filter(Boolean))];
  const portSchedule = usedVessels.map((v) => ({
    vessel: v, berthDate: iso(vesselBerth[v].berthDate), berth: vesselBerth[v].berth,
    status: vesselBerth[v].status, erd: iso(vesselBerth[v].erd), port: PORT,
    planEta: iso(vesselBerth[v].planEta),
  }));

  return { rows, portSchedule };
}

/* ============================================================================
   ============================ ENGINE (pure) =================================
   compute(data, ctx) and matchesQuery(row, query) — no React, no globals.
   Headless-testable; parity recorded in the build test.
   ========================================================================== */
export function compute(data, ctx) {
  const TODAY = ctx?.today ? new Date(ctx.today) : startOfToday();
  TODAY.setHours(0, 0, 0, 0);
  const T = ctx?.tuning || TUNING;
  const portByVessel = {};
  (data.portSchedule || []).forEach((p) => { portByVessel[p.vessel] = p; });

  const parse = (s) => (s ? new Date(s + "T00:00:00") : null);

  const rows = (data.rows || []).map((r) => {
    const cur = parse(r.currentAsn);
    const dDate = parse(r.deliveryDate);
    const ata = parse(r.ata);
    const tEta = parse(r.trackerEta);
    const cEta = parse(r.carrierEta);

    // --- recommended date by confidence hierarchy -------------------------
    let recommended = null, basis = null, soft = false, carrierSourced = false;
    if (dDate) { recommended = dDate; basis = "Scheduled delivery"; }
    else if (ata) { recommended = addDays(ata, T.TRANSIT_DAYS); basis = `Actual arrival + ${T.TRANSIT_DAYS}d`; }
    else if (tEta) { recommended = tEta; basis = "Tracker ETA"; }
    else if (cEta) { recommended = cEta; basis = "Carrier ETA"; soft = true; carrierSourced = true; }

    const zeroQty = Number(r.qty) === 0;
    const hasRec = !!recommended;
    const delta = hasRec && cur ? dayDelta(recommended, cur) : null; // recommended - current (days)
    const recPast = hasRec && recommended < TODAY;
    const scheduled = basis === "Scheduled delivery";

    // --- classification (mutually exclusive bucket) -----------------------
    let cls;
    if (zeroQty) cls = "zeroqty";
    else if (!hasRec) cls = "nosource";
    else if (scheduled && recPast) cls = "grcheck";
    else if (delta === 0) cls = "ontarget";
    else if (recPast) cls = "pastdue";       // estimate basis, already in the past
    else cls = "needsupdate";

    const direction = (cls === "needsupdate" || cls === "pastdue") && delta != null
      ? (delta < 0 ? "pullin" : "pushout") : null;
    const aged = cur ? dayDelta(TODAY, cur) > T.AGED_DAYS : false;

    // --- flags ------------------------------------------------------------
    const flags = [];
    if (cls === "grcheck") flags.push({ t: "Check GR", kind: "risk" });
    if (cls === "pastdue") flags.push({ t: "Past due", kind: "risk" });
    if (cls === "zeroqty") flags.push({ t: "Zero qty", kind: "warn" });
    if (cls === "nosource") flags.push({ t: "No source", kind: "muted" });
    if (soft) flags.push({ t: "Soft date", kind: "warn" });
    else if (carrierSourced) flags.push({ t: "Carrier-sourced", kind: "warn" });
    if (aged) flags.push({ t: "Aged", kind: "info" });

    // --- reason text ------------------------------------------------------
    let reason;
    if (cls === "zeroqty") reason = "Quantity is 0 — likely a cancelled or duplicate line. Delete rather than reschedule.";
    else if (cls === "nosource") reason = "No arrival signal on any tracker yet — chase logistics for an ETA before this line can be dated.";
    else if (cls === "grcheck") reason = `Scheduled delivery ${fmtShort(recommended)} has already passed but the ASN is still open — verify the goods receipt before editing the date.`;
    else if (cls === "ontarget") reason = `Recommended ${fmtShort(recommended)} (${basis}) matches the current ASN date — no change.`;
    else {
      const n = Math.abs(delta);
      const dir = direction === "pullin" ? "earlier — pull in" : "later — push out";
      const pd = cls === "pastdue" ? " The estimate is already in the past — chase logistics." : "";
      reason = `Recommended ${fmtShort(recommended)} (${basis}) is ${n}d ${dir} vs the current ASN date ${fmtShort(cur)}.${pd}`;
    }
    if (r.dock) reason += ` Delivery: ${r.dock}.`;

    return {
      ...r,
      _cur: cur, _recommended: recommended, basis, soft, carrierSourced,
      zeroQty, hasRec, delta, recPast, scheduled,
      cls, direction, aged, flags, reason,
    };
  });

  // --- shared-container sibling flags -------------------------------------
  const byContainer = {};
  rows.forEach((r) => { if (r.container) (byContainer[r.container] ||= []).push(r); });
  rows.forEach((r) => {
    const sibs = byContainer[r.container];
    if (sibs && sibs.length > 1) {
      r.flags.push({ t: `Shared container ×${sibs.length}`, kind: "muted", h: `${sibs.length} lines ride container ${r.container} — reschedule one and the others move with it.` });
      r.siblingCount = sibs.length;
    }
  });

  // --- vessel movements (wide impact) -------------------------------------
  const vAgg = {};
  rows.forEach((r) => {
    if (!r.vessel) return;
    const p = portByVessel[r.vessel];
    if (!p) return;
    const planEta = p.planEta ? new Date(p.planEta + "T00:00:00") : (r._recommended || null);
    const berth = p.berthDate ? new Date(p.berthDate + "T00:00:00") : null;
    if (!planEta || !berth) return;
    const move = dayDelta(berth, planEta);
    if (Math.abs(move) > T.SAME_VOYAGE_WINDOW) return; // different voyage — suppress
    const a = (vAgg[r.vessel] ||= {
      vessel: r.vessel, move, berth: p.berth, status: p.status, erd: p.erd,
      berthDate: p.berthDate, planEta: p.planEta, lines: 0, needs: 0,
      containers: new Set(), suppliers: new Set(),
    });
    a.lines += 1;
    if (r.cls === "needsupdate" || r.cls === "pastdue") a.needs += 1;
    a.containers.add(r.container); a.suppliers.add(r.supplier);
  });
  const vessels = Object.values(vAgg)
    .filter((v) => Math.abs(v.move) >= 1)
    .map((v) => ({ ...v, containers: v.containers.size, suppliers: v.suppliers.size, major: Math.abs(v.move) >= T.MAJOR_VESSEL_MOVE }))
    .sort((a, b) => Math.abs(b.move) - Math.abs(a.move));

  // --- big container reschedules (wide impact) ----------------------------
  // excludes grCheck and pastDue (those own their own buckets / actions)
  const mAgg = {};
  rows.forEach((r) => {
    if (!r.container || !r.hasRec || r.cls === "grcheck" || r.cls === "pastdue") return;
    if (r.delta === null || Math.abs(r.delta) < T.BIG_MOVE_DAYS) return;
    const a = (mAgg[r.container] ||= {
      container: r.container, delta: r.delta, lines: 0,
      materials: new Set(), basis: r.basis, vessel: r.vessel,
      from: r.currentAsn, to: iso(r._recommended),
    });
    a.lines += 1; a.materials.add(r.material);
    if (Math.abs(r.delta) > Math.abs(a.delta)) a.delta = r.delta;
  });
  const movers = Object.values(mAgg)
    .map((m) => ({ ...m, materials: m.materials.size, risk: Math.abs(m.delta) >= 2 * T.BIG_MOVE_DAYS }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  // --- summary ------------------------------------------------------------
  const count = (fn) => rows.filter(fn).length;
  const summary = {
    total: rows.length,
    computable: count((r) => r.hasRec),
    grCheck: count((r) => r.cls === "grcheck"),
    pastDue: count((r) => r.cls === "pastdue"),
    needsUpdate: count((r) => r.cls === "needsupdate"),
    onTarget: count((r) => r.cls === "ontarget"),
    noSource: count((r) => r.cls === "nosource"),
    zeroQty: count((r) => r.cls === "zeroqty"),
    pullIn: count((r) => r.direction === "pullin"),
    pushOut: count((r) => r.direction === "pushout"),
    aged: count((r) => r.aged),
    wideImpact: vessels.length + movers.length,
  };

  return { rows, vessels, movers, summary };
}

const SEV = { grcheck: 0, pastdue: 1, nosource: 2, needsupdate: 3, ontarget: 4, zeroqty: 5 };

export function matchesQuery(row, query) {
  const q = (query || "").trim();
  if (!q) return true;
  const hay = [row.asnId, row.po, row.material, row.description, row.supplier,
    row.supplierCode, row.container, row.vessel, row.carrier, row.dock]
    .filter(Boolean).join(" ").toLowerCase();
  // commas = OR groups; spaces within a group = AND
  const orGroups = q.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  return orGroups.some((group) => group.split(/\s+/).filter(Boolean).every((term) => hay.includes(term)));
}
/* ========================== END ENGINE ==================================== */

/* ============================================================================
   XLSX EXPORT — full + filtered pair from one shared builder
   ========================================================================== */
function buildWorklist(rows) {
  const act = (r) => {
    if (r.cls === "grcheck") return "Verify goods receipt — do not edit date";
    if (r.cls === "zeroqty") return "Review for deletion (zero qty)";
    if (r.cls === "nosource") return "Chase logistics for an ETA";
    if (r.cls === "ontarget") return "No change";
    return `${r.direction === "pullin" ? "Pull in" : "Push out"} to ${iso(r._recommended)}`;
  };
  const header = ["ASN", "PO", "Material", "Description", "Supplier", "Qty",
    "Current ASN date", "Recommended date", "Δ days", "Basis", "Classification",
    "Action", "Container", "Vessel", "Mode", "Flags", "Reason"];
  const body = rows.map((r) => [
    r.asnId, r.po, r.material, r.description, r.supplier, r.qty,
    r.currentAsn, iso(r._recommended), r.delta ?? "", r.basis || "",
    r.cls, act(r), r.container || "", r.vessel || "", r.mode,
    r.flags.map((f) => f.t).join("; "), r.reason,
  ]);
  return [header, ...body];
}
async function exportXLSX(rows, label) {
  const XLSX = await import("xlsx");
  const aoa = buildWorklist(rows);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [12, 11, 11, 24, 22, 7, 16, 16, 7, 22, 14, 34, 13, 18, 7, 26, 60].map((w) => ({ wch: w }));
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: aoa[0].length - 1 } }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ASN worklist");
  XLSX.writeFile(wb, `asn-update-radar-${label}-${iso(startOfToday())}.xlsx`);
}

/* ============================================================================
   TOOLTIP LAYER — fixed-position, glossary-backed
   ========================================================================== */
const TipCtx = createContext(null);
function TipProvider({ children }) {
  const [tip, setTip] = useState(null);
  const show = useCallback((content, e) => {
    const x = e.clientX, y = e.clientY;
    setTip({ content, x, y });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  return (
    <TipCtx.Provider value={{ show, hide }}>
      {children}
      {tip && (
        <div style={{
          position: "fixed", left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 320),
          top: tip.y + 16, maxWidth: 300, zIndex: 9999, pointerEvents: "none",
          background: "rgba(20,22,28,0.97)", color: "#f2f4f8", fontSize: 12.5, lineHeight: 1.5,
          padding: "9px 11px", borderRadius: 8, boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>{tip.content}</div>
      )}
    </TipCtx.Provider>
  );
}
function useTip() { return useContext(TipCtx); }

function Q({ term, children, T }) {
  const tip = useTip();
  const def = GLOSSARY[term] || term;
  return (
    <span
      tabIndex={0}
      onMouseEnter={(e) => tip.show(<span><b>{term}</b> — {def}</span>, e)}
      onMouseMove={(e) => tip.show(<span><b>{term}</b> — {def}</span>, e)}
      onMouseLeave={tip.hide}
      onFocus={(e) => tip.show(<span><b>{term}</b> — {def}</span>, { clientX: e.target.getBoundingClientRect().right, clientY: e.target.getBoundingClientRect().bottom })}
      onBlur={tip.hide}
      style={{ borderBottom: `1px dotted ${T.textMuted}`, cursor: "help" }}
    >{children || term}</span>
  );
}
function Hover({ text, children }) {
  const tip = useTip();
  return (
    <span
      tabIndex={0}
      onMouseEnter={(e) => tip.show(text, e)}
      onMouseMove={(e) => tip.show(text, e)}
      onMouseLeave={tip.hide}
      onFocus={(e) => tip.show(text, { clientX: e.target.getBoundingClientRect().right, clientY: e.target.getBoundingClientRect().bottom })}
      onBlur={tip.hide}
      style={{ cursor: "help" }}
    >{children}</span>
  );
}

/* ============================================================================
   THEME — neutral light / dark (public surface; no corporate branding)
   ========================================================================== */
const THEMES = {
  dark: {
    name: "dark", bg: "#0f1115", surface: "#171a20", surfaceAlt: "#1e2228", border: "#2a2f38",
    text: "#e9ecf1", textSec: "#aab2bf", textMuted: "#727a87", accent: "#748ffc",
    risk: "#ff6b6b", warn: "#ffa94d", ok: "#51cf66", info: "#4dabf7",
    riskBg: "rgba(255,107,107,0.13)", warnBg: "rgba(255,169,77,0.13)", okBg: "rgba(81,207,102,0.12)",
    infoBg: "rgba(77,171,247,0.13)", mutedBg: "rgba(170,178,191,0.10)",
  },
  light: {
    name: "light", bg: "#f5f6f8", surface: "#ffffff", surfaceAlt: "#f1f3f5", border: "#e3e6ea",
    text: "#191c20", textSec: "#535b66", textMuted: "#8a909b", accent: "#3b5bdb",
    risk: "#e03131", warn: "#e8830c", ok: "#2f9e44", info: "#1c7ed6",
    riskBg: "rgba(224,49,49,0.08)", warnBg: "rgba(232,131,12,0.10)", okBg: "rgba(47,158,68,0.09)",
    infoBg: "rgba(28,126,214,0.08)", mutedBg: "rgba(138,144,155,0.10)",
  },
};

function Chip({ kind, T, children, title }) {
  const map = {
    risk: [T.risk, T.riskBg], warn: [T.warn, T.warnBg], ok: [T.ok, T.okBg],
    info: [T.info, T.infoBg], muted: [T.textSec, T.mutedBg], accent: [T.accent, T.mutedBg],
  };
  const [fg, bg] = map[kind] || map.muted;
  return (
    <span title={title} style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
      color: fg, background: bg, border: `1px solid ${fg}33`, padding: "1.5px 7px",
      borderRadius: 999, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Stat({ icon, label, value, kind, hint, T, active, onClick }) {
  const tip = useTip();
  const color = { risk: T.risk, warn: T.warn, ok: T.ok, info: T.info, accent: T.accent }[kind] || T.text;
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => hint && tip.show(hint, e)}
      onMouseMove={(e) => hint && tip.show(hint, e)}
      onMouseLeave={tip.hide}
      style={{
        flex: "1 1 130px", minWidth: 130, textAlign: "left", cursor: hint || onClick ? "pointer" : "default",
        background: active ? T.surfaceAlt : T.surface, border: `1px solid ${active ? color + "66" : T.border}`,
        borderRadius: 11, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 3,
        boxShadow: active ? `inset 0 0 0 1px ${color}33` : "none", transition: "all .12s",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.textSec, fontSize: 11.5, fontWeight: 600 }}>
        {icon}{label}
      </span>
      <span style={{ fontSize: 24, fontWeight: 700, color }}>{value}</span>
    </button>
  );
}

/* ============================================================================
   RESPONSIVE — viewport hook (presentational only; no engine impact)
   ========================================================================== */
function useIsNarrow(bp = 760) {
  const [narrow, setNarrow] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia(`(max-width: ${bp}px)`).matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`);
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [bp]);
  return narrow;
}

/* ============================================================================
   MAIN COMPONENT
   ========================================================================== */
export default function ASNUpdateRadar() {
  const narrow = useIsNarrow();
  const [mode, setMode] = useState("dark");
  const T = THEMES[mode];
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [sortKey, setSortKey] = useState("severity");
  const [sortDir, setSortDir] = useState("asc");
  const [showLogic, setShowLogic] = useState(false);
  const [showWide, setShowWide] = useState(true);
  const [disp, setDisp] = useState({});        // asnId -> "updated" | "deferred" | "investigate"
  const [toast, setToast] = useState(null);

  const loadSample = () => { setData(genSampleData()); setDisp({}); };
  useEffect(() => { loadSample(); }, []); // self-load on boot — no upload required

  const result = useMemo(() => data ? compute(data, { tuning: TUNING }) : null, [data]);

  const setDisposition = (id, val) => {
    setDisp((d) => {
      const next = { ...d };
      if (next[id] === val) delete next[id]; else next[id] = val;
      return next;
    });
    const msg = {
      updated: "Marked updated — in production this posts the new delivery date back to your ERP automatically.",
      deferred: "Deferred — held off this worklist; nothing written.",
      investigate: "Flagged for investigation — in production this opens a receipt-check task for the warehouse team.",
    }[val];
    if (disp[id] !== val) { setToast(msg); setTimeout(() => setToast(null), 3200); }
  };

  const TABS = result ? [
    ["all", "All", result.summary.total, null],
    ["grcheck", "Check GR", result.summary.grCheck, "risk"],
    ["pastdue", "Past due", result.summary.pastDue, "risk"],
    ["needsupdate", "Needs update", result.summary.needsUpdate, "warn"],
    ["ontarget", "On target", result.summary.onTarget, "ok"],
    ["nosource", "No source", result.summary.noSource, "muted"],
    ["zeroqty", "Zero qty", result.summary.zeroQty, "muted"],
  ] : [];

  const visible = useMemo(() => {
    if (!result) return [];
    let rs = result.rows.filter((r) => matchesQuery(r, query));
    if (tab !== "all") rs = rs.filter((r) => r.cls === tab);
    const dir = sortDir === "asc" ? 1 : -1;
    rs = [...rs].sort((a, b) => {
      if (sortKey === "severity") {
        const s = SEV[a.cls] - SEV[b.cls];
        if (s) return s * dir;
        return (Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0)) * dir;
      }
      if (sortKey === "delta") return ((a.delta ?? 0) - (b.delta ?? 0)) * dir;
      if (sortKey === "current") return ((a._cur?.getTime() ?? 0) - (b._cur?.getTime() ?? 0)) * dir;
      if (sortKey === "recommended") return ((a._recommended?.getTime() ?? 0) - (b._recommended?.getTime() ?? 0)) * dir;
      return 0;
    });
    return rs;
  }, [result, query, tab, sortKey, sortDir]);

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "severity" ? "asc" : "asc"); }
  };
  const SortArrow = ({ k }) => sortKey === k ? <span style={{ color: T.accent }}>{sortDir === "asc" ? " ▲" : " ▼"}</span> : null;

  const clsLabel = { grcheck: "Check GR", pastdue: "Past due", needsupdate: "Needs update", ontarget: "On target", nosource: "No source", zeroqty: "Zero qty" };
  const clsKind = { grcheck: "risk", pastdue: "risk", needsupdate: "warn", ontarget: "ok", nosource: "muted", zeroqty: "muted" };

  const cell = { padding: "8px 11px", borderBottom: `1px solid ${T.border}`, fontSize: 12.5, verticalAlign: "top" };
  const th = { ...cell, position: "sticky", top: 0, zIndex: 2, background: T.surfaceAlt, color: T.textSec, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" };

  if (!result) return null;
  const s = result.summary;
  const dispCount = Object.keys(disp).length;

  return (
    <TipProvider>
      <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: narrow ? "16px 12px 48px" : "20px 18px 60px" }}>

          {/* Header */}
          <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "grid", placeItems: "center", color: T.accent }}>
                <Radar size={22} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em" }}>ASN Update Radar</h1>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: T.textMuted }}>
                  Daily inbound worklist — Northpoint Manufacturing <span style={{ opacity: .6 }}>· demo data</span>
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))} title="Toggle theme"
                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textSec, borderRadius: 9, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                {mode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </header>

          {/* Ingestion provenance strip */}
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {[
              ["ERP receiving worklist", `${s.total} open ASNs`, "ok"],
              ["Logistics planning tracker", "scheduled / ETA dates", "ok"],
              ["Carrier track & trace", "live ETA feed", "ok"],
              [`${PORT} schedule`, `${data.portSchedule.length} vessels`, "ok"],
            ].map(([n, meta, k]) => (
              <Hover key={n} text={`Synthetic source for this demo. In production this is an uploaded export, auto-classified by its column signature.`}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 12 }}>
                  <CheckCircle2 size={13} color={T.ok} />
                  <b style={{ fontWeight: 600 }}>{n}</b>
                  <span style={{ color: T.textMuted }}>· {meta}</span>
                </span>
              </Hover>
            ))}
            <span style={{ flex: 1 }} />
            <button onClick={loadSample} title="Regenerate the synthetic worklist"
              style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.textSec, borderRadius: 8, padding: "5px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <RotateCcw size={13} /> Reload sample
            </button>
          </div>

          {/* Intro with live numbers */}
          <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6, color: T.textSec, maxWidth: 940 }}>
            Of <b style={{ color: T.text }}>{s.total}</b> open <Q term="ASN" T={T}>ASNs</Q>,{" "}
            <b style={{ color: T.text }}>{s.computable}</b> have a recommended date and{" "}
            <b style={{ color: T.warn }}>{s.needsUpdate + s.pastDue}</b> differ from what the system shows now
            {" "}(<b>{s.pullIn}</b> need <Q term="Pull in" T={T}>pulling in</Q>, <b>{s.pushOut}</b> <Q term="Push out" T={T}>pushing out</Q>).
            {s.grCheck > 0 && <> <b style={{ color: T.risk }}>{s.grCheck}</b> have a scheduled date already in the past — <Q term="GR" T={T}>verify the receipt</Q>, don't just move the date.</>}
            {s.noSource > 0 && <> <b style={{ color: T.textMuted }}>{s.noSource}</b> have no arrival signal yet — chase logistics.</>}
          </p>

          {/* How this works */}
          <button onClick={() => setShowLogic((v) => !v)}
            style={{ marginTop: 4, background: "transparent", border: "none", color: T.accent, cursor: "pointer", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}>
            {showLogic ? <ChevronDown size={15} /> : <ChevronRight size={15} />} How this works
          </button>
          {showLogic && (
            <div style={{ marginTop: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 11, padding: "14px 16px", fontSize: 13, lineHeight: 1.6, color: T.textSec, maxWidth: 940 }}>
              <div style={{ marginBottom: 9 }}><b style={{ color: T.text }}>1 · Pick the best arrival signal.</b> Each ASN is matched across the sources and the recommended date comes from the firmest one available — <Q term="Basis" T={T}>confidence runs</Q> Scheduled delivery &gt; Actual arrival + {TUNING.TRANSIT_DAYS}d transit &gt; Tracker <Q term="ETA" T={T}>ETA</Q> &gt; Carrier ETA.</div>
              <div style={{ marginBottom: 9 }}><b style={{ color: T.text }}>2 · Compare to the system.</b> Recommended vs the current ASN date: earlier means <Chip kind="warn" T={T}>pull in</Chip>, later means <Chip kind="warn" T={T}>push out</Chip>, equal means <Chip kind="ok" T={T}>on target</Chip>.</div>
              <div style={{ marginBottom: 9 }}><b style={{ color: T.text }}>3 · The GR check.</b> If the <b>scheduled</b> delivery date itself is already in the past and the ASN is still open, the freight should already be received — flag <Chip kind="risk" T={T}>Check GR</Chip>, verify the <Q term="GR" T={T}>goods receipt</Q>, and keep it out of the update counts. An estimate in the past stays <Chip kind="risk" T={T}>Past due</Chip> — chase logistics.</div>
              <div><b style={{ color: T.text }}>4 · Wide-impact movements.</b> Surfaces the changes that ripple furthest: <Q term="Vessel" T={T}>vessel</Q> <Q term="Berth" T={T}>berthing</Q> shifts at {PORT} vs your tracker ETA for the same voyage, and individual <Q term="Container" T={T}>container</Q> reschedules of {TUNING.BIG_MOVE_DAYS}+ days. Hover any panel row for the detail.</div>
            </div>
          )}

          {/* Stat tiles */}
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Stat icon={<AlertTriangle size={14} />} label="Check GR" value={s.grCheck} kind="risk" active={tab === "grcheck"} onClick={() => setTab(tab === "grcheck" ? "all" : "grcheck")} T={T}
              hint="Scheduled delivery date already in the past while the ASN is still open — verify the goods receipt first." />
            <Stat icon={<Clock size={14} />} label="Past due" value={s.pastDue} kind="risk" active={tab === "pastdue"} onClick={() => setTab(tab === "pastdue" ? "all" : "pastdue")} T={T}
              hint="Estimated arrival already in the past — chase logistics for the real status." />
            <Stat icon={<ArrowDownToLine size={14} />} label="Needs update" value={s.needsUpdate} kind="warn" active={tab === "needsupdate"} onClick={() => setTab(tab === "needsupdate" ? "all" : "needsupdate")} T={T}
              hint="Recommended date is in the future but differs from the current ASN date — pull in or push out." />
            <Stat icon={<CheckCircle2 size={14} />} label="On target" value={s.onTarget} kind="ok" active={tab === "ontarget"} onClick={() => setTab(tab === "ontarget" ? "all" : "ontarget")} T={T}
              hint="Recommended date already matches the current ASN date — no action." />
            <Stat icon={<CircleSlash size={14} />} label="No source" value={s.noSource} kind="info" active={tab === "nosource"} onClick={() => setTab(tab === "nosource" ? "all" : "nosource")} T={T}
              hint="No arrival signal on any tracker yet — can't be dated until logistics provides one." />
            <Stat icon={<Ship size={14} />} label="Wide impact" value={s.wideImpact} kind="accent" T={T}
              hint="Vessel movements + big container reschedules — the changes most likely to ripple across the plan." />
          </div>

          {/* Wide-impact movements panel */}
          {(result.vessels.length > 0 || result.movers.length > 0) && (
            <div style={{ marginTop: 16, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 11, overflow: "hidden" }}>
              <button onClick={() => setShowWide((v) => !v)}
                style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: T.text, cursor: "pointer", padding: "11px 15px", display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
                {showWide ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Ship size={15} color={T.accent} /> Wide-impact movements
                <span style={{ color: T.textMuted, fontWeight: 500 }}>· {result.vessels.length} vessel{result.vessels.length !== 1 ? "s" : ""}, {result.movers.length} container reschedule{result.movers.length !== 1 ? "s" : ""}</span>
              </button>
              {showWide && (
                <div style={{ padding: "0 15px 14px", display: "grid", gridTemplateColumns: narrow ? "1fr" : "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
                  {/* Vessel movements */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 7 }}>Vessel berthing shifts</div>
                    {result.vessels.length === 0 && <div style={{ fontSize: 12.5, color: T.textMuted }}>None within a plausible voyage window.</div>}
                    {result.vessels.slice(0, TUNING.WIDE_LIST_CAP).map((v) => (
                      <Hover key={v.vessel} text={<span><b>{v.vessel}</b><br />Berth {v.berth} · {v.status} · ERD {fmtShort(new Date(v.erd + "T00:00:00"))}<br />{v.lines} lines · {v.containers} containers · {v.suppliers} suppliers<br />{v.needs} need updating</span>}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                          <span style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.vessel}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 11.5, color: T.textMuted }}>{v.lines}L · {v.needs}↻</span>
                            <Chip kind={v.major ? "risk" : "warn"} T={T}>{v.move > 0 ? "+" : ""}{v.move}d{v.major ? " · major" : ""}</Chip>
                          </span>
                        </div>
                      </Hover>
                    ))}
                    {result.vessels.length > TUNING.WIDE_LIST_CAP && <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 5 }}>+ {result.vessels.length - TUNING.WIDE_LIST_CAP} more</div>}
                  </div>
                  {/* Container reschedules */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 7 }}>Big container reschedules (≥{TUNING.BIG_MOVE_DAYS}d)</div>
                    {result.movers.length === 0 && <div style={{ fontSize: 12.5, color: T.textMuted }}>None over the threshold.</div>}
                    {result.movers.slice(0, TUNING.WIDE_LIST_CAP).map((m) => (
                      <Hover key={m.container} text={<span><b>{m.container}</b>{m.vessel ? ` · ${m.vessel}` : ""}<br />{m.lines} lines · {m.materials} materials · basis {m.basis}<br />{m.from} → {m.to}</span>}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                          <span style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.container}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 11.5, color: T.textMuted }}>{m.lines}L</span>
                            <Chip kind={m.risk ? "risk" : "warn"} T={T}>{m.delta > 0 ? "+" : ""}{m.delta}d</Chip>
                          </span>
                        </div>
                      </Hover>
                    ))}
                    {result.movers.length > TUNING.WIDE_LIST_CAP && <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 5 }}>+ {result.movers.length - TUNING.WIDE_LIST_CAP} more</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 9, alignItems: "center" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TABS.map(([key, label, n, kind]) => (
                <button key={key} onClick={() => setTab(key)}
                  title={key === "needsupdate" ? "Future updates that differ from the current ASN date" : key === "pastdue" ? "Estimate-based dates already in the past" : undefined}
                  style={{
                    background: tab === key ? T.surfaceAlt : "transparent",
                    border: `1px solid ${tab === key ? (kind ? T[kind] + "66" : T.accent + "66") : T.border}`,
                    color: tab === key ? T.text : T.textSec, borderRadius: 8, padding: "5px 11px",
                    cursor: "pointer", fontSize: 12.5, fontWeight: tab === key ? 600 : 500,
                  }}>
                  {label} <span style={{ color: T.textMuted }}>({n})</span>
                </button>
              ))}
            </div>
            <span style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "0 9px", width: narrow ? "100%" : undefined }}>
              <Search size={14} color={T.textMuted} />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search — spaces = AND, commas = OR"
                style={{ background: "transparent", border: "none", outline: "none", color: T.text, fontSize: 12.5, padding: "7px 0", width: narrow ? "100%" : 250 }} />
              {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, display: "flex" }}><X size={14} /></button>}
            </div>
          </div>

          {/* Export pair + disposition counter */}
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button onClick={() => exportXLSX(result.rows, "full")} title="Every row in the loaded worklist, regardless of the current filter or search"
              style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Download size={14} /> Export full list ({result.rows.length}) <span style={{ opacity: .8, fontWeight: 400 }}>.xlsx</span>
            </button>
            <button onClick={() => exportXLSX(visible, "filtered")} title="Exactly the rows on screen — the active filter, search and sort applied"
              style={{ background: "transparent", color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: "7px 13px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Download size={14} /> Export filtered ({visible.length}) <span style={{ opacity: .7, fontWeight: 400 }}>.xlsx</span>
            </button>
            <span style={{ flex: 1 }} />
            {dispCount > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.textSec }}>
                <b style={{ color: T.text }}>{dispCount}</b> dispositioned
                <button onClick={() => setDisp({})} title="Clear this session's dispositions"
                  style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Trash2 size={12} /> Reset view
                </button>
              </span>
            )}
          </div>

          {/* Worklist table — bounded dual-sticky window */}
          <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 11, overflow: "auto", overflowX: "auto", WebkitOverflowScrolling: "touch", maxHeight: "max(440px, calc(100vh - 230px))", overscrollBehavior: "contain" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1080 }}>
              <thead>
                <tr>
                  <th style={{ ...th, left: 0, zIndex: 3, minWidth: 230 }}>Line</th>
                  <th style={th} onClick={() => toggleSort("current")}>Current ASN<SortArrow k="current" /></th>
                  <th style={th} onClick={() => toggleSort("recommended")}>Recommended<SortArrow k="recommended" /></th>
                  <th style={th} onClick={() => toggleSort("delta")}>Δ<SortArrow k="delta" /></th>
                  <th style={th}>Basis</th>
                  <th style={th} onClick={() => toggleSort("severity")}>Status<SortArrow k="severity" /></th>
                  <th style={th}>Flags</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const d = disp[r.asnId];
                  const rowBg = d ? T.surfaceAlt : T.surface;
                  return (
                    <tr key={r.asnId} style={{ opacity: d ? 0.55 : 1 }}>
                      {/* sticky lead column */}
                      <td style={{ ...cell, position: "sticky", left: 0, zIndex: 1, background: rowBg, minWidth: 230 }}>
                        <div style={{ fontWeight: 600 }}>{r.description}</div>
                        <div style={{ fontSize: 11.5, color: T.textMuted, fontFamily: "ui-monospace, monospace" }}>
                          {r.asnId} · {r.material} · qty {r.qty}
                        </div>
                        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 1 }}>
                          {r.supplier} · {r.vessel || r.mode}{r.container ? <> · <span style={{ fontFamily: "ui-monospace, monospace" }}>{r.container}</span></> : null}
                        </div>
                      </td>
                      <td style={{ ...cell, whiteSpace: "nowrap", background: rowBg }}>{fmtDate(r._cur)}</td>
                      <td style={{ ...cell, whiteSpace: "nowrap", background: rowBg }}>
                        <Hover text={r.reason}><span style={{ borderBottom: `1px dotted ${T.textMuted}` }}>{fmtDate(r._recommended)}</span></Hover>
                      </td>
                      <td style={{ ...cell, whiteSpace: "nowrap", fontWeight: 600, background: rowBg, color: r.delta == null ? T.textMuted : r.cls === "ontarget" ? T.ok : r.direction === "pullin" ? T.warn : T.info }}>
                        {r.delta == null ? "—" : `${r.delta > 0 ? "+" : ""}${r.delta}d`}
                      </td>
                      <td style={{ ...cell, whiteSpace: "nowrap", background: rowBg }}>{r.basis ? <Q term="Basis" T={T}>{r.basis}</Q> : <span style={{ color: T.textMuted }}>—</span>}</td>
                      <td style={{ ...cell, whiteSpace: "nowrap", background: rowBg }}><Chip kind={clsKind[r.cls]} T={T}>{clsLabel[r.cls]}</Chip></td>
                      <td style={{ ...cell, background: rowBg }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 200 }}>
                          {r.flags.map((f, i) => (
                            <Hover key={i} text={f.h || FLAG_HELP[f.t] || f.t}><Chip kind={f.kind} T={T}>{f.t}</Chip></Hover>
                          ))}
                          {r.flags.length === 0 && <span style={{ color: T.textMuted, fontSize: 11.5 }}>—</span>}
                        </div>
                      </td>
                      <td style={{ ...cell, whiteSpace: "nowrap", background: rowBg }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {(() => {
                            const primary = r.cls === "grcheck" || r.cls === "pastdue" ? "investigate" : r.cls === "ontarget" || r.cls === "nosource" || r.cls === "zeroqty" ? "deferred" : "updated";
                            const opts = [
                              ["updated", "Mark updated", T.ok],
                              ["investigate", "Investigate", T.risk],
                              ["deferred", "Defer", T.textMuted],
                            ];
                            return opts.map(([k, label, color]) => (
                              <button key={k} onClick={() => setDisposition(r.asnId, k)} title={label}
                                style={{
                                  background: d === k ? color + "22" : "transparent",
                                  border: `1px solid ${d === k ? color : T.border}`,
                                  color: d === k ? color : (k === primary ? T.textSec : T.textMuted),
                                  borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontSize: 11,
                                  fontWeight: k === primary ? 600 : 500,
                                }}>{label.split(" ")[0]}</button>
                            ));
                          })()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr><td colSpan={8} style={{ ...cell, textAlign: "center", color: T.textMuted, padding: "28px 0" }}>No rows match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / byline */}
          <footer style={{ marginTop: 18, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, fontSize: 11.5, color: T.textMuted }}>
            <span>Dispositions are in-session only — a production build writes them back through a connector. Synthetic demo data; no real company or shipments.</span>
            <span>Built by Ian Provencher</span>
          </footer>
        </div>

        {/* Connector toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: T.surface, color: T.text, border: `1px solid ${T.accent}66`, borderRadius: 10, padding: "11px 16px", fontSize: 13, maxWidth: 460, boxShadow: "0 10px 32px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 9 }}>
            <Info size={16} color={T.accent} style={{ flexShrink: 0 }} /> {toast}
          </div>
        )}
      </div>
    </TipProvider>
  );
}
