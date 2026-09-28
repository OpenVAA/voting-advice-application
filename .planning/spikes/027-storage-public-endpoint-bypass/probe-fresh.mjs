// Follow-up: rule out caching. With the anon policy ALREADY perturbed to USING (false) (probe.mjs leaves it so),
// upload a NEVER-BEFORE-SEEN object and read it via each endpoint as anon; also read a path in a CLOSED project
// folder and a garbage path, which storage_path_is_public would deny under the SHIPPED policy too.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const ids = JSON.parse(fs.readFileSync(new URL('../026-election-scale-entity-read/ids.json', import.meta.url)));
const { API_URL, ANON_KEY, SERVICE_ROLE_KEY } = process.env;
const PG = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const q = execFileSync('psql', [PG, '-X', '-At', '-c', `select left(md5(qual),8) from pg_policies where policyname='anon_select_public_assets'`]).toString().trim();
console.log(`policy qual md5 now: ${q} (68934a3e = perturbed to false)`);
const svc = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` };
const anon = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const paths = {
  'fresh object, visible candidate folder': `${ids.m}/candidates/${ids.mycand}/fresh-${Date.now()}.png`,
  'fresh object, NONEXISTENT candidate (policy denies even when shipped)': `${ids.m}/candidates/00000000-0000-0000-0000-00000000dead/fresh-${Date.now()}.png`,
  'fresh object, garbage path (policy denies even when shipped)': `not-a-uuid/whatever/fresh-${Date.now()}.png`
};
for (const [label, p] of Object.entries(paths)) {
  const up = await fetch(`${API_URL}/storage/v1/object/public-assets/${p}`, { method: 'POST', body: png, headers: { ...svc, 'Content-Type': 'image/png' } });
  const pub = await fetch(`${API_URL}/storage/v1/object/public/public-assets/${p}`);
  const auth = await fetch(`${API_URL}/storage/v1/object/authenticated/public-assets/${p}`, { headers: anon });
  console.log(`${label}\n   upload ${up.status} | anon /object/public ${pub.status} | anon /object/authenticated ${auth.status}`);
  await fetch(`${API_URL}/storage/v1/object/public-assets`, { method: 'DELETE', headers: { ...svc, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [p] }) });
}
const priv = `${ids.m}/candidates/${ids.mycand}/priv-${Date.now()}.png`;
await fetch(`${API_URL}/storage/v1/object/private-assets/${priv}`, { method: 'POST', body: png, headers: { ...svc, 'Content-Type': 'image/png' } });
const pa = await fetch(`${API_URL}/storage/v1/object/authenticated/private-assets/${priv}`, { headers: anon });
const pp = await fetch(`${API_URL}/storage/v1/object/public/private-assets/${priv}`);
console.log(`control, PRIVATE bucket (has no anon policy)\n   anon /object/authenticated ${pa.status} | anon /object/public ${pp.status}`);
await fetch(`${API_URL}/storage/v1/object/private-assets`, { method: 'DELETE', headers: { ...svc, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [priv] }) });
