// =============================================================================
// Northpoint BOM Explorer — portfolio demo
// Built by Ian Provencher
//
// Flexible field-qualified search, where-used reverse lookup, and multi-level
// BOM-tree exploration over a manufacturing bill-of-materials extract. The
// signature capability is per-finished-good-unit quantity: multiply each
// component quantity down its parent chain and sum across every usage path.
//
// Public demo. Synthetic self-loading data — no real company, plant, or part.
// Northpoint Manufacturing is fictional; persistence and write-back are the
// connector story, deliberately in-session only here.
// =============================================================================

import React, { useState, useMemo, useRef, useEffect, useContext, createContext, useCallback } from "react";
// xlsx is loaded lazily inside exportRows() so its ~480 KB chunk stays off the
// initial bundle — export is a secondary action.
import {
  Search, Boxes, Network, Download, Info, Sun, Moon, RefreshCw, AlertTriangle,
  Layers, X, ChevronRight, CornerDownRight, Cpu, HelpCircle, ListTree,
} from "lucide-react";

// =============================================================================
// CONFIG — single editable block. Re-skin the whole demo from here.
// =============================================================================
const CONFIG = {
  company: "Northpoint Manufacturing",
  product: "BOM Explorer",
  seed: 42,
  sites: ["1710", "1720"],            // synthetic site codes (SAP sample-plant shape)
  siteNames: { "1710": "Riverside", "1720": "Lakeside" },
  maxLevel: 4,                        // explosion depth ceiling (display guard)
};

// =============================================================================
// GLOSSARY — terms a non-specialist won't know. Backs the Q tooltip layer.
// =============================================================================
const GLOSSARY = {
  "Finished Good": "A top-level sellable product (FG). It is the parent the explosion is normalized to — never appears as a component of anything else in this extract.",
  "Component": "The material at one BOM position. A few positions carry no component number — they are document / text items (a drawing or spec sheet), not parts.",
  "Level": "Depth in the BOM tree. Level 1 = direct children of the finished good; level 2 = children of those, and so on. Long-format order encodes the tree — a row's parent is the nearest preceding row one level shallower.",
  "Component Qty": "Quantity of this component per ONE unit of its DIRECT parent — not per finished good. Negative quantities are legitimate (by-product / recovered-material credit) and flagged in red.",
  "Per-unit qty": "Computed, not in the extract: quantity per one finished-good unit. Obtained by multiplying Component Qty down the parent chain, then summing across every usage path the component takes in that FG.",
  "Where-used": "Reverse lookup. For a chosen component: every finished good it appears in, each usage path, and the per-FG-unit quantity — kept separate per site, because the same part can carry different quantities in different sites.",
  "Procurement Type": "How the material is sourced. E = produced in-house, F = purchased externally, X = both possible. Blank = a document / text item, not a procured part.",
  "MRP Controller": "The planner code responsible for ordering or scheduling this material (e.g. M10, M20, M30).",
  "Phantom": "A phantom assembly (PII = X, special procurement 50). It exists to structure the BOM but is never stocked or built as its own object — its children are pulled straight into the parent. Flagged so planners don't chase stock for it.",
  "Assembly": "An item that is itself a parent of other items (Asm = X) — it explodes further. Produced in-house and carries its own sub-tree.",
  "Special Procurement": "A key that overrides default sourcing. 50 = phantom assembly; other numeric keys route to stock-transfer, subcontract, or specific source plants.",
  "IRC": "An item-relevance flag carried on the extract (X / blank). Marks positions relevant to a downstream relevance check.",
  "Spare Part": "The service / spare-part material number cross-referenced to this component, where one exists. Often zero-padded — searchable with or without leading zeros.",
  "UoM": "Base unit of measure of the quantity (PC, KG, G, M). Quantities in different units are never summed together.",
  "Usage path": "The chain of parents from the finished good down to a component instance — e.g. Drill → Gearbox assembly → Screw. A component can take several paths in one FG; each contributes to the per-unit quantity.",
};

const SEARCH_FIELDS_HELP = [
  ["material / fg", "finished-good material number"],
  ["fgdesc", "finished-good description"],
  ["comp / component", "component material number"],
  ["desc / description", "component description"],
  ["level / lvl", "level — supports level:2, level:2-4, level:>2"],
  ["item / pos", "BOM item position"],
  ["mrp", "MRP controller"],
  ["proc", "procurement type (E / F / X)"],
  ["uom", "base unit of measure"],
  ["plant / site", "1710 or 1720"],
  ["phantom / pii", "phantom item indicator"],
  ["asm / assembly", "assembly indicator"],
  ["irc", "IRC flag"],
  ["spare", "spare-part reference"],
  ["sproc / special", "special procurement key"],
  ["qty", "component quantity — supports qty:4, qty:<0, qty:>=10, qty:1-5"],
];

// =============================================================================
// THEME — vivid slate base + cyan / yellow / green / orange / red accents.
// Deliberately NOT a corporate grayscale theme: this is a public portfolio piece.
// =============================================================================
const THEMES = {
  dark: {
    bg: "#020617", surface: "#0f172a", surfaceAlt: "#1e293b", border: "#334155",
    text: "#f1f5f9", textSec: "#94a3b8", textMuted: "#64748b",
    cyan: "#22d3ee", green: "#4ade80", yellow: "#facc15", orange: "#fb923c", red: "#f87171",
    cyanDim: "#0e7490", greenDim: "#15803d", yellowDim: "#a16207", orangeDim: "#9a3412", redDim: "#991b1b",
    onAccent: "#020617",
  },
  light: {
    bg: "#f8fafc", surface: "#ffffff", surfaceAlt: "#f1f5f9", border: "#cbd5e1",
    text: "#0f172a", textSec: "#475569", textMuted: "#94a3b8",
    cyan: "#0891b2", green: "#16a34a", yellow: "#ca8a04", orange: "#ea580c", red: "#dc2626",
    cyanDim: "#cffafe", greenDim: "#dcfce7", yellowDim: "#fef9c3", orangeDim: "#ffedd5", redDim: "#fee2e2",
    onAccent: "#ffffff",
  },
};
const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';
const MONO = '"JetBrains Mono", "Cascadia Code", ui-monospace, monospace';

// =============================================================================
// ENGINE START — pure, headless-testable. No React, no DOM, no globals mutated.
// =============================================================================

// ---- deterministic RNG (mulberry32) so the dataset is identical every boot ---
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- synthetic catalog: a fictional cordless-power-tool maker -----------------
// Components (purchased / raw). proc F unless noted.
const COMPONENTS = {
  "90010001": { desc: "Brushless motor stator", uom: "PC", proc: "F", mrp: "M20", spare: "00910001", irc: "X" },
  "90010002": { desc: "Brushless motor rotor", uom: "PC", proc: "F", mrp: "M20", spare: "" },
  "90010003": { desc: "Cooling fan, axial", uom: "PC", proc: "F", mrp: "M20", spare: "" },
  "90010004": { desc: "Copper winding wire", uom: "M", proc: "F", mrp: "M20", spare: "" },
  "90010005": { desc: "Recovered copper offcut", uom: "G", proc: "E", mrp: "M20", spare: "", byproduct: true },
  "90010010": { desc: "Li-ion cell, 21700", uom: "PC", proc: "F", mrp: "M30", spare: "" },
  "90010011": { desc: "Battery mgmt PCB", uom: "PC", proc: "F", mrp: "M30", spare: "", irc: "X" },
  "90010012": { desc: "Pack label set", uom: "PC", proc: "F", mrp: "M10", spare: "" },
  "90010020": { desc: "Trigger switch", uom: "PC", proc: "X", mrp: "M10", spare: "00920020" },
  "90010021": { desc: "Hall-effect sensor", uom: "PC", proc: "F", mrp: "M30", spare: "" },
  "90010030": { desc: "Steel gear, helical", uom: "PC", proc: "F", mrp: "M20", spare: "" },
  "90010031": { desc: "Planetary carrier", uom: "PC", proc: "E", mrp: "M20", spare: "" },
  "90010032": { desc: "Gearbox grease", uom: "G", proc: "F", mrp: "M30", spare: "" },
  "90010040": { desc: "Housing shell, left", uom: "PC", proc: "E", mrp: "M10", spare: "" },
  "90010041": { desc: "Housing shell, right", uom: "PC", proc: "E", mrp: "M10", spare: "" },
  "90010099": { desc: "Legacy bracket (proc TBD)", uom: "PC", proc: "", mrp: "", spare: "" },
  "90010050": { desc: "Screw M3x12", uom: "PC", proc: "F", mrp: "M10", spare: "" },
  "90010051": { desc: "Screw M4x16", uom: "PC", proc: "F", mrp: "M10", spare: "" },
  "90010060": { desc: "Keyless chuck, 13mm", uom: "PC", proc: "F", mrp: "M10", spare: "00920060" },
  "90010070": { desc: "Saw blade, 165mm", uom: "PC", proc: "F", mrp: "M10", spare: "00920070" },
  "90010071": { desc: "Blade guard", uom: "PC", proc: "F", mrp: "M10", spare: "" },
  "90010080": { desc: "Grinding wheel guard", uom: "PC", proc: "F", mrp: "M10", spare: "" },
  "90010090": { desc: "Nameplate label", uom: "PC", proc: "F", mrp: "M10", spare: "" },
};

// Phantom assemblies: structural only, no stock (PII = X, sproc 50).
const PHANTOMS = {
  "72050001": {
    desc: "Fastener kit (phantom)", mrp: "M10",
    children: [["90010050", 6], ["90010051", 2]],
  },
};

// Assemblies (HALB). children: [component, qtyPerParent]. May reference phantoms / sub-assemblies.
const ASSEMBLIES = {
  "72010001": {
    desc: "Motor assembly", mrp: "M20",
    children: [["90010001", 1], ["90010002", 1], ["90010004", 0.8], ["90010003", 1], ["90010099", 1], ["90010005", -2]],
  },
  "72010002": {
    desc: "Battery pack 2.0Ah", mrp: "M30",
    children: [["90010010", 5], ["90010011", 1], ["90010050", 4], ["90010012", 1]],
  },
  "72010003": {
    desc: "Battery pack 4.0Ah", mrp: "M30",
    children: [["90010010", 10], ["90010011", 1], ["90010050", 4], ["90010012", 1]],
  },
  "72010004": {
    desc: "Gearbox assembly", mrp: "M20",
    children: [["90010030", 3], ["90010031", 1], ["90010032", 2], ["90010050", 2]],
  },
  "72010005": {
    desc: "Housing assembly", mrp: "M10",
    children: [["90010040", 1], ["90010041", 1], ["72050001", 1], ["90010020", 1], ["90010021", 1]],
  },
  "72010006": {
    desc: "Blade assembly", mrp: "M10",
    children: [["90010070", 1], ["90010071", 1], ["90010051", 4]],
  },
};

// Finished goods. children: [material, qtyPerFG]. A trailing {doc:"..."} adds a text position.
const FINISHED_GOODS = {
  "71000001": { desc: "Cordless Drill 18V", children: [["72010001", 1], ["72010002", 1], ["72010004", 1], ["72010005", 1], ["90010060", 1], ["90010090", 1]], doc: "Assembly drawing DRL-18" },
  "71000002": { desc: "Cordless Driver 12V", children: [["72010001", 1], ["72010002", 1], ["72010004", 1], ["72010005", 1], ["90010090", 1]], doc: "Assembly drawing DRV-12" },
  "71000003": { desc: "Circular Saw 18V", children: [["72010001", 1], ["72010003", 1], ["72010005", 1], ["72010006", 1], ["90010090", 1]], doc: "Spec sheet SAW-18" },
  "71000004": { desc: "Angle Grinder 18V", children: [["72010001", 1], ["72010003", 1], ["72010005", 1], ["90010080", 1], ["90010090", 1]], doc: "" },
  "71000005": { desc: "Hammer Drill 18V", children: [["72010001", 1], ["72010003", 1], ["72010004", 1], ["72010005", 1], ["90010060", 1]], doc: "Spec sheet HAM-18" },
  "71000006": { desc: "Impact Driver 18V", children: [["72010001", 1], ["72010002", 1], ["72010004", 1], ["72010005", 1]], doc: "" },
};

// Per-site revision delta: site 1720 runs a heavier 4.0Ah cell count + different planner.
// This is the reason where-used must key on (site, material), never material alone.
function siteOverride(site, parentMat, comp) {
  if (site === "1720" && parentMat === "72010003" && comp === "90010010") {
    return { qty: 12, mrp: "M35" };
  }
  return null;
}

const lookupNode = (mat) => COMPONENTS[mat] || PHANTOMS[mat] || ASSEMBLIES[mat] || FINISHED_GOODS[mat] || null;
const isAssembly = (mat) => !!ASSEMBLIES[mat];
const isPhantom = (mat) => !!PHANTOMS[mat];

// ---- generate the long-format BOM extract (DFS, traversal order = tree) -------
// Each row mirrors a real explosion export: Material (FG) repeats down its block,
// Component is the item at this position, Level is depth, plus flag columns.
function generateExtract(cfg) {
  const rng = mulberry32(cfg.seed);
  const rows = [];
  let seq = 0;

  function emit(site, fg, parentMat, mat, qtyRaw, level) {
    const node = lookupNode(mat) || {};
    const ov = siteOverride(site, parentMat, mat);
    const qty = ov && ov.qty != null ? ov.qty : qtyRaw;
    const mrp = ov && ov.mrp ? ov.mrp : (node.mrp || "");
    const phantom = isPhantom(mat);
    const asm = isAssembly(mat) || phantom;
    // item position: 4-digit, stepped, deterministic
    const item = String(500 + (rows.length % 40) * 10).padStart(4, "0");
    rows.push({
      site,
      mat: fg,
      matDesc: FINISHED_GOODS[fg].desc,
      level,
      item,
      comp: mat,
      compDesc: node.desc || "",
      qty,
      proc: phantom ? "E" : (asm ? "E" : (node.proc || "")),
      mrp,
      uom: node.uom || "PC",
      matType: phantom ? "HALB" : (asm ? "HALB" : "ROH"),
      pii: phantom ? "X" : "",
      sproc: phantom ? "50" : "",
      asm: asm ? "X" : "",
      irc: node.irc || "",
      spare: node.spare || "",
      topBase: 1,
      seq: seq++,
    });
    // recurse into assemblies / phantoms
    const sub = ASSEMBLIES[mat] || PHANTOMS[mat];
    if (sub) {
      for (const [childMat, childQty] of sub.children) {
        emit(site, fg, mat, childMat, childQty, level + 1);
      }
    }
  }

  function emitDoc(site, fg, text) {
    if (!text) return;
    const item = String(500 + (rows.length % 40) * 10).padStart(4, "0");
    rows.push({
      site, mat: fg, matDesc: FINISHED_GOODS[fg].desc, level: 1, item,
      comp: "", compDesc: text, qty: 0, proc: "", mrp: "", uom: "",
      matType: "", pii: "", sproc: "", asm: "", irc: "", spare: "", topBase: 1, seq: seq++,
    });
  }

  for (const site of cfg.sites) {
    for (const fg of Object.keys(FINISHED_GOODS)) {
      const def = FINISHED_GOODS[fg];
      for (const [childMat, childQty] of def.children) {
        emit(site, fg, fg, childMat, childQty, 1);
      }
      emitDoc(site, fg, def.doc);
    }
  }
  // touch rng so the seed is a real dependency (future jitter hook); keeps determinism honest
  void rng();
  return rows;
}

// ---- stable, content-derived row id (never index-derived) ---------------------
function rowId(r) {
  const s = `${r.site}|${r.mat}|${r.level}|${r.item}|${r.comp}|${r.qty}|${r.seq}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return "r" + (h >>> 0).toString(36);
}

// ---- derive parent material per row via a level stack (order-dependent) -------
// In long-format, a row's parent is the nearest preceding row one level shallower
// WITHIN the same (site, FG) block. The stack reconstruction is what makes
// per-unit quantity math possible.
function deriveParents(rows) {
  const out = [];
  let stack = [];          // stack[level] = { comp, qty }
  let curKey = null;
  for (const r of rows) {
    const key = r.site + "|" + r.mat;
    if (key !== curKey) { stack = []; curKey = key; }
    const rr = { ...r, id: rowId(r), parent: r.level === 1 ? r.mat : (stack[r.level - 1]?.comp ?? r.mat) };
    stack[r.level] = { comp: r.comp, qty: r.qty };
    stack.length = r.level + 1;   // drop anything deeper
    out.push(rr);
  }
  return out;
}

// ---- classification: every row lands in exactly ONE bucket (a partition) ------
const BUCKETS = ["document", "phantom", "assembly", "purchased", "in_house", "unclassified"];
function classify(r) {
  if (!r.comp) return "document";          // no component number -> text/drawing
  if (r.pii === "X") return "phantom";     // phantom assembly
  if (r.asm === "X") return "assembly";    // real sub-assembly
  if (r.proc === "F" || r.proc === "X") return "purchased";
  if (r.proc === "E") return "in_house";
  return "unclassified";                   // honest bucket: has a comp but no proc signal
}

// ---- flexible search syntax ---------------------------------------------------
const FIELD_ALIASES = {
  material: "mat", fg: "mat", mat: "mat",
  fgdesc: "matDesc",
  comp: "comp", component: "comp",
  desc: "compDesc", description: "compDesc",
  level: "level", lvl: "level",
  item: "item", pos: "item",
  mrp: "mrp",
  proc: "proc",
  uom: "uom",
  plant: "site", site: "site",
  pii: "pii", phantom: "pii",
  irc: "irc",
  asm: "asm", assembly: "asm",
  spare: "spare",
  sproc: "sproc", special: "sproc",
  qty: "qty",
};
const FLAG_FIELDS = new Set(["pii", "irc", "asm"]);
const NUM_FIELDS = new Set(["level", "qty"]);
const stripZeros = (s) => String(s).replace(/^0+/, "");

function numMatch(val, expr) {
  const v = Number(val);
  if (Number.isNaN(v)) return false;
  expr = expr.trim();
  let m;
  if ((m = expr.match(/^(>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/))) {
    const t = Number(m[2]);
    return m[1] === ">=" ? v >= t : m[1] === "<=" ? v <= t : m[1] === ">" ? v > t : v < t;
  }
  if ((m = expr.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/))) {
    return v >= Number(m[1]) && v <= Number(m[2]);
  }
  if ((m = expr.match(/^(-?\d+(?:\.\d+)?)$/))) return v === Number(m[1]);
  return false;
}

function tokenize(query) {
  // split on whitespace but keep field:value (value may contain operators, no spaces)
  return (query.match(/\S+/g) || []);
}

// returns a predicate over a derived row
function buildMatcher(query) {
  const tokens = tokenize(query);
  const preds = [];
  for (const tok of tokens) {
    const ci = tok.indexOf(":");
    if (ci > 0) {
      const rawField = tok.slice(0, ci).toLowerCase();
      const rawVal = tok.slice(ci + 1);
      const field = FIELD_ALIASES[rawField];
      if (!field) { // unknown field -> treat the whole token as free text
        preds.push(freeText(tok));
        continue;
      }
      if (NUM_FIELDS.has(field)) {
        preds.push((r) => numMatch(r[field], rawVal));
      } else if (FLAG_FIELDS.has(field)) {
        const want = /^(x|1|true|yes)$/i.test(rawVal);
        preds.push((r) => (r[field] === "X") === want);
      } else if (field === "proc") {
        preds.push((r) => r.proc.toUpperCase() === rawVal.toUpperCase());
      } else if (field === "spare") {
        preds.push((r) => stripZeros(r.spare).includes(stripZeros(rawVal)) && rawVal !== "");
      } else {
        const v = rawVal.toLowerCase();
        preds.push((r) => String(r[field]).toLowerCase().includes(v));
      }
    } else {
      const low = tok.toLowerCase();
      // bare flag keywords
      if (low === "phantom" || low === "pii") { preds.push((r) => r.pii === "X"); continue; }
      if (low === "assembly" || low === "asm") { preds.push((r) => r.asm === "X"); continue; }
      if (low === "irc") { preds.push((r) => r.irc === "X"); continue; }
      preds.push(freeText(tok));
    }
  }
  if (preds.length === 0) return () => true;
  return (r) => preds.every((p) => p(r));
}

function freeText(tok) {
  const t = tok.toLowerCase();
  const tz = stripZeros(tok);
  return (r) =>
    String(r.mat).toLowerCase().includes(t) ||
    String(r.matDesc).toLowerCase().includes(t) ||
    String(r.comp).toLowerCase().includes(t) ||
    String(r.compDesc).toLowerCase().includes(t) ||
    (r.spare && stripZeros(r.spare).includes(tz) && tz !== "");
}

function runSearch(rows, query) {
  const m = buildMatcher(query || "");
  return rows.filter(m);
}

// ---- where-used: for a component, all FGs + usage paths + per-FG-unit qty ------
// Walks each (site, FG) block, maintaining the level stack; when the target
// component is hit, multiplies Component Qty up the chain to get per-FG-unit qty
// and records the path. Sums across every path within an FG. Keyed (site, FG).
function whereUsed(rows, target) {
  if (!target) return [];
  const byKey = new Map();   // `${site}|${fg}` -> { site, fg, fgDesc, totalQty, paths:[] }
  let stack = [];            // stack[level] = { comp, compDesc, qty }
  let curKey = null;
  for (const r of rows) {
    const blockKey = r.site + "|" + r.mat;
    if (blockKey !== curKey) { stack = []; curKey = blockKey; }
    stack[r.level] = { comp: r.comp, compDesc: r.compDesc, qty: r.qty };
    stack.length = r.level + 1;
    if (r.comp === target) {
      let q = 1;
      const path = [{ comp: r.mat, desc: r.matDesc, qty: null }];
      for (let lv = 1; lv <= r.level; lv++) {
        const s = stack[lv];
        q *= s.qty;
        path.push({ comp: s.comp, desc: s.compDesc, qty: s.qty });
      }
      const k = r.site + "|" + r.mat;
      if (!byKey.has(k)) byKey.set(k, { site: r.site, fg: r.mat, fgDesc: r.matDesc, totalQty: 0, paths: [] });
      const e = byKey.get(k);
      e.totalQty += q;
      e.paths.push({ qty: q, level: r.level, path });
    }
  }
  return Array.from(byKey.values()).sort((a, b) => (a.site === b.site ? a.fg.localeCompare(b.fg) : a.site.localeCompare(b.site)));
}

// ---- per-unit qty for one (FG, component) in one site (sum across paths) ------
function pathQty(rows, site, fg, target) {
  let total = 0, paths = 0;
  let stack = [], curKey = null;
  for (const r of rows) {
    if (r.site !== site) continue;
    const blockKey = r.site + "|" + r.mat;
    if (blockKey !== curKey) { stack = []; curKey = blockKey; }
    stack[r.level] = r.qty;
    stack.length = r.level + 1;
    if (r.mat === fg && r.comp === target) {
      let q = 1;
      for (let lv = 1; lv <= r.level; lv++) q *= stack[lv];
      total += q; paths++;
    }
  }
  return { total, paths };
}

// ---- BOM tree: the explosion for one (site, FG), already in traversal order ----
function bomTree(rows, site, fg) {
  return rows.filter((r) => r.site === site && r.mat === fg);
}

// ---- summary stats ------------------------------------------------------------
function summarize(rows) {
  const counts = Object.fromEntries(BUCKETS.map((b) => [b, 0]));
  let neg = 0;
  const fgs = new Set(), comps = new Set();
  for (const r of rows) {
    counts[classify(r)]++;
    if (Number(r.qty) < 0) neg++;
    fgs.add(r.site + "|" + r.mat);
    if (r.comp) comps.add(r.comp);
  }
  return { total: rows.length, counts, neg, fgCount: fgs.size, compCount: comps.size };
}

// =============================================================================
// ENGINE END
// =============================================================================

// ---- bucket presentation (color + label), driven by theme --------------------
function bucketStyle(theme) {
  return {
    document:     { label: "Document / text", color: theme.textMuted, key: "document" },
    phantom:      { label: "Phantom assembly", color: theme.yellow, key: "phantom" },
    assembly:     { label: "Sub-assembly", color: theme.cyan, key: "assembly" },
    purchased:    { label: "Purchased", color: theme.orange, key: "purchased" },
    in_house:     { label: "In-house", color: theme.green, key: "in_house" },
    unclassified: { label: "Unclassified", color: theme.red, key: "unclassified" },
  };
}

const fmtQty = (q) => {
  const n = Number(q);
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
};

// =============================================================================
// TOOLTIP SYSTEM — fixed-position layer (not clipped by scroll containers)
// =============================================================================
const TipCtx = createContext(null);

function TipLayer({ children }) {
  const [tip, setTip] = useState(null); // { x, y, text }
  const show = useCallback((x, y, text) => setTip({ x, y, text }), []);
  const hide = useCallback(() => setTip(null), []);
  return (
    <TipCtx.Provider value={{ show, hide }}>
      {children}
      {tip && (
        <div
          style={{
            position: "fixed", left: Math.min(tip.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 320),
            top: tip.y + 16, zIndex: 9999, maxWidth: 300, pointerEvents: "none",
            background: "rgba(2,6,23,0.97)", color: "#f1f5f9", border: "1px solid #334155",
            borderRadius: 8, padding: "8px 11px", fontSize: 12.5, lineHeight: 1.5,
            boxShadow: "0 8px 28px rgba(0,0,0,0.45)", fontFamily: FONT,
          }}
        >
          {tip.text}
        </div>
      )}
    </TipCtx.Provider>
  );
}

function Q({ term, theme }) {
  const ctx = useContext(TipCtx);
  const text = GLOSSARY[term] || term;
  return (
    <span
      tabIndex={0}
      onMouseEnter={(e) => ctx.show(e.clientX, e.clientY, text)}
      onMouseMove={(e) => ctx.show(e.clientX, e.clientY, text)}
      onMouseLeave={ctx.hide}
      onFocus={(e) => { const r = e.target.getBoundingClientRect(); ctx.show(r.right, r.top, text); }}
      onBlur={ctx.hide}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 14, height: 14, marginLeft: 4, borderRadius: "50%", cursor: "help",
        border: `1px solid ${theme.textMuted}`, color: theme.textMuted, fontSize: 9.5,
        fontWeight: 700, verticalAlign: "middle", lineHeight: 1, userSelect: "none",
      }}
    >?</span>
  );
}

function Hover({ text, children }) {
  const ctx = useContext(TipCtx);
  return (
    <span
      onMouseEnter={(e) => ctx.show(e.clientX, e.clientY, text)}
      onMouseMove={(e) => ctx.show(e.clientX, e.clientY, text)}
      onMouseLeave={ctx.hide}
    >
      {children}
    </span>
  );
}

// =============================================================================
// EXPORT — .xlsx full + filtered pair (named sheet, widths, autofilter)
// =============================================================================
const EXPORT_COLS = [
  ["Site", "site", 8], ["Material (FG)", "mat", 13], ["FG Description", "matDesc", 22],
  ["Level", "level", 7], ["Item", "item", 8], ["Component", "comp", 13],
  ["Component Description", "compDesc", 24], ["Qty / parent", "qty", 11],
  ["Per-FG-unit qty", "_perUnit", 14], ["Proc", "proc", 7], ["MRP", "mrp", 7],
  ["UoM", "uom", 7], ["Phantom", "pii", 9], ["Assembly", "asm", 10],
  ["IRC", "irc", 7], ["Spare", "spare", 12], ["Special Proc", "sproc", 13],
];

async function exportRows(rows, allRows, filename) {
  const XLSX = await import("xlsx");
  const header = EXPORT_COLS.map((c) => c[0]);
  const aoa = [header];
  // memoize per-unit per (site,fg,comp)
  const cache = new Map();
  for (const r of rows) {
    const line = EXPORT_COLS.map(([, key]) => {
      if (key === "_perUnit") {
        if (!r.comp) return "";
        const ck = r.site + "|" + r.mat + "|" + r.comp;
        if (!cache.has(ck)) cache.set(ck, pathQty(allRows, r.site, r.mat, r.comp).total);
        return cache.get(ck);
      }
      return r[key];
    });
    aoa.push(line);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = EXPORT_COLS.map((c) => ({ wch: c[2] }));
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: EXPORT_COLS.length - 1 } }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BOM Explorer");
  XLSX.writeFile(wb, filename);
}

// =============================================================================
// UI
// =============================================================================
export default function App() {
  const [mode, setMode] = useState("dark");
  const theme = THEMES[mode];
  const B = bucketStyle(theme);

  const [version, setVersion] = useState(0); // bump to regenerate sample
  const raw = useMemo(() => deriveParents(generateExtract(CONFIG)), [version]);
  const stats = useMemo(() => summarize(raw), [raw]);

  const [tab, setTab] = useState("search"); // search | whereused | tree
  const [query, setQuery] = useState("");
  const [activeBucket, setActiveBucket] = useState(null);
  const [showLogic, setShowLogic] = useState(false);
  const [showSyntax, setShowSyntax] = useState(false);

  // -- search results --
  const searched = useMemo(() => runSearch(raw, query), [raw, query]);
  const filtered = useMemo(
    () => (activeBucket ? searched.filter((r) => classify(r) === activeBucket) : searched),
    [searched, activeBucket]
  );

  const page = theme;
  const card = {
    background: page.surface, border: `1px solid ${page.border}`, borderRadius: 12,
  };

  return (
    <TipLayer>
      <div style={{ minHeight: "100vh", background: page.bg, color: page.text, fontFamily: FONT, fontSize: 14 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 20px 56px" }}>
          {/* ---- Header ---- */}
          <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11, display: "grid", placeItems: "center",
                background: `linear-gradient(135deg, ${page.cyan}, ${page.green})`, color: page.onAccent, flexShrink: 0,
              }}>
                <Network size={23} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
                  <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: -0.3 }}>{CONFIG.product}</h1>
                  <span style={{ fontSize: 12.5, color: page.textMuted, fontWeight: 600 }}>{CONFIG.company}</span>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: page.textSec }}>
                  Search, where-used, and multi-level explosion over a bill-of-materials extract — with per-finished-good-unit quantity math.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => setVersion((v) => v + 1)} title="Regenerate the synthetic sample dataset"
                style={btn(page, "ghost")}>
                <RefreshCw size={14} /> Reload sample
              </button>
              <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} title="Toggle light / dark"
                style={btn(page, "ghost")}>
                {mode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </header>

          {/* ---- Synthetic-data banner ---- */}
          <div style={{
            ...card, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center",
            borderLeft: `3px solid ${page.cyan}`, fontSize: 12.5, color: page.textSec,
          }}>
            <Cpu size={15} style={{ color: page.cyan, flexShrink: 0 }} />
            <span>
              <b style={{ color: page.text }}>Synthetic demo data</b> — {stats.fgCount} finished-good/site blocks across {stats.total.toLocaleString()} positions,
              generated deterministically on load (seed {CONFIG.seed}). No real company, site, or part number. In a deployed build,
              this loads from live SAP explosion exports and a database; persistence and write-back are the connector story.
            </span>
          </div>

          {/* ---- Plain-language intro + live numbers ---- */}
          <div style={{ ...card, padding: 16, marginBottom: 16 }}>
            <p style={{ margin: "0 0 12px", fontSize: 13.5, color: page.textSec, lineHeight: 1.6 }}>
              Of <b style={{ color: page.text }}>{stats.total.toLocaleString()}</b> BOM positions across{" "}
              <b style={{ color: page.text }}>{CONFIG.sites.length}</b> sites,{" "}
              <b style={{ color: page.cyan }}>{stats.counts.assembly}</b> are <Hover text={GLOSSARY["Assembly"]}><u style={us}>sub-assemblies</u></Hover>,{" "}
              <b style={{ color: page.green }}>{stats.counts.in_house}</b> in-house and{" "}
              <b style={{ color: page.orange }}>{stats.counts.purchased}</b> purchased components,{" "}
              <b style={{ color: page.yellow }}>{stats.counts.phantom}</b> <Hover text={GLOSSARY["Phantom"]}><u style={us}>phantoms</u></Hover>, and{" "}
              <b style={{ color: page.textMuted }}>{stats.counts.document}</b> document positions.{" "}
              <b style={{ color: page.red }}>{stats.neg}</b> positions carry a negative quantity (by-product credit) — find them with <code style={codeChip(page)}>qty:&lt;0</code>.
            </p>

            {/* stat / filter tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 8 }}>
              {BUCKETS.map((b) => {
                const def = B[b];
                const n = stats.counts[b];
                const on = activeBucket === b;
                return (
                  <button key={b}
                    onClick={() => { setActiveBucket(on ? null : b); setTab("search"); }}
                    title={`Filter the worklist to ${def.label} rows`}
                    style={{
                      textAlign: "left", padding: "9px 11px", borderRadius: 9, cursor: "pointer",
                      background: on ? def.color : page.surfaceAlt,
                      border: `1px solid ${on ? def.color : page.border}`,
                      color: on ? page.onAccent : page.text, transition: "all .12s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: on ? page.onAccent : def.color }} />
                      <span style={{ fontSize: 11, fontWeight: 600, opacity: on ? 0.9 : 0.75 }}>{def.label}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO }}>{n.toLocaleString()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---- Tabs ---- */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[
              ["search", "Search", Search],
              ["whereused", "Where-used", Network],
              ["tree", "BOM tree", ListTree],
            ].map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 9,
                  cursor: "pointer", fontWeight: 700, fontSize: 13,
                  background: tab === k ? page.cyan : page.surface,
                  color: tab === k ? page.onAccent : page.textSec,
                  border: `1px solid ${tab === k ? page.cyan : page.border}`,
                }}>
                <Icon size={15} /> {label}
              </button>
            ))}
            <button onClick={() => setShowLogic((s) => !s)}
              style={{ ...btn(page, "ghost"), marginLeft: "auto" }} title="Explain how this tool works">
              <Info size={14} /> How this works
            </button>
          </div>

          {/* ---- How this works panel ---- */}
          {showLogic && <LogicPanel page={page} />}

          {/* ---- Tab body ---- */}
          {tab === "search" && (
            <SearchTab
              page={page} B={B} raw={raw} query={query} setQuery={setQuery}
              filtered={filtered} searched={searched} activeBucket={activeBucket}
              setActiveBucket={setActiveBucket} showSyntax={showSyntax} setShowSyntax={setShowSyntax}
            />
          )}
          {tab === "whereused" && <WhereUsedTab page={page} raw={raw} />}
          {tab === "tree" && <TreeTab page={page} B={B} raw={raw} />}

          {/* ---- Footer / byline ---- */}
          <footer style={{ marginTop: 30, paddingTop: 16, borderTop: `1px solid ${page.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: page.textMuted }}>
              Built by <b style={{ color: page.textSec }}>Ian Provencher</b> · {CONFIG.company} is fictional · synthetic data
            </span>
            <span style={{ fontSize: 11.5, color: page.textMuted, fontFamily: MONO }}>
              {CONFIG.product} · public portfolio demo
            </span>
          </footer>
        </div>
      </div>
    </TipLayer>
  );
}

const us = { textDecoration: "underline", textDecorationStyle: "dotted", cursor: "help" };
function codeChip(page) {
  return { fontFamily: MONO, fontSize: 12, background: page.surfaceAlt, border: `1px solid ${page.border}`, borderRadius: 5, padding: "1px 5px", color: page.cyan };
}
function btn(page, kind) {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 12.5, fontFamily: FONT };
  if (kind === "primary") return { ...base, background: page.cyan, color: page.onAccent, border: `1px solid ${page.cyan}` };
  if (kind === "secondary") return { ...base, background: page.surface, color: page.text, border: `1px solid ${page.border}` };
  return { ...base, background: page.surface, color: page.textSec, border: `1px solid ${page.border}` };
}

// ---- How this works ----------------------------------------------------------
function LogicPanel({ page }) {
  const Row = ({ title, children }) => (
    <div style={{ marginBottom: 11 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, color: page.text }}>{title}</div>
      <div style={{ fontSize: 12.5, color: page.textSec, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
  return (
    <div style={{ background: page.surface, border: `1px solid ${page.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <Row title="The extract">
        A long-format multi-level BOM explosion: one row per component position, with the finished-good number repeated down its block,
        the component at that position, and the depth as <b style={{ color: page.text }}>Level</b>. Row order encodes the tree — a row's parent is the nearest preceding row one level shallower, within the same site + FG block.
      </Row>
      <Row title="Per-finished-good-unit quantity (the computed column)">
        The extract's quantity is per ONE unit of the <i>direct parent</i>. To get quantity per finished good, the engine multiplies the quantity down the parent chain
        (FG → assembly → sub-assembly → part) and then <b style={{ color: page.text }}>sums across every usage path</b> a part takes in that FG. A screw reached three ways is counted three times and totaled.
      </Row>
      <Row title="Where-used (reverse)">
        For any component, the engine reports every finished good it appears in, each path taken, and the per-FG-unit quantity — kept <b style={{ color: page.text }}>separate per site</b>,
        because the same part can carry a different quantity in a different site's revision. Merging sites on the part number alone would produce a confident, wrong number.
      </Row>
      <Row title="Classification (the colored buckets)">
        Every position lands in exactly one bucket: document/text (no part number), phantom (structural, never stocked), sub-assembly, purchased, in-house, or unclassified.
        The buckets partition the worklist — counts always sum to the total. <b style={{ color: page.red }}>Negative quantities</b> are a flag overlaid on whatever bucket a row sits in, not a bucket of their own.
      </Row>
      <Row title="Honest surfaces">
        Document positions have no component to compute against, and the "unclassified" bucket holds rows with a part but no procurement signal — both are shown as-is rather than guessed at.
      </Row>
    </div>
  );
}

// ---- Search tab --------------------------------------------------------------
function SearchTab({ page, B, raw, query, setQuery, filtered, searched, activeBucket, setActiveBucket, showSyntax, setShowSyntax }) {
  const onExportFull = () =>
    exportRows(raw, raw, `northpoint-bom-full-${raw.length}.xlsx`);
  const onExportFiltered = () =>
    exportRows(filtered, raw, `northpoint-bom-filtered-${filtered.length}.xlsx`);

  return (
    <div>
      {/* search bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: page.textMuted }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try:  proc:F  ·  level:>2  ·  qty:<0  ·  phantom  ·  cell  ·  spare:920060'
            style={{
              width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 36px", borderRadius: 9,
              background: page.surface, border: `1px solid ${page.border}`, color: page.text,
              fontFamily: MONO, fontSize: 13, outline: "none",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ position: "absolute", right: 8, top: 8, background: "none", border: "none", cursor: "pointer", color: page.textMuted }}>
              <X size={16} />
            </button>
          )}
        </div>
        <button onClick={() => setShowSyntax((s) => !s)} style={btn(page, "ghost")} title="Show all searchable fields">
          <HelpCircle size={14} /> Syntax
        </button>
        <button onClick={onExportFull} style={btn(page, "secondary")} title="Every row in the loaded sample (.xlsx), ignoring filters">
          <Download size={14} /> Full ({raw.length})
        </button>
        <button onClick={onExportFiltered} style={btn(page, "primary")} title="Exactly the rows on screen (.xlsx), with the active search + bucket filter">
          <Download size={14} /> Filtered ({filtered.length})
        </button>
      </div>

      {/* syntax help */}
      {showSyntax && (
        <div style={{ background: page.surface, border: `1px solid ${page.border}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: page.textSec, marginBottom: 9 }}>
            Tokens combine with AND. <code style={codeChip(page)}>field:value</code> for a field; a bare word searches material, descriptions, and component across the board.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "4px 18px" }}>
            {SEARCH_FIELDS_HELP.map(([f, d]) => (
              <div key={f} style={{ fontSize: 12, display: "flex", gap: 8 }}>
                <code style={{ ...codeChip(page), whiteSpace: "nowrap" }}>{f}</code>
                <span style={{ color: page.textSec }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* active-filter chip */}
      {activeBucket && (
        <div style={{ marginBottom: 10, fontSize: 12.5, color: page.textSec }}>
          Bucket filter:{" "}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 9px", borderRadius: 20, background: page.surfaceAlt, border: `1px solid ${page.border}` }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: B[activeBucket].color }} />
            {B[activeBucket].label}
            <button onClick={() => setActiveBucket(null)} style={{ background: "none", border: "none", cursor: "pointer", color: page.textMuted, padding: 0, display: "flex" }}>
              <X size={13} />
            </button>
          </span>
        </div>
      )}

      <ResultTable page={page} B={B} rows={filtered} allRows={raw} />
    </div>
  );
}

// ---- bounded, dual-sticky data window ----------------------------------------
function ResultTable({ page, B, rows, allRows }) {
  const ctx = useContext(TipCtx);
  const cols = [
    ["Site", 56], ["Material", 96], ["Lvl", 44], ["Item", 56], ["Component", 100],
    ["Description", 200], ["Qty", 70], ["UoM", 50], ["Proc", 52], ["MRP", 56], ["Type", 110],
  ];
  const th = (label, w, lead) => (
    <th key={label} style={{
      position: "sticky", top: 0, left: lead ? 0 : undefined, zIndex: lead ? 3 : 2,
      background: page.surfaceAlt, color: page.textSec, fontWeight: 700, fontSize: 11.5,
      textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${page.border}`,
      minWidth: w, whiteSpace: "nowrap",
    }}>{label}</th>
  );

  if (rows.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: page.textMuted, background: page.surface, border: `1px solid ${page.border}`, borderRadius: 12 }}>
      No positions match. Try clearing the search or bucket filter.
    </div>;
  }

  return (
    <div style={{
      overflow: "auto", maxHeight: "max(440px, calc(100vh - 360px))", overscrollBehavior: "contain",
      border: `1px solid ${page.border}`, borderRadius: 12, background: page.surface,
    }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5 }}>
        <thead>
          <tr>
            {th("Description", 200, true)}
            {th("Site", 56)}{th("Material", 96)}
            <th style={{ position: "sticky", top: 0, zIndex: 2, background: page.surfaceAlt, color: page.textSec, fontWeight: 700, fontSize: 11.5, textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${page.border}`, minWidth: 44 }}>
              <span style={{ display: "inline-flex", alignItems: "center" }}>Lvl<Q term="Level" theme={page} /></span>
            </th>
            {th("Item", 56)}{th("Component", 100)}
            <th style={{ position: "sticky", top: 0, zIndex: 2, background: page.surfaceAlt, color: page.textSec, fontWeight: 700, fontSize: 11.5, textAlign: "right", padding: "8px 10px", borderBottom: `1px solid ${page.border}`, minWidth: 78 }}>
              <span style={{ display: "inline-flex", alignItems: "center" }}>Qty / parent<Q term="Component Qty" theme={page} /></span>
            </th>
            {th("UoM", 50)}
            <th style={{ position: "sticky", top: 0, zIndex: 2, background: page.surfaceAlt, color: page.textSec, fontWeight: 700, fontSize: 11.5, textAlign: "left", padding: "8px 10px", borderBottom: `1px solid ${page.border}`, minWidth: 52 }}>
              <span style={{ display: "inline-flex", alignItems: "center" }}>Proc<Q term="Procurement Type" theme={page} /></span>
            </th>
            {th("MRP", 56)}{th("Type", 116)}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 600).map((r) => {
            const bk = classify(r);
            const def = B[bk];
            const neg = Number(r.qty) < 0;
            const reason = rowReason(r, bk, def);
            return (
              <tr key={r.id}
                onMouseEnter={(e) => ctx.show(e.clientX, e.clientY, reason)}
                onMouseMove={(e) => ctx.show(e.clientX, e.clientY, reason)}
                onMouseLeave={ctx.hide}
                style={{ borderBottom: `1px solid ${page.border}` }}>
                <td style={{ position: "sticky", left: 0, zIndex: 1, background: page.surface, padding: "7px 10px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: def.color, flexShrink: 0 }} />
                    <span style={{ color: r.comp ? page.text : page.textMuted, fontStyle: r.comp ? "normal" : "italic" }}>
                      {r.compDesc || "—"}
                    </span>
                  </span>
                </td>
                <td style={td(page)}>{r.site}</td>
                <td style={{ ...td(page), fontFamily: MONO, color: page.textSec }}>{r.mat}</td>
                <td style={{ ...td(page), textAlign: "center", color: page.textSec }}>{r.level}</td>
                <td style={{ ...td(page), fontFamily: MONO, color: page.textMuted }}>{r.item}</td>
                <td style={{ ...td(page), fontFamily: MONO }}>{r.comp || <span style={{ color: page.textMuted }}>—</span>}</td>
                <td style={{ ...td(page), textAlign: "right", fontFamily: MONO, color: neg ? page.red : page.text, fontWeight: neg ? 700 : 400 }}>
                  {r.comp ? fmtQty(r.qty) : ""}
                </td>
                <td style={{ ...td(page), color: page.textSec }}>{r.uom}</td>
                <td style={{ ...td(page), color: page.textSec, fontFamily: MONO }}>{r.proc || "—"}</td>
                <td style={{ ...td(page), color: page.textSec, fontFamily: MONO }}>{r.mrp || "—"}</td>
                <td style={td(page)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11.5, color: def.color, fontWeight: 600 }}>{def.label}</span>
                    {neg && <Hover text="Negative quantity — a by-product / recovered-material credit, not an error."><AlertTriangle size={13} style={{ color: page.red }} /></Hover>}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length > 600 && (
        <div style={{ padding: "8px 12px", fontSize: 12, color: page.textMuted, borderTop: `1px solid ${page.border}` }}>
          Showing first 600 of {rows.length.toLocaleString()} — narrow the search or export to see all.
        </div>
      )}
    </div>
  );
}

function td(page) {
  return { padding: "7px 10px", whiteSpace: "nowrap" };
}

function rowReason(r, bk, def) {
  if (!r.comp) return `Document / text position "${r.compDesc}" — no component number, nothing to compute.`;
  const base = `${r.comp} (${r.compDesc}) at level ${r.level} of ${r.mat}, qty ${fmtQty(r.qty)} ${r.uom} per parent.`;
  if (bk === "phantom") return `${base} Phantom (PII X, special proc 50): structural only, never stocked.`;
  if (bk === "assembly") return `${base} Sub-assembly (Asm X): explodes further below.`;
  if (bk === "purchased") return `${base} Purchased (proc ${r.proc}), planner ${r.mrp}.`;
  if (bk === "in_house") return `${base} Produced in-house (proc E), planner ${r.mrp}.`;
  return `${base} No procurement signal — shown unclassified rather than guessed.`;
}

// ---- Where-used tab ----------------------------------------------------------
function WhereUsedTab({ page, raw }) {
  // component picker: distinct components, sorted by where-used breadth
  const components = useMemo(() => {
    const m = new Map();
    for (const r of raw) {
      if (!r.comp) continue;
      if (!m.has(r.comp)) m.set(r.comp, { comp: r.comp, desc: r.compDesc, hits: 0 });
      m.get(r.comp).hits++;
    }
    return Array.from(m.values()).sort((a, b) => b.hits - a.hits);
  }, [raw]);

  const [sel, setSel] = useState(components[0]?.comp || "");
  useEffect(() => { if (!components.find((c) => c.comp === sel)) setSel(components[0]?.comp || ""); }, [components]);

  const used = useMemo(() => whereUsed(raw, sel), [raw, sel]);
  const selDesc = components.find((c) => c.comp === sel)?.desc || "";

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: page.textSec, display: "inline-flex", alignItems: "center" }}>
          Component <Q term="Where-used" theme={page} />
        </span>
        <select value={sel} onChange={(e) => setSel(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 9, background: page.surface, border: `1px solid ${page.border}`, color: page.text, fontFamily: MONO, fontSize: 13, minWidth: 320 }}>
          {components.map((c) => (
            <option key={c.comp} value={c.comp}>{c.comp} — {c.desc}</option>
          ))}
        </select>
      </div>

      <div style={{ background: page.surface, border: `1px solid ${page.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 13.5, color: page.textSec, lineHeight: 1.6 }}>
          <b style={{ color: page.text, fontFamily: MONO }}>{sel}</b> <span style={{ color: page.text }}>({selDesc})</span> appears in{" "}
          <b style={{ color: page.cyan }}>{used.length}</b> finished-good/site blocks, across{" "}
          <b style={{ color: page.green }}>{used.reduce((n, u) => n + u.paths.length, 0)}</b> usage paths.
          Per-finished-good-unit quantity is the path quantities summed — kept separate per site.
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {used.map((u) => (
          <div key={u.site + u.fg} style={{ background: page.surface, border: `1px solid ${page.border}`, borderRadius: 11, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9, flexWrap: "wrap", gap: 8 }}>
              <div>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: page.text }}>{u.fg}</span>
                <span style={{ color: page.textSec, marginLeft: 8 }}>{u.fgDesc}</span>
                <span style={{ marginLeft: 10, fontSize: 11.5, padding: "2px 8px", borderRadius: 20, background: page.surfaceAlt, border: `1px solid ${page.border}`, color: page.textSec }}>
                  Site {u.site} · {CONFIG.siteNames[u.site]}
                </span>
              </div>
              <div style={{ fontSize: 13, color: page.textSec }}>
                Per FG unit:{" "}
                <b style={{ fontFamily: MONO, fontSize: 16, color: Number(u.totalQty) < 0 ? page.red : page.green }}>{fmtQty(u.totalQty)}</b>
              </div>
            </div>
            <div style={{ display: "grid", gap: 5 }}>
              {u.paths.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: page.textSec, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: MONO, color: page.cyan, fontWeight: 700, minWidth: 54 }}>×{fmtQty(p.qty)}</span>
                  {p.path.map((step, j) => (
                    <span key={j} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {j > 0 && <ChevronRight size={12} style={{ color: page.textMuted }} />}
                      <span style={{ color: j === p.path.length - 1 ? page.text : page.textSec }}>
                        {step.desc}{step.qty != null && <span style={{ color: page.textMuted, fontFamily: MONO }}> ({fmtQty(step.qty)})</span>}
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- BOM tree tab ------------------------------------------------------------
function TreeTab({ page, B, raw }) {
  const fgs = useMemo(() => {
    const m = new Map();
    for (const r of raw) {
      const k = r.site + "|" + r.mat;
      if (!m.has(k)) m.set(k, { site: r.site, fg: r.mat, desc: r.matDesc });
    }
    return Array.from(m.values()).sort((a, b) => (a.fg === b.fg ? a.site.localeCompare(b.site) : a.fg.localeCompare(b.fg)));
  }, [raw]);

  const [sel, setSel] = useState(fgs[0] ? fgs[0].site + "|" + fgs[0].fg : "");
  useEffect(() => { if (!fgs.find((f) => f.site + "|" + f.fg === sel)) setSel(fgs[0] ? fgs[0].site + "|" + fgs[0].fg : ""); }, [fgs]);

  const [site, fg] = sel.split("|");
  const tree = useMemo(() => bomTree(raw, site, fg), [raw, site, fg]);
  const fgDesc = fgs.find((f) => f.site + "|" + f.fg === sel)?.desc || "";

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: page.textSec }}>Finished good</span>
        <select value={sel} onChange={(e) => setSel(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 9, background: page.surface, border: `1px solid ${page.border}`, color: page.text, fontFamily: MONO, fontSize: 13, minWidth: 360 }}>
          {fgs.map((f) => (
            <option key={f.site + f.fg} value={f.site + "|" + f.fg}>{f.fg} — {f.desc} · Site {f.site}</option>
          ))}
        </select>
      </div>

      <div style={{ background: page.surface, border: `1px solid ${page.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${page.border}`, background: page.surfaceAlt }}>
          <span style={{ fontFamily: MONO, fontWeight: 800, color: page.text, fontSize: 15 }}>{fg}</span>
          <span style={{ color: page.textSec, marginLeft: 10 }}>{fgDesc}</span>
          <span style={{ color: page.textMuted, marginLeft: 10, fontSize: 12.5 }}>· {tree.length} positions · Site {site} ({CONFIG.siteNames[site]})</span>
        </div>
        <div style={{ overflow: "auto", maxHeight: "max(440px, calc(100vh - 360px))", overscrollBehavior: "contain" }}>
          {tree.map((r) => {
            const bk = classify(r);
            const def = B[bk];
            const neg = Number(r.qty) < 0;
            return (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "6px 16px",
                paddingLeft: 16 + (r.level - 1) * 26, borderBottom: `1px solid ${page.border}`,
                fontSize: 12.5,
              }}>
                {r.level > 1 && <CornerDownRight size={13} style={{ color: page.textMuted, flexShrink: 0 }} />}
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: def.color, flexShrink: 0 }} />
                <span style={{ fontFamily: MONO, color: page.textSec, minWidth: 90 }}>{r.comp || "—"}</span>
                <span style={{ flex: 1, color: r.comp ? page.text : page.textMuted, fontStyle: r.comp ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.compDesc}
                  {bk === "phantom" && <span style={{ marginLeft: 8, fontSize: 10.5, color: page.yellow, fontWeight: 700 }}>PHANTOM</span>}
                  {bk === "assembly" && <span style={{ marginLeft: 8, fontSize: 10.5, color: page.cyan, fontWeight: 700 }}>ASSY</span>}
                </span>
                {r.comp && (
                  <span style={{ fontFamily: MONO, color: neg ? page.red : page.textSec, fontWeight: neg ? 700 : 400, minWidth: 70, textAlign: "right" }}>
                    {fmtQty(r.qty)} {r.uom}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
