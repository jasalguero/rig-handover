import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const n = readNight('runs', '2026-10-28');
    expect(n?.rows).toHaveLength(5);
    expect(n?.badLines).toBe(1);
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '2000-01-01')).toBeNull();
  });

  it('keeps null owners and survives bad lines', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    writeFileSync(
      join(dir, '2026-01-01.jsonl'),
      '{"at":"2026-01-01T01:00:00Z","job":"a","status":"retry","owner":null,"error":"x"}\nnot json\n{"at":"2026-01-01T02:00:00Z","job":"a","status":"ok","owner":null}\n',
    );
    const n = readNight(dir, '2026-01-01');
    expect(n?.badLines).toBe(1);
    expect(n?.rows[0]).toMatchObject({ job: 'a', owner: null, runs: 2, retries: 1, lastStatus: 'ok', lastError: 'x' });
  });
});
