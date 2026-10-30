import type { DigestRow, Night } from '../digest/types.js';

// A row is flagged when it retried 3 or more times or its last run failed. The flag is text as
// well as colour, so a fetched copy of the page shows it too.
function flagOf(row: DigestRow): string | null {
  if (row.lastStatus === 'fail') return 'fail';
  if (row.retries >= 3) return 'retries ≥ 3';
  return null;
}

export function DigestPage({ night }: { night: Night }) {
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last</th>
              <th>flag</th>
              <th>last at</th>
              <th>last error</th>
            </tr>
          </thead>
          <tbody>
            {night.rows.map((row) => {
              const flag = flagOf(row);
              return (
                <tr class={flag ? 'warn' : undefined}>
                  <td>{row.job}</td>
                  <td>{row.owner ?? '—'}</td>
                  <td>{row.runs}</td>
                  <td>{row.retries}</td>
                  <td>{row.lastStatus}</td>
                  <td>{flag ?? '—'}</td>
                  <td>{row.lastAt}</td>
                  <td>{row.lastError ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
