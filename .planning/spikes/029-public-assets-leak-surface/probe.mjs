// Spike 029: with public-assets public (downloads bypass RLS, spike 027), how can an object that should
// NOT be public actually reach someone? Candidate solution C1 = the status quo: random UUID file names
// (supabaseDataWriter.#uploadCandidateFile). A URL is then only as secret as the PATH. So: every way a path
// can become known, or stay valid after it should not, is probed here as anon.
// Needs spike 026's load.sh fixture. Restore with `yarn db:reset`.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const ids = JSON.parse(fs.readFileSync(new URL('../026-election-scale-entity-read/ids.json', import.meta.url)));
const { API_URL, ANON_KEY, SERVICE_ROLE_KEY } = process.env;
const PG = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sql = (q) => execFileSync('psql', [PG, '-X', '-q', '-At', '-c', q]).toString().trim();
const svc = { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` };
const anon = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const upload = async (bucket, path) => (await fetch(`${API_URL}/storage/v1/object/${bucket}/${path}`, { method: 'POST', body: png, headers: { ...svc, 'Content-Type': 'image/png', 'x-upsert': 'true' } })).status;
const get = async (path) => (await fetch(`${API_URL}/storage/v1/object/public/public-assets/${path}`)).status;
const list = async (prefix) => { const r = await fetch(`${API_URL}/storage/v1/object/list/public-assets`, { method: 'POST', headers: { ...anon, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix }) }); return (await r.json()).length; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const row = (id) => fetch(`${API_URL}/rest/v1/candidates?select=id,image&id=eq.${id}`, { headers: anon }).then((r) => r.json());
const uuid = () => crypto.randomUUID();
// two visible candidates of the municipal fixture
const [c1, c2, c3] = sql(`select string_agg(id::text, ',') from (select id from candidates where project_id = '${ids.m}' order by id limit 3) s`).split(',');
const folder = (c) => `${ids.m}/candidates/${c}`;
const out = [];
const rec = (scenario, expectation, observed, leak) => { out.push({ scenario, expectation, observed, leak }); console.log(`${leak ? 'LEAK ' : 'ok   '} ${scenario}\n      expected: ${expectation}\n      observed: ${observed}`); };

// S1: a candidate that is NOT public (unconfirmed) with a photo. Can anon learn the file name?
const p1 = `${folder(c1)}/${uuid()}.png`;
await upload('public-assets', p1);
sql(`update candidates set image = jsonb_build_object('path', '${p1}'), confirmed = false where id = '${c1}'`);
rec('S1a list the unpublished candidate\'s folder (anon)', '0 objects (list is policy-gated)', `${await list(folder(c1))} objects`, (await list(folder(c1))) > 0);
rec('S1b read the unpublished candidate row via REST (anon)', 'no row, so no image path', `${(await row(c1)).length} rows`, (await row(c1)).length > 0);
const noms = await (await fetch(`${API_URL}/rest/v1/rpc/get_nominations`, { method: 'POST', headers: { ...anon, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_project_id: ids.m }) })).json();
rec('S1c path of the unpublished candidate in get_nominations (anon)', 'absent', JSON.stringify(noms).includes(p1) ? 'PRESENT' : 'absent', JSON.stringify(noms).includes(p1));
rec('S1d guess the URL knowing only the candidate id', 'infeasible: 122 random bits in the name', `guessed ${uuid()}.png -> HTTP ${await get(`${folder(c1)}/${uuid()}.png`)}`, false);
rec('S1e direct URL, if it is known anyway', 'served (public bucket, spike 027)', `HTTP ${await get(p1)}`, (await get(p1)) === 200);

// S2: unpublish AFTER being public. The URL was served to voters; does it stop working?
const p2 = `${folder(c2)}/${uuid()}.png`;
await upload('public-assets', p2);
sql(`update candidates set image = jsonb_build_object('path', '${p2}') where id = '${c2}'`);
const before = await get(p2);
sql(`update candidates set confirmed = false where id = '${c2}'`);
rec('S2  URL of a candidate who was public, then unconfirmed', 'ideally 4xx once unpublished', `HTTP ${before} while public -> HTTP ${await get(p2)} after unconfirm`, (await get(p2)) === 200);
sql(`update projects set open_for_voters = false where id = '${ids.m}'`);
rec('S2b same URL after the whole project is closed to voters', 'ideally 4xx', `HTTP ${await get(p2)}`, (await get(p2)) === 200);
sql(`update projects set open_for_voters = true where id = '${ids.m}'; update candidates set confirmed = true where id = '${c2}'`);

// S3: image column replaced -> old file deleted by cleanup_image_on_update (pg_net, async)
const p3a = `${folder(c3)}/${uuid()}.png`, p3b = `${folder(c3)}/${uuid()}.png`;
await upload('public-assets', p3a); await upload('public-assets', p3b);
sql(`update candidates set image = jsonb_build_object('path', '${p3a}') where id = '${c3}'`);
sql(`update candidates set image = jsonb_build_object('path', '${p3b}') where id = '${c3}'`);
let s3 = 0; for (let i = 0; i < 20 && (s3 = await get(p3a)) === 200; i++) await sleep(500);
rec('S3  replaced photo in the image column', 'old file deleted by trigger', `old URL HTTP ${s3} (polled up to 10 s)`, s3 === 200);

// S4: photo stored as an ANSWER, then replaced. Established from the code, not run: cleanup_old_image_file
// is attached to the `image` column only; no trigger reads `answers`. (Running it needs a real image-type
// question, and after S3 the result is moot: the delete call itself does not work.)
rec('S4  replaced photo stored in an answer (orphan)', 'old file deleted', 'no trigger covers `answers` (code read: 400-storage.sql)', true);

// S5: entity deleted -> cleanup_entity_storage_files removes its folder
const p5 = `${folder(c1)}/${uuid()}.png`; await upload('public-assets', p5);
sql(`delete from nominations where candidate_id = '${c1}'; delete from candidates where id = '${c1}'`);
let s5 = 0; for (let i = 0; i < 20 && (s5 = await get(p5)) === 200; i++) await sleep(500);
rec('S5  candidate deleted', 'folder deleted by trigger', `URL HTTP ${s5} (polled up to 10 s)`, s5 === 200);

fs.writeFileSync(new URL('./probe-results.json', import.meta.url), JSON.stringify(out, null, 1));
