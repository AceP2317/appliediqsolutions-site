/* The planning-setting audit: each material-plant row held against its
   sourcing tier and ABC/XYZ segment. Pure: rows and a BOM map in, findings
   out, each with its dollar exposure and the sentence that explains it. */
import { dollars } from "../format.js";
import { qty } from "./shared.js";

// Target days of supply per sourcing tier.
export const TGT = {
  jit:      { l: "JIT / Release", d: 0.5 },
  local:    { l: "Local",         d: 1.5 },
  regional: { l: "Regional",      d: 3 },
  domestic: { l: "Domestic",      d: 7 },
  overseas: { l: "Overseas",      d: 30 },
  inhouse:  { l: "In-House",      d: 1 },
  unknown:  { l: "Unclassified",  d: 7 }
};

// Parameter matrix: target SS / lot / rounding (in days of supply) + lot procedure,
// per sourcing tier per ABC+XYZ segment. Illustrative targets for the demo.
export const PM = {
  overseas: { AX:{ss:7,lot:46,rnd:5,lp:"PER"},AY:{ss:10,lot:40,rnd:5,lp:"PER"},AZ:{ss:14,lot:32,rnd:5,lp:"PER"},BX:{ss:8,lot:44,rnd:10,lp:"PER"},BY:{ss:12,lot:36,rnd:10,lp:"PER"},BZ:{ss:15,lot:30,rnd:10,lp:"OPT"},CX:{ss:5,lot:50,rnd:15,lp:"OPT"},CY:{ss:8,lot:44,rnd:15,lp:"OPT"},CZ:{ss:10,lot:40,rnd:15,lp:"OPT"},_d:{ss:10,lot:40,rnd:10,lp:"OPT"} },
  domestic: { AX:{ss:2,lot:10,rnd:1,lp:"PER"},AY:{ss:3,lot:8,rnd:1,lp:"PER"},AZ:{ss:4,lot:6,rnd:2,lp:"PER"},BX:{ss:2,lot:10,rnd:2,lp:"PER"},BY:{ss:3,lot:8,rnd:2,lp:"PER"},BZ:{ss:4,lot:6,rnd:3,lp:"OPT"},CX:{ss:1,lot:12,rnd:3,lp:"OPT"},CY:{ss:2,lot:10,rnd:5,lp:"OPT"},CZ:{ss:3,lot:8,rnd:5,lp:"OPT"},_d:{ss:3,lot:8,rnd:3,lp:"OPT"} },
  regional: { AX:{ss:.5,lot:5,rnd:.5,lp:"L4L"},AY:{ss:1,lot:4,rnd:.5,lp:"PER"},AZ:{ss:1.5,lot:3,rnd:1,lp:"PER"},BX:{ss:.5,lot:5,rnd:1,lp:"PER"},BY:{ss:1,lot:4,rnd:1,lp:"PER"},BZ:{ss:1.5,lot:3,rnd:1,lp:"OPT"},CX:{ss:.5,lot:5,rnd:2,lp:"OPT"},CY:{ss:1,lot:4,rnd:2,lp:"OPT"},CZ:{ss:1.5,lot:3,rnd:2,lp:"OPT"},_d:{ss:1,lot:4,rnd:1,lp:"PER"} },
  local:    { AX:{ss:.25,lot:2.5,rnd:0,lp:"L4L"},AY:{ss:.5,lot:2,rnd:0,lp:"L4L"},AZ:{ss:.75,lot:1.5,rnd:.5,lp:"PER"},BX:{ss:.25,lot:2.5,rnd:.5,lp:"L4L"},BY:{ss:.5,lot:2,rnd:.5,lp:"PER"},BZ:{ss:.75,lot:1.5,rnd:.5,lp:"PER"},CX:{ss:.25,lot:3,rnd:1,lp:"OPT"},CY:{ss:.5,lot:2.5,rnd:1,lp:"OPT"},CZ:{ss:.75,lot:2,rnd:1,lp:"OPT"},_d:{ss:.5,lot:2,rnd:.5,lp:"PER"} },
  jit:      { AX:{ss:0,lot:1,rnd:0,lp:"L4L"},AY:{ss:.1,lot:.8,rnd:0,lp:"L4L"},AZ:{ss:.25,lot:.5,rnd:0,lp:"L4L"},BX:{ss:0,lot:1,rnd:0,lp:"L4L"},BY:{ss:.1,lot:.8,rnd:0,lp:"L4L"},BZ:{ss:.25,lot:.5,rnd:0,lp:"L4L"},CX:{ss:0,lot:1,rnd:0,lp:"L4L"},CY:{ss:.1,lot:1,rnd:0,lp:"L4L"},CZ:{ss:.25,lot:1,rnd:0,lp:"L4L"},_d:{ss:.1,lot:.8,rnd:0,lp:"L4L"} },
  inhouse:  { AX:{ss:.25,lot:2,rnd:0,lp:"L4L"},AY:{ss:.5,lot:2,rnd:0,lp:"L4L"},AZ:{ss:1,lot:2,rnd:0,lp:"L4L"},BX:{ss:.25,lot:3,rnd:0,lp:"L4L"},BY:{ss:.5,lot:3,rnd:0,lp:"L4L"},BZ:{ss:1,lot:3,rnd:0,lp:"L4L"},CX:{ss:0,lot:5,rnd:0,lp:"MAKE"},CY:{ss:0,lot:5,rnd:0,lp:"MAKE"},CZ:{ss:.5,lot:5,rnd:0,lp:"MAKE"},_d:{ss:.5,lot:3,rnd:0,lp:"L4L"} }
};
PM.unknown = PM.domestic;

// Rule catalog: code -> display name
export const RN = { SS:"Safety Stock \u0394", MOQ:"MOQ Review", RND:"Rounding \u0394", LP:"Lot Procedure \u0394", PTF:"Time Fence", DEAD:"Dead Stock", OVER:"Overstocked", UNDER:"Understocked", CLS:"Missing Class.", BLK:"Blocked Stock", PO_SS:"Phase-Out + SS", OBSOL:"Lifecycle Obsolete", PI_NO:"Phase-In No Stock", STRCR:"Structural Crit.", PHNTM:"Phantom Params" };

export const NON_US = new Set("DE,IT,TR,MX,CN,TW,SI,ES,AT,FR,CH,CA,PL,TH,SK,CZ,PT,NL,JP,KR,IN,BR,GB,SE,HU,RO,VN,MY".split(","));

// Stable content-derived id (cyrb53-lite) — never index-derived.
export function cid(s) { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); }

export function classifyHALB(row) {
  const mc = String(row["MRP Controller"] || "").trim();
  const proc = String(row["Procurement Type"] || "").trim();
  if (mc === "UFB") return "phantom";
  if (proc === "F") return "external";
  return "counted";
}

export function classifyGeo(row, ctx) {
  const proc = String(row["Procurement Type"] || "").trim();
  if (proc === "E") { return String(row["MRP Controller"] || "").trim() === "UFB" ? "phantom" : "inhouse"; }
  if (proc !== "F") return "unknown";
  const sup = String(row["Supplier"] || "").trim();
  if (ctx.jitSet.has(sup)) return "jit";
  if (ctx.localSet.has(sup)) return "local";
  if (ctx.regSet.has(sup)) return "regional";
  const c1 = String(row["Country Goods Suppl."] || "").trim().toUpperCase();
  const c2 = String(row["Country/Region Key"] || "").trim().toUpperCase();
  const c = c1 || c2;
  if (!c || c === "NAN" || c === "UNDEFINED") return "unknown";
  if (c === "US") return "domestic";
  if (NON_US.has(c) || c.length === 2) return "overseas";
  return "unknown";
}

// BOM keyed (plant, material) — never material alone.
export function processBOM(rows, ctx) {
  const map = {}; const pDesc = {}; let curSku = "", curPlant = "";
  for (const row of rows) {
    const lv = row["Level"];
    if (lv != null && typeof lv === "string" && isNaN(Number(lv))) {
      curSku = String(row["SKU"] || "").trim(); curPlant = String(row["Plant"] || "").trim();
      if (curSku && !pDesc[curSku]) pDesc[curSku] = String(row["Material Description"] || "").trim().substring(0, 48);
      continue;
    }
    const mat = row["Material"]; if (mat == null) continue;
    const plant = String(row["Plant"] || curPlant || "").trim();
    const key = plant + "::" + String(mat).trim();
    if (!map[key]) map[key] = { parents: new Set(), act: 0, po: 0, pop: 0, pip: 0, repl: false, topP: {} };
    const m = map[key];
    if (curSku) { m.parents.add(curSku); m.topP[curSku] = (m.topP[curSku] || 0) + (Number(row["Quantity"]) || 0); }
    const st = String(row["Status"] || "");
    if (st === "Active") m.act++; else if (st === "Phased Out") m.po++; else if (st === "Phase-Out Planned") m.pop++; else if (st === "Phase-In Planned") m.pip++;
    if (row["Replaces / Replaced By"] != null) m.repl = true;
  }
  const r = {};
  for (const [key, m] of Object.entries(map)) {
    const sortedP = Object.entries(m.topP).sort((a, b) => b[1] - a[1]);
    r[key] = { pc: m.parents.size, act: m.act, po: m.po, pop: m.pop, pip: m.pip, repl: m.repl, top3: sortedP.slice(0, 3).map(e => e[0]), allParents: sortedP.map(([sku, qty]) => ({ sku, desc: pDesc[sku] || "", qty })), allOut: m.act === 0 && (m.po > 0 || m.pop > 0) };
  }
  return r;
}

// Main audit. ctx = { rows, bomMap, jitSet, localSet, regSet }. Returns findings[] (raw floats).
export function runAudit(ctx) {
  const CC = ["Con.quantity act.month","Con.quantity act.month+1","Con.quantity act.month+2","Con.quantity act.month+3","Con.quantity act.month+4","Con.quantity act.month+5"];
  const out = [];
  const push = (rule, base, o) => out.push({ ...base, rule, fid: cid(base.pl + "|" + base.mat + "|" + rule), ...o });
  for (const row of ctx.rows) {
    const mat = String(row["Material"] || "").trim();
    const pl = String(row["Plant"] || "").trim();
    const desc = String(row["Material Description"] || "").trim().substring(0, 50);
    const abc = String(row["ABC Indicator"] || "").trim();
    const xyz = String(row["XYZ"] || "").trim();
    const proc = String(row["Procurement Type"] || "").trim();
    const mtyp = String(row["Material Type"] || "").trim();
    const mc = String(row["MRP Controller"] || "").trim();
    const mcn = String(row["MRP controller name"] || "").trim().substring(0, 22);
    const lp = String(row["Lot Sizing Procedure"] || "").trim();
    const sup = String(row["Supplier"] || "").trim();
    const supN = String(row["Name 1"] || "").trim();
    const ctry = String(row["Country/Region Key"] || "").trim();
    const uom = String(row["Base Unit of Measure"] || "PC").trim();
    const mrpType = String(row["MRP Type"] || "").trim();
    const ptf = Number(row["Planning time fence"]) || 0;
    const ss = Number(row["Safety Stock"]) || 0;
    const stk = Number(row["Total Stock"]) || 0;
    const sv = Number(row["Stock value"]) || 0;
    const ml = Number(row["Minimum Lot Size"]) || 0;
    const rv = Number(row["Rounding value"]) || 0;
    const price = Number(row["Moving price"]) || 0;
    const bv = Number(row["Value blocked sto"]) || 0;
    const cq = CC.map(c => Number(row[c]) || 0);
    const tc = cq.reduce((a, b) => a + b, 0);
    const am = tc / 6, daily = am / 30;
    const uc = stk > 0 ? sv / stk : price;          // full precision, round at display
    const mos = am > 0 ? stk / am : (stk > 0 ? 999 : 0);
    if (am === 0 && stk === 0 && bv === 0) continue;

    const geo = classifyGeo(row, ctx);
    const bom = ctx.bomMap ? ctx.bomMap[pl + "::" + mat] : null;
    const pc = bom ? bom.pc : 0;

    if (geo === "phantom") {
      if ((ss > 0 || ml > 0) && am > 0) {
        const base = mkBase({ mat, pl, desc, proc, mc, mcn, lp, abc, xyz, ss, stk, sv, ml, rv, ptf, mrpType, geo, geoL: "Phantom", tDays: 0, seg: "\u2014", sup, supN, ctry, uom, uc: 0, am: 0, daily: 0, mos: 0, pc, critMult: 1, rSS: 0, rRnd: 0, rLP: "", cAvgV: 0, rAvgV: 0, invD: 0, bv: 0, isPhantom: true, isND: false, halbType: "phantom", allOut: false, hasPIP: false, hasPOP: false, hasRepl: false, top3: bom ? bom.top3 : [], allParents: bom ? bom.allParents : [], cq });
        push("PHNTM", base, { sev: "LOW", exp: 0, dir: "CLEAN", act: "Phantom assembly carries SS=" + Math.round(ss) + ", MinLot=" + Math.round(ml) + " — planning ignores these. Zero them out in the item master.", det: "Phantom assemblies explode straight to components; their own planning parameters are never used." });
      }
      continue;
    }

    const halbType = mtyp === "HALB" ? classifyHALB(row) : "n/a";
    const abcN = "ABC".includes(abc) && abc ? abc : "";
    const xyzN = "XYZ".includes(xyz) && xyz ? xyz : "";
    const seg = abcN && xyzN ? abcN + xyzN : "_d";
    const matrix = PM[geo] || PM.unknown;
    const params = matrix[seg] || matrix._d;
    const tgt = TGT[geo] || TGT.unknown;
    const rSS = Math.ceil(daily * params.ss);
    const rLot = Math.max(1, Math.ceil(daily * params.lot));
    const rRnd = Math.max(0, Math.ceil(daily * params.rnd));
    const rLP = params.lp;
    const cAvg = ss + (ml > 0 ? ml / 2 : (rv > 0 ? rv / 2 : 0));
    const rAvg = rSS + rLot / 2;
    const cAvgV = cAvg * uc, rAvgV = rAvg * uc, invD = cAvgV - rAvgV;
    const isND = mrpType === "ND";
    const critMult = pc >= 20 ? 1.5 : pc >= 5 ? 1.2 : 1.0;
    const allOut = bom ? bom.allOut : false, hasPIP = bom ? bom.pip > 0 : false, hasPOP = bom ? bom.pop > 0 : false, hasRepl = bom ? bom.repl : false;
    const isExternal = proc === "F";

    const base = mkBase({ mat, pl, desc, proc, mc, mcn, lp, abc: abcN || "\u2014", xyz: xyzN || "\u2014", ss, stk, sv, ml, rv, ptf, mrpType, geo, geoL: tgt.l, tDays: tgt.d, seg: seg === "_d" ? "\u2014" : seg, sup, supN, ctry, uom, uc, am, daily, mos: Math.min(mos, 999), pc, critMult, rSS, rRnd, rLP, cAvgV, rAvgV, invD, bv, isPhantom: false, isND, halbType, allOut, hasPIP, hasPOP, hasRepl, top3: bom ? bom.top3 : [], allParents: bom ? bom.allParents : [], cq });

    // ---- Parameter findings (external procurement, MRP active) ----
    if (isExternal && am > 0 && !isND) {
      const adjRSS = Math.ceil(rSS * critMult), ssG = adjRSS - ss;
      if (Math.abs(ssG) > daily * 0.5) {
        const ssev = abcN === "A" ? (ss === 0 ? "CRITICAL" : "HIGH") : (ss === 0 && abcN === "B" ? "HIGH" : (pc >= 20 && ss === 0 ? "HIGH" : "MEDIUM"));
        const cn = pc >= 20 ? " [critical: " + pc + " parents]" : (pc >= 5 ? " [" + pc + " parents]" : "");
        push("SS", base, { sev: ssev, exp: Math.abs(ssG) * uc, dir: ssG > 0 ? "INCREASE" : "DECREASE", act: "Safety Stock: " + Math.round(ss) + " \u2192 " + Math.round(adjRSS) + " " + uom + ". Target " + params.ss + "d \u00d7 " + critMult + "x = " + (params.ss * critMult).toFixed(1) + "d for " + tgt.l + " " + (seg !== "_d" ? seg : "") + "." + cn, det: ss === 0 ? "No safety stock buffer on an active item." : "Current buffer " + (daily > 0 ? (ss / daily).toFixed(1) : "0") + "d vs " + (params.ss * critMult).toFixed(1) + "d target." });
      }
      if (ml > 0 && daily > 0 && ml > daily * params.lot * 3) {
        push("MOQ", base, { sev: ml > daily * params.lot * 5 ? "HIGH" : "MEDIUM", exp: (ml - daily * params.lot) * uc / 2, dir: "NEGOTIATE", act: "Min lot " + Math.round(ml) + " " + uom + " = " + (ml / daily).toFixed(1) + "d/order vs " + params.lot + "d target. Verify supplier agreement; negotiate or consign if supplier-imposed.", det: "Each order lands " + (ml / daily).toFixed(1) + " days of supply. MOQ treated as a constraint, not a unilateral change." });
      }
      if (rv > 0 && daily > 0 && Math.abs(rv - rRnd) > daily) {
        push("RND", base, { sev: rv > rRnd * 3 ? "HIGH" : "MEDIUM", exp: Math.abs(rv - rRnd) * uc / 2, dir: "REVIEW", act: "Rounding " + Math.round(rv) + " " + uom + " = " + (rv / daily).toFixed(1) + "d/order vs " + params.rnd + "d target. If packaging-driven, verify pack size; else reset to " + Math.round(rRnd) + ".", det: "Rounding often reflects a pack/pallet unit — confirm before changing." });
      }
      if (rLP && lp !== rLP) {
        push("LP", base, { sev: "MEDIUM", exp: 0, dir: "CHANGE", act: "Lot procedure: " + (lp || "(blank)") + " \u2192 " + rLP + " for " + tgt.l + " " + (abcN || "") + "-class.", det: rLP === "PER" ? "Period lot sizing — responsive to delivery frequency." : rLP === "L4L" ? "Lot-for-lot — minimal inventory." : rLP === "OPT" ? "Optimized — consolidates orders." : "Recommended for segment." });
      }
      if (ptf === 0) {
        const recPtf = geo === "overseas" ? 45 : geo === "domestic" ? 10 : geo === "regional" ? 7 : geo === "local" ? 3 : geo === "jit" ? 1 : 5;
        push("PTF", base, { sev: abcN === "A" ? "HIGH" : "MEDIUM", exp: 0, dir: "SET", act: "Planning time fence 0 \u2192 " + recPtf + "d. A zero fence lets planning churn orders inside lead time.", det: "No firm horizon — the planning run reschedules freely, creating noise." });
      } else if (ptf >= 333) {
        push("PTF", base, { sev: "MEDIUM", exp: 0, dir: "REDUCE", act: "Planning time fence " + ptf + "d \u2192 review. An over-long fence suppresses real demand signals.", det: ptf + "-day fence blocks the planning run from responding to demand." });
      }
    }

    // ---- In-house counted subassemblies (ABC-A buffer) ----
    if (proc === "E" && geo === "inhouse" && am > 0 && !isND) {
      const ihAdj = Math.ceil(rSS * critMult), ihG = ihAdj - ss;
      if (Math.abs(ihG) > daily * 0.5 && abcN === "A") {
        push("SS", base, { sev: ss === 0 ? "HIGH" : "MEDIUM", exp: Math.abs(ihG) * uc, dir: ihG > 0 ? "INCREASE" : "DECREASE", act: "Safety Stock: " + Math.round(ss) + " \u2192 " + Math.round(ihAdj) + " " + uom + ". In-house ABC-A target " + (params.ss * critMult).toFixed(1) + "d for production variability.", det: "Counted subassembly produced in-house; ABC-A needs a buffer against line variability." });
      }
    }

    // ---- Inventory-health findings (all types) ----
    if (stk > 0 && tc === 0) {
      push("DEAD", base, { sev: "MEDIUM", exp: sv, dir: "REVIEW", act: Math.round(stk) + " " + uom + " (" + fmt(sv) + ") with zero consumption over 6 months." + (isND ? " Disposition: scrap / transfer / return." : " Set to No-MRP, then disposition."), det: "Stagnant stock." + (allOut ? " All BOM positions phased out — obsolescence signal." : "") });
    }
    if (am > 0 && mos > 6 && isExternal && !isND) {
      const eq = Math.max(0, stk - (am * tgt.d / 30 * 1.5)), ev = eq * uc;
      if (ev > 100) push("OVER", base, { sev: "HIGH", exp: ev, dir: "REDUCE", act: mos.toFixed(1) + "mo on hand vs " + tgt.d + "d target. Excess ~" + Math.ceil(eq) + " " + uom + " (" + fmt(ev) + ").", det: tgt.l + " items should target " + tgt.d + " days of supply." });
    }
    if (am > 0 && mos > 0 && mos < 1 && ss === 0 && isExternal && !isND) {
      push("UNDER", base, { sev: "CRITICAL", exp: am * uc, dir: "URGENT", act: "Only " + mos.toFixed(1) + "mo supply and no safety stock. Expedite and set SS = " + Math.ceil(rSS * critMult) + " " + uom + "." + (pc >= 10 ? " Affects " + pc + " parent SKUs." : ""), det: am.toFixed(0) + " " + uom + "/mo consumption." + (pc > 0 ? " Parents: " + (base.top3 || []).slice(0, 3).join(", ") : "") });
    }
    if (am > 0 && (!abcN || !xyzN) && isExternal && !isND) {
      push("CLS", base, { sev: "LOW", exp: 0, dir: "CLASSIFY", act: "Missing " + (!abcN ? "ABC" : "") + (!abcN && !xyzN ? " & " : "") + (!xyzN ? "XYZ" : "") + " class. Run the analysis; defaults are being used until then.", det: "Cannot tune parameters without segmentation." + (pc > 0 ? " Feeds " + pc + " SKUs." : "") });
    }
    if (bv > 1000) {
      push("BLK", base, { sev: "MEDIUM", exp: bv, dir: "REVIEW", act: fmt(bv) + " in blocked stock — review to release, return, or scrap.", det: "Blocked stock tying up working capital." });
    }

    // ---- Lifecycle findings (BOM-driven; honest gap when no linkage) ----
    if (bom) {
      if (hasPOP && ss > 0 && am > 0) {
        push("PO_SS", base, { sev: "HIGH", exp: ss * uc, dir: "REDUCE", act: "Phase-out planned but SS=" + Math.round(ss) + ". Wind safety stock to 0; on-hand covers " + (am > 0 ? (stk / am).toFixed(1) : "\u221e") + "mo.", det: bom.pop + " position(s) phasing out." + (hasRepl ? " Replacement exists." : "") });
      }
      if (allOut && stk > 0 && !isND) {
        push("OBSOL", base, { sev: "HIGH", exp: sv, dir: "DISPOSE", act: "All BOM positions retired but " + Math.round(stk) + " " + uom + " (" + fmt(sv) + ") on hand. Set No-MRP and disposition.", det: bom.po + " phased out, " + bom.pop + " phase-out planned." + (hasRepl ? " Supersession exists." : "") });
      }
      if (hasPIP && stk === 0 && !isND && isExternal) {
        push("PI_NO", base, { sev: "HIGH", exp: 0, dir: "PREPARE", act: "Phase-in planned but zero stock. Initiate procurement before the phase-in date.", det: bom.pip + " position(s) phase-in planned." });
      }
      if (pc >= 20 && abcN === "C" && am > 0 && !isND) {
        push("STRCR", base, { sev: "MEDIUM", exp: 0, dir: "REVIEW", act: "ABC-C but feeds " + pc + " parent SKUs — structurally critical. Consider reclassifying to B/A. Top: " + (base.top3 || []).join(", "), det: "A stockout here cascades across " + pc + " SKUs." });
      }
    }
  }
  return out;
}

export function mkBase(o) { return o; }
// Rounding happens here, at display, never in the arithmetic above.
const days = (n) => `${qty(n)} day${n === 1 ? "" : "s"}`;
export function fmt(v) { return dollars(v, { empty: "\u2014" }); }

/* EVERY RULE CARRIES ITS PUBLIC SOURCE OR STAYS OUT OF THE TASK SET. A source
   is a page that was opened and read, quoted word for word in `says`. The
   thresholds and day targets are this audit's own policy, which a task states
   in its question; the source backs the rule's reasoning, never its numbers. A
   rule with no source read stays here, because the demo still paints it. */
const SAP_COVERAGE = "https://help.sap.com/saphelp_46c/helpdata/en/f4/7d2cff44af11d182b40000e829fbfe/content.htm";
const SAP_LOT_SIZE = "https://help.sap.com/saphelp_46C/helpdata/EN/c1/37595c449a11d188fe0000e8322f96/content.htm";
const ORACLE_MODIFIERS = "https://docs.oracle.com/cd/A60725_05/html/comnls/us/mrp/ordmod.htm";
export const SOURCES_READ = "2026-11-25";
export const RULE_KEY = {
  SS: { sources: [{ url: SAP_COVERAGE, says: "Average daily requirements * target range of coverage" }] },
  MOQ: { sources: [{ url: SAP_LOT_SIZE, says: "this leads to an excessive average stock level which incurs unnecessary costs" }] },
  RND: { sources: [{ url: ORACLE_MODIFIERS, says: "may suggest a planned order for more than what is actually needed" }] },
  LP: { outOfTaskSet: "No page read ties a lot-sizing procedure to a sourcing tier and class, so the mapping is this audit's own convention." },
  PTF: { sources: [{ url: "https://help.sap.com/SAPHelp_46c/helpdata/EN/f4/7d30a944af11d182b40000e829fbfe/content.htm", says: "Within the planning time fence, the system does not automatically change procurement proposals" }] },
  DEAD: { sources: [{ url: SAP_LOT_SIZE, says: "Slow-moving items incur costs without being of any use" }] },
  OVER: { sources: [{ url: SAP_COVERAGE, says: "If the maximum range of coverage is exceeded, the system will display an exception message" }] },
  UNDER: { sources: [{ url: SAP_COVERAGE, says: "The system checks whether the statistical range of coverage is below the minimum range of coverage" }] },
  CLS: { outOfTaskSet: "It reports a missing class rather than arithmetic, and no page read says what an unclassified item should default to." },
  BLK: { sources: [{ url: "https://help.sap.com/saphelp_46c/helpdata/en/f4/7d27aa44af11d182b40000e829fbfe/content.htm", says: "whether stock in transfer, blocked stock and restricted-use stock are included" }] },
  PO_SS: { outOfTaskSet: "No source read yet for winding safety stock down on a phase-out." },
  OBSOL: { outOfTaskSet: "No source read yet for calling stock obsolete when every bill position is retired." },
  PI_NO: { outOfTaskSet: "No source read yet for the phase-in-without-stock rule." },
  STRCR: { outOfTaskSet: "No source read yet for reclassifying a C item by how many parents it feeds." },
  PHNTM: { sources: [
    { url: "https://help.sap.com/saphelp_470/helpdata/EN/ea/e9b47a4c7211d189520000e829fbbd/content.htm", says: "planned orders or purchase requisitions are created only for these components" },
    { url: ORACLE_MODIFIERS, says: "ignores order modifiers for items that have a phantom supply type" },
  ] },
};
export const TASK_RULES = Object.keys(RULE_KEY).filter((k) => RULE_KEY[k].sources).sort();

/** One material row through every task-set rule, test by test. Its answer is the sorted list of rules that fire. */
export function workAuditRow(row, ctx) {
  const CC = ["Con.quantity act.month", "Con.quantity act.month+1", "Con.quantity act.month+2", "Con.quantity act.month+3", "Con.quantity act.month+4", "Con.quantity act.month+5"];
  const S = (k) => String(row[k] || "").trim();
  const N = (k) => Number(row[k]) || 0;
  const mat = S("Material"), pl = S("Plant"), abc = S("ABC Indicator"), xyz = S("XYZ");
  const proc = S("Procurement Type"), sup = S("Supplier"), mrpType = S("MRP Type");
  const uom = String(row["Base Unit of Measure"] || "PC").trim();
  const ptf = N("Planning time fence"), ss = N("Safety Stock"), stk = N("Total Stock"), sv = N("Stock value");
  const ml = N("Minimum Lot Size"), rv = N("Rounding value"), price = N("Moving price"), bv = N("Value blocked sto");
  const cq = CC.map((c) => Number(row[c]) || 0);
  const tc = cq.reduce((a, b) => a + b, 0), am = tc / 6, daily = am / 30;
  const uc = stk > 0 ? sv / stk : price;
  const mos = am > 0 ? stk / am : (stk > 0 ? 999 : 0);
  const fired = new Set(), lines = [];
  const done = () => {
    const answer = [...fired].sort();
    lines.push(`Findings among the sourced rules: ${answer.length ? answer.join(", ") : "none"}.`);
    return { answer, lines };
  };
  lines.push(`${mat} at plant ${pl}: six months' use ${cq.map(qty).join(" + ")} = ${qty(tc)} ${uom}; a month is ${qty(tc)} \u00f7 6 = ${qty(am)}; a day is ${qty(am)} \u00f7 30 = ${qty(daily)}. Stock ${qty(stk)} ${uom}, valued ${fmt(sv)}.`);
  if (am === 0 && stk === 0 && bv === 0) { lines.push("No use, no stock and nothing blocked: no rule reads this row."); return done(); }

  const geo = classifyGeo(row, ctx);
  if (geo === "phantom") {
    const f = (ss > 0 || ml > 0) && am > 0;
    lines.push(`Made in-house under the phantom controller: a phantom, planned straight through to its components. Safety stock ${qty(ss)} and minimum lot ${qty(ml)}: ${f ? "a used phantom carrying either is a phantom finding (PHNTM)" : "nothing to clear"}.`);
    if (f) fired.add("PHNTM");
    return done();
  }
  const tgt = TGT[geo] || TGT.unknown;
  const why = proc === "E" ? "made in-house"
    : proc !== "F" ? `procurement type "${proc}" is neither bought nor made`
    : ctx.jitSet.has(sup) ? `bought from ${sup}, on the release-supplier list`
    : ctx.localSet.has(sup) ? `bought from ${sup}, on the local list`
    : ctx.regSet.has(sup) ? `bought from ${sup}, on the regional list`
    : `bought from ${sup || "an unnamed supplier"}, shipping from ${S("Country Goods Suppl.") || S("Country/Region Key") || "no country given"}`;
  const abcN = "ABC".includes(abc) && abc ? abc : "", xyzN = "XYZ".includes(xyz) && xyz ? xyz : "";
  const seg = abcN && xyzN ? abcN + xyzN : "_d";
  const params = (PM[geo] || PM.unknown)[seg] || (PM[geo] || PM.unknown)._d;
  const bom = ctx.bomMap ? ctx.bomMap[pl + "::" + mat] : null;
  const pc = bom ? bom.pc : 0;
  const critMult = pc >= 20 ? 1.5 : pc >= 5 ? 1.2 : 1.0;
  const rSS = Math.ceil(daily * params.ss), rRnd = Math.max(0, Math.ceil(daily * params.rnd));
  const isND = mrpType === "ND", isExternal = proc === "F";
  lines.push(`Tier: ${tgt.l}, because it is ${why}; target ${days(tgt.d)} of supply.`);
  lines.push(`Class ${seg === "_d" ? "missing, so the tier's default row applies" : seg}: safety stock ${days(params.ss)}, lot ${days(params.lot)}, rounding ${days(params.rnd)}. It feeds ${pc} parent${pc === 1 ? "" : "s"}, so the safety-stock multiplier is ${qty(critMult)}.`);

  if (isExternal && am > 0 && !isND) {
    const adj = Math.ceil(rSS * critMult), gap = adj - ss, half = daily * 0.5;
    const f = Math.abs(gap) > half;
    lines.push(`Safety stock: target \u2308${qty(daily)} \u00d7 ${qty(params.ss)}\u2309 = ${qty(rSS)}, \u00d7 ${qty(critMult)} rounded up = ${qty(adj)}; current ${qty(ss)}, a gap of ${qty(gap)}, ${f ? "more" : "not more"} than half a day's use (${qty(half)}): ${f ? "finding SS" : "no finding"}.`);
    if (f) fired.add("SS");
    if (ml > 0 && daily > 0) {
      const cap = daily * params.lot * 3, m = ml > cap;
      lines.push(`Minimum lot ${qty(ml)} against three lots' worth, ${qty(daily)} \u00d7 ${qty(params.lot)} \u00d7 3 = ${qty(cap)}: ${m ? "above it, finding MOQ" : "not above it, no finding"}.`);
      if (m) fired.add("MOQ");
    } else lines.push("Minimum lot: none set, so no minimum-lot finding.");
    if (rv > 0 && daily > 0) {
      const d = Math.abs(rv - rRnd), f2 = d > daily;
      lines.push(`Rounding ${qty(rv)} against the target \u2308${qty(daily)} \u00d7 ${qty(params.rnd)}\u2309 = ${qty(rRnd)}: apart by ${qty(d)}, ${f2 ? "more" : "not more"} than one day's use (${qty(daily)}): ${f2 ? "finding RND" : "no finding"}.`);
      if (f2) fired.add("RND");
    } else lines.push("Rounding: none set, so no rounding finding.");
    const p0 = ptf === 0, pLong = ptf >= 333;
    lines.push(`Planning time fence ${qty(ptf)} days: ${p0 ? "zero, finding PTF" : pLong ? "333 days or more, finding PTF" : "above zero and under 333, no finding"}.`);
    if (p0 || pLong) fired.add("PTF");
  } else if (proc === "E" && geo === "inhouse" && am > 0 && !isND) {
    const adj = Math.ceil(rSS * critMult), gap = adj - ss, half = daily * 0.5;
    const f = Math.abs(gap) > half && abcN === "A";
    lines.push(`Made in-house: only an A-class item gets a safety-stock target. Target \u2308${qty(daily)} \u00d7 ${qty(params.ss)}\u2309 = ${qty(rSS)}, \u00d7 ${qty(critMult)} rounded up = ${qty(adj)}; current ${qty(ss)}, gap ${qty(gap)} against half a day's use (${qty(half)}); class ${abcN || "none"}: ${f ? "finding SS" : "no finding"}.`);
    if (f) fired.add("SS");
  } else {
    lines.push(`The setting rules read only an item in planning with use, bought or made: this one is ${am === 0 ? "unused" : isND ? "set to no planning" : "neither"}, so none apply.`);
  }
  const dead = stk > 0 && tc === 0;
  lines.push(`Dead stock: ${dead ? `${qty(stk)} ${uom} on hand with no use in six months, finding DEAD` : stk > 0 ? "in use, no finding" : "nothing on hand, no finding"}.`);
  if (dead) fired.add("DEAD");
  if (am > 0 && isExternal && !isND) {
    const months = Math.min(mos, 999);
    if (mos > 6) {
      const keep = am * tgt.d / 30 * 1.5, eq = Math.max(0, stk - keep), ev = eq * uc, f = ev > 100;
      lines.push(`Overstock: ${qty(stk)} \u00f7 ${qty(am)} = ${qty(months)} months on hand, over six. Keep ${qty(am)} \u00d7 ${qty(tgt.d)} \u00f7 30 \u00d7 1.5 = ${qty(keep)}; excess ${qty(eq)} \u00d7 unit cost ${qty(uc)} = ${qty(ev)}, ${f ? "over $100: finding OVER" : "not over $100: no finding"}.`);
      if (f) fired.add("OVER");
    } else lines.push(`Overstock: ${qty(months)} months on hand, not over six, no finding.`);
    const u = mos > 0 && mos < 1 && ss === 0;
    lines.push(`Understock: ${qty(months)} months on hand${mos > 0 && mos < 1 ? ", under one," : ", not between zero and one,"} with safety stock ${qty(ss)}: ${u ? "finding UNDER" : "no finding"}.`);
    if (u) fired.add("UNDER");
  }
  const b = bv > 1000;
  lines.push(`Blocked stock valued ${fmt(bv)}: ${b ? "over $1,000, finding BLK" : "not over $1,000, no finding"}.`);
  if (b) fired.add("BLK");
  return done();
}
