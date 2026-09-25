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

import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
// The northpoint palette (D120): every color a var() reference, the values on
// the house frame's root for the mode in force.
import { northpointTokens } from "../kit/industrial.js";
import { figure, count, MINUS } from "../../lib/format.js";
import {
  HouseFrame, Intro, HowItWorks, AnswerCards, AnswerCard, ExportPair,
  Help, Term, Hint, Legend, Pill, pinColumns,
} from "../kit/house.jsx";
import { writeWorkbook } from "../kit/house-export.js";
// The fictional company these seven are set in — one file, so the world
// cannot drift into two companies across seven tools.
import { NORTHPOINT } from "../../lib/northpoint.js";
// xlsx is loaded lazily inside exportWorkbook() so its ~480 KB chunk stays off
// the initial bundle — export is a secondary action.

// =============================================================================
// CONFIG — single editable block. Re-skin the whole demo from here.
// =============================================================================
const CONFIG = {
  company: NORTHPOINT.company,
  product: "BOM Explorer",
  seed: 42,
  sites: NORTHPOINT.plantCodes,          // synthetic site codes (SAP sample-plant shape)
  /* RIVERSIDE AND LAKESIDE WERE ONLY EVER NAMED HERE, while the past-due
     console called the same two codes Assembly and Fabrication. Both survive:
     a plant now carries a code, a place and a role, because that is how anyone
     actually refers to one. See src/lib/northpoint.js. */
  siteNames: NORTHPOINT.plantNames,
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

// =============================================================================
// THE HOUSE FRAME (D120, 2026-09-24). Everything below the engine is the
// screen: HouseFrame from ../kit/house.jsx, the northpoint palette, the house
// formats, writeWorkbook() with its About sheet.
// =============================================================================
const SLUG = "bom-explorer";
const NAME = "BOM Explorer";
const SCOPE = "Reads a bill-of-materials explosion extract in your browser. Never connects to SAP.";

/* THE NORTHPOINT PALETTE, "master data" band. Every value a var() reference;
   the house frame's root carries the values for the mode in force. */
const T = northpointTokens(SLUG);

/* A BUCKET IS A KIND OF POSITION, so five of the six take the series. Until D120
   they took the severity ramp: purchased parts were orange and in-house parts
   green, which said "worse" and "fine" about two ordinary ways to source a part.
   Unclassified is the one that is a problem (a part with no procurement signal),
   so it alone keeps the alarm. */
const BUCKET = {
  assembly:     { label: "Sub-assembly", swatch: T.series1, about: "A parent of other items, produced in-house; it explodes further below." },
  purchased:    { label: "Purchased", swatch: T.series2, about: "Bought in: procurement type F, or X where either is possible." },
  in_house:     { label: "In-house", swatch: T.series3, about: "Produced in-house: procurement type E." },
  phantom:      { label: "Phantom assembly", swatch: T.series4, about: "Structures the BOM but is never stocked; its children are pulled straight into the parent." },
  document:     { label: "Document / text", swatch: T.series5, about: "A drawing or spec-sheet position with no part number; nothing to compute against." },
  unclassified: { label: "Unclassified", swatch: T.badFill, about: "A part with no procurement signal, shown as it is rather than guessed." },
};
const Swatch = ({ bk }) => (
  <i aria-hidden="true" style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, flex: "none", background: BUCKET[bk].swatch }} />
);
const nfmt = (n) => figure(n, { zeroMeans: "zero" });

/* A QUANTITY, with the house minus. A negative quantity is a by-product credit,
   legitimate, so it is marked with a quiet pill rather than painted red. */
function qtyText(q) {
  const n = Number(q);
  const body = Number.isInteger(n) ? String(Math.abs(n)) : Math.abs(n).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  return (n < 0 ? MINUS : "") + body;
}
const CREDIT = "A negative quantity: a by-product or recovered-material credit, not an error.";

function rowReason(r, bk) {
  if (!r.comp) return `Document / text position "${r.compDesc}": no component number, nothing to compute.`;
  const base = `${r.comp} (${r.compDesc}) at level ${r.level} of ${r.mat}, ${qtyText(r.qty)} ${r.uom} per parent.`;
  if (bk === "phantom") return `${base} Phantom (PII X, special procurement 50): structural only, never stocked.`;
  if (bk === "assembly") return `${base} Sub-assembly (Asm X): explodes further below.`;
  if (bk === "purchased") return `${base} Purchased (procurement ${r.proc}), planner ${r.mrp}.`;
  if (bk === "in_house") return `${base} Produced in-house (procurement E), planner ${r.mrp}.`;
  return `${base} No procurement signal: shown unclassified rather than guessed.`;
}

const CAP = 600;

/* The export's columns: the extract's own, plus the worked-out quantity per
   finished-good unit after the quantity per parent. */
const EXPORT_COLS = [
  ["Site", "site"], ["Material (FG)", "mat"], ["FG Description", "matDesc"],
  ["Level", "level"], ["Item", "item"], ["Component", "comp"],
  ["Component Description", "compDesc"], ["Qty / parent", "qty"],
  ["Per-FG-unit qty", "_perUnit"], ["Proc", "proc"], ["MRP", "mrp"],
  ["UoM", "uom"], ["Phantom", "pii"], ["Assembly", "asm"],
  ["IRC", "irc"], ["Spare", "spare"], ["Special Proc", "sproc"],
];

// =============================================================================
// THE INSTRUCTION MANUAL (tool-conventions § N), built from BUCKETS, GLOSSARY
// and SEARCH_FIELDS_HELP above, so a change to any of them reaches it.
// =============================================================================
export const MANUAL = {
  tool: NAME,
  purpose: "Searches a bill-of-materials extract by any field, finds every finished good a part is used in, and works out how many of a part one finished good takes.",
  sections: [
    {
      id: "start", title: "What it is for, and what to do first",
      blocks: [
        { p: "A BOM extract says how many of a part go into its direct parent, not into the finished good. This explorer multiplies down every chain and adds up every path, so the question planners actually ask (how many per finished good, in which plant) has one answer." },
        { list: [
          { lead: "Read the answer cards.", text: "How the positions split by kind; press a card to show only that kind." },
          { lead: "Search.", text: "Type a word, or a field and a value such as proc:F or level:>2; the grid narrows as you type." },
          { lead: "Open Where-used.", text: "Pick a component to see every finished good it is in, each path it takes, and the quantity per finished good, plant by plant." },
          { lead: "Open BOM tree.", text: "Pick a finished good to see its explosion indented by level." },
          { lead: "Export.", text: "The full extract or what the search shows, each with the per-finished-good quantity worked out." },
        ] },
      ],
    },
    {
      id: "numbers", title: "What the numbers mean",
      blocks: [
        { table: { head: ["Figure", "What it is"], rows: [
          ["Qty / parent", GLOSSARY["Component Qty"]],
          ["Per finished-good unit", GLOSSARY["Per-unit qty"]],
          ["Usage paths", GLOSSARY["Usage path"]],
          ["Positions", "Rows in the extract: one per component position, within one plant's finished good."],
        ] } },
      ],
    },
    {
      id: "flags", title: "Every kind of position, and what to do about it",
      blocks: [
        { table: { head: ["Kind", "What it means"], rows: BUCKETS.map((b) => [BUCKET[b].label, BUCKET[b].about]) } },
        { p: "Each position lands in exactly one kind, checked in this order: no part number, phantom, sub-assembly, purchased, in-house, then unclassified. The kinds partition the extract, so the cards add up to the total. " + CREDIT },
      ],
    },
    {
      id: "derived", title: "How to read the derived columns",
      blocks: [
        { p: GLOSSARY["Per-unit qty"], lead: "Per finished-good unit." },
        { p: GLOSSARY["Where-used"], lead: "Where-used." },
        { p: GLOSSARY.Level, lead: "Level." },
        { p: GLOSSARY["Procurement Type"], lead: "Procurement type." },
        { table: { head: ["Search field", "What it matches"], rows: SEARCH_FIELDS_HELP.map(([f, d]) => [f, d]) } },
      ],
    },
    {
      id: "data", title: "How the data is handled",
      blocks: [
        { p: `This copy runs entirely in your browser. On open it builds a bill-of-materials extract for ${CONFIG.company}, an invented manufacturer, from a fixed seed (${CONFIG.seed}), for plants ${CONFIG.sites.join(" and ")}. Every visitor sees the same extract.` },
        { p: "Nothing you search for is stored or sent anywhere. The exports are written in your browser." },
      ],
    },
    {
      id: "thresholds", title: "Every threshold",
      blocks: [
        { table: { head: ["Threshold", "Value", "What it does"], rows: [
          ["Rows on screen", `${CAP}`, "The grid shows the first rows; both exports carry every one."],
          ["Explosion depth", `${CONFIG.maxLevel} levels`, "The deepest level the sample builds."],
          ["Quantity decimals", "3", "A fractional quantity shows up to three decimals, trailing zeros dropped."],
        ] } },
        { p: "Set for this demo. A delivered copy reads the plant's own extract." },
      ],
    },
    {
      id: "limits", title: "What it cannot tell you",
      blocks: [
        { list: [
          "Whether a BOM is correct. It reads the extract as given.",
          "Anything across plants merged on part number alone: the same part can carry a different quantity in each plant, so every figure stays per plant.",
          "A total across units of measure: quantities in different units are never added together.",
          "What a document position refers to, beyond its description: it has no part number.",
        ] },
      ],
    },
  ],
};

// =============================================================================
// THE SCREEN
// =============================================================================
function SearchView({ raw, query, setQuery, filtered, activeBucket, setActiveBucket }) {
  const [showSyntax, setShowSyntax] = useState(false);
  const tableRef = useRef(null);
  useLayoutEffect(() => { pinColumns(tableRef.current); }, [filtered]);

  const exportWorkbook = async (full) => {
    const XLSX = await import("xlsx");
    const list = full ? raw : filtered;
    const header = EXPORT_COLS.map((c) => c[0]);
    const cache = new Map();
    const body = list.map((r) => EXPORT_COLS.map(([, key]) => {
      if (key !== "_perUnit") return r[key];
      if (!r.comp) return "";
      const ck = r.site + "|" + r.mat + "|" + r.comp;
      if (!cache.has(ck)) cache.set(ck, pathQty(raw, r.site, r.mat, r.comp).total);
      return cache.get(ck);
    }));
    const shown = [];
    if (query.trim()) shown.push(`Search: ${query.trim()}`);
    if (activeBucket) shown.push(`Kind: ${BUCKET[activeBucket].label}`);
    writeWorkbook(XLSX, {
      slug: SLUG, which: full ? "full" : "filtered", tool: NAME,
      what: full
        ? `Every position in the extract (${raw.length}), with its quantity per parent and per finished-good unit.`
        : `The ${count(list.length, "position")} the search showed, with quantity per parent and per finished-good unit.`,
      source: `The ${CONFIG.company} sample extract, generated in your browser from seed ${CONFIG.seed}`,
      shown: full ? [] : shown,
      sheets: [{ name: full ? "BOM extract" : "Filtered positions", rows: [header, ...body] }],
    });
  };

  return (
    <div className="np-gridwrap">
      <div className="np-gridhead">
        <input className="np-in" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the extract"
          placeholder="Try  proc:F   level:>2   qty:<0   phantom   cell   spare:920060"
          style={{ flex: "1 1 300px", fontFamily: T.fontData }} />
        {query && <button type="button" className="np-btn quiet" onClick={() => setQuery("")}>Clear</button>}
        <button type="button" className="np-btn quiet" aria-expanded={showSyntax} onClick={() => setShowSyntax((s) => !s)}>Search fields</button>
        <span style={{ marginLeft: "auto" }} />
        <ExportPair fullCount={raw.length} filteredCount={filtered.length} noun="positions" onFull={() => exportWorkbook(true)} onFiltered={() => exportWorkbook(false)} />
      </div>
      {showSyntax && (
        <div className="np-gridhead" style={{ display: "block" }}>
          <p style={{ marginBottom: 8 }}>Words combine with AND. <span className="np-num" style={{ color: T.text }}>field:value</span> searches one field; a bare word searches the material, both descriptions and the component.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: "4px 18px" }}>
            {SEARCH_FIELDS_HELP.map(([f, d]) => (
              <div key={f} style={{ display: "flex", gap: 8 }}><span className="np-num" style={{ color: T.text, whiteSpace: "nowrap" }}>{f}</span><span>{d}</span></div>
            ))}
          </div>
        </div>
      )}
      <div className="np-gridhead">
        {activeBucket && (
          <button type="button" className="np-chip" aria-pressed="true" onClick={() => setActiveBucket(null)} title="Show every kind again">
            <Swatch bk={activeBucket} /> {BUCKET[activeBucket].label} ✕
          </button>
        )}
        <span>{filtered.length > CAP
          ? <>Showing the first <span className="np-num">{CAP}</span> of <span className="np-num">{nfmt(filtered.length)}</span> positions; both exports carry every one</>
          : <>Showing <span className="np-num">{nfmt(filtered.length)}</span> of <span className="np-num">{nfmt(raw.length)}</span> positions</>}</span>
      </div>
      {filtered.length === 0 ? (
        <div className="np-empty">No positions match. Clear the search or the kind filter.</div>
      ) : (
        <div className="np-scroll">
          <table className="np-grid" ref={tableRef} style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th className="pin">Description</th>
                <th>Plant</th>
                <th>Material</th>
                <th className="r">Level<Help label="Level" text={GLOSSARY.Level} /></th>
                <th>Item</th>
                <th>Component<Help label="Component" text={GLOSSARY.Component} /></th>
                <th className="r">Qty / parent<Help label="Qty per parent" text={GLOSSARY["Component Qty"]} /></th>
                <th>UoM<Help label="UoM" text={GLOSSARY.UoM} /></th>
                <th>Proc<Help label="Procurement type" text={GLOSSARY["Procurement Type"]} /></th>
                <th>MRP<Help label="MRP controller" text={GLOSSARY["MRP Controller"]} /></th>
                <th>Kind</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, CAP).map((r) => {
                const bk = classify(r);
                const neg = Number(r.qty) < 0;
                return (
                  <tr key={r.id}>
                    <td className="pin clip" title={r.compDesc || "—"}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <Swatch bk={bk} />
                        <span style={{ color: r.comp ? T.text : T.textMuted }}>{r.compDesc || "—"}</span>
                      </span>
                    </td>
                    <td className="num">{r.site}</td>
                    <td><span className="code" style={{ color: T.textSec }}>{r.mat}</span></td>
                    <td className="r num">{r.level}</td>
                    <td><span className="code" style={{ color: T.textMuted }}>{r.item}</span></td>
                    <td>{r.comp ? <span className="code">{r.comp}</span> : <span className="np-muted">—</span>}</td>
                    <td className="r num">{r.comp ? qtyText(r.qty) : ""}{neg && <> <Hint text={CREDIT}><Pill tone="quiet">credit</Pill></Hint></>}</td>
                    <td>{r.uom}</td>
                    <td className="num">{r.proc || "—"}</td>
                    <td className="num">{r.mrp || "—"}</td>
                    <td style={{ whiteSpace: "nowrap" }}><Hint text={rowReason(r, bk)}><span>{BUCKET[bk].label}</span></Hint></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Legend lead="Kind:" items={BUCKETS.map((b) => ({ label: BUCKET[b].label, swatch: BUCKET[b].swatch, note: BUCKET[b].about }))} />
    </div>
  );
}

function WhereUsedView({ raw }) {
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
  const paths = used.reduce((n, u) => n + u.paths.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 var(--np-pad)" }}>
      <label style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13, color: T.textSec }}>
        Component<Help label="Where-used" text={GLOSSARY["Where-used"]} />
        <select className="np-in" value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Component" style={{ fontFamily: T.fontData, maxWidth: "100%" }}>
          {components.map((c) => <option key={c.comp} value={c.comp}>{c.comp} — {c.desc}</option>)}
        </select>
      </label>
      <p data-role="wu-summary" style={{ fontSize: 14, color: T.textSec }}>
        <span className="np-num" style={{ color: T.text }}>{sel}</span> <span style={{ color: T.text }}>({selDesc})</span> is used in <b style={{ color: T.text, fontWeight: 600 }}>{count(used.length, "finished good")}</b> across <b style={{ color: T.text, fontWeight: 600 }}>{count(paths, "usage path")}</b>. The quantity per finished-good unit is the paths added up, plant by plant.
      </p>
      {used.map((u) => (
        <section key={u.site + u.fg} className="np-panel" style={{ margin: 0 }}>
          <div className="np-panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span className="np-num" style={{ color: T.text, fontWeight: 600 }}>{u.fg}</span>
              <span style={{ color: T.textSec, fontWeight: 400 }}>{u.fgDesc}</span>
              <Pill tone="quiet">Plant {u.site} · {CONFIG.siteNames[u.site]}</Pill>
            </span>
            <span style={{ color: T.textSec, fontWeight: 400 }}>Per finished-good unit: <b className="np-num" data-per-unit={u.site + "|" + u.fg} style={{ fontSize: 16, color: T.text }}>{qtyText(u.totalQty)}</b></span>
          </div>
          <div className="np-panel-body" style={{ display: "grid", gap: 5 }}>
            {u.paths.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 7, fontSize: 13, color: T.textSec, flexWrap: "wrap" }}>
                <span className="np-num" style={{ color: T.text, minWidth: 54 }}>×{qtyText(p.qty)}</span>
                {p.path.map((step, j) => (
                  <span key={j} style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                    {j > 0 && <span className="np-muted" aria-hidden="true">›</span>}
                    <span style={{ color: j === p.path.length - 1 ? T.text : T.textSec }}>
                      {step.desc}{step.qty != null && <span className="np-num np-muted"> ({qtyText(step.qty)})</span>}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TreeView({ raw }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 var(--np-pad)" }}>
      <label style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13, color: T.textSec }}>
        Finished good<Help label="Finished good" text={GLOSSARY["Finished Good"]} />
        <select className="np-in" value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Finished good" style={{ fontFamily: T.fontData, maxWidth: "100%" }}>
          {fgs.map((f) => <option key={f.site + f.fg} value={f.site + "|" + f.fg}>{f.fg} — {f.desc} · Plant {f.site}</option>)}
        </select>
      </label>
      <section className="np-panel" style={{ margin: 0 }}>
        <div className="np-panel-head" style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
          <span className="np-num" style={{ color: T.text, fontWeight: 600, fontSize: 15 }}>{fg}</span>
          <span style={{ color: T.textSec, fontWeight: 400 }}>{fgDesc}</span>
          <span data-role="tree-head" className="np-muted">{count(tree.length, "position")} · Plant {site} ({CONFIG.siteNames[site]})</span>
        </div>
        <div className="np-scroll" data-role="tree">
          {tree.map((r) => {
            const bk = classify(r);
            const neg = Number(r.qty) < 0;
            return (
              <div key={r.id} data-comp={r.comp || ""} data-qty={r.comp ? qtyText(r.qty) : ""} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "6px 12px",
                paddingLeft: 12 + (r.level - 1) * 24, borderBottom: `1px solid ${T.border}`, fontSize: 13,
              }}>
                {r.level > 1 && <span className="np-muted" aria-hidden="true">└</span>}
                <Swatch bk={bk} />
                <span className="np-num" style={{ color: T.textSec, minWidth: 90 }}>{r.comp || "—"}</span>
                <span style={{ flex: 1, minWidth: 0, color: r.comp ? T.text : T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.compDesc}
                  {bk === "phantom" && <> <Pill tone="quiet">Phantom</Pill></>}
                  {bk === "assembly" && <> <Pill tone="quiet">Assembly</Pill></>}
                </span>
                {r.comp && (
                  <span className="np-num" style={{ color: T.text, minWidth: 70, textAlign: "right", whiteSpace: "nowrap" }}>
                    {qtyText(r.qty)} {r.uom}{neg && <> <Hint text={CREDIT}><Pill tone="quiet">credit</Pill></Hint></>}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <div className="np-panel" style={{ margin: 0 }}>
        <Legend lead="Kind:" items={BUCKETS.map((b) => ({ label: BUCKET[b].label, swatch: BUCKET[b].swatch, note: BUCKET[b].about }))} />
      </div>
    </div>
  );
}

const VIEWS = [["search", "Search"], ["whereused", "Where-used"], ["tree", "BOM tree"]];

function Explorer() {
  const raw = useMemo(() => deriveParents(generateExtract(CONFIG)), []);
  const stats = useMemo(() => summarize(raw), [raw]);
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [activeBucket, setActiveBucket] = useState(null);
  const searched = useMemo(() => runSearch(raw, query), [raw, query]);
  const filtered = useMemo(() => (activeBucket ? searched.filter((r) => classify(r) === activeBucket) : searched), [searched, activeBucket]);

  return (
    <>
      <div className="np-part">
        <div className="np-ident">
          <h2>{CONFIG.company} · bill of materials, {count(CONFIG.sites.length, "plant")}</h2>
          <p>Loaded <b>the synthetic sample extract</b>, generated in your browser from seed {CONFIG.seed}: {count(stats.fgCount, "finished good")} across plants {CONFIG.sites.join(" and ")}, {nfmt(stats.total)} positions. No real company, plant or part.</p>
        </div>
      </div>

      <div className="np-bar">
        <div className="np-row" role="tablist" aria-label="Views">
          {VIEWS.map(([k, label]) => <button key={k} type="button" role="tab" className="np-chip" aria-selected={tab === k} aria-pressed={tab === k} onClick={() => setTab(k)}>{label}</button>)}
        </div>
      </div>

      <Intro>
        Of <b>{nfmt(stats.total)}</b> BOM positions across {count(CONFIG.sites.length, "plant")}, <b>{nfmt(stats.counts.assembly)}</b> are <Term text={GLOSSARY.Assembly}>sub-assemblies</Term>, <b>{nfmt(stats.counts.in_house)}</b> in-house and <b>{nfmt(stats.counts.purchased)}</b> purchased components, <b>{nfmt(stats.counts.phantom)}</b> <Term text={GLOSSARY.Phantom}>phantoms</Term> and <b>{nfmt(stats.counts.document)}</b> document positions.
        {" "}<b>{nfmt(stats.neg)}</b> carry a negative quantity, a by-product credit; <button type="button" className="np-btn quiet" style={{ minHeight: 22, padding: "0 6px", verticalAlign: "baseline" }} onClick={() => { setQuery("qty:<0"); setActiveBucket(null); setTab("search"); }}>show them</button>.
      </Intro>
      <HowItWorks points={[
        { lead: "The extract is one row per component position.", text: "The finished good repeats down its block and the depth is the level; a row's parent is the nearest row above it one level shallower, within the same plant and finished good." },
        { lead: "Quantity per finished good is worked out, not read.", text: "The extract's quantity is per one unit of the direct parent. The explorer multiplies down the chain to the finished good and adds up every path a part takes, so a screw reached three ways is counted three times." },
        { lead: "Where-used runs the chain backwards.", text: "For any component: every finished good it is in, each path, and the quantity per finished good, kept apart per plant, because the same part can carry a different quantity in another plant." },
        { lead: "Every position has exactly one kind.", text: "No part number, phantom, sub-assembly, purchased, in-house, or unclassified, checked in that order; the kinds add up to the total. A negative quantity is marked on whatever kind it sits in." },
        { lead: "Nothing is guessed.", text: "Document positions have no part to compute against, and a part with no procurement signal stays unclassified." },
      ]} />

      <AnswerCards>
        {BUCKETS.map((b) => (
          <AnswerCard key={b} label={<><Swatch bk={b} />{BUCKET[b].label}</>} value={nfmt(stats.counts[b])}
            tone={b === "unclassified" && stats.counts[b] > 0 ? "bad" : undefined}
            pressed={activeBucket === b} title="Press to show only these positions; press again to show all."
            onClick={() => { setActiveBucket(activeBucket === b ? null : b); setTab("search"); }}>
            {BUCKET[b].about}
          </AnswerCard>
        ))}
      </AnswerCards>

      <div style={{ marginTop: 8 }}>
        {tab === "search" && <SearchView raw={raw} query={query} setQuery={setQuery} filtered={filtered} activeBucket={activeBucket} setActiveBucket={setActiveBucket} />}
        {tab === "whereused" && <WhereUsedView raw={raw} />}
        {tab === "tree" && <TreeView raw={raw} />}
      </div>
    </>
  );
}

export default function BomExplorer() {
  return (
    <HouseFrame slug={SLUG} name={NAME} scope={SCOPE} manual={MANUAL}>
      <Explorer />
    </HouseFrame>
  );
}
