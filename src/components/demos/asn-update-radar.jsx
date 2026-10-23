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
import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
// The northpoint palette — every color a var() reference; the values arrive on
// the house frame's root for the mode in force (D120).
import { northpointTokens } from "../kit/industrial.js";
// The fictional company these seven are set in — one file, so the world
// cannot drift into two companies across seven tools.
import { NORTHPOINT } from "../../lib/northpoint.js";
import { figure, date as houseDate, dateShort as houseDateShort, time, count } from "../../lib/format.js";
import {
  HouseFrame, Intro, HowItWorks, NoticeBanner, AnswerCards, AnswerCard, ExportPair,
  ConfirmButton, Help, Term, Hint, Legend, Dot, Pill, pinColumns,
} from "../kit/house.jsx";
import { writeWorkbook } from "../kit/house-export.js";
// xlsx is loaded lazily inside exportXLSX() to keep its ~480 KB chunk off the
// initial bundle (only fetched when the visitor actually exports).
import { Search, X, ChevronDown, ChevronRight, CircleCheck, Ship, RotateCcw } from "lucide-react";

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
  "Zero qty": "The ASN carries no quantity — a likely canceled or duplicate line. A cleanup/delete candidate, not a reschedule.",
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
/* A DAY, NOT A MOMENT. These dates are local midnights, so they are keyed by
   their LOCAL calendar date. `iso` was toISOString().slice(0, 10), which is the
   UTC date — for a visitor east of UTC every local midnight fell on the
   previous day, and every date on screen was one day early. Fixed 2026-09-23. */
const iso = (d) => d
  ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  : "";
/* The house formats read a bare YYYY-MM-DD as the day it names, never shifted
   through a zone: "22 Sep 2026" and "22 Sep". */
const fmtDate = (d) => d ? houseDate(iso(d)) : "—";
const fmtShort = (d) => d ? houseDateShort(iso(d)) : "—";

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
  /* "MV Northwind" was written as a Cyrillic name stripped to ASCII with this
     as the fallback — but the strip left "MV ", which is not empty, so the
     fallback never fired and the grid showed a vessel called "MV". */
  "MV Aurora Crest", "MV Tasman Pioneer", "MV Halcyon Bay", "MV Northwind",
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
    if (cls === "zeroqty") reason = "Quantity is 0 — likely a canceled or duplicate line. Delete rather than reschedule.";
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
   THE HOUSE FRAME (D120, 2026-09-23). Everything below the engine is the
   screen: it renders inside HouseFrame from ../kit/house.jsx, takes its colors
   from the northpoint palette, formats through src/lib/format.js, reports in a
   banner rather than a toast, and exports through writeWorkbook(), which adds
   the About sheet.
   ========================================================================== */
const SLUG = "asn-update-radar";
const NAME = "ASN Update Radar";
const SCOPE = "Reads a receiving worklist, tracker and carrier dates, and a port schedule in your browser. Never connects to SAP.";
const SAMPLE_SEED = 20260613;

/* THE NORTHPOINT PALETTE, "inbound & inventory" band — shared with the
   staging board, because a receiving queue and a staging board are the same
   screen. Every value is a var() reference.

   THE WASH CHIPS ARE GONE. The day-shift chips painted a status color on a 13%
   wash of itself and measured 4.25-4.41:1 — under the floor, found by
   scripts/verify-work-legibility.mjs. A status is now a FILLED pill with the
   one ink on it, which clears 7:1 on every fill. */
const T = northpointTokens(SLUG);

/* Status by class: the dot at the start of each row, the pill in the Status
   column, and the answer card all read this one map. */
const CLS = {
  grcheck: { label: "Check GR", tone: "bad" },
  pastdue: { label: "Past due", tone: "bad" },
  needsupdate: { label: "Needs update", tone: "warn" },
  ontarget: { label: "On target", tone: "ok" },
  nosource: { label: "No source", tone: "quiet" },
  zeroqty: { label: "Zero qty", tone: "quiet" },
};
/* A flag's kind (from the engine) to its pill. */
const FLAG_TONE = { risk: "bad", warn: "warn", info: "quiet", muted: "quiet" };

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
    "Current ASN date", "Recommended date", "Δ days", "Basis", "Status",
    "Action", "Container", "Vessel", "Mode", "Flags", "Reason", "Decision"];
  const body = rows.map((r) => [
    r.asnId, r.po, r.material, r.description, r.supplier, r.qty,
    r.currentAsn, iso(r._recommended), r.delta ?? "", r.basis || "",
    CLS[r.cls].label, act(r), r.container || "", r.vessel || "", r.mode,
    r.flags.map((f) => f.t).join("; "), r.reason, r._decision || "",
  ]);
  return [header, ...body];
}

/* ============================================================================
   THE INSTRUCTION MANUAL (tool-conventions § N), built from TUNING, GLOSSARY
   and FLAG_HELP above, so a threshold change reaches it on its own.
   ========================================================================== */
export const MANUAL = {
  tool: NAME,
  purpose: "A daily worklist for inbound logistics: for every open shipment notice, the date it should say and the flags that matter.",
  sections: [
    {
      id: "start", title: "What it is for, and what to do first",
      blocks: [
        { p: "An open shipment notice (ASN) carries a delivery date the plant plans against. Trackers, carriers and the port schedule often know better. This tool picks the firmest arrival signal for each line, compares it with the date the system shows, and says what to change." },
        { list: [
          { lead: "Read the answer cards.", text: "Check GR and Past due come first: both are dates already in the past. Press a card to show only those lines." },
          { lead: "Open Wide-impact movements.", text: "A vessel shift or a big container move changes several lines at once; handle those before single lines." },
          { lead: "Work the grid.", text: "Hover a recommended date for the reason behind it, then mark the line updated, to investigate, or deferred." },
          { lead: "Export.", text: "The full list or what is on screen, each with an About sheet naming the filters." },
        ] },
      ],
    },
    {
      id: "numbers", title: "What the numbers mean",
      blocks: [
        { table: { head: ["Figure", "What it is"], rows: [
          ["Open ASNs", "Every line in the receiving worklist."],
          ["Check GR", "Lines whose scheduled delivery date has passed while the ASN is still open."],
          ["Past due", "Lines whose recommended date is an estimate already in the past."],
          ["Needs update", "Lines whose recommended date is in the future and differs from the current ASN date."],
          ["On target", "Lines whose recommended date already matches."],
          ["No source", "Lines with no arrival signal on any source."],
          ["Wide impact", "Vessel berthing shifts plus container reschedules at or over the big-move threshold."],
          ["Δ (column)", "Recommended date minus current ASN date, in days. Minus means pull in; plus means push out."],
        ] } },
      ],
    },
    {
      id: "flags", title: "Every status and flag, and what to do about it",
      blocks: [
        { table: { head: ["Flag", "What it means and what to do"], rows: Object.entries(FLAG_HELP).map(([k, v]) => [k, v]) } },
        { p: "A shared-container flag marks lines that ride the same container: reschedule one and the others move with it." },
      ],
    },
    {
      id: "derived", title: "How to read the derived columns",
      blocks: [
        { p: `The recommended date comes from the firmest source available, in this order: scheduled delivery, then actual arrival plus ${TUNING.TRANSIT_DAYS} days of transit, then tracker ETA, then carrier ETA. The Basis column names which one was used.`, lead: "Recommended date." },
        { p: "Recommended minus current, in whole days. A minus figure pulls the date in; a plus figure pushes it out.", lead: "Δ." },
        { p: `A vessel shift compares the port's berthing date with the plan for the same voyage; shifts over ${TUNING.SAME_VOYAGE_WINDOW} days are treated as a different voyage and left out.`, lead: "Wide impact." },
      ],
    },
    {
      id: "data", title: "How the data is handled",
      blocks: [
        { p: `This copy runs entirely in your browser. On open it generates a sample for ${NORTHPOINT.company}, an invented manufacturer, from a fixed seed (${SAMPLE_SEED}), with dates set relative to today so the worklist always looks current. Four sources are simulated: the receiving worklist, a planning tracker, a carrier feed and the ${PORT} schedule.` },
        { p: "Decisions (updated, investigate, defer) stay in this tab and go into both exports. Nothing is sent anywhere." },
      ],
    },
    {
      id: "thresholds", title: "Every threshold",
      blocks: [
        { table: { head: ["Threshold", "Value", "What it does"], rows: [
          ["Port-to-dock transit", `${TUNING.TRANSIT_DAYS} days`, "Added to an actual arrival to reach the dock date."],
          ["Big container move", `${TUNING.BIG_MOVE_DAYS} days or more`, "A container reschedule this large is listed under wide impact."],
          ["Major vessel shift", `${TUNING.MAJOR_VESSEL_MOVE} days or more`, "A berthing shift this large is marked major."],
          ["Aged ASN", `older than ${TUNING.AGED_DAYS} days`, "Gets an informational Aged flag."],
          ["Same-voyage window", `${TUNING.SAME_VOYAGE_WINDOW} days`, "A shift beyond this is a different voyage, not a move."],
        ] } },
        { p: "Set for this demo. A delivered copy takes the plant's own transit times and review windows." },
      ],
    },
    {
      id: "limits", title: "What it cannot tell you",
      blocks: [
        { list: [
          "Whether a goods receipt was actually posted. Check GR says the date passed; the receiving system says whether stock arrived.",
          "Why a vessel moved, or whether it will move again.",
          "Anything for a line with no arrival signal. It says so rather than guessing a date.",
          "Whether the carrier's ETA is right. A carrier-only date is marked soft for that reason.",
        ] },
      ],
    },
  ],
};

const DISP = {
  updated: { label: "Updated", tone: "ok", note: "in a delivered copy this posts the new delivery date back to the ERP." },
  investigate: { label: "Investigate", tone: "bad", note: "in a delivered copy this opens a receipt-check task for the warehouse." },
  deferred: { label: "Deferred", tone: "quiet", note: "held off this worklist; nothing is written." },
};

/* A shift in days, signed with the house minus: −4d, +29d, 0d. */
const shift = (n) => `${figure(n, { sign: true, zeroMeans: "zero" })}d`;

function Radar() {
  const [data, setData] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [sortKey, setSortKey] = useState("severity");
  const [sortDir, setSortDir] = useState("asc");
  const [showWide, setShowWide] = useState(true);
  const [disp, setDisp] = useState({});        // asnId -> "updated" | "deferred" | "investigate"
  const [notice, setNotice] = useState(null);
  const tableRef = useRef(null);

  const loadSample = () => { setData(genSampleData(SAMPLE_SEED)); setLoadedAt(new Date()); setDisp({}); setNotice(null); };
  useEffect(() => { loadSample(); }, []); // self-load on boot — no upload required

  const result = useMemo(() => data ? compute(data, { tuning: TUNING }) : null, [data]);

  const setDisposition = (id, val) => {
    const cleared = disp[id] === val;
    setDisp((d) => {
      const next = { ...d };
      if (next[id] === val) delete next[id]; else next[id] = val;
      return next;
    });
    setNotice(cleared
      ? { tag: "Cleared", tone: "ok", text: `The decision on ${id} is cleared.` }
      : { tag: DISP[val].label, tone: "ok", text: `${id} marked ${DISP[val].label.toLowerCase()} in this tab — ${DISP[val].note}` });
  };

  const TABS = result ? [
    ["all", "All", result.summary.total],
    ["grcheck", "Check GR", result.summary.grCheck],
    ["pastdue", "Past due", result.summary.pastDue],
    ["needsupdate", "Needs update", result.summary.needsUpdate],
    ["ontarget", "On target", result.summary.onTarget],
    ["nosource", "No source", result.summary.noSource],
    ["zeroqty", "Zero qty", result.summary.zeroQty],
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

  useLayoutEffect(() => { pinColumns(tableRef.current); }, [visible, disp]);

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };
  const sortTh = (k, label) => (
    <button type="button" onClick={() => toggleSort(k)}>{label}{sortKey === k ? (sortDir === "asc" ? " ▲" : " ▼") : ""}</button>
  );

  /* The filters in force, in words, for a filtered export's About sheet. */
  const shown = () => {
    const out = [];
    if (tab !== "all") out.push(`Status: ${CLS[tab].label} only`);
    if (query.trim()) out.push(`Search: "${query.trim()}" (spaces = AND, commas = OR)`);
    out.push(`Sorted by ${{ severity: "status", delta: "Δ days", current: "current ASN date", recommended: "recommended date" }[sortKey]}, ${sortDir === "asc" ? "ascending" : "descending"}`);
    return out;
  };
  const exportXLSX = async (rows, which) => {
    const XLSX = await import("xlsx");
    const withDecision = rows.map((r) => ({ ...r, _decision: DISP[disp[r.asnId]]?.label }));
    writeWorkbook(XLSX, {
      slug: SLUG, which, tool: NAME,
      what: which === "full"
        ? `Every open ASN (${result.rows.length}) with its recommended date, the basis for it, its status, flags, reason and the decision made in this tab.`
        : `The ${count(rows.length, "line")} on screen when it was exported, with recommended dates, basis, status, flags, reason and decision.`,
      source: `The ${NORTHPOINT.company} sample, generated in your browser from seed ${SAMPLE_SEED}, dates relative to the export day`,
      shown: which === "full" ? [] : shown(),
      sheets: [{ name: "ASN worklist", rows: buildWorklist(withDecision) }],
    });
  };

  if (!result) return null;
  const s = result.summary;
  const dispCount = Object.keys(disp).length;
  const reload = dispCount > 0
    ? <ConfirmButton label="Reload sample" icon={<RotateCcw />} effect={`Reloads the sample and clears the ${count(dispCount, "decision")} made in this tab.`} confirmLabel="Reload and clear" onConfirm={loadSample} />
    : <button type="button" className="np-btn" onClick={loadSample}><RotateCcw />Reload sample</button>;

  return (
    <>
      {/* Where the data came from: the block under the header. */}
      <div className="np-part">
        <div className="np-ident">
          <h2>{NORTHPOINT.company} · inbound worklist</h2>
          <p>Loaded <b>the {NORTHPOINT.company} sample</b> at {time(loadedAt)}, generated in your browser from seed {SAMPLE_SEED}, dates set relative to today. {count(s.total, "open ASN")} from four sources:</p>
          <div className="np-row" style={{ marginTop: 6 }}>
            {[
              ["ERP receiving worklist", count(s.total, "open ASN")],
              ["Logistics planning tracker", "scheduled and ETA dates"],
              ["Carrier track & trace", "live ETA feed"],
              [`${PORT} schedule`, count(data.portSchedule.length, "vessel")],
            ].map(([n, meta]) => (
              <Hint key={n} text="A synthetic source for this demo. In a delivered copy this is an uploaded export, recognized by its columns.">
                <span className="np-chip" style={{ cursor: "help" }}><CircleCheck size={13} aria-hidden="true" /> <b style={{ color: T.text, fontWeight: 600 }}>{n}</b> · {meta}</span>
              </Hint>
            ))}
          </div>
        </div>
        <div className="np-row">{reload}</div>
      </div>

      {notice && (
        <NoticeBanner tag={notice.tag} tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</NoticeBanner>
      )}

      <Intro>
        Of <b>{s.total}</b> open <Term text={GLOSSARY.ASN}>ASNs</Term>, <b>{s.computable}</b> have a recommended date and{" "}
        <b>{s.needsUpdate + s.pastDue}</b> differ from what the system shows now (<b>{s.pullIn}</b> need{" "}
        <Term text={GLOSSARY["Pull in"]}>pulling in</Term>, <b>{s.pushOut}</b> <Term text={GLOSSARY["Push out"]}>pushing out</Term>).
        {s.grCheck > 0 && <> <b>{s.grCheck}</b> have a scheduled date already in the past — <Term text={GLOSSARY.GR}>verify the receipt</Term>, don't just move the date.</>}
        {s.noSource > 0 && <> <b>{s.noSource}</b> have no arrival signal yet — chase logistics.</>}
      </Intro>
      <HowItWorks points={[
        { lead: "Pick the best arrival signal.", text: `Each line is matched across the sources and the recommended date comes from the firmest one available: scheduled delivery, then actual arrival plus ${TUNING.TRANSIT_DAYS} days of transit, then tracker ETA, then carrier ETA.` },
        { lead: "Compare it with the system.", text: "Earlier than the current ASN date means pull in, later means push out, equal means on target." },
        { lead: "A scheduled date in the past is a receipt question.", text: "If the scheduled delivery itself has passed and the ASN is still open, the freight should already be received: it is flagged Check GR and kept out of the update counts. An estimate in the past is Past due — chase logistics." },
        { lead: "Wide-impact movements ripple furthest.", text: `Vessel berthing shifts at ${PORT} against the tracker for the same voyage, and container reschedules of ${TUNING.BIG_MOVE_DAYS} days or more. Hover a row for the detail.` },
      ]} />

      <AnswerCards>
        <AnswerCard label="Check GR" value={s.grCheck} tone={s.grCheck ? "bad" : "good"} pressed={tab === "grcheck"} onClick={() => setTab(tab === "grcheck" ? "all" : "grcheck")} title="Press to show only these lines; press again to show all.">
          Scheduled date passed and the ASN is still open — verify the goods receipt before touching the date.
        </AnswerCard>
        <AnswerCard label="Past due" value={s.pastDue} tone={s.pastDue ? "bad" : "good"} pressed={tab === "pastdue"} onClick={() => setTab(tab === "pastdue" ? "all" : "pastdue")} title="Press to show only these lines; press again to show all.">
          The estimated arrival is already past — chase logistics for the real status.
        </AnswerCard>
        <AnswerCard label="Needs update" value={s.needsUpdate} tone={s.needsUpdate ? "warn" : "good"} pressed={tab === "needsupdate"} onClick={() => setTab(tab === "needsupdate" ? "all" : "needsupdate")} title="Press to show only these lines; press again to show all.">
          A future date that differs from the system: move it in or out.
        </AnswerCard>
        <AnswerCard label="On target" value={s.onTarget} tone="good" pressed={tab === "ontarget"} onClick={() => setTab(tab === "ontarget" ? "all" : "ontarget")} title="Press to show only these lines; press again to show all.">
          Already match — nothing to change.
        </AnswerCard>
        <AnswerCard label="No source" value={s.noSource} tone="info" pressed={tab === "nosource"} onClick={() => setTab(tab === "nosource" ? "all" : "nosource")} title="Press to show only these lines; press again to show all.">
          No arrival signal yet, so no date can be recommended.
        </AnswerCard>
        <AnswerCard label="Wide impact" value={s.wideImpact} onClick={() => setShowWide((v) => !v)} pressed={showWide} title="Press to open or fold the wide-impact panel.">
          Vessel shifts and big container moves — the changes that reach the most lines.
        </AnswerCard>
      </AnswerCards>

      {/* Wide-impact movements */}
      {(result.vessels.length > 0 || result.movers.length > 0) && (
        <section className="np-panel">
          <button type="button" className="np-btn quiet" style={{ width: "100%", justifyContent: "flex-start", flexWrap: "wrap", whiteSpace: "normal", textAlign: "left", border: 0, padding: "10px 12px", color: T.text }}
            aria-expanded={showWide} onClick={() => setShowWide((v) => !v)}>
            {showWide ? <ChevronDown /> : <ChevronRight />}<Ship aria-hidden="true" /> Wide-impact movements
            <span className="np-muted"> · {count(result.vessels.length, "vessel")}, {count(result.movers.length, "container reschedule")}</span>
          </button>
          {showWide && (
            <div className="np-panel-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))", gap: 18 }}>
              <div>
                <h4 className="np-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Vessel berthing shifts<Help label="Vessel berthing shift" text={GLOSSARY.Berth + " A shift compares the berthing date with the plan for the same voyage."} /></h4>
                {result.vessels.length === 0 && <p className="np-muted">None within a plausible voyage window.</p>}
                {result.vessels.slice(0, TUNING.WIDE_LIST_CAP).map((v) => (
                  <Hint key={v.vessel} text={`${v.vessel}: berth ${v.berth}, ${v.status}, ERD ${houseDateShort(v.erd)}. ${count(v.lines, "line")}, ${count(v.containers, "container")}, ${count(v.suppliers, "supplier")}; ${v.needs} need updating.`}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.vessel}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span className="np-muted">{count(v.lines, "line")} · {v.needs} to move</span>
                        <Pill tone={v.major ? "bad" : "warn"}>{shift(v.move)}{v.major ? " · major" : ""}</Pill>
                      </span>
                    </span>
                  </Hint>
                ))}
                {result.vessels.length > TUNING.WIDE_LIST_CAP && <p className="np-muted" style={{ marginTop: 5 }}>and {result.vessels.length - TUNING.WIDE_LIST_CAP} more; export the full list to see them</p>}
              </div>
              <div>
                <h4 className="np-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Big container reschedules ({TUNING.BIG_MOVE_DAYS} days or more)<Help label="Container reschedule" text={GLOSSARY.Container} /></h4>
                {result.movers.length === 0 && <p className="np-muted">None over the threshold.</p>}
                {result.movers.slice(0, TUNING.WIDE_LIST_CAP).map((m) => (
                  <Hint key={m.container} text={`${m.container}${m.vessel ? ` on ${m.vessel}` : ""}: ${count(m.lines, "line")}, ${count(m.materials, "material")}, basis ${m.basis}; ${houseDateShort(m.from)} to ${houseDateShort(m.to)}.`}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                      <span className="np-num" style={{ color: T.text }}>{m.container}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span className="np-muted">{count(m.lines, "line")}</span>
                        <Pill tone={m.risk ? "bad" : "warn"}>{shift(m.delta)}</Pill>
                      </span>
                    </span>
                  </Hint>
                ))}
                {result.movers.length > TUNING.WIDE_LIST_CAP && <p className="np-muted" style={{ marginTop: 5 }}>and {result.movers.length - TUNING.WIDE_LIST_CAP} more; export the full list to see them</p>}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="np-gridwrap">
        <div className="np-gridhead">
          <div className="np-row">
            {TABS.map(([key, label, n]) => (
              <button key={key} type="button" className="np-chip" aria-pressed={tab === key} onClick={() => setTab(key)}>
                {label} <span className="n">({n})</span>
              </button>
            ))}
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <Search size={14} aria-hidden="true" />
            <input className="np-in" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search: spaces mean AND, commas mean OR" aria-label="Search the worklist" style={{ width: "min(260px, 60vw)" }} />
            {query && <button type="button" className="np-btn icon quiet" aria-label="Clear the search" onClick={() => setQuery("")}><X /></button>}
          </label>
        </div>
        <div className="np-gridhead">
          <span>Showing <span className="np-num">{visible.length}</span> of <span className="np-num">{result.rows.length}</span> lines{dispCount > 0 && <> · <span className="np-num">{dispCount}</span> decided in this tab</>}</span>
          {dispCount > 0 && (
            <ConfirmButton label="Clear decisions" className="np-btn quiet" effect={`Clears the ${count(dispCount, "decision")} made in this tab. Nothing was written anywhere.`}
              confirmLabel="Clear them" onConfirm={() => { setDisp({}); setNotice({ tag: "Done", tone: "ok", text: "Every decision in this tab is cleared." }); }} />
          )}
          <span style={{ marginLeft: "auto" }} />
          <ExportPair fullCount={result.rows.length} filteredCount={visible.length} noun="lines"
            onFull={() => exportXLSX(result.rows, "full")} onFiltered={() => exportXLSX(visible, "filtered")} />
        </div>

        <div className="np-scroll">
          <table className="np-grid" ref={tableRef} style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th className="pin">ASN</th>
                <th className="pin">Line</th>
                <th>Supplier · carrier</th>
                <th>{sortTh("current", "Current ASN")}</th>
                <th>{sortTh("recommended", "Recommended")}<Help label="Recommended date" text={GLOSSARY.Basis} /></th>
                <th className="r">{sortTh("delta", "Δ")}<Help label="Δ" text="Recommended date minus current ASN date, in days. Minus pulls the date in; plus pushes it out." /></th>
                <th>Basis</th>
                <th>{sortTh("severity", "Status")}</th>
                <th>Flags</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const d = disp[r.asnId];
                const c = CLS[r.cls];
                return (
                  <tr key={r.asnId} className={d ? "is-done" : ""}>
                    <td className="pin">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Dot tone={c.tone === "quiet" ? "quiet" : c.tone} title={c.label} />
                        <span className="code">{r.asnId}</span>
                      </span>
                      <span className="sub np-num" style={{ paddingLeft: 14 }}>PO {r.po}</span>
                    </td>
                    <td className="pin clip" title={`${r.description} · material ${r.material} · qty ${r.qty}`}>
                      <span style={{ color: T.text }}>{r.description}</span>
                      <span className="sub np-num">{r.material} · qty {figure(r.qty, { zeroMeans: "zero" })}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.supplier}
                      <span className="sub">{r.vessel || r.mode}{r.container ? <> · <span className="np-num">{r.container}</span></> : null}</span>
                    </td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>{fmtDate(r._cur)}</td>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>
                      {r._recommended ? <Hint text={r.reason}><span className="np-term">{fmtDate(r._recommended)}</span></Hint> : <span className="np-muted">—</span>}
                    </td>
                    <td className="r num" style={{ whiteSpace: "nowrap", color: r.cls === "ontarget" ? T.good : T.text }}>
                      {r.delta == null ? <span className="np-muted">—</span> : shift(r.delta)}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{r.basis || <span className="np-muted">—</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}><Pill tone={c.tone}>{c.label}</Pill></td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", gap: 4 }}>
                        {r.flags.map((f, i) => (
                          <Hint key={i} text={f.h || FLAG_HELP[f.t] || f.t}><Pill tone={FLAG_TONE[f.kind] || "quiet"}>{f.t}</Pill></Hint>
                        ))}
                        {r.flags.length === 0 && <span className="np-muted">—</span>}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", gap: 4 }}>
                        {Object.entries(DISP).map(([k, v]) => {
                          const on = d === k;
                          const fill = { ok: T.goodFill, bad: T.badFill, quiet: T.surfaceAlt }[v.tone];
                          return (
                            <button key={k} type="button" className="np-btn" aria-pressed={on}
                              title={`${v.label}: ${v.note}`} onClick={() => setDisposition(r.asnId, k)}
                              style={{ minHeight: 24, padding: "1px 8px", fontSize: 12, ...(on ? { background: fill, borderColor: fill, color: v.tone === "quiet" ? T.text : T.accentInk } : {}) }}>
                              {v.label}
                            </button>
                          );
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr className="detail"><td colSpan={10} className="np-empty">No lines match. Press All, or clear the search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Legend lead="Status:" items={[
          { label: "Check GR or Past due: a date already in the past", tone: "bad" },
          { label: "Needs update: a future date that differs", tone: "warn" },
          { label: "On target: already matches", tone: "ok" },
          { label: "No source or Zero qty: nothing to date", tone: "quiet" },
        ]} />
      </div>
    </>
  );
}

export default function ASNUpdateRadar() {
  return (
    <HouseFrame slug={SLUG} name={NAME} scope={SCOPE} manual={MANUAL}>
      <Radar />
    </HouseFrame>
  );
}
