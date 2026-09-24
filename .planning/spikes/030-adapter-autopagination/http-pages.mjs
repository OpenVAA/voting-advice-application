// Spike 030: auto-pagination over the real PostgREST. For each query, fetch every page with PostgREST's own
// limit/offset (what supabase-js .range() sends), and report per-page time, total time, page count, and
// whether the concatenated pages equal the full set (no duplicate, no missing id).
// Usage: node http-pages.mjs <pageSize> [reader=anon]    Needs spike 026's load.sh fixture (ids.json).
import crypto from 'node:crypto';
import fs from 'node:fs';
const ids = JSON.parse(fs.readFileSync(new URL('../026-election-scale-entity-read/ids.json', import.meta.url)));
const { API_URL, ANON_KEY, JWT_SECRET } = process.env;
const PAGE = +process.argv[2]; const READER = process.argv[3] ?? 'anon';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (p) => { const h = b64({ alg: 'HS256', typ: 'JWT' }), q = b64({ iss: 'supabase-demo', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7200, ...p });
  return `${h}.${q}.${crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${q}`).digest('base64url')}`; };
const TOK = { anon: jwt({ role: 'anon' }),
  admin: jwt({ role: 'authenticated', aud: 'authenticated', sub: '33333333-3333-3333-3333-333333333333', grants: [{ scope: 'project', role: 'admin', target_type: null, target_id: ids.m }] }) }[READER];
const H = { apikey: ANON_KEY, Authorization: `Bearer ${TOK}`, 'Content-Type': 'application/json' };
const rpcBody = (a) => JSON.stringify({ p_include_unconfirmed: false, ...a });
const QUERIES = {
  'Helsinki (get_nominations)': (lim, off) => fetch(`${API_URL}/rest/v1/rpc/get_nominations?limit=${lim}&offset=${off}`, { method: 'POST', headers: H, body: rpcBody({ p_project_id: ids.m, p_election_id: ids.me, p_constituency_id: ids.mc1 }) }),
  'whole municipal (get_nominations)': (lim, off) => fetch(`${API_URL}/rest/v1/rpc/get_nominations?limit=${lim}&offset=${off}`, { method: 'POST', headers: H, body: rpcBody({ p_project_id: ids.m }) }),
  'candidates table (order sort_order,id)': (lim, off) => fetch(`${API_URL}/rest/v1/candidates?select=*&project_id=eq.${ids.m}&order=sort_order,id&limit=${lim}&offset=${off}`, { headers: H })
};
console.log(`# page size ${PAGE}, reader ${READER}, ${new Date().toISOString()}, loadavg ${(await import('node:os')).loadavg().map((x) => x.toFixed(1)).join(' ')}`);
for (const [name, call] of Object.entries(QUERIES)) {
  const t0 = performance.now(); const all = []; const pageMs = []; let off = 0; let err = '';
  for (;;) {
    const p0 = performance.now(); const r = await call(PAGE, off); const txt = await r.text(); pageMs.push(performance.now() - p0);
    if (r.status !== 200) { err = ` ERROR HTTP ${r.status} ${txt.slice(0, 100)}`; break; }
    const rows = JSON.parse(txt); all.push(...rows); off += rows.length;
    if (rows.length < PAGE) break;           // short page = last page
  }
  const idset = new Set(all.map((r) => r.id));
  const total = performance.now() - t0; const med = [...pageMs].sort((a, b) => a - b)[pageMs.length >> 1];
  console.log(`${name.padEnd(40)} rows ${String(all.length).padStart(6)} unique ${String(idset.size).padStart(6)} pages ${String(pageMs.length).padStart(3)}  per-page median ${med.toFixed(0).padStart(6)} ms  total ${(total / 1000).toFixed(2).padStart(7)} s${err}`);
}
