// PUBLIC-ARTIFACT — a demo on the public marketing site, not an internal work tool.
// This file reads a spreadsheet, which puts it inside the reach of the internal tool-conventions
// guard in the operator's own setup (tool-conventions-guard.sh, outside this repo). That guard once
// demanded a corporate palette DECISIONS D2 forbids here; since 2026-09-23 the house conventions
// this demo follows are the ones tool-conventions records, in its OWN palette (northpoint), and
// the marker stays because the guard's internal-data checks still do not apply to a public demo
// on invented data. The marker is read from this file rather than its path. See LEDGER L-197.
//
// THE HOUSE FRAME (2026-09-23). Ian brought the seven factory demos under the house conventions
// MD04 set that day: the house header and footer, banners in place of pop-ups, answer cards, the
// bounded grid with its identity columns pinned, one formatter, the About sheet on every export,
// an Instruction Manual, and a light mode beside the dark one. The shared pieces live in
// ../kit/house.jsx; this file carries only what is this tool's own.
import { northpointTokens } from "../kit/industrial.js";
// The fictional company these seven are set in — one file, so the world
// cannot drift into two companies across seven tools.
import { NORTHPOINT } from "../../lib/northpoint.js";
import { figure, percent, time, count } from "../../lib/format.js";
import {
  HouseFrame, Intro, HowItWorks, NoticeBanner, AnswerCards, AnswerCard, ExportPair,
  ConfirmButton, Help, Legend, Dot, Pill, NumberField, pinColumns,
} from "../kit/house.jsx";
import { writeWorkbook } from "../kit/house-export.js";

import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
// xlsx is loaded lazily inside the upload + export handlers, keeping its
// ~480 KB chunk off the initial bundle until the visitor uploads or exports.
import {
  OctagonAlert, TriangleAlert, CircleCheck, ChevronDown, ChevronRight, ChevronUp,
  Search, Upload, Layers, Check, X, Clock, Trash,
} from "lucide-react";

/*
  Staging Triage Console — portfolio demo
  Built by Ian Provencher

  Reads a stock-by-location export, computes how much of each item's total
  on-hand is concentrated line-side (point of use), classifies every location
  into a flow-ordered bucket, and flags physical-integrity anomalies in
  severity tiers. Each flag is triaged — Accept / Reject / Ignore — captured
  in-session and, wired to connectors, actioned automatically.

  Synthetic data only — fictional manufacturer, invented part numbers.
*/

const SLUG = "staging-triage-console";
const NAME = "Staging Triage Console";
const SCOPE = "Reads a stock-by-location extract in your browser. Never connects to SAP.";

/* THE NORTHPOINT PALETTE, "inbound & inventory" band — shared with the ASN
   radar, because a staging board and a receiving queue are the same screen.
   Every color below is a var() reference; the values arrive on the house
   frame's root for the mode in force. */
const T = northpointTokens(SLUG);

// ---- Location buckets, in material-flow order ----------------------------
/* THE BAR IS DRAWN IN THE CHART SERIES, NOT IN STATUS COLORS. Until 2026-09-23
   the line-side bucket was green — and a growing line-side share is the very
   problem this tool flags, so the bar read "healthy" exactly where it meant
   "look here". Brass marks the bucket the tool is about; the other four run in
   steel steps, in flow order. */
const BUCKETS = [
  { key: "LINE", label: "Line-Side", note: "Point of use at the assembly line", color: T.series1 },
  { key: "FEED", label: "Line Feed", note: "Production-supply staging bins", color: T.series2 },
  { key: "MART", label: "Supermarket", note: "Buffered pick face", color: T.series3 },
  { key: "REPL", label: "Replenishment", note: "Refill loop in motion", color: T.series4 },
  { key: "WHSE", label: "Warehouse", note: "Bulk resting storage", color: T.series5 },
];

const BUCKET_KEYS = BUCKETS.map((b) => b.key);
const BUCKET_LABEL = Object.fromEntries(BUCKETS.map((b) => [b.key, b.label]));

// ---- Flag rules (the transparent triage logic) ---------------------------
const IMPOSSIBLE_CEILING = 100_000_000; // any single bin at/above this is non-physical
const IMPOSSIBLE_MULTIPLE = 1000; // ...or >= 1000x this item's median bin
const DEFAULT_OVERSTAGED = 50; // % of total on-hand sitting line-side
const SAMPLE_SEED = 42;

// ---- Number formatting: the house formats, never exponential --------------
/* Through src/lib/format.js: a true minus, grouped thousands, and a dash for a
   value that is not there. On-hand is a real quantity, so a zero is printed. */
const fmt = (n) => figure(n, { zeroMeans: "zero", empty: "—" });
const pct = (n) => percent(n, { digits: 1, empty: "—" });
const keyOf = (it) => it.mat || it.item;

const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].map(Math.abs).sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// ---- Synthetic dataset ---------------------------------------------------
// Deterministic seeded RNG so the demo renders identically every load.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Synthetic material numbers — invented numeric keys, not anyone's real scheme.
const MAT_MAP = {
  "BRKT-MNT-L": "10010110", "BRKT-MNT-R": "10010111", "HARN-ASY-12": "10022045",
  "MOTOR-DRV-240": "10030877", "FAN-AXL-120": "10031290", "PCB-CTRL-R3": "10044501",
  "SCRW-M4-16": "10009912", "LABEL-RTG-A": "10071133", "HOSE-DRN-08": "10052760",
  "CLIP-RET-SS": "10009488", "FOAM-PAD-90": "10063021", "VALVE-INL-2": "10038150",
  "SENS-TEMP-K": "10047709", "CAP-END-32": "10018844", "SPRG-CMP-7": "10027319",
  "WSHR-FLT-M6": "10009007", "ORING-32MM": "10015562", "GSKT-SEAL-M8": "10042317",
};

function buildSampleRows() {
  const rng = mulberry32(SAMPLE_SEED);
  const items = [
    ["BRKT-MNT-L", "Mounting bracket, left", "EA"],
    ["BRKT-MNT-R", "Mounting bracket, right", "EA"],
    ["HARN-ASY-12", "Wiring harness, 12-pin", "EA"],
    ["MOTOR-DRV-240", "Drive motor, 240V", "EA"],
    ["FAN-AXL-120", "Axial fan, 120mm", "EA"],
    ["PCB-CTRL-R3", "Control board, rev 3", "EA"],
    ["SCRW-M4-16", "Machine screw, M4x16", "EA"],
    ["LABEL-RTG-A", "Rating label, type A", "EA"],
    ["HOSE-DRN-08", "Drain hose, 8mm", "M"],
    ["CLIP-RET-SS", "Retainer clip, stainless", "EA"],
    ["FOAM-PAD-90", "Damping pad, 90mm", "EA"],
    ["VALVE-INL-2", "Inlet valve, dual", "EA"],
    ["SENS-TEMP-K", "Thermistor, type K", "EA"],
  ];

  const rows = [];
  const addBin = (item, desc, uom, loc, bin, qty) =>
    rows.push({ item, desc, uom, location: loc, bin, qty });

  // Healthy / normal spread — weighted to warehouse + supermarket.
  items.forEach(([item, desc, uom], i) => {
    const base = 200 + Math.floor(rng() * 1800);
    addBin(item, desc, uom, "WHSE", `WHSE-R${10 + i}`, Math.round(base * (0.45 + rng() * 0.2)));
    addBin(item, desc, uom, "MART", `MART-${String.fromCharCode(65 + (i % 6))}${4 + (i % 9)}`, Math.round(base * (0.2 + rng() * 0.15)));
    if (rng() > 0.35) addBin(item, desc, uom, "REPL", `REPL-T${2 + (i % 7)}`, Math.round(base * (0.05 + rng() * 0.1)));
    if (rng() > 0.4) addBin(item, desc, uom, "FEED", `FEED-${String.fromCharCode(65 + (i % 5))}${1 + (i % 6)}`, Math.round(base * (0.05 + rng() * 0.1)));
    addBin(item, desc, uom, "LINE", `LINE-${String.fromCharCode(65 + (i % 7))}0${1 + (i % 8)}`, Math.round(base * (0.08 + rng() * 0.12)));
  });

  // Planted: three overstaged items (most of their stock sitting line-side).
  addBin("CAP-END-32", "End cap, 32mm", "EA", "LINE", "LINE-C04", 4200);
  addBin("CAP-END-32", "End cap, 32mm", "EA", "WHSE", "WHSE-R28", 380);
  addBin("CAP-END-32", "End cap, 32mm", "EA", "MART", "MART-D7", 210);

  addBin("SPRG-CMP-7", "Compression spring, 7mm", "EA", "LINE", "LINE-E02", 9100);
  addBin("SPRG-CMP-7", "Compression spring, 7mm", "EA", "FEED", "FEED-B3", 600);
  addBin("SPRG-CMP-7", "Compression spring, 7mm", "EA", "WHSE", "WHSE-R31", 900);

  addBin("WSHR-FLT-M6", "Flat washer, M6", "EA", "LINE", "LINE-A09", 15800);
  addBin("WSHR-FLT-M6", "Flat washer, M6", "EA", "MART", "MART-A2", 1200);

  // Planted: plain negative stock in a resting bucket (data error).
  addBin("ORING-32MM", "O-ring, 32mm", "EA", "WHSE", "WHSE-R44", 2600);
  addBin("ORING-32MM", "O-ring, 32mm", "EA", "MART", "MART-F5", 740);
  addBin("ORING-32MM", "O-ring, 32mm", "EA", "REPL", "REPL-T9", -310);

  // Planted: the netting trap. A non-physical positive line-side bin offset by a
  // huge negative count bin. The TOTAL nets to a plausible-looking ~1.3M, so a
  // total-only view shows nothing wrong — but both bins are individually
  // impossible. This is the case the per-bin integrity check is built to catch.
  addBin("GSKT-SEAL-M8", "Gasket seal, M8", "EA", "LINE", "LINE-B07", 9_000_210_716);
  addBin("GSKT-SEAL-M8", "Gasket seal, M8", "EA", "WHSE", "WHSE-R09", -8_998_900_000);
  addBin("GSKT-SEAL-M8", "Gasket seal, M8", "EA", "MART", "MART-B1", 950);

  return rows.map((r) => ({ ...r, mat: MAT_MAP[r.item] || "" }));
}
const SAMPLE_ROWS = buildSampleRows();

// ---- Aggregation: rows -> per-item record --------------------------------
function aggregate(rows, thresholdPct) {
  const byItem = new Map();
  for (const r of rows) {
    const key = r.item;
    if (!byItem.has(key)) {
      byItem.set(key, {
        item: r.item,
        mat: r.mat || MAT_MAP[r.item] || "",
        desc: r.desc,
        uom: r.uom || "",
        bins: [],
        q: Object.fromEntries(BUCKET_KEYS.map((k) => [k, 0])),
      });
    }
    const a = byItem.get(key);
    const qty = Number(r.qty) || 0;
    const bucket = BUCKET_KEYS.includes(r.location) ? r.location : "WHSE";
    a.bins.push({ location: bucket, bin: r.bin, qty });
    a.q[bucket] += qty;
  }

  const items = [];
  for (const a of byItem.values()) {
    // Single shared denominator: total on-hand across every bucket.
    const total = BUCKET_KEYS.reduce((s, k) => s + a.q[k], 0);
    const med = median(a.bins.map((b) => b.qty));

    const flagged = a.bins.map((b) => {
      const reasons = [];
      if (
        Math.abs(b.qty) >= IMPOSSIBLE_CEILING ||
        (med > 0 && Math.abs(b.qty) >= IMPOSSIBLE_MULTIPLE * med)
      )
        reasons.push("impossible");
      if (b.qty < 0) reasons.push("negative");
      return { ...b, reasons };
    });

    const hasImpossible = flagged.some((b) => b.reasons.includes("impossible"));
    const hasNegative = flagged.some((b) => b.reasons.includes("negative"));
    const lineShare = total > 0 ? a.q.LINE / total : 0;
    const overstaged = !hasImpossible && !hasNegative && lineShare * 100 >= thresholdPct;

    let severity = "ok";
    if (hasImpossible || hasNegative) severity = "critical";
    else if (overstaged) severity = "warn";

    let reason = "No flags — line-side share within threshold.";
    if (hasImpossible) {
      const b = flagged.find((x) => x.reasons.includes("impossible"));
      reason = `Bin ${b.bin} holds ${fmt(b.qty)} — non-physical (≥ ${fmt(IMPOSSIBLE_CEILING)} or ≥ ${IMPOSSIBLE_MULTIPLE}× median bin).`;
    } else if (hasNegative) {
      const b = flagged.find((x) => x.reasons.includes("negative"));
      reason = `Bin ${b.bin} is negative (${fmt(b.qty)}) — caught per-bin so the total can't mask it.`;
    } else if (overstaged) {
      reason = `Line-side ${pct(lineShare)} ≥ ${thresholdPct}% threshold.`;
    }

    items.push({
      ...a,
      bins: flagged,
      total,
      lineShare,
      severity,
      reason,
      hasImpossible,
      hasNegative,
      overstaged,
    });
  }
  return items;
}

// ---- Flag presentation ---------------------------------------------------
/* A filled pill for the two flags and a quiet one for clear: a mark sits only
   where there is something to act on, so thirteen green pills do not shout
   over two red ones. The dot at the start of every row carries the status too. */
const SEV = {
  critical: { label: "Integrity", tone: "bad", Icon: OctagonAlert },
  warn: { label: "Overstaged", tone: "warn", Icon: TriangleAlert },
  ok: { label: "Clear", tone: "ok", Icon: CircleCheck },
};

const LOGIC = [
  {
    sev: "critical",
    name: "Impossible quantity",
    what: "A single bin holds a physically impossible amount.",
    how: `Any bin at or above ${fmt(IMPOSSIBLE_CEILING)} units, or ${IMPOSSIBLE_MULTIPLE}× this item's median bin or more.`,
    action: "Treat as a count or posting error before trusting any total for this item.",
  },
  {
    sev: "critical",
    name: "Negative stock",
    what: "A bin shows stock below zero.",
    how: "Any bin quantity below zero. Caught per bin, so a positive bin can't mask it in the total.",
    action: "Reconcile the bin; a negative paired with an impossible positive is a swapped or mis-keyed count.",
  },
  {
    sev: "warn",
    name: "Overstaged line-side",
    what: "Too much of the item's total is sitting at point of use.",
    how: `Line-side share of total on-hand at or above the threshold (adjustable, default ${DEFAULT_OVERSTAGED}%). Only checked when the item has no integrity error.`,
    action: "Pull the excess back to the supermarket; line-side space and first-in-first-out are at risk.",
  },
];

/* THE GLOSSARY behind every "?" in the grid head. */
const HELP = {
  distribution: "Where the item's stock sits, left to right in the order material moves: line-side, line feed, supermarket, replenishment, warehouse. Hover a segment for its quantity.",
  onhand: "The item's total across every bin in every bucket. This is the figure a total-only view reports, and it nets errors against each other.",
  share: "Line-side units divided by the item's total on-hand. Hover a figure to see the two numbers behind it.",
  flag: "Integrity: a bin is impossible or negative, so the total cannot be trusted. Overstaged: the line-side share reached the threshold. Clear: neither.",
  triage: "Accept, Reject or Ignore a flag. Decisions stay in this tab; wired to connectors, they post the fix, tune the rule or defer the item.",
};

/* ── THE INSTRUCTION MANUAL (tool-conventions § N), built from the constants
      above so a threshold change reaches it on its own. Rendered by
      ../kit/house-manual.js on its own page and in the tool's panel. ── */
export const MANUAL = {
  tool: NAME,
  purpose: "Finds the stock-count errors a total-only view hides, and the items with too much of their stock sitting at the line, and turns each one into a triage decision.",
  sections: [
    {
      id: "start", title: "What it is for, and what to do first",
      blocks: [
        { p: "A physical inventory can net to a believable total while two bins are wrong in opposite directions. This tool checks every bin on its own, measures how much of each item sits at point of use, and lists what needs a decision." },
        { list: [
          { lead: "Read the answer cards.", text: "They say how many items carry an integrity error and how many are overstaged. Press a card to show only those items." },
          { lead: "Sort by flag.", text: "Integrity errors come first: an item's total cannot be trusted until its bins are recounted." },
          { lead: "Open a row.", text: "It lists the item's bins in flow order, with the ones to act on marked." },
          { lead: "Triage each flag.", text: "Accept, Reject or Ignore. The decisions go into both exports." },
        ] },
      ],
    },
    {
      id: "numbers", title: "What the numbers mean",
      blocks: [
        { table: { head: ["Figure", "What it is"], rows: [
          ["Items", "Distinct items in the extract, and the bins they are held in."],
          ["Integrity errors", "Items with at least one impossible or negative bin."],
          ["Overstaged", "Items with no integrity error whose line-side share reached the threshold."],
          ["Total on-hand", "Units across every bin of every item. Errors are netted into it, which is the point: it can look right while being wrong."],
          ["On-hand (column)", "One item's total across all its bins."],
          ["Line-side share (column)", "Line-side units divided by the item's on-hand."],
        ] } },
      ],
    },
    {
      id: "flags", title: "Every flag, and what to do about it",
      blocks: [
        { table: { head: ["Flag", "What it means", "How it is decided", "What to do"], rows: LOGIC.map((l) => [l.name, l.what, l.how, l.action]) } },
        { p: "Clear means neither check fired. An item with an integrity error is never also marked overstaged, because its share is computed from a total that cannot be trusted." },
      ],
    },
    {
      id: "derived", title: "How to read the derived columns",
      blocks: [
        { p: "The distribution bar is the item's stock by bucket, left to right in the order material flows toward the line. Line-side is drawn in brass because it is the bucket this tool is about; the rest run in steel, darkest to lightest.", lead: "Distribution." },
        { p: "One division, line-side units over total on-hand. A share far above 100% means a bin is impossible, not that the line holds more than the plant owns.", lead: "Line-side share." },
        { p: "Each flag carries the bin and quantity that set it off. Hover the flag, or open the row.", lead: "The reason." },
      ],
    },
    {
      id: "data", title: "How the data is handled",
      blocks: [
        { p: `This copy runs entirely in your browser. On open it generates a sample for ${NORTHPOINT.company}, an invented manufacturer, from a fixed seed (${SAMPLE_SEED}), so every visit shows the same figures.` },
        { p: "An uploaded file is read in this tab and nothing is sent anywhere. Expected columns: Material, Item, Description, UoM, Location, Bin, Qty. It is gone when the tab closes." },
        { p: "Triage decisions live in this tab only, and both exports carry them." },
      ],
    },
    {
      id: "thresholds", title: "Every threshold",
      blocks: [
        { table: { head: ["Threshold", "Value", "Why"], rows: [
          ["Impossible bin, absolute", `${fmt(IMPOSSIBLE_CEILING)} units`, "No single storage bin holds this many of anything; a count this size is a keying or posting error."],
          ["Impossible bin, relative", `${IMPOSSIBLE_MULTIPLE}× the item's median bin`, "A bin a thousand times its siblings is a misplaced decimal or a scanned barcode typed as a quantity."],
          ["Overstaged", `${DEFAULT_OVERSTAGED}% line-side, adjustable 1–100%`, "Set for this demo. A delivered copy takes the plant's own figure, which depends on line-side space and how often the line is fed."],
        ] } },
      ],
    },
    {
      id: "limits", title: "What it cannot tell you",
      blocks: [
        { list: [
          "Which of two offsetting bins is the wrong one. It flags both; a recount decides.",
          "Whether overstaged stock is causing harm. It does not know consumption rates or line-side space.",
          "Anything about time. It reads one snapshot; stock moving between buckets during a count is invisible.",
          "Where a location with an unknown bucket code sits. Any location it does not recognize is counted as warehouse.",
        ] },
      ],
    },
  ],
};

// ---- Flow distribution bar -----------------------------------------------
function FlowBar({ q, total }) {
  if (total <= 0)
    return <div style={{ height: 10, borderRadius: 5, background: T.surfaceAlt }} title="No positive on-hand" />;
  return (
    <div role="img" aria-label="stock distribution by location"
      style={{ display: "flex", height: 10, width: "100%", overflow: "hidden", borderRadius: 5, background: T.surfaceAlt, gap: 1 }}>
      {BUCKETS.map((b) => {
        const v = Math.max(q[b.key], 0);
        const w = (v / total) * 100;
        if (w <= 0) return null;
        return <div key={b.key} style={{ width: `${w}%`, background: b.color }} title={`${b.label}: ${fmt(v)} (${pct(v / total)})`} />;
      })}
    </div>
  );
}

/* One triage button. Pressed, it fills with its meaning; the label says what it
   does in a delivered copy, so the demo never pretends a connector fired. */
function TriageBtn({ active, tone, label, onClick, children }) {
  const fill = { accept: T.goodFill, reject: T.badFill, ignore: T.surfaceAlt }[tone];
  return (
    <button type="button" className="np-btn icon" aria-pressed={active} aria-label={label} title={label} onClick={onClick}
      style={{ width: 26, minHeight: 26, ...(active ? { background: fill, borderColor: fill, color: tone === "ignore" ? T.text : T.accentInk } : {}) }}>
      {children}
    </button>
  );
}

const CONNECTOR_MSG = {
  accepted: "wired to a connector, this posts the correction back.",
  rejected: "wired to a connector, this logs a false positive and tunes the rule.",
  ignored: "wired to a connector, this defers the item to the next review.",
};
const DISP_LABEL = { accepted: "Accepted", rejected: "Rejected", ignored: "Ignored" };

function Console() {
  const [rows, setRows] = useState([]);
  const [threshold, setThreshold] = useState(DEFAULT_OVERSTAGED);
  const [sevFilter, setSevFilter] = useState("all");
  const [sortKey, setSortKey] = useState("lineShare");
  const [sortDir, setSortDir] = useState("desc");
  const [expanded, setExpanded] = useState(null);
  const [source, setSource] = useState(null);
  const [picked, setPicked] = useState([]);
  const [comboOpen, setComboOpen] = useState(false);
  const [comboQuery, setComboQuery] = useState("");
  const [hideTriaged, setHideTriaged] = useState(false);
  const [disposition, setDisposition] = useState({});
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);
  const tableRef = useRef(null);

  const items = useMemo(() => aggregate(rows, threshold), [rows, threshold]);

  const summary = useMemo(() => {
    const critical = items.filter((i) => i.severity === "critical").length;
    const warn = items.filter((i) => i.severity === "warn").length;
    const totalOnHand = items.reduce((s, i) => s + Math.max(i.total, 0), 0);
    const bins = items.reduce((s, i) => s + i.bins.length, 0);
    return { count: items.length, critical, warn, totalOnHand, bins };
  }, [items]);

  const triage = useMemo(() => {
    const flagged = items.filter((i) => i.severity !== "ok");
    const done = flagged.filter((i) => disposition[keyOf(i)]).length;
    return { flagged: flagged.length, done };
  }, [items, disposition]);

  const view = useMemo(() => {
    let v = items;
    if (sevFilter !== "all") v = v.filter((i) => i.severity === sevFilter);
    if (picked.length) {
      const set = new Set(picked);
      v = v.filter((i) => set.has(keyOf(i)));
    } else if (comboQuery.trim()) {
      const q = comboQuery.trim().toLowerCase();
      v = v.filter(
        (i) =>
          i.item.toLowerCase().includes(q) ||
          i.desc.toLowerCase().includes(q) ||
          (i.mat || "").includes(q)
      );
    }
    if (hideTriaged) v = v.filter((i) => !disposition[keyOf(i)]);
    const dir = sortDir === "asc" ? 1 : -1;
    const sevRank = { critical: 2, warn: 1, ok: 0 };
    v = [...v].sort((a, b) => {
      let x, y;
      if (sortKey === "item") return dir * (a.mat || a.item).localeCompare(b.mat || b.item);
      if (sortKey === "severity") {
        x = sevRank[a.severity];
        y = sevRank[b.severity];
      } else {
        x = a[sortKey];
        y = b[sortKey];
      }
      return dir * (x - y);
    });
    return v;
  }, [items, sevFilter, picked, comboQuery, hideTriaged, disposition, sortKey, sortDir]);

  /* Pin the identity block whenever the rows change: the second pinned column's
     offset is the first one's width, which only the laid-out table knows. */
  useLayoutEffect(() => { pinColumns(tableRef.current); }, [view, expanded]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "item" ? "asc" : "desc");
    }
  };
  const arrow = (k) => (sortKey !== k ? null : sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />);
  const sortTh = (k, label) => <button type="button" onClick={() => toggleSort(k)}>{label}{arrow(k)}</button>;

  const loadSample = () => {
    setRows(SAMPLE_ROWS);
    setSource({ name: `the ${NORTHPOINT.company} sample`, detail: `generated in your browser from seed ${SAMPLE_SEED}`, at: new Date() });
    setDisposition({});
    setPicked([]);
    setComboQuery("");
    setExpanded(null);
    setNotice(null);
  };

  // Boot populated like the other six demos — the sample loads on mount, so a
  // visitor lands on a working console instead of an empty state. Upload still
  // replaces it; "Reload sample" still resets to it.
  useEffect(() => { loadSample(); }, []);

  const resetView = () => {
    setSevFilter("all");
    setThreshold(DEFAULT_OVERSTAGED);
    setSortKey("lineShare");
    setSortDir("desc");
    setPicked([]);
    setComboQuery("");
    setComboOpen(false);
    setHideTriaged(false);
    setExpanded(null);
  };

  const clearData = () => {
    resetView();
    setRows([]);
    setDisposition({});
    setSource(null);
    setNotice({ tag: "Done", tone: "ok", text: "The data and every triage decision are cleared. Nothing had been saved anywhere." });
    if (fileRef.current) fileRef.current.value = "";
  };

  const setDisp = (it, val) => {
    const k = keyOf(it);
    const cleared = disposition[k] === val;
    setDisposition((d) => {
      const next = { ...d };
      if (cleared) delete next[k];
      else next[k] = val;
      return next;
    });
    setNotice(cleared
      ? { tag: "Cleared", tone: "ok", text: `The decision on ${k} is cleared.` }
      : { tag: DISP_LABEL[val], tone: "ok", text: `${k} ${DISP_LABEL[val].toLowerCase()} — in this demo it is recorded in this tab; ${CONNECTOR_MSG[val]}` });
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const norm = raw.map((r) => {
          const k = Object.fromEntries(Object.entries(r).map(([key, val]) => [key.toString().trim().toLowerCase(), val]));
          return {
            mat: (k.material || k.mat || k.materialnumber || k.matnr || "").toString(),
            item: (k.item || k.part || k.code || k.material || k.mat || "").toString(),
            desc: (k.description || k.desc || "").toString(),
            uom: (k.uom || k.unit || "").toString(),
            location: (k.location || k.bucket || k.area || "WHSE").toString().toUpperCase(),
            bin: (k.bin || k.storagebin || k.slot || "").toString(),
            qty: Number(k.qty ?? k.quantity ?? k.onhand ?? 0) || 0,
          };
        }).filter((r) => r.item);
        if (!norm.length) throw new Error("no rows");
        setRows(norm);
        setSource({ name: f.name, detail: `${figure(norm.length, { zeroMeans: "zero" })} rows read in this tab`, at: new Date() });
        setDisposition({});
        setPicked([]);
        setComboQuery("");
        setExpanded(null);
        setNotice({ tag: "Done", tone: "ok", text: `${f.name} is loaded: ${figure(norm.length, { zeroMeans: "zero" })} rows. The sample is replaced until you reload it.` });
      } catch (err) {
        setNotice({
          tag: "Not done", tone: "bad", text: `${f.name} could not be read, so the data on screen is unchanged.`,
          reasons: ["Expected an Excel or CSV file whose first sheet has the columns Material, Item, Description, UoM, Location, Bin and Qty."],
        });
      }
    };
    reader.readAsArrayBuffer(f);
  };

  /* THE FILTERS IN FORCE, in words — the About sheet of a filtered export names
     every one, so the file never reads as all of it. */
  const shown = () => {
    const out = [];
    if (sevFilter !== "all") out.push(`Flag: ${SEV[sevFilter].label} only`);
    if (picked.length) out.push(`Materials picked: ${picked.join(", ")}`);
    else if (comboQuery.trim()) out.push(`Search: "${comboQuery.trim()}"`);
    if (hideTriaged) out.push("Triaged items hidden");
    out.push(`Overstaged threshold: ${threshold}%${threshold === DEFAULT_OVERSTAGED ? " (the default)" : ` (the default is ${DEFAULT_OVERSTAGED}%)`}`);
    out.push(`Sorted by ${{ item: "material", total: "on-hand", lineShare: "line-side share", severity: "flag" }[sortKey]}, ${sortDir === "asc" ? "ascending" : "descending"}`);
    return out;
  };

  const exportRows = async (data, which) => {
    const XLSX = await import("xlsx");
    const head = ["Material", "Item", "Description", "UoM", "Total on-hand", ...BUCKETS.map((b) => b.label), "Line-side share %", "Flag", "Why", "Triage"];
    const body = data.map((i) => [
      i.mat, i.item, i.desc, i.uom, Math.round(i.total),
      ...BUCKETS.map((b) => Math.round(i.q[b.key])),
      Number((i.lineShare * 100).toFixed(1)),
      SEV[i.severity].label, i.reason,
      DISP_LABEL[disposition[keyOf(i)]] || (i.severity === "ok" ? "" : "Open"),
    ]);
    writeWorkbook(XLSX, {
      slug: SLUG, which, tool: NAME,
      what: which === "full"
        ? `Every item in the extract (${items.length}), with its stock by bucket, line-side share, flag, the reason for it, and the triage decision made in this tab.`
        : `The ${count(data.length, "item")} on screen when it was exported, with their stock by bucket, line-side share, flag, reason and triage decision.`,
      source: source ? `${source.name}, ${source.detail}` : "Nothing loaded",
      shown: which === "full" ? [`Overstaged threshold: ${threshold}%`] : shown(),
      sheets: [{ name: "Staging", rows: [head, ...body] }],
    });
  };

  const hasData = rows.length > 0;
  const reload = triage.done > 0
    ? <ConfirmButton label="Reload sample" icon={<Layers />} effect={`Reloads the sample and clears the ${count(triage.done, "triage decision")} made in this tab.`} confirmLabel="Reload and clear" onConfirm={loadSample} />
    : <button type="button" className="np-btn" onClick={loadSample}><Layers />Reload sample</button>;

  const pickerItems = items.filter((i) => {
    const q = comboQuery.trim().toLowerCase();
    if (!q) return true;
    return i.item.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || (i.mat || "").includes(q);
  });

  return (
    <>
      {/* Where the data came from: the block under the header. */}
      <div className="np-part">
        <div className="np-ident">
          <h2>{NORTHPOINT.company} · stock by location</h2>
          <p>{source
            ? <>Loaded <b>{source.name}</b> at {time(source.at)}, {source.detail}. {figure(summary.count, { zeroMeans: "zero" })} items in {figure(summary.bins, { zeroMeans: "zero" })} bins.</>
            : <>Nothing is loaded. Reload the sample, or upload a stock-by-location export.</>}</p>
        </div>
        <div className="np-row">
          {reload}
          <button type="button" className="np-btn" onClick={() => fileRef.current?.click()}><Upload />Upload export</button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} style={{ display: "none" }} />
          {hasData && (
            <ConfirmButton label="Clear data" icon={<Trash />}
              effect={`Clears the ${count(summary.count, "item")} on screen${triage.done ? ` and ${count(triage.done, "triage decision")}` : ""}. Nothing was saved anywhere, so nothing else changes.`}
              confirmLabel="Clear it" onConfirm={clearData} />
          )}
        </div>
      </div>

      {notice && (
        <NoticeBanner tag={notice.tag} tone={notice.tone} reasons={notice.reasons} onDismiss={() => setNotice(null)}>
          {notice.text}
        </NoticeBanner>
      )}

      {!hasData ? (
        <div className="np-empty">
          <Layers size={28} aria-hidden="true" style={{ color: T.textMuted }} />
          <p style={{ marginTop: 8, color: T.text }}>No data is loaded.</p>
          <p>Press <b>Reload sample</b> for {NORTHPOINT.company}, or <b>Upload export</b> with the columns Material, Item, Description, UoM, Location, Bin and Qty.</p>
        </div>
      ) : (
        <>
          <Intro>
            Of <b>{figure(summary.count, { zeroMeans: "zero" })}</b> items across {figure(summary.bins, { zeroMeans: "zero" })} bins,{" "}
            <b>{figure(summary.critical, { zeroMeans: "zero" })}</b> carry an integrity error a total-only view would hide and{" "}
            <b>{figure(summary.warn, { zeroMeans: "zero" })}</b> are overstaged, with {threshold}% or more of their stock line-side.{" "}
            {triage.flagged > 0 && <>{figure(triage.done, { zeroMeans: "zero" })} of {figure(triage.flagged, { zeroMeans: "zero" })} flags are triaged.</>}
          </Intro>
          <HowItWorks points={[
            { lead: "Every bin is checked on its own.", text: `A bin holding ${fmt(IMPOSSIBLE_CEILING)} units or more, or ${IMPOSSIBLE_MULTIPLE}× its item's median bin, is impossible; a bin below zero is negative. Either one is an integrity error, found per bin so a positive bin cannot hide it inside the total.` },
            { lead: "Line-side share is one division.", text: "Line-side units divided by the item's total on-hand across every bucket. Hover a share to see both figures." },
            { lead: "Overstaged means the threshold was reached.", text: `An item with no integrity error whose line-side share is at or above the threshold (default ${DEFAULT_OVERSTAGED}%, adjustable above the grid).` },
            { lead: "The bar reads in flow order.", text: "Line-side in brass, then line feed, supermarket, replenishment and warehouse in steel, the way material moves toward the line." },
            { lead: "Triage stays in this tab.", text: "Accept, Reject or Ignore records a decision here and in both exports; wired to connectors in a delivered copy, each posts the fix, tunes the rule or defers the item." },
          ]} />

          <AnswerCards>
            <AnswerCard label="Items" value={figure(summary.count, { zeroMeans: "zero" })}>
              In this extract, held in {figure(summary.bins, { zeroMeans: "zero" })} bins.
            </AnswerCard>
            <AnswerCard label="Integrity errors" value={figure(summary.critical, { zeroMeans: "zero" })} tone={summary.critical ? "bad" : "good"}
              pressed={sevFilter === "critical"} onClick={() => setSevFilter((f) => (f === "critical" ? "all" : "critical"))}
              title="Press to show only these items; press again to show all.">
              {summary.critical ? "Items whose total cannot be trusted until a bin is recounted." : "No bin is impossible or negative."}
            </AnswerCard>
            <AnswerCard label="Overstaged" value={figure(summary.warn, { zeroMeans: "zero" })} tone={summary.warn ? "warn" : "good"}
              pressed={sevFilter === "warn"} onClick={() => setSevFilter((f) => (f === "warn" ? "all" : "warn"))}
              title="Press to show only these items; press again to show all.">
              Items with {threshold}% or more of their stock at point of use.
            </AnswerCard>
            <AnswerCard label="Total on-hand" value={fmt(summary.totalOnHand)}>
              Units across every bin: what a total-only view reports, errors netted in.
            </AnswerCard>
          </AnswerCards>

          <div className="np-gridwrap">
            <div className="np-gridhead">
              <div className="np-row" style={{ position: "relative" }}>
                <button type="button" className="np-btn" aria-expanded={comboOpen} onClick={() => setComboOpen((o) => !o)}>
                  <Search />{picked.length ? `${picked.length} material${picked.length > 1 ? "s" : ""} picked` : "All materials"}<ChevronDown />
                </button>
                {comboOpen && (
                  <div className="np-panel" style={{ position: "absolute", top: "100%", left: 0, zIndex: 20, width: "min(300px, calc(100vw - 32px))", margin: "4px 0 0", padding: 8 }}>
                    <input className="np-in" autoFocus value={comboQuery} onChange={(e) => setComboQuery(e.target.value)}
                      placeholder="Type to filter, tick to pick" aria-label="Filter materials" style={{ width: "100%", marginBottom: 6 }} />
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                      {pickerItems.map((i) => {
                        const k = keyOf(i);
                        const on = picked.includes(k);
                        return (
                          <label key={k} style={{ display: "flex", gap: 8, alignItems: "center", padding: "3px 4px", cursor: "pointer", fontSize: 12.5 }}>
                            <input type="checkbox" checked={on} onChange={() => setPicked((p) => (on ? p.filter((x) => x !== k) : [...p, k]))} />
                            <span className="np-num" style={{ color: T.text }}>{i.mat || i.item}</span>
                            <span style={{ color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.desc}</span>
                          </label>
                        );
                      })}
                    </div>
                    {picked.length > 0 && <button type="button" className="np-btn quiet" onClick={() => setPicked([])}>Clear the picks</button>}
                  </div>
                )}
                <select className="np-in" value={sevFilter} onChange={(e) => setSevFilter(e.target.value)} aria-label="Show which flags">
                  <option value="all">All flags ({items.length})</option>
                  <option value="critical">Integrity only ({summary.critical})</option>
                  <option value="warn">Overstaged only ({summary.warn})</option>
                  <option value="ok">Clear only ({items.length - summary.critical - summary.warn})</option>
                </select>
                <NumberField label="Overstaged at" value={threshold} min={1} max={100} suffix="%" onCommit={setThreshold} width="4em" />
                <label><input type="checkbox" checked={hideTriaged} onChange={(e) => setHideTriaged(e.target.checked)} /> Hide triaged</label>
                <button type="button" className="np-btn quiet" onClick={resetView}>Reset view</button>
              </div>
              <span style={{ marginLeft: "auto" }}>
                Showing <span className="np-num">{view.length}</span> of <span className="np-num">{items.length}</span> items
                {triage.flagged > 0 && <> · triaged <span className="np-num">{triage.done}</span> of <span className="np-num">{triage.flagged}</span> flagged</>}
              </span>
              <ExportPair fullCount={items.length} filteredCount={view.length} noun="items"
                onFull={() => exportRows(items, "full")} onFiltered={() => exportRows(view, "filtered")} />
            </div>

            <div className="np-scroll">
              <table className="np-grid" ref={tableRef} style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th className="pin">{sortTh("item", "Material")}</th>
                    <th className="pin">Description</th>
                    <th>Distribution<Help label="Distribution" text={HELP.distribution} /></th>
                    <th className="r">{sortTh("total", "On-hand")}<Help label="On-hand" text={HELP.onhand} /></th>
                    <th className="r">{sortTh("lineShare", "Line-side share")}<Help label="Line-side share" text={HELP.share} /></th>
                    <th>{sortTh("severity", "Flag")}<Help label="Flag" text={HELP.flag} /></th>
                    <th className="c">Triage<Help label="Triage" text={HELP.triage} /></th>
                  </tr>
                </thead>
                <tbody>
                  {view.map((it) => {
                    const s = SEV[it.severity];
                    const open = expanded === it.item;
                    const disp = disposition[keyOf(it)];
                    return (
                      <React.Fragment key={it.item}>
                        <tr className={`is-row${disp ? " is-done" : ""}`} aria-expanded={open} onClick={() => setExpanded(open ? null : it.item)}>
                          <td className="pin">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <Dot tone={s.tone} title={s.label} />
                              {open ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
                              <span className="code">{it.mat || it.item}</span>
                            </span>
                            {it.mat && <span className="sub np-num" style={{ paddingLeft: 33 }}>{it.item}</span>}
                          </td>
                          <td className="pin clip" title={it.desc}>{it.desc}</td>
                          <td style={{ minWidth: 200 }}><FlowBar q={it.q} total={it.total} /></td>
                          <td className="r num" title={BUCKETS.map((b) => `${b.label}: ${fmt(it.q[b.key])}`).join("  ·  ")}>{fmt(it.total)}</td>
                          <td className="r num" title={`${fmt(it.q.LINE)} line-side ÷ ${fmt(it.total)} total on-hand = ${pct(it.lineShare)}`}>{pct(it.lineShare)}</td>
                          <td title={it.reason}>
                            {it.severity === "ok"
                              ? <Pill tone="quiet">{s.label}</Pill>
                              : <Pill tone={s.tone} icon={<s.Icon size={11} aria-hidden="true" />}>{s.label}</Pill>}
                          </td>
                          <td className="c" onClick={(e) => e.stopPropagation()}>
                            {it.severity === "ok" ? (
                              <span className="np-muted" aria-label="Nothing to triage">—</span>
                            ) : (
                              <span style={{ display: "inline-flex", gap: 4 }}>
                                <TriageBtn active={disp === "accepted"} tone="accept" label={`Accept the flag on ${keyOf(it)}: post the fix (wired)`} onClick={() => setDisp(it, "accepted")}><Check /></TriageBtn>
                                <TriageBtn active={disp === "rejected"} tone="reject" label={`Reject the flag on ${keyOf(it)}: a false positive, tune the rule (wired)`} onClick={() => setDisp(it, "rejected")}><X /></TriageBtn>
                                <TriageBtn active={disp === "ignored"} tone="ignore" label={`Ignore the flag on ${keyOf(it)}: defer to the next review`} onClick={() => setDisp(it, "ignored")}><Clock /></TriageBtn>
                              </span>
                            )}
                          </td>
                        </tr>
                        {open && (
                          <tr className="detail">
                            <td colSpan={7}>
                              <div className="np-detail" style={{ padding: "4px 0 6px 20px" }}>
                                <p style={{ fontSize: 12.5, color: T.text, marginBottom: 6 }}><b>Bins for {it.mat || it.item}</b> — {it.reason}</p>
                                <table style={{ borderCollapse: "collapse", fontSize: 12.5, width: "100%" }}>
                                  <thead>
                                    <tr style={{ color: T.textMuted, textAlign: "left" }}>
                                      <th style={{ padding: "3px 12px 3px 0", fontWeight: 600 }}>Bucket</th>
                                      <th style={{ padding: "3px 12px 3px 0", fontWeight: 600 }}>Bin</th>
                                      <th style={{ padding: "3px 12px 3px 0", fontWeight: 600, textAlign: "right" }}>Qty</th>
                                      <th style={{ padding: "3px 0", fontWeight: 600 }}>To act on</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[...it.bins]
                                      .sort((a, b) => BUCKET_KEYS.indexOf(a.location) - BUCKET_KEYS.indexOf(b.location))
                                      .map((b, idx) => (
                                        <tr key={idx} style={{ color: b.reasons.length ? T.bad : T.textSec }}>
                                          <td style={{ padding: "3px 12px 3px 0" }}>{BUCKET_LABEL[b.location]}</td>
                                          <td style={{ padding: "3px 12px 3px 0" }} className="np-num">{b.bin}</td>
                                          <td style={{ padding: "3px 12px 3px 0", textAlign: "right" }} className="np-num">{fmt(b.qty)}</td>
                                          <td style={{ padding: "3px 0" }}>{b.reasons.length ? b.reasons.join(" and ") : ""}</td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {view.length === 0 && (
                    <tr className="detail">
                      <td colSpan={7} className="np-empty">No items match these filters. Press Reset view, or clear the material picks.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Legend lead="Flow order:" items={BUCKETS.map((b) => ({ label: b.label, note: b.note, swatch: b.color }))} />
            <Legend lead="Flags:" items={[
              { label: "Integrity: a bin is impossible or negative", tone: "bad" },
              { label: "Overstaged: line-side share reached the threshold", tone: "warn" },
              { label: "Clear: neither", tone: "ok" },
            ]} />
          </div>
        </>
      )}
    </>
  );
}

export default function StagingTriageConsole() {
  return (
    <HouseFrame slug={SLUG} name={NAME} scope={SCOPE} manual={MANUAL}>
      <Console />
    </HouseFrame>
  );
}
