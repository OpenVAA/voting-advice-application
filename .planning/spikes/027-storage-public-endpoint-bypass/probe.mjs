// Spike 027: is storage.objects' anon SELECT policy (the 6.4x `storage_path_is_public` read) ever evaluated
// on the voter's image path? Uploads one real image as service_role into a VISIBLE candidate's folder, then
// fetches it via every read endpoint as anon, first with the shipped policy, then with the policy forced to
// USING (false). An endpoint whose answer does not change when the policy denies everything does not
// consult the policy. Needs spike 026's load.sh fixture (ids.json). Restore with `yarn db:reset`.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const ids = JSON.parse(fs.readFileSync(new URL('../026-election-scale-entity-read/ids.json', import.meta.url)));
const { API_URL, ANON_KEY, SERVICE_ROLE_KEY } = process.env;
const PG = process.env.PG ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const psql = (sql) => execFileSync('psql', [PG, '-X', '-q', '-At', '-c', sql]).toString().trim();
const dir = `${ids.m}/candidates/${ids.mycand}`;
const path = `${dir}/spike027.png`;
// 1x1 PNG
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const up = await fetch(`${API_URL}/storage/v1/object/public-assets/${path}`, { method: 'POST', body: png,
  headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'image/png', 'x-upsert': 'true' } });
console.log(`upload as service_role: HTTP ${up.status}`);
const anonH = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const ENDPOINTS = {
  'GET /object/public/…  (what the voter app uses)': () => fetch(`${API_URL}/storage/v1/object/public/public-assets/${path}`),
  'GET /object/authenticated/… (RLS read)': () => fetch(`${API_URL}/storage/v1/object/authenticated/public-assets/${path}`, { headers: anonH }),
  'POST /object/list (RLS list)': () => fetch(`${API_URL}/storage/v1/object/list/public-assets`, { method: 'POST', headers: { ...anonH, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: dir }) }),
  'GET /object/info/public/…': () => fetch(`${API_URL}/storage/v1/object/info/public/public-assets/${path}`)
};
async function probe(label) {
  console.log(`\n== ${label}`);
  for (const [name, f] of Object.entries(ENDPOINTS)) {
    const r = await f(); const body = await r.arrayBuffer();
    let note = `${body.byteLength} bytes`;
    if (name.includes('list')) { try { note = `${JSON.parse(Buffer.from(body)).length} objects listed`; } catch {} }
    console.log(`  ${String(r.status).padEnd(4)} ${name.padEnd(52)} ${note}`);
  }
}
async function timeIt(label, f, n = 50) {
  const t = []; for (let i = 0; i < n; i++) { const t0 = performance.now(); const r = await f(); await r.arrayBuffer(); t.push(performance.now() - t0); }
  t.sort((a, b) => a - b); console.log(`  ${label.padEnd(52)} median ${t[n >> 1].toFixed(1)} ms  p95 ${t[Math.ceil(0.95 * n) - 1].toFixed(1)} ms  (n=${n})`);
}
const fp = () => psql(`select left(md5(qual),8) from pg_policies where schemaname='storage' and policyname='anon_select_public_assets'`);
console.log(`anon_select_public_assets qual md5 (shipped): ${fp()}`);
await probe('SHIPPED policy');
console.log('\n== HTTP latency, shipped policy, anon');
await timeIt('GET /object/public/…', ENDPOINTS['GET /object/public/…  (what the voter app uses)']);
await timeIt('GET /object/authenticated/… (evaluates the policy)', ENDPOINTS['GET /object/authenticated/… (RLS read)']);
psql(`ALTER POLICY "anon_select_public_assets" ON storage.objects USING (false)`);
console.log(`\nanon_select_public_assets qual md5 (PERTURBED to false): ${fp()}`);
await probe('PERTURBED policy: USING (false) - denies every row');
const del = await fetch(`${API_URL}/storage/v1/object/public-assets`, { method: 'DELETE', headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [path] }) });
console.log(`\ncleanup: delete as service_role HTTP ${del.status}`);
console.log('\n(policy left perturbed on purpose; `yarn db:reset` restores the committed schema)');
