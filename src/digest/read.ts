import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, Night, ReadNight, RunStatus } from './types.js';

const STATUSES: RunStatus[] = ['ok', 'retry', 'fail'];

type Line = { at: string; job: string; status: RunStatus; owner: string | null; error?: string };

function parseLine(text: string): Line | null {
  try {
    const o = JSON.parse(text);
    if (typeof o?.at !== 'string' || typeof o?.job !== 'string' || !STATUSES.includes(o?.status)) return null;
    return { at: o.at, job: o.job, status: o.status, owner: typeof o.owner === 'string' ? o.owner : null, error: typeof o.error === 'string' ? o.error : undefined };
  } catch {
    return null;
  }
}

export const readNight: ReadNight = (runsDir, night) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  const path = join(runsDir, `${night}.jsonl`);
  if (!existsSync(path)) return null;

  const byJob = new Map<string, DigestRow>();
  let badLines = 0;
  for (const text of readFileSync(path, 'utf8').split('\n')) {
    if (text.trim() === '') continue;
    const line = parseLine(text);
    if (!line) {
      badLines++;
      continue;
    }
    const row = byJob.get(line.job);
    if (!row) {
      byJob.set(line.job, {
        job: line.job,
        owner: line.owner,
        runs: 1,
        retries: line.status === 'retry' ? 1 : 0,
        lastStatus: line.status,
        lastError: line.error ?? null,
        firstAt: line.at,
        lastAt: line.at,
      });
      continue;
    }
    row.runs++;
    if (line.status === 'retry') row.retries++;
    if (line.at < row.firstAt) row.firstAt = line.at;
    if (line.at >= row.lastAt) {
      row.lastAt = line.at;
      row.lastStatus = line.status;
      if (line.error !== undefined) row.lastError = line.error;
      if (line.owner !== null) row.owner = line.owner;
    }
    if (row.owner === null) row.owner = line.owner;
  }
  const rows = [...byJob.values()].sort((a, b) => a.job.localeCompare(b.job));
  return { night, rows, badLines } satisfies Night;
};
