/* Pieces the planning answer key shares: rounding that keeps float noise out
   of an answer, the number form the worked lines print, and the two bill-of-
   materials facts every explosion needs (is a line in force on a day, and how
   many base units one of its units is). */
import { figure } from "../format.js";

export const r6 = (x) => Math.round(x * 1e6) / 1e6;

/** A quantity for a worked line: up to four decimals, a true minus sign, zero printed. */
export function qty(n) {
  const x = r6(n);
  const digits = Number.isInteger(x) ? 0 : Math.min(4, (String(x).split(".")[1] || "").length);
  return figure(x, { zeroMeans: "zero", digits });
}

/** A quantity that may be negative, bracketed so "− (−20)" reads as arithmetic. */
export function signed(n) {
  return r6(n) < 0 ? `(${qty(n)})` : qty(n);
}

/** "YYYY-MM-DD" for a UTC day count in milliseconds. */
export function isoDay(ms) {
  return new Date(ms).toISOString().slice(0, 10); // utc-day: every lab day is held at UTC midnight, so its UTC date is the day itself
}

/** A line is in force from its first day through its last, both counted. */
export function validOn(line, day) {
  return (!line.from || line.from <= day) && (!line.to || day <= line.to);
}

/** Base units of the component in one of the line's units; refuses a unit it has no factor for. */
export function lineFactor(line, comp) {
  if (!line.uom || line.uom === comp.unit) return 1;
  const f = comp.conv && comp.conv[line.uom];
  if (!(f > 0)) throw new Error(`${comp.id} is kept in ${comp.unit} and has no factor for ${line.uom}`);
  return f;
}
