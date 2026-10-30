import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const runsDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
writeFileSync(join(runsDir, '2026-02-01.jsonl'), '');
writeFileSync(
  join(runsDir, '2026-02-02.jsonl'),
  '{"at":"2026-02-02T01:00:00Z","job":"b","status":"ok","owner":"rook"}\nnot json\n{"at":"2026-02-02T02:00:00Z","job":"a","status":"fail","owner":null,"error":"boom"}\n',
);
const app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });

describe('digest routes (temp runs dir)', () => {
  it('empty night: page says nothing ran, JSON has no rows', async () => {
    expect(await (await app.request('/digest/2026-02-01')).text()).toContain('nothing ran');
    const body = await (await app.request('/api/digest/2026-02-01')).json();
    expect(body.rows).toEqual([]);
  });

  it('night with a bad line: both 200, same jobs in the same order', async () => {
    const page = await app.request('/digest/2026-02-02');
    const api = await app.request('/api/digest/2026-02-02');
    expect(page.status).toBe(200);
    expect(api.status).toBe(200);
    const body = await api.json();
    expect(body.badLines).toBe(1);
    const jobs: string[] = body.rows.map((r: { job: string }) => r.job);
    expect(jobs).toEqual(['a', 'b']);
    const html = await page.text();
    expect(html.indexOf('>a<')).toBeLessThan(html.indexOf('>b<'));
  });

  it('missing night: 404 on both', async () => {
    expect((await app.request('/digest/2000-01-01')).status).toBe(404);
    expect((await app.request('/api/digest/2000-01-01')).status).toBe(404);
  });
});
