// Spike 025 probe: does the voter app's universal client (routes/+layout.ts ->
// createSupabaseUniversalClient) send a signed-in user's JWT to PostgREST?
// Mirrors production: sign in through createServerClient with a cookie jar, then
// rebuild a SECOND client from those cookies exactly as universal.ts does, and
// intercept its fetch to record the role claim on every request it issues.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../apps/frontend/package.json', import.meta.url));
const { createServerClient } = require('@supabase/ssr');
const { createClient } = require('@supabase/supabase-js');

const { API_URL, ANON_KEY, SERVICE_ROLE_KEY } = process.env;
const email = `spike025-${Date.now()}@example.invalid`;
const password = 'spike025-Passw0rd!';
const admin = createClient(API_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (cErr) throw cErr;

const jar = new Map();
const signer = createServerClient(API_URL, ANON_KEY, {
  cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach((c) => jar.set(c.name, c.value)) }
});
const { error: sErr } = await signer.auth.signInWithPassword({ email, password });
if (sErr) throw sErr;
const cookies = [...jar].map(([name, value]) => ({ name, value }));

function roleOf(headers) {
  const h = new Headers(headers);
  const auth = h.get('authorization') ?? '';
  const tok = auth.replace(/^Bearer /, '');
  try { return JSON.parse(Buffer.from(tok.split('.')[1], 'base64url').toString()).role ?? '(no role)'; } catch { return '(no token)'; }
}
async function run(label, cookieList) {
  const log = [];
  const fetchSpy = (input, init) => { log.push({ url: String(input).replace(API_URL, ''), role: roleOf(init?.headers) }); return fetch(input, init); };
  const client = createServerClient(API_URL, ANON_KEY, { global: { fetch: fetchSpy }, cookies: { getAll: () => cookieList } });
  const r = await client.from('candidates').select('id').limit(1);
  console.log(`${label}: status=${r.status} rows=${r.data?.length ?? 0}`);
  for (const e of log) console.log(`   ${e.role.padEnd(14)} ${e.url.split('?')[0]}`);
}
console.log(`cookies carried from sign-in: ${cookies.map((c) => c.name).join(', ')}`);
await run('A. no cookies (anonymous voter)', []);
await run('B. signed-in cookies (candidate/admin opening the voter app)', cookies);
await admin.auth.admin.deleteUser(created.user.id);
console.log('cleanup: throwaway user deleted');
