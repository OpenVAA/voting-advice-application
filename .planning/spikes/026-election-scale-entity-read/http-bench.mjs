// Spike 026 HTTP bench: the voter app's real reads, over HTTP, through the real PostgREST, as four readers.
// Needs load.sh to have run (ids.json) and API_URL / ANON_KEY / JWT_SECRET in the environment.
// Usage: node http-bench.mjs [runs=10] [concurrency=10]
import crypto from 'node:crypto';
import fs from 'node:fs';
const ids = JSON.parse(fs.readFileSync(new URL('./ids.json', import.meta.url)));
const { API_URL, ANON_KEY, JWT_SECRET } = process.env;
const RUNS = +(process.argv[2] ?? 10), CONC = +(process.argv[3] ?? 10);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt(payload) {
  const now = Math.floor(Date.now() / 1000), h = b64({ alg: 'HS256', typ: 'JWT' });
  const p = b64({ iss: 'supabase-demo', iat: now, exp: now + 7200, aud: payload.role === 'anon' ? undefined : 'authenticated', ...payload });
  return `${h}.${p}.${crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url')}`;
}
// grant claim shape = what the access-token hook emits (public.grants rows: scope/role/target_type/target_id)
const READERS = {
  anon: jwt({ role: 'anon' }),
  auth_nogrant: jwt({ role: 'authenticated', sub: '11111111-1111-1111-1111-111111111111', grants: [] }),
  candidate: jwt({ role: 'authenticated', sub: '22222222-2222-2222-2222-222222222222',
    grants: [{ scope: 'entity', role: 'editor', target_type: 'candidate', target_id: ids.mycand }] }),
  admin: jwt({ role: 'authenticated', sub: '33333333-3333-3333-3333-333333333333',
    grants: [{ scope: 'project', role: 'admin', target_type: null, target_id: ids.m }] })
};
const rpc = (args) => ({ method: 'POST', path: '/rest/v1/rpc/get_nominations', body: JSON.stringify({ p_include_unconfirmed: false, ...args }) });
const QUERIES = {
  Q1: { what: 'voter, municipal, largest constituency (1,500 cands)', ...rpc({ p_project_id: ids.m, p_election_id: ids.me, p_constituency_id: ids.mc1 }) },
  Q2: { what: 'whole municipal project (/nominations page)', ...rpc({ p_project_id: ids.m }) },
  Q3: { what: 'candidates table, whole municipal project (getEntityData)', method: 'GET', path: `/rest/v1/candidates?select=*&project_id=eq.${ids.m}&order=sort_order` },
  Q4: { what: 'voter, parliamentary, largest constituency (430 cands)', ...rpc({ p_project_id: ids.r, p_election_id: ids.re, p_constituency_id: ids.rc1 }) },
  Q5: { what: 'whole parliamentary project', ...rpc({ p_project_id: ids.r }) }
};
async function hit(tok, q) {
  const t0 = performance.now();
  const res = await fetch(API_URL + q.path, { method: q.method, body: q.body,
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' } });
  const text = await res.text();
  const ms = performance.now() - t0;
  if (res.status !== 200) {
    let code = ''; try { code = JSON.parse(text).code; } catch {}
    return { ms, rows: `HTTP${res.status}:${code}`, kb: 0, failed: true };
  }
  return { ms, rows: JSON.parse(text).length, kb: text.length / 1024 };
}
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.max(0, Math.min(s.length - 1, Math.ceil(p * s.length) - 1))]; };
// Sanity: the token is honoured, not silently downgraded to anon. projects has no anon policy.
for (const [r, tok] of Object.entries(READERS)) {
  const res = await fetch(`${API_URL}/rest/v1/projects?select=id&id=eq.${ids.m}`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${tok}` } });
  console.log(`# sanity ${r.padEnd(12)} sees municipal project row: ${(await res.json()).length}`);
}
console.log(`# ${new Date().toISOString()}  runs=${RUNS}  loadavg=${(await import('node:os')).loadavg().map((x) => x.toFixed(1)).join(' ')}`);
console.log('query reader              rows    KB   min_ms  med_ms  p95_ms  max_ms');
const results = {};
for (const [qn, q] of Object.entries(QUERIES)) {
  for (const [r, tok] of Object.entries(READERS)) {
    const warm = await hit(tok, q); // warm-up
    const t = []; let last = warm; const n = warm.failed ? 3 : RUNS; // a failing cell is sampled 3x, not 10x
    for (let i = 0; i < n; i++) { last = await hit(tok, q); t.push(last.ms); }
    results[`${qn}/${r}`] = { rows: last.rows, t };
    console.log(`${qn}    ${r.padEnd(12)} ${String(last.rows).padStart(12)} ${last.kb.toFixed(0).padStart(5)} ${pct(t, 0).toFixed(0).padStart(7)} ${pct(t, 0.5).toFixed(0).padStart(7)} ${pct(t, 0.95).toFixed(0).padStart(7)} ${Math.max(...t).toFixed(0).padStart(7)}`);
  }
}
// Load: CONC simultaneous clients each issuing the voter's main call (Q1) 5 times, per reader.
console.log(`\n# concurrency: ${CONC} simultaneous clients x 5 requests of Q1 (voter, largest municipal constituency)`);
console.log('reader        requests  med_ms  p95_ms  max_ms  wall_s');
for (const [r, tok] of Object.entries(READERS)) {
  const t = []; const w0 = performance.now();
  await Promise.all(Array.from({ length: CONC }, async () => { for (let i = 0; i < 5; i++) t.push((await hit(tok, QUERIES.Q1)).ms); }));
  console.log(`${r.padEnd(12)} ${String(t.length).padStart(9)} ${pct(t, 0.5).toFixed(0).padStart(7)} ${pct(t, 0.95).toFixed(0).padStart(7)} ${Math.max(...t).toFixed(0).padStart(7)} ${((performance.now() - w0) / 1000).toFixed(1).padStart(7)}`);
}
fs.writeFileSync(new URL('./http-results.json', import.meta.url), JSON.stringify(results, null, 1));
