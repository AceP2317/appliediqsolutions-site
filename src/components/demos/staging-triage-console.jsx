import React, { useState, useMemo, useRef, useEffect } from "react";
// xlsx is loaded lazily inside the upload + export handlers, keeping its
// ~480 KB chunk off the initial bundle until the visitor uploads or exports.
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  RotateCcw,
  Search,
  Upload,
  Layers,
  Info,
  Check,
  X,
  Clock,
  Zap,
  Filter,
  Trash2,
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

// ---- Location buckets, in material-flow order ----------------------------
const BUCKETS = [
  { key: "LINE", label: "Line-Side", note: "Point of use at the assembly line", bar: "bg-teal-500" },
  { key: "FEED", label: "Line Feed", note: "Production-supply staging bins", bar: "bg-sky-400" },
  { key: "MART", label: "Supermarket", note: "Buffered pick face", bar: "bg-indigo-400" },
  { key: "REPL", label: "Replenishment", note: "Refill loop in motion", bar: "bg-violet-400" },
  { key: "WHSE", label: "Warehouse", note: "Bulk resting storage", bar: "bg-slate-300" },
];
const BUCKET_KEYS = BUCKETS.map((b) => b.key);
const BUCKET_LABEL = Object.fromEntries(BUCKETS.map((b) => [b.key, b.label]));

// ---- Flag rules (the transparent triage logic) ---------------------------
const IMPOSSIBLE_CEILING = 100_000_000; // any single bin at/above this is non-physical
const IMPOSSIBLE_MULTIPLE = 1000; // ...or >= 1000x this item's median bin
const DEFAULT_OVERSTAGED = 50; // % of total on-hand sitting line-side

// ---- Number formatting: grouped integers, never exponential --------------
const fmt = (n) => {
  if (n == null || Number.isNaN(n)) return "—";
  const r = Math.round(n);
  return r.toLocaleString("en-US");
};
const pct = (n) => (n == null || Number.isNaN(n) ? "—" : `${(n * 100).toFixed(1)}%`);
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
  const rng = mulberry32(42);
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
const SEV = {
  critical: { label: "Integrity", text: "text-red-700", chip: "bg-red-50 text-red-700 ring-red-200", Icon: AlertOctagon },
  warn: { label: "Overstaged", text: "text-amber-700", chip: "bg-amber-50 text-amber-700 ring-amber-200", Icon: AlertTriangle },
  ok: { label: "Clear", text: "text-emerald-700", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", Icon: CheckCircle2 },
};

const LOGIC = [
  {
    sev: "critical",
    name: "Impossible quantity",
    what: "A single bin holds a physically impossible amount.",
    how: `Any bin at/above ${fmt(IMPOSSIBLE_CEILING)} units, or ≥ ${IMPOSSIBLE_MULTIPLE}× this item's median bin.`,
    action: "Treat as a count/posting error before trusting any total for this item.",
  },
  {
    sev: "critical",
    name: "Negative stock",
    what: "A bin shows stock below zero.",
    how: "Any bin quantity < 0. Caught per-bin so a positive bin can't mask it in the total.",
    action: "Reconcile the bin; a negative paired with an impossible positive is a swapped or mis-keyed count.",
  },
  {
    sev: "warn",
    name: "Overstaged line-side",
    what: "Too much of the item's total is sitting at point of use.",
    how: "Line-Side share of total on-hand ≥ the threshold (adjustable, default 50%).",
    action: "Pull back excess to the supermarket; line-side space and FIFO are at risk.",
  },
];

// ---- KPI tile ------------------------------------------------------------
function Kpi({ label, value, tone }) {
  const toneCls =
    tone === "critical" ? "text-red-700" : tone === "warn" ? "text-amber-700" : "text-slate-900";
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}

// ---- Flow distribution bar -----------------------------------------------
function FlowBar({ q, total }) {
  if (total <= 0)
    return <div className="h-2.5 w-full rounded-full bg-slate-100" title="No positive on-hand" />;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label="stock distribution by location">
      {BUCKETS.map((b) => {
        const v = Math.max(q[b.key], 0);
        const w = (v / total) * 100;
        if (w <= 0) return null;
        return (
          <div
            key={b.key}
            className={b.bar}
            style={{ width: `${w}%` }}
            title={`${b.label}: ${fmt(v)} (${pct(v / total)})`}
          />
        );
      })}
    </div>
  );
}

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

function ActBtn({ active, tone, title, onClick, children }) {
  const tones = {
    accept: active ? "bg-emerald-600 text-white ring-emerald-600" : "text-emerald-700 ring-emerald-200 hover:bg-emerald-50",
    reject: active ? "bg-red-600 text-white ring-red-600" : "text-red-700 ring-red-200 hover:bg-red-50",
    ignore: active ? "bg-slate-600 text-white ring-slate-600" : "text-slate-600 ring-slate-200 hover:bg-slate-100",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex h-6 w-6 items-center justify-center rounded ring-1 ring-inset transition ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export default function StagingTriageConsole() {
  const [rows, setRows] = useState([]);
  const [threshold, setThreshold] = useState(DEFAULT_OVERSTAGED);
  const [sevFilter, setSevFilter] = useState("all");
  const [sortKey, setSortKey] = useState("lineShare");
  const [sortDir, setSortDir] = useState("desc");
  const [expanded, setExpanded] = useState(null);
  const [showLogic, setShowLogic] = useState(false);
  const [fileNote, setFileNote] = useState("");
  const [picked, setPicked] = useState([]);
  const [comboOpen, setComboOpen] = useState(false);
  const [comboQuery, setComboQuery] = useState("");
  const [hideTriaged, setHideTriaged] = useState(false);
  const [disposition, setDisposition] = useState({});
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);
  const toastTimer = useRef(null);
  const narrow = useIsNarrow();

  const items = useMemo(() => aggregate(rows, threshold), [rows, threshold]);

  const summary = useMemo(() => {
    const critical = items.filter((i) => i.severity === "critical").length;
    const warn = items.filter((i) => i.severity === "warn").length;
    const totalOnHand = items.reduce((s, i) => s + Math.max(i.total, 0), 0);
    return { count: items.length, critical, warn, totalOnHand };
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
      if (sortKey === "item") return dir * a.item.localeCompare(b.item);
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

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "item" ? "asc" : "desc");
    }
  };

  const arrow = (k) =>
    sortKey !== k ? null : sortDir === "asc" ? (
      <ChevronUp className="ml-0.5 inline h-3 w-3" />
    ) : (
      <ChevronDown className="ml-0.5 inline h-3 w-3" />
    );

  const loadSample = () => {
    setRows(SAMPLE_ROWS);
    setFileNote("Sample dataset · Northpoint Manufacturing (synthetic)");
    setDisposition({});
    setPicked([]);
    setComboQuery("");
    setExpanded(null);
  };

  // Boot populated like the other six demos — the sample loads on mount, so a
  // visitor lands on a working console instead of an empty state. Upload still
  // replaces it; "Load sample data" still resets to it.
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
    setFileNote("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const CONNECTOR_MSG = {
    accepted: "Accepted — wired to a connector, this posts the correction back.",
    rejected: "Rejected — wired to a connector, this logs a false positive and tunes the rule.",
    ignored: "Ignored — wired to a connector, this defers the item to the next review.",
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
    setToast(cleared ? "Disposition cleared." : CONNECTOR_MSG[val]);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
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
        setRows(norm);
        setFileNote(`${f.name} · ${norm.length} rows`);
        setDisposition({});
        setPicked([]);
        setComboQuery("");
        setExpanded(null);
      } catch (err) {
        setFileNote("Could not read that file — expected columns: Item, Description, UoM, Location, Bin, Qty.");
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const exportRows = async (data, name) => {
    const XLSX = await import("xlsx");
    const flat = data.map((i) => ({
      Material: i.mat,
      Item: i.item,
      Description: i.desc,
      UoM: i.uom,
      "Total on-hand": Math.round(i.total),
      ...Object.fromEntries(BUCKETS.map((b) => [b.label, Math.round(i.q[b.key])])),
      "Line-Side %": Number((i.lineShare * 100).toFixed(1)),
      Flag: SEV[i.severity].label,
      Disposition: disposition[keyOf(i)] || (i.severity === "ok" ? "" : "open"),
    }));
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staging");
    XLSX.writeFile(wb, name);
  };

  const hasData = rows.length > 0;

  return (
    <div className="min-h-screen w-full bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-teal-600" />
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Staging Triage Console</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Surfaces stock concentrated at point of use, flags the physical-integrity errors a
            total-only view would hide, and turns each one into a triaged decision — ready to action
            through connectors.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Built by <span className="font-medium text-slate-700">Ian Provencher</span>
            <span className="mx-1.5 text-slate-300">·</span>
            Portfolio demo, synthetic data
          </p>
        </header>

        {/* Load controls */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <button
            onClick={loadSample}
            className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            <Layers className="h-4 w-4" /> Load sample data
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <Upload className="h-4 w-4" /> Upload export
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} className="hidden" />
          {hasData && (
            <button
              onClick={clearData}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              <Trash2 className="h-4 w-4" /> Clear data
            </button>
          )}
          {fileNote && <span className="text-xs text-slate-500">{fileNote}</span>}
        </div>

        {!hasData ? (
          // Empty state
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Layers className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-base font-medium text-slate-800">Load a dataset to begin</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Hit <span className="font-medium text-teal-700">Load sample data</span> for a fictional
              manufacturer, or upload a stock-by-location export with columns Material, Item,
              Description, UoM, Location, Bin, Qty.
            </p>
          </div>
        ) : (
          <>
            {/* KPI strip */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Items" value={fmt(summary.count)} />
              <Kpi label="Integrity flags" value={fmt(summary.critical)} tone={summary.critical ? "critical" : "ok"} />
              <Kpi label="Overstaged" value={fmt(summary.warn)} tone={summary.warn ? "warn" : "ok"} />
              <Kpi label="Total on-hand" value={fmt(summary.totalOnHand)} />
            </div>

            {/* Controls */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="relative" style={{ width: narrow ? "100%" : undefined }}>
                <button
                  onClick={() => setComboOpen((o) => !o)}
                  className="inline-flex w-56 items-center justify-between rounded-md border border-slate-300 bg-white py-1.5 pl-3 pr-2 text-sm text-slate-700 hover:bg-slate-50 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  style={{ width: narrow ? "100%" : undefined, minWidth: narrow ? 0 : undefined }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Filter className="h-4 w-4 text-slate-400" />
                    {picked.length ? `${picked.length} material${picked.length > 1 ? "s" : ""} selected` : "All materials"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {comboOpen && (
                  <div
                    className="absolute z-20 mt-1 w-72 rounded-md border border-slate-200 bg-white p-2 shadow-lg"
                    style={{ width: narrow ? "100%" : undefined, maxWidth: narrow ? "100%" : undefined }}
                  >
                    <div className="relative mb-2">
                      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        autoFocus
                        value={comboQuery}
                        onChange={(e) => setComboQuery(e.target.value)}
                        placeholder="Type to filter, tick to pin"
                        className="w-full rounded border border-slate-300 py-1.5 pl-7 pr-2 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {items
                        .filter((i) => {
                          const q = comboQuery.trim().toLowerCase();
                          if (!q) return true;
                          return i.item.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || (i.mat || "").includes(q);
                        })
                        .map((i) => {
                          const k = keyOf(i);
                          const on = picked.includes(k);
                          return (
                            <label key={k} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={on}
                                onChange={() => setPicked((p) => (on ? p.filter((x) => x !== k) : [...p, k]))}
                                className="h-3.5 w-3.5 accent-teal-600"
                              />
                              <span className="font-mono text-slate-700">{i.mat || i.item}</span>
                              <span className="truncate text-slate-400">{i.desc}</span>
                            </label>
                          );
                        })}
                    </div>
                    {picked.length > 0 && (
                      <button
                        onClick={() => setPicked([])}
                        className="mt-1.5 w-full rounded px-1.5 py-1 text-left text-xs font-medium text-teal-700 hover:bg-teal-50"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                )}
              </div>
              <select
                value={sevFilter}
                onChange={(e) => setSevFilter(e.target.value)}
                className="rounded-md border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">All flags</option>
                <option value="critical">Integrity only</option>
                <option value="warn">Overstaged only</option>
                <option value="ok">Clear only</option>
              </select>
              <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white py-1.5 pl-2.5 pr-3 text-sm">
                <span className="text-slate-500">Overstaged ≥</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-14 bg-transparent text-right font-mono tabular-nums focus:outline-none"
                />
                <span className="text-slate-500">%</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={hideTriaged}
                  onChange={(e) => setHideTriaged(e.target.checked)}
                  className="h-3.5 w-3.5 accent-teal-600"
                />
                Hide triaged
              </label>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={resetView}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <RotateCcw className="h-4 w-4" /> Reset view
                </button>
                <button
                  onClick={() => exportRows(view, "staging-filtered.xlsx")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Download className="h-4 w-4" /> Export filtered
                </button>
                <button
                  onClick={() => exportRows(items, "staging-all.xlsx")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Download className="h-4 w-4" /> Export all
                </button>
              </div>
            </div>

            {/* Logic panel */}
            <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => setShowLogic((s) => !s)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {showLogic ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Info className="h-4 w-4 text-slate-400" />
                How the flags work
              </button>
              {showLogic && (
                <div className="grid gap-3 border-t border-slate-100 px-4 py-4 sm:grid-cols-3">
                  {LOGIC.map((l) => {
                    const s = SEV[l.sev];
                    return (
                      <div key={l.name} className="rounded-md border border-slate-200 p-3">
                        <div className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${s.text}`}>
                          <s.Icon className="h-4 w-4" /> {l.name}
                        </div>
                        <dl className="space-y-1.5 text-xs text-slate-600">
                          <div><dt className="font-medium text-slate-500">What</dt><dd>{l.what}</dd></div>
                          <div><dt className="font-medium text-slate-500">How</dt><dd>{l.how}</dd></div>
                          <div><dt className="font-medium text-slate-500">Do</dt><dd>{l.action}</dd></div>
                        </dl>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Connector note */}
            <div className="mb-2 flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
              <Zap className="h-3.5 w-3.5 flex-shrink-0 text-teal-600" />
              <span>
                Triage each flag with Accept / Reject / Ignore. Decisions are captured in-session here —
                wired to connectors, they post the fix, tune the rule, or defer the item automatically.
              </span>
            </div>

            {/* Result count + hover hint */}
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing <span className="font-mono tabular-nums">{view.length}</span> of{" "}
                <span className="font-mono tabular-nums">{items.length}</span> items
                {triage.flagged > 0 && (
                  <>
                    {" · "}triaged <span className="font-mono tabular-nums">{triage.done}</span> of{" "}
                    <span className="font-mono tabular-nums">{triage.flagged}</span> flagged
                  </>
                )}
              </span>
              <span className="hidden sm:inline">Hover any percentage, total, or flag to see how it was derived</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2.5 font-medium">
                      <button onClick={() => toggleSort("item")} className="inline-flex items-center hover:text-slate-700">Item{arrow("item")}</button>
                    </th>
                    <th className="px-3 py-2.5 font-medium">Distribution (flow order)</th>
                    <th className="px-3 py-2.5 text-right font-medium">
                      <button onClick={() => toggleSort("total")} className="inline-flex items-center hover:text-slate-700">On-hand{arrow("total")}</button>
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium">
                      <button onClick={() => toggleSort("lineShare")} className="inline-flex items-center hover:text-slate-700">Line-Side{arrow("lineShare")}</button>
                    </th>
                    <th className="px-3 py-2.5 font-medium">
                      <button onClick={() => toggleSort("severity")} className="inline-flex items-center hover:text-slate-700">Flag{arrow("severity")}</button>
                    </th>
                    <th className="px-3 py-2.5 text-center font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {view.map((it) => {
                    const s = SEV[it.severity];
                    const open = expanded === it.item;
                    const disp = disposition[keyOf(it)];
                    return (
                      <React.Fragment key={it.item}>
                        <tr
                          onClick={() => setExpanded(open ? null : it.item)}
                          className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${disp ? "opacity-55" : ""}`}
                        >
                          <td className="px-3 py-2.5 align-top">
                            <div className="flex items-start gap-1.5">
                              {open ? <ChevronDown className="mt-0.5 h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-slate-400" />}
                              <div>
                                <div className="font-mono font-medium text-slate-800">
                                  {it.mat || it.item}
                                  {it.mat && <span className="ml-2 text-xs font-normal text-slate-400">{it.item}</span>}
                                </div>
                                <div className="text-xs text-slate-500">{it.desc}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 align-middle" style={{ minWidth: 220 }}>
                            <FlowBar q={it.q} total={it.total} />
                          </td>
                          <td
                            className="px-3 py-2.5 text-right align-middle font-mono tabular-nums text-slate-700"
                            title={BUCKETS.map((b) => `${b.label}: ${fmt(it.q[b.key])}`).join("   ·   ")}
                          >
                            {fmt(it.total)}
                          </td>
                          <td
                            className="px-3 py-2.5 text-right align-middle font-mono tabular-nums font-medium"
                            title={`${fmt(it.q.LINE)} line-side ÷ ${fmt(it.total)} total on-hand = ${pct(it.lineShare)}`}
                          >
                            {pct(it.lineShare)}
                          </td>
                          <td className="px-3 py-2.5 align-middle">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.chip}`}
                              title={it.reason}
                            >
                              <s.Icon className="h-3 w-3" /> {s.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                            {it.severity === "ok" ? (
                              <div className="text-center text-slate-300">—</div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <ActBtn active={disp === "accepted"} tone="accept" title="Accept — post the fix (wired)" onClick={() => setDisp(it, "accepted")}><Check className="h-3.5 w-3.5" /></ActBtn>
                                <ActBtn active={disp === "rejected"} tone="reject" title="Reject — false positive; tune the rule (wired)" onClick={() => setDisp(it, "rejected")}><X className="h-3.5 w-3.5" /></ActBtn>
                                <ActBtn active={disp === "ignored"} tone="ignore" title="Ignore — defer to next review" onClick={() => setDisp(it, "ignored")}><Clock className="h-3.5 w-3.5" /></ActBtn>
                              </div>
                            )}
                          </td>
                        </tr>
                        {open && (
                          <tr className="border-b border-slate-100 bg-slate-50/60">
                            <td colSpan={6} className="px-3 py-3">
                              <div className="rounded-md border border-slate-200 bg-white p-3">
                                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                                  Bins to act on — {it.item}
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-left text-slate-400">
                                        <th className="py-1 pr-4 font-medium">Bucket</th>
                                        <th className="py-1 pr-4 font-medium">Bin</th>
                                        <th className="py-1 pr-4 text-right font-medium">Qty</th>
                                        <th className="py-1 font-medium">Note</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[...it.bins]
                                        .sort((a, b) => BUCKET_KEYS.indexOf(a.location) - BUCKET_KEYS.indexOf(b.location))
                                        .map((b, idx) => (
                                          <tr key={idx} className={b.reasons.length ? "text-red-700" : "text-slate-600"}>
                                            <td className="py-1 pr-4">{BUCKET_LABEL[b.location]}</td>
                                            <td className="py-1 pr-4 font-mono">{b.bin}</td>
                                            <td className="py-1 pr-4 text-right font-mono tabular-nums">{fmt(b.qty)}</td>
                                            <td className="py-1">
                                              {b.reasons.includes("impossible") && (
                                                <span className="mr-2 inline-flex items-center gap-1"><AlertOctagon className="h-3 w-3" />impossible</span>
                                              )}
                                              {b.reasons.includes("negative") && (
                                                <span className="inline-flex items-center gap-1"><AlertOctagon className="h-3 w-3" />negative</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {view.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">
                        No items match this filter. Clear the material selection or change the flag filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Flow order:</span>
              {BUCKETS.map((b) => (
                <span key={b.key} className="inline-flex items-center gap-1.5" title={b.note}>
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${b.bar}`} /> {b.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-teal-300" />
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
