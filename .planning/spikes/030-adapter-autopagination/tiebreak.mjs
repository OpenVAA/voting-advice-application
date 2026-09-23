// Does paging the adapter's `order('sort_order')` (not unique) lose or duplicate rows? Same query, pages of
// 1000, with and without an `id` tie-breaker. Anon reader, municipal fixture.
import fs from 'node:fs';
const ids = JSON.parse(fs.readFileSync(new URL('../026-election-scale-entity-read/ids.json', import.meta.url)));
const { API_URL, ANON_KEY } = process.env; const H = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
for (const order of ['sort_order', 'sort_order,id']) {
  const all = []; let off = 0;
  for (;;) { const r = await (await fetch(`${API_URL}/rest/v1/candidates?select=id&project_id=eq.${ids.m}&order=${order}&limit=1000&offset=${off}`, { headers: H })).json();
    all.push(...r.map((x) => x.id)); off += r.length; if (r.length < 1000) break; }
  const u = new Set(all);
  console.log(`order=${order.padEnd(14)} rows fetched ${all.length}  unique ${u.size}  duplicates ${all.length - u.size}  missing ${36056 - u.size}`);
}
