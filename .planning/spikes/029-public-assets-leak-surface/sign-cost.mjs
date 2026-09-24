// C2 cost: if public-assets became private, every photo a voter sees needs a signed URL, and signing
// evaluates the storage SELECT policy (storage_path_is_public, the 6.4x residual) per object.
// Upload one photo for each candidate in the Helsinki-sized constituency, then sign them all in one batch as anon.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const ids = JSON.parse(fs.readFileSync(new URL('../026-election-scale-entity-read/ids.json', import.meta.url)));
const { API_URL, ANON_KEY, SERVICE_ROLE_KEY } = process.env;
const PG = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const cands = execFileSync('psql', [PG, '-X', '-At', '-c', `select c.id from candidates c join nominations n on n.candidate_id = c.id where n.constituency_id = '${ids.mc1}' and c.confirmed`]).toString().trim().split('\n');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const svc = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` };
const paths = cands.map((c) => `${ids.m}/candidates/${c}/${crypto.randomUUID()}.png`);
const t0 = performance.now();
for (let i = 0; i < paths.length; i += 50) await Promise.all(paths.slice(i, i + 50).map((p) => fetch(`${API_URL}/storage/v1/object/public-assets/${p}`, { method: 'POST', body: png, headers: { ...svc, 'Content-Type': 'image/png' } })));
console.log(`uploaded ${paths.length} photos in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
const anon = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' };
const times = [];
let signed = 0;
for (let i = 0; i < 6; i++) {
  const s0 = performance.now();
  const r = await fetch(`${API_URL}/storage/v1/object/sign/public-assets`, { method: 'POST', headers: anon, body: JSON.stringify({ expiresIn: 3600, paths }) });
  const j = await r.json(); times.push(performance.now() - s0);
  signed = Array.isArray(j) ? j.filter((x) => x.signedURL && !x.error).length : `HTTP ${r.status} ${JSON.stringify(j).slice(0, 120)}`;
}
times.shift(); times.sort((a, b) => a - b);
console.log(`sign ${paths.length} paths in one batch as anon: ${signed} signed; median ${times[2].toFixed(0)} ms, max ${times[4].toFixed(0)} ms (5 runs after warm-up)`);
const one = await fetch(`${API_URL}/storage/v1/object/sign/public-assets`, { method: 'POST', headers: anon, body: JSON.stringify({ expiresIn: 3600, paths: [paths[0]] }) }).then((r) => r.json());
const url = `${API_URL}/storage/v1${one[0].signedURL}`;
const g0 = performance.now(); const gs = (await fetch(url)).status;
console.log(`fetch via signed URL: HTTP ${gs} in ${(performance.now() - g0).toFixed(1)} ms`);
