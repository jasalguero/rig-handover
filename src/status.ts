import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { readNight } from './digest/read.js';
import { lastBeat, type Beat } from './heartbeat.js';

// Counts per night, taken from the digest rows (not per log line):
// ok = rows whose lastStatus is ok, retry = sum of row retries, fail = rows whose lastStatus is fail.
export type NightSummary = {
  night: string;
  counts: { ok: number; retry: number; fail: number } | null;
};

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightSummary[];
};

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

function summarize(runsDir: string, night: string): NightSummary {
  const n = readNight(runsDir, night);
  if (!n) return { night, counts: null };
  return {
    night,
    counts: {
      ok: n.rows.filter((r) => r.lastStatus === 'ok').length,
      retry: n.rows.reduce((sum, r) => sum + r.retries, 0),
      fail: n.rows.filter((r) => r.lastStatus === 'fail').length,
    },
  };
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((night) => summarize(config.runsDir, night)),
  };
}
