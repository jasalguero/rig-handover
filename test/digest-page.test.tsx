import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const runsDir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
writeFileSync(
  join(runsDir, '2026-01-01.jsonl'),
  '{"at":"2026-01-01T01:00:00+01:00","job":"z/job","status":"ok","owner":"rook"}\n' +
    '{"at":"2026-01-01T02:00:00+01:00","job":"a/job","status":"retry","owner":null,"error":"x"}\n' +
    '{"at":"2026-01-01T03:00:00+01:00","job":"a/job","status":"retry","owner":null}\n' +
    '{"at":"2026-01-01T04:00:00+01:00","job":"a/job","status":"retry","owner":null}\n',
);
writeFileSync(join(runsDir, '2026-01-03.jsonl'), '');
const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir };

describe('digest page', () => {
  it('renders rows sorted by job, flags retries >= 3, shows missing owner as dash', async () => {
    const res = await createApp(config).request('/digest/2026-01-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('z/job'));
    expect(html).toContain('retries ≥ 3');
    expect(html).toContain('<td>—</td>');
  });

  it('returns 404 for a night with no file', async () => {
    const res = await createApp(config).request('/digest/2000-01-01');
    expect(res.status).toBe(404);
  });

  it('says nothing ran for an empty file', async () => {
    const res = await createApp(config).request('/digest/2026-01-03');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
});
