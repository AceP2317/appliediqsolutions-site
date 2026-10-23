// buildinfo — build-time facts for the footer "serial plate" (and any other
// surface that wants them). This module runs in Node during the static build
// (never in the browser), so it can ask git directly; on an environment without
// git it degrades to timestamp-only rather than failing the build.
import { execSync } from 'node:child_process';

function git(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

const builtAt = new Date();

export const buildInfo = {
  /** Short HEAD hash, or '' when git is unavailable at build time. */
  commit: git('git rev-parse --short HEAD'),
  builtAt,
  /** e.g. "2026-07-09 19:41 ET" — house convention: America/New_York. */
  builtAtLabel:
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(builtAt)
      .replace(',', '') + ' ET',
};
