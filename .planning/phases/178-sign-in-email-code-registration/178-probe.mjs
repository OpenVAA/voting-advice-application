#!/usr/bin/env node
// 178-probe.mjs — measurements of what the RUNNING local auth service does with the tokens of mailed links,
// with an account that has no password and with a password set on a link session, and of what the RUNNING
// account-access function does with a recovery request. Nothing of the application is asked: every step
// is a call to the auth service, to the data API, to the function, to the mail catcher or to the database.
//
// Usage: node 178-probe.mjs <rows>
//   <rows>  a comma-separated list out of p1,p2,p3,p4,p5pre,p5,p6,p7,fn. The row p5pre is run alone, before
//           the stack is restarted on a new configuration; p5 and p6 after the restart. Naming p5pre beside
//           p5 is a usage error.
//
// It works in the default project that apps/supabase/supabase/seed.sql creates. Every address it uses
// begins with r178-probe- and carries the run's own id, so a run never meets an address of an earlier one;
// the one exception is the account of the row p5pre, r178-probe-p5pre@test.openvaa.local, which a later run
// of p5 must find.
//
// WHAT A LINE MEANS. Each step prints one line. PASS says that the step was made and that what the line
// states was observed; FAIL says that the step could not be made at all. A step whose observation is set
// against an assumption ends "(as assumed)" or "(NOT as assumed)"; either is a PASS, because the row is a
// measurement. After its steps a row prints its summary lines, each alone on its line:
//    P1: held | not held        P1-DIFFERED: <steps> (only when not held)
//    P1-EXPIRY: <n> s configured; not observed
//    P2: held | not held        P2-ACCEPTED: <steps> (only when not held)     P2-TYPE: interchangeable | bound
//    P3: held | not held        P3-IDP: set | empty                           P3-RECOVERY: unchanged | changed
//    P4: held | not held        P4-FALLBACK: refresh | full-load (only when not held)
//    P5-PRE: created | stored directly (from p5pre); P5-PRE: missing (from p5, when that account is gone)
//    P5: held | not held        P5-DIFFERED: <steps> (only when not held)
//    P6: held | not held        P6-OTP: distinguishes | uniform               P6-EMAIL-CHANGE: no mail | mail
//    P7: no difference | difference
//    FN: held | not held        FN-DIFFERED: <steps> (only when not held)
// A row with a step that could not be made prints "<row>: not measured" instead of a verdict.
//
// The three kinds of account:
//    with a password            an admin createUser with email_confirm and a random password of sixteen
//                               characters;
//    by the recipe              the two calls of the account-access function: generateLink with the type
//                               invite, then generateLink with the type magiclink, for the same address;
//    identity-provider-shaped   an admin createUser with email_confirm and no password, as the
//                               identity-callback function calls it (its metadata arguments are not sent).
//
// Whether an account's password is set is read with psql on the local database as its owner role, through
// private.user_password_set, one boolean per read. Beside it the database computes a short digest of the
// stored value, which this script compares before and after an act and never prints.
//
// The rows:
//   p1  the recovery link. For an account with a password and for one made by the recipe: the fact; a
//       recovery link from the service role; its token verified as recovery; the fact again; the same token
//       presented a second time. Then a recovery link asked for an address with no account. Then a fresh
//       recipe account whose sign-in token is verified as magiclink and presented a second time. The
//       lifetime of a link is not waited out: otp_expiry of [auth.email] is read from config.toml and
//       printed as P1-EXPIRY.
//   p2  the two kinds against each other, each on an account with a password of its own: (i) a sign-in
//       link, then a recovery link, the sign-in token presented; (ii) a recovery link, then a sign-in link,
//       the recovery token presented; (iii) a sign-in link, then a recovery link, the recovery token
//       presented and then the sign-in token; (iv) a sign-in token presented with the type recovery.
//   p3  the truth table of "password set": the recipe's account before and after its first verification, an
//       account created with a password, an identity-provider-shaped account, the recipe's account after a
//       password is set on its session, and a second recipe account after a recovery token is verified.
//   p4  a password set on a link session: claim_invitations read with the session, the password set, then
//       claim_invitations read by a second client that holds only the access token as it was before.
//   p5pre  one account with a password of seven characters, made while the running service still holds the
//       configuration it started with, and kept by this run's cleanup for the row p5. Its password is not
//       stored anywhere: it is derived from the account's address with an HMAC keyed by the stack's service
//       key, which the row p5 reads again. When the service already refuses seven characters, the account is
//       made with a longer password and the seven-character password's bcrypt hash is written for it directly
//       in the database, with the cost read from the prefix of its stored hash; the SQL travels to psql on its
//       standard input.
//   p5  the minimum password length as the running service applies it: the account of p5pre is found (else
//       P5-PRE: missing); on a fresh account's session, the user's own update with a password of seven
//       characters and then with one of eight; an administrator's createUser with seven; a password sign-in
//       with the seven-character password of the account p5pre made.
//   p6  the auth service under a mail hook that sends nothing: a magiclink from the service role and its token
//       verified; the service's own one-time-code request and its own recovery request, each for an address
//       with an account and one without; the user's own change of address on the verified session; a link
//       request and a recovery request through the account-access function, each for an eligible address and
//       with a completion witness; then the mails the catcher holds for every one of those addresses.
//   p7  nine password sign-ins each for an address with no account, for an account with a password and a
//       wrong one, and for a recipe account, interleaved and timed from the request to its answer.
//   fn  the recovery operation of the account-access function, as the running edge runtime serves it. Three
//       accounts with a password are each given a project-scope grant the way a user gets one: an invitation
//       seeded by the service role and claimed on the account's own session. Every request carries a
//       completion witness, and nothing is read of a request's effect before its witness has finished.
//       For the first grant holder: a recovery request; its answer; the witness; the one mail and its
//       subject; the mail's one link, its path and its query parameters; the link's token verified as
//       recovery; the password fact before and after. Then a second recovery request for the same address;
//       a recovery request for an address that has an open invitation and no account; one for an address
//       with neither; a link request for the second grant holder followed at once by a recovery request for
//       the same address; a recovery request for the third grant holder carrying the Origin and
//       X-Forwarded-Host of another site and the locale fi; and every answer set against the first.
//
// THE TWO LIMITS. The stack admits thirty password sign-ins and, separately, thirty link verifications in
// five minutes from one address of origin. Before its first step the script prints how many of each the
// named rows make and refuses when either passes twenty-eight; the two are never summed. It also refuses
// while an E2E run is in flight: a `started` file with no `ended` beside it at any depth under
// tests/e2e-runs/, or a listener on the E2E server's port. A search that cannot be made is a refusal too.
//
// Its last step, made in every case once the keys are read, deletes every user whose address begins with
// r178-probe- (except the account of p5pre in the run that made it), every invitation that names such an address, every completion witness a row opened, the
// one-mail-a-minute slots its addresses took and the mails the catcher holds for them, and confirms that no
// such user and no such invitation remains.
//
// What it never does: print a key, a token, a token hash, a link, a link's origin, a password or an
// address; read a container variable; open any environment file. It prints statuses, error codes, booleans,
// counts, times and the outcome a completion witness read.
//
// Exit codes: 0 when every step of the named rows was made, whatever the rows' verdicts; 1 when a step
// could not be made; 2 on a usage error or a refusal.

import { spawnSync } from 'node:child_process';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const SELF = '178-probe';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

const API = 'http://127.0.0.1:54321';
const MAIL_API = 'http://127.0.0.1:54324';
const FUNCTION_URL = `${API}/functions/v1/account-access`;
/** The function's mail texts as the tree holds them; the row fn reads the subjects it expects from this file. */
const MAIL_TEMPLATES = path.join(REPO_ROOT, 'apps', 'supabase', 'supabase', 'functions', 'account-access', 'mailTemplates.ts');
/** How long a completion witness, and a mail that was handed over, are waited for. */
const WITNESS_CEILING_MS = 30_000;
const MAIL_CEILING_MS = 30_000;
/** A site that is not this deployment's, named in the headers of one request of the row fn. */
const OTHER_SITE = 'evil.example';
/** The project apps/supabase/supabase/seed.sql creates. */
const PROJECT = '00000000-0000-0000-0000-000000000001';
const ADDRESS_PREFIX = 'r178-probe-';
/** The most of either kind one run may make; the stack admits thirty of each in five minutes. */
const MOST_OF_A_KIND = 28;
const SIGN_INS_PER_CASE = 9;
const REQUEST_CEILING_MS = 30_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The one address that outlives a run: the account the row p5pre makes for the row p5. */
const P5PRE_ADDRESS = `${ADDRESS_PREFIX}p5pre@test.openvaa.local`;
/** The client's minimum password length, and one character less. */
const CLIENT_MINIMUM = 8;

/** The directory of the running Node first, so that `yarn` resolves to the same toolchain. */
const CHILD_PATH = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}`;

/** What each row makes of the two limited calls. */
const ROWS = {
  p1: { signIns: 0, verifications: 6, run: rowP1 },
  p2: { signIns: 0, verifications: 5, run: rowP2 },
  p3: { signIns: 0, verifications: 2, run: rowP3 },
  p4: { signIns: 0, verifications: 1, run: rowP4 },
  p5pre: { signIns: 0, verifications: 0, run: rowP5pre },
  p5: { signIns: 2, verifications: 0, run: rowP5 },
  p6: { signIns: 1, verifications: 1, run: rowP6 },
  p7: { signIns: 3 * SIGN_INS_PER_CASE, verifications: 0, run: rowP7 },
  fn: { signIns: 3, verifications: 1, run: rowFn }
};

function usage(message) {
  console.error(`${SELF}: ${message}`);
  console.error(`usage: node 178-probe.mjs <rows>   <rows>: a comma-separated list out of ${Object.keys(ROWS).join(',')}`);
  process.exit(2);
}

let unmade = false;
/** One line per step: PASS when the step was made, FAIL when it could not be. */
function line(id, made, text) {
  if (!made) unmade = true;
  console.log(`${made ? 'PASS' : 'FAIL'} ${id} — ${text}`);
}

/** A row's steps, numbered as they are printed. */
function recorder(row) {
  let n = 0;
  let measured = true;
  const differed = [];
  const next = () => `${row}.${String((n += 1)).padStart(2, '0')}`;
  return {
    /** A step with no assumption of its own. Answers whether it was made. */
    act(text, made) {
      if (!made) measured = false;
      line(next(), made, text);
      return made;
    },
    /** A step whose observation is set against an assumption. Answers its id. */
    observe(text, made, asAssumed) {
      const id = next();
      if (!made) {
        measured = false;
        line(id, false, text);
      } else {
        if (!asAssumed) differed.push(id);
        line(id, true, `${text} (${asAssumed ? 'as assumed' : 'NOT as assumed'})`);
      }
      return id;
    },
    get measured() {
      return measured;
    },
    get differed() {
      return differed;
    }
  };
}

/** An error code as the service names it, or a fixed word; nothing else of an answer passes. */
const codeOf = (value) => (typeof value === 'string' && /^[a-z0-9_]{1,64}$/i.test(value) ? value : 'none');
/** What a client call answered, reduced to a status and an error code. */
const outcome = (error) =>
  error ? { ok: false, status: Number(error.status ?? 0) || 0, code: codeOf(error.code) } : { ok: true, status: 200, code: 'none' };
/** True when the service itself answered: not a failed request, not its rate limit, not a server error. */
const answered = (o) => o.status >= 200 && o.status < 500 && o.status !== 429;
const seen = (o) => `status ${o.status}, code ${o.code}`;
const digest = (value) => createHash('sha256').update(String(value)).digest('hex').slice(0, 8);
const randomPassword = () => randomBytes(12).toString('base64url');
const boundedFetch = (input, init = {}) => fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_CEILING_MS) });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const unescapeHtml = (value) =>
  value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** One JSON request that never throws. Answers `{ status, json }`; a body that is not JSON gives `json: null`. */
async function jsonCall(url, init = {}) {
  try {
    const response = await boundedFetch(url, init);
    const json = await response.json().catch(() => null);
    return { status: response.status, json };
  } catch {
    return { status: 0, json: null };
  }
}

/**
 * One POST through node:http, which writes every header as given. `fetch` may drop or rewrite a header such
 * as `Origin`, and the step that sends another site's headers must be sure they left this process.
 */
function rawPost(url, headers, body) {
  const started = performance.now();
  const payload = JSON.stringify(body);
  return new Promise((resolve) => {
    const req = httpRequest(url, { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) }, timeout: REQUEST_CEILING_MS }, (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (text += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
        resolve({ status: res.statusCode ?? 0, json, ms: performance.now() - started });
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => resolve({ status: 0, json: null, ms: performance.now() - started }));
    req.end(payload);
  });
}

/** The English and Finnish subjects of the two mails, read from the function's module in the tree, or null. */
async function treeSubjects() {
  try {
    const templates = await import(pathToFileURL(MAIL_TEMPLATES).href);
    const subjects = {
      recovery: templates.RECOVERY_MAIL_TEMPLATES.en.subject,
      recoveryFi: templates.RECOVERY_MAIL_TEMPLATES.fi.subject,
      signIn: templates.SIGN_IN_MAIL_TEMPLATES.en.subject
    };
    return Object.values(subjects).every((subject) => typeof subject === 'string' && subject !== '') ? subjects : null;
  } catch {
    return null;
  }
}

/** The one link of a mail, parsed, when the message holds exactly one in each part and the two agree; else null. */
function onlyLink(links) {
  if (!links) return null;
  if (links.html.length !== 1 || links.text.length !== 1 || links.html[0] !== links.text[0]) return null;
  try {
    return new URL(links.html[0]);
  } catch {
    return null;
  }
}

/** The value of `otp_expiry` in the `[auth.email]` table of config.toml, or null when the file does not hold it. */
function configuredOtpExpiry() {
  let text;
  try {
    text = readFileSync(path.join(REPO_ROOT, 'apps', 'supabase', 'supabase', 'config.toml'), 'utf8');
  } catch {
    return null;
  }
  let table = '';
  for (const raw of text.split('\n')) {
    const header = /^\s*\[{1,2}([^[\]]+)\]{1,2}\s*(?:#.*)?$/.exec(raw);
    if (header) {
      table = header[1].trim();
      continue;
    }
    if (table !== 'auth.email') continue;
    const value = /^\s*otp_expiry\s*=\s*(\d+)\s*(?:#.*)?$/.exec(raw);
    if (value) return Number(value[1]);
  }
  return null;
}

/** The run directories that hold a `started` file and no `ended`; `looked` is false when the search failed. */
function runsInFlight() {
  const found = spawnSync('find', [path.join('tests', 'e2e-runs'), '-name', 'started', '-type', 'f'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 64 * 1024 * 1024
  });
  if (found.error || found.status !== 0) return { looked: false, open: [] };
  const open = found.stdout
    .split('\n')
    .filter(Boolean)
    .map((started) => path.dirname(started))
    .filter((dir) => !existsSync(path.join(REPO_ROOT, dir, 'ended')));
  return { looked: true, open };
}

/** Whether a process listens on the E2E server's port; `looked` is false when the question could not be asked. */
function serverListening() {
  const port = /^\d{1,5}$/.test(process.env.FRONTEND_PORT ?? '') ? process.env.FRONTEND_PORT : '5273';
  const asked = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  if (asked.error || (asked.status !== 0 && asked.status !== 1)) return { looked: false, port, listening: false };
  return { looked: true, port, listening: asked.status === 0 };
}

/** The two API keys and the database's address, or null when the stack does not report them. */
function readStack() {
  const r = spawnSync('yarn', ['supabase', 'status', '-o', 'env'], {
    cwd: path.join(REPO_ROOT, 'apps', 'supabase'),
    encoding: 'utf8',
    env: { ...process.env, PATH: CHILD_PATH },
    stdio: ['ignore', 'pipe', 'ignore']
  });
  const field = (name) => new RegExp(`^${name}="?([^"\\n]*)"?$`, 'm').exec(r.stdout ?? '')?.[1] ?? '';
  const anon = field('ANON_KEY');
  const service = field('SERVICE_ROLE_KEY');
  let database = null;
  try {
    const url = new URL(field('DB_URL'));
    database = {
      PGHOST: url.hostname,
      PGPORT: url.port,
      PGUSER: decodeURIComponent(url.username),
      PGPASSWORD: decodeURIComponent(url.password),
      PGDATABASE: url.pathname.replace(/^\//, '')
    };
  } catch {
    database = null;
  }
  return anon && service && database ? { anon, service, database } : null;
}

function context(stack, createClient, run) {
  const options = {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: boundedFetch }
  };
  const admin = createClient(API, stack.service, options);
  /** A client that holds the anon key and keeps a session, once it has one, in memory. */
  const anonClient = () => createClient(API, stack.anon, options);
  const address = (tag) => `${ADDRESS_PREFIX}${tag}-${run}@test.openvaa.local`;
  const made = { signIns: 0, verifications: 0 };
  /** What the cleanup removes beside the users: the witnesses that were opened and the addresses a request was made for. */
  const left = { witnesses: [], asked: new Set() };
  /** Addresses whose users this run's cleanup keeps: the account of p5pre, in the run that made it. */
  const spare = new Set();

  /** One query's single value, or null when it could not be read. */
  function sql(query) {
    const r = spawnSync('psql', ['-X', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1', '-c', query], {
      encoding: 'utf8',
      env: { ...process.env, PATH: CHILD_PATH, ...stack.database },
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000
    });
    return r.status === 0 ? String(r.stdout ?? '').trim() : null;
  }

  /** One statement handed to psql on its standard input, so that nothing of it reaches a command line. Its single value, or null. */
  function sqlOnStdin(query) {
    const r = spawnSync('psql', ['-X', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1'], {
      encoding: 'utf8',
      input: query,
      env: { ...process.env, PATH: CHILD_PATH, ...stack.database },
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 15_000
    });
    return r.status === 0 ? String(r.stdout ?? '').trim() : null;
  }

  /** The seven-character password of the account p5pre makes, derived again from its address; never printed and never stored. */
  const sevenOf = (email) => createHmac('sha256', stack.service).update(`p5pre:${email}`).digest('base64url').slice(0, CLIENT_MINIMUM - 1);

  /** The one user that holds exactly this address, `undefined` when none does, or null when the users could not be read. */
  async function userAt(email) {
    const users = await allUsers();
    if (!users) return null;
    return users.find((u) => String(u.email ?? '').toLowerCase() === email);
  }

  /** The user of p5pre's address with its seven-character password stored directly, under bcrypt at the cost of its stored hash. Answers whether the stored value checks against that password. */
  function storeSevenDirectly(userId, email) {
    if (!UUID.test(String(userId))) return false;
    const prefix = sql(`SELECT left(encrypted_password, 7) FROM auth.users WHERE id = '${userId}'::uuid`);
    const cost = /^\$2[aby]\$(\d{2})\$$/.exec(prefix ?? '')?.[1];
    if (!cost) return false;
    const seven = sevenOf(email);
    if (!/^[A-Za-z0-9_-]{7}$/.test(seven)) return false;
    const written = sqlOnStdin(
      `WITH w AS (UPDATE auth.users SET encrypted_password = extensions.crypt('${seven}', extensions.gen_salt('bf', ${Number(cost)})) WHERE id = '${userId}'::uuid RETURNING 1) SELECT count(*) FROM w;`
    );
    const checks = sqlOnStdin(`SELECT encrypted_password = extensions.crypt('${seven}', encrypted_password) FROM auth.users WHERE id = '${userId}'::uuid;`);
    return written === '1' && checks === 't';
  }

  /** An account with a password of sixteen characters, signed in on a client of its own. */
  async function signedInAccount(tag) {
    const email = address(tag);
    const password = randomPassword();
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error || !created.data?.user?.id) return { email, client: null, made: outcome(created.error) };
    made.signIns += 1;
    const client = anonClient();
    const signedIn = await client.auth.signInWithPassword({ email, password });
    return { email, client: signedIn.data?.session ? client : null, made: outcome(signedIn.error) };
  }

  /** One request of the auth service's own mail endpoints with the anon key, reduced to a status and an error code. */
  async function serviceMailRequest(endpoint, body) {
    if (typeof body.email === 'string') left.asked.add(body.email);
    const answer = await jsonCall(`${API}/auth/v1/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: stack.anon, Authorization: `Bearer ${stack.anon}` },
      body: JSON.stringify(body)
    });
    return { status: answer.status, code: codeOf(answer.json?.error_code) };
  }

  /** An address whose mails the cleanup removes. */
  const track = (email) => left.asked.add(email);

  /** What the database holds of an account's password: the fact as a boolean, and a digest that is compared and never printed. */
  function stored(userId) {
    if (!UUID.test(String(userId))) return null;
    const fact = sql(`SELECT private.user_password_set('${userId}'::uuid)`);
    const mark = sql(`SELECT left(md5(coalesce(u.encrypted_password, '')), 8) FROM auth.users u WHERE u.id = '${userId}'::uuid`);
    if ((fact !== 't' && fact !== 'f') || !mark) return null;
    return { set: fact === 't', mark };
  }

  async function accountWithPassword(tag) {
    const email = address(tag);
    const { data, error } = await admin.auth.admin.createUser({ email, password: randomPassword(), email_confirm: true });
    return { email, id: data?.user?.id ?? null, made: outcome(error) };
  }

  /** The recipe of the account-access function. The account's sign-in token hash is kept and never printed. */
  async function accountByRecipe(tag) {
    const email = address(tag);
    const invited = await admin.auth.admin.generateLink({ type: 'invite', email });
    if (invited.error) return { email, id: null, tokenHash: null, made: outcome(invited.error) };
    const minted = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    return {
      email,
      id: invited.data?.user?.id ?? null,
      tokenHash: minted.data?.properties?.hashed_token ?? null,
      made: outcome(minted.error)
    };
  }

  async function accountLikeIdentityProvider(tag) {
    const email = address(tag);
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    return { email, id: data?.user?.id ?? null, made: outcome(error) };
  }

  /** A link of one kind from the service role. Answers its token hash, which is never printed. */
  async function mint(type, email) {
    const { data, error } = await admin.auth.admin.generateLink({ type, email });
    return { tokenHash: data?.properties?.hashed_token ?? null, ...outcome(error) };
  }

  /** One presentation of a token to the auth service, on a client of its own. */
  async function present(tokenHash, type) {
    made.verifications += 1;
    const client = anonClient();
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    const session = data?.session ?? null;
    return { client, session, accepted: !error && session !== null, ...outcome(error) };
  }

  /** `claim_invitations` for the seed's project, asked with an access token as it is. */
  async function claim(accessToken) {
    try {
      const response = await boundedFetch(`${API}/rest/v1/rpc/claim_invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: stack.anon, Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ p_project_id: PROJECT })
      });
      const json = await response.json().catch(() => null);
      return {
        status: response.status,
        passwordSet: typeof json?.password_set === 'boolean' ? json.password_set : null,
        claimed: Array.isArray(json?.claimed) ? json.claimed.length : null,
        skipped: Array.isArray(json?.skipped) ? json.skipped.length : null
      };
    } catch {
      return { status: 0, passwordSet: null, claimed: null, skipped: null };
    }
  }

  /** One password sign-in at the auth service, timed from the request to the end of its answer. */
  async function signIn(email, password) {
    made.signIns += 1;
    const started = performance.now();
    try {
      const response = await boundedFetch(`${API}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: stack.anon, Authorization: `Bearer ${stack.anon}` },
        body: JSON.stringify({ email, password })
      });
      const json = await response.json().catch(() => null);
      return { status: response.status, code: codeOf(json?.error_code), ms: performance.now() - started };
    } catch {
      return { status: 0, code: 'none', ms: performance.now() - started };
    }
  }

  /** One (project, editor) invitation by email in the seed's project, seeded as the service role. Answers whether a row came back. */
  async function seedInvitation(email) {
    const { data, error } = await admin.rpc('create_invitations', {
      p_project_id: PROJECT,
      p_invitations: [{ scope: 'project', role: 'editor', email }]
    });
    return !error && Array.isArray(data) && data.length === 1 && UUID.test(String(data[0]?.id));
  }

  /**
   * An account with a password that holds a project-scope grant, got as a user gets one: an invitation for the
   * account's address, claimed on the account's own session. `ok` is false with the `step` that could not be made.
   */
  async function grantHolder(tag) {
    const email = address(tag);
    const password = randomPassword();
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    const id = created.data?.user?.id ?? null;
    if (created.error || !id) return { email, id, ok: false, step: `the account was not created (${seen(outcome(created.error))})` };
    if (!(await seedInvitation(email))) return { email, id, ok: false, step: 'its invitation was not seeded' };
    made.signIns += 1;
    const signedIn = await anonClient().auth.signInWithPassword({ email, password });
    const accessToken = signedIn.data?.session?.access_token ?? null;
    if (!accessToken) return { email, id, ok: false, step: `its password sign-in gave no session (${seen(outcome(signedIn.error))})` };
    const claimed = await claim(accessToken);
    const ok = claimed.status === 200 && claimed.claimed === 1 && claimed.skipped === 0;
    return { email, id, ok, step: ok ? '' : `the claim answered ${claimed.status} with ${claimed.claimed ?? 'unread'} claimed and ${claimed.skipped ?? 'unread'} skipped` };
  }

  /** Ask the function. The anon key travels as `apikey` and as bearer, as the application's client sends it. */
  function ask(body, headers = {}) {
    if (typeof body.email === 'string') left.asked.add(body.email);
    return rawPost(
      FUNCTION_URL,
      { 'Content-Type': 'application/json', apikey: stack.anon, Authorization: `Bearer ${stack.anon}`, ...headers },
      { project_id: PROJECT, ...body }
    );
  }

  /** Open a completion witness. Answers its id, or null. */
  async function openWitness() {
    const { data, error } = await admin.rpc('invitation_link_witness_open');
    if (error || !UUID.test(String(data))) return null;
    left.witnesses.push(data);
    return data;
  }

  /** Poll a witness until it reads a finished outcome. Answers `sent`, `not-sent`, or null after the ceiling. */
  async function finishedWitness(id) {
    const started = Date.now();
    while (Date.now() - started < WITNESS_CEILING_MS) {
      const { data, error } = await admin.rpc('invitation_link_witness', { p_id: id });
      if (!error && (data === 'sent' || data === 'not-sent')) return data;
      await sleep(250);
    }
    return null;
  }

  /** One request of the function with a witness of its own. Answers the function's answer and the witness's finished outcome. */
  async function witnessed(fields, headers = {}) {
    const witness = await openWitness();
    if (!witness) return { answer: { status: 0, json: null, ms: 0 }, outcome: null, opened: false };
    const answer = await ask({ ...fields, witness }, headers);
    return { answer, outcome: await finishedWitness(witness), opened: true };
  }

  /** The messages the catcher holds for an address, or null when it could not be asked. */
  async function mailsFor(email) {
    const found = await jsonCall(`${MAIL_API}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    return found.status === 200 && Array.isArray(found.json?.messages) ? found.json.messages : null;
  }

  /** The messages for an address once at least `least` are there, waited for at most the ceiling; then whatever is there. */
  async function mailsOnce(email, least) {
    const started = Date.now();
    let mails = await mailsFor(email);
    while (least > 0 && (mails === null || mails.length < least) && Date.now() - started < MAIL_CEILING_MS) {
      await sleep(500);
      mails = await mailsFor(email);
    }
    return mails;
  }

  /** The links of a message: every href of its html part, and every URL of its text part. */
  async function linksOf(messageId) {
    const message = await jsonCall(`${MAIL_API}/api/v1/message/${encodeURIComponent(String(messageId))}`);
    if (message.status !== 200) return null;
    return {
      html: Array.from(String(message.json?.HTML ?? '').matchAll(/href="([^"]*)"/g)).map((m) => unescapeHtml(m[1])),
      text: Array.from(String(message.json?.Text ?? '').matchAll(/https?:\/\/\S+/g)).map((m) => m[0])
    };
  }

  /** Every auth user, read page by page. Answers null when a page could not be read. */
  async function allUsers() {
    const users = [];
    for (let page = 1; page < 200; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !Array.isArray(data?.users)) return null;
      users.push(...data.users);
      if (data.users.length < 200) return users;
    }
    return null;
  }

  /** How many users hold exactly this address, or null when the users could not be read. */
  async function usersFor(email) {
    const users = await allUsers();
    return users ? users.filter((u) => String(u.email ?? '').toLowerCase() === email).length : null;
  }

  /**
   * What the function's requests left beside users and invitations, removed: the witnesses this run opened, the
   * one-mail-a-minute slots of the addresses it asked for, and the mails the catcher holds for them. Answers a
   * count of each, null where the removal could not be made.
   */
  async function removeRequestTraces() {
    const witnessIds = left.witnesses.filter((id) => UUID.test(String(id)));
    const witnesses =
      witnessIds.length === 0
        ? '0'
        : sql(`WITH gone AS (DELETE FROM private.invitation_link_witness WHERE id IN (${witnessIds.map((id) => `'${id}'::uuid`).join(', ')}) RETURNING 1) SELECT count(*) FROM gone`);
    const keys = [...left.asked].map((email) => `link:${PROJECT}:${createHash('sha256').update(email).digest('hex')}`);
    const slots =
      keys.length === 0 ? '0' : sql(`WITH gone AS (DELETE FROM private.invitation_throttle WHERE key IN (${keys.map((key) => `'${key}'`).join(', ')}) RETURNING 1) SELECT count(*) FROM gone`);
    let mails = 0;
    for (const email of left.asked) {
      const held = await mailsFor(email);
      if (held === null) {
        mails = null;
        break;
      }
      if (held.length === 0) continue;
      const removed = await jsonCall(`${MAIL_API}/api/v1/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDs: held.map((mail) => mail.ID) })
      });
      if (removed.status !== 200) {
        mails = null;
        break;
      }
      mails += held.length;
    }
    return { witnesses, slots, mails };
  }

  /** Deletes every user of the probe, every invitation naming one of its addresses and what its requests left, and confirms that no such user and no such invitation remains. */
  async function cleanup() {
    const users = await allUsers();
    const ours = (users ?? []).filter((u) => String(u.email ?? '').startsWith(ADDRESS_PREFIX) && !spare.has(String(u.email ?? '').toLowerCase()));
    let refusedRemovals = 0;
    for (const user of ours) {
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) refusedRemovals += 1;
    }
    const after = await allUsers();
    const usersLeft = after ? after.filter((u) => String(u.email ?? '').startsWith(ADDRESS_PREFIX) && !spare.has(String(u.email ?? '').toLowerCase())).length : null;
    const named = `email.like.${ADDRESS_PREFIX}*,pending_email.like.${ADDRESS_PREFIX}*`;
    const removedInvitations = await admin.from('invitations').delete({ count: 'exact' }).or(named);
    const invitations = await admin.from('invitations').select('id', { count: 'exact', head: true }).or(named);
    const invitationsLeft = invitations.error ? null : invitations.count;
    const traces = await removeRequestTraces();
    line(
      'cleanup',
      users !== null && refusedRemovals === 0 && usersLeft === 0 && !removedInvitations.error && invitationsLeft === 0 && traces.witnesses !== null && traces.slots !== null && traces.mails !== null,
      `${users === null ? 'the users could not be read' : `${ours.length} user(s) of the probe found`}${spare.size > 0 ? `; ${spare.size} kept for the row p5` : ''}; ${refusedRemovals} removal(s) refused; ${usersLeft ?? 'an unread number of'} left; ${removedInvitations.error ? 'the invitations could not be removed' : `${removedInvitations.count ?? 0} invitation(s) removed`}; ${invitationsLeft ?? 'an unread number of'} invitation(s) naming an address of the probe; ${traces.witnesses ?? 'an unread number of'} witness(es), ${traces.slots ?? 'an unread number of'} slot(s) and ${traces.mails ?? 'an unread number of'} mail(s) of its requests removed`
    );
  }

  return {
    anonClient,
    address,
    made,
    stored,
    accountWithPassword,
    accountByRecipe,
    accountLikeIdentityProvider,
    mint,
    present,
    claim,
    signIn,
    usersFor,
    grantHolder,
    seedInvitation,
    witnessed,
    mailsOnce,
    mailsFor,
    linksOf,
    spare,
    sevenOf,
    userAt,
    storeSevenDirectly,
    signedInAccount,
    serviceMailRequest,
    track,
    admin,
    cleanup
  };
}

/** The line of an account that could not be created; the steps that need it are not made. */
const notCreated = (label, account) => `${label}: could not be created — ${seen(account.made)}; the steps that need it were not made`;
const refusal = (presentation) => `refused: ${!presentation.accepted}, ${seen(presentation)}`;

// ── p1 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP1(c) {
  const r = recorder('p1');

  /** The fact, a recovery link, its token verified, the fact again, the token a second time. */
  async function recoveryOn(label, account) {
    if (!r.act(account.made.ok && account.id ? `${label}: created` : notCreated(label, account), account.made.ok && Boolean(account.id))) return;
    const before = c.stored(account.id);
    if (!r.act(`${label}: password set before the recovery link — ${before ? before.set : 'not read'}`, before !== null)) return;
    const minted = await c.mint('recovery', account.email);
    r.observe(`${label}: a recovery link from the service role — issued: ${minted.ok && Boolean(minted.tokenHash)}, ${seen(minted)}`, answered(minted), minted.ok && Boolean(minted.tokenHash));
    if (!minted.tokenHash) {
      r.act(`${label}: no recovery token exists; its verification, the second read and the second presentation were not made`, false);
      return;
    }
    const first = await c.present(minted.tokenHash, 'recovery');
    r.observe(`${label}: the recovery token verified as recovery — a session came back: ${first.accepted}, ${seen(first)}`, answered(first), first.accepted);
    const after = c.stored(account.id);
    r.observe(
      `${label}: password set after the verification — ${after ? after.set : 'not read'}; the stored value is unchanged: ${after ? after.mark === before.mark : 'not read'}`,
      after !== null,
      after !== null && after.set === before.set && after.mark === before.mark
    );
    const second = await c.present(minted.tokenHash, 'recovery');
    r.observe(`${label}: the same recovery token presented a second time — ${refusal(second)}`, answered(second), !second.accepted);
  }

  await recoveryOn('an account with a password', await c.accountWithPassword('p1-with'));
  await recoveryOn('an account made by the recipe, never signed in', await c.accountByRecipe('p1-without'));

  const stranger = c.address('p1-unknown');
  const asked = await c.mint('recovery', stranger);
  const existing = await c.usersFor(stranger);
  r.observe(
    `an address with no account: a recovery link asked of the service role — issued: ${asked.ok}, ${seen(asked)}; users for the address afterwards: ${existing ?? 'not read'}`,
    answered(asked) && existing !== null,
    existing === 0
  );

  const fresh = await c.accountByRecipe('p1-signin');
  if (r.act(fresh.made.ok && fresh.tokenHash ? 'a fresh account made by the recipe: created' : notCreated('a fresh account made by the recipe', fresh), fresh.made.ok && Boolean(fresh.tokenHash))) {
    const first = await c.present(fresh.tokenHash, 'magiclink');
    r.observe(`the sign-in token verified as magiclink — a session came back: ${first.accepted}, ${seen(first)}`, answered(first), first.accepted);
    const second = await c.present(fresh.tokenHash, 'magiclink');
    r.observe(`the same sign-in token presented a second time — ${refusal(second)}`, answered(second), !second.accepted);
  }

  if (!r.measured) console.log('P1: not measured');
  else if (r.differed.length === 0) console.log('P1: held');
  else {
    console.log('P1: not held');
    console.log(`P1-DIFFERED: ${r.differed.join(', ')}`);
  }
  const expiry = configuredOtpExpiry();
  if (expiry === null) line('p1.expiry', false, 'otp_expiry of [auth.email] could not be read from config.toml');
  else console.log(`P1-EXPIRY: ${expiry} s configured; not observed`);
}

// ── p2 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP2(c) {
  const r = recorder('p2');

  /** An account with a password, with one link of each named kind minted in the order given. */
  async function pair(name, tag, kinds) {
    const account = await c.accountWithPassword(tag);
    if (!account.made.ok) {
      r.act(notCreated(`(${name}) an account with a password`, account), false);
      return null;
    }
    const tokens = {};
    for (const kind of kinds) {
      const minted = await c.mint(kind, account.email);
      if (!minted.tokenHash) {
        r.act(`(${name}) a ${kind} link could not be issued — ${seen(minted)}; the presentation was not made`, false);
        return null;
      }
      tokens[kind] = minted.tokenHash;
    }
    r.act(`(${name}) an account with a password, and its link(s) issued in the order ${kinds.join(', then ')}`, true);
    return tokens;
  }

  const accepted = [];
  const earlier = (name, id, presentation) => {
    if (answered(presentation) && presentation.accepted) accepted.push(`(${name}) ${id}`);
  };

  const i = await pair('i', 'p2-i', ['magiclink', 'recovery']);
  if (i) {
    const shown = await c.present(i.magiclink, 'magiclink');
    earlier('i', r.observe(`(i) the earlier sign-in token presented after a recovery link was issued — ${refusal(shown)}`, answered(shown), !shown.accepted), shown);
  }

  const ii = await pair('ii', 'p2-ii', ['recovery', 'magiclink']);
  if (ii) {
    const shown = await c.present(ii.recovery, 'recovery');
    earlier('ii', r.observe(`(ii) the earlier recovery token presented after a sign-in link was issued — ${refusal(shown)}`, answered(shown), !shown.accepted), shown);
  }

  const iii = await pair('iii', 'p2-iii', ['magiclink', 'recovery']);
  if (iii) {
    const opened = await c.present(iii.recovery, 'recovery');
    r.act(`(iii) the later recovery token presented first — accepted: ${opened.accepted}, ${seen(opened)}`, answered(opened));
    const shown = await c.present(iii.magiclink, 'magiclink');
    earlier('iii', r.observe(`(iii) the sign-in token presented after the recovery token was opened — ${refusal(shown)}`, answered(shown), !shown.accepted), shown);
  }

  let crossed = null;
  const iv = await pair('iv', 'p2-iv', ['magiclink']);
  if (iv) {
    crossed = await c.present(iv.magiclink, 'recovery');
    r.act(`(iv) a sign-in token presented with the type recovery — accepted: ${crossed.accepted}, ${seen(crossed)}`, answered(crossed));
  }

  if (!r.measured || crossed === null) {
    console.log('P2: not measured');
    return;
  }
  if (accepted.length === 0) console.log('P2: held');
  else {
    console.log('P2: not held');
    console.log(`P2-ACCEPTED: ${accepted.join(', ')}`);
  }
  console.log(`P2-TYPE: ${crossed.accepted ? 'interchangeable' : 'bound'}`);
}

// ── p3 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP3(c) {
  const r = recorder('p3');
  const read = (id) => c.stored(id);
  const shown = (state) => (state ? state.set : 'not read');
  let before = null;
  let afterVerification = null;
  let afterPassword = null;
  let identityProvider = null;
  let recoveryUnchanged = null;

  const recipe = await c.accountByRecipe('p3-recipe');
  let session = null;
  if (r.act(recipe.made.ok && recipe.tokenHash ? 'the recipe\'s account: created' : notCreated('the recipe\'s account', recipe), recipe.made.ok && Boolean(recipe.tokenHash))) {
    before = read(recipe.id);
    r.observe(`the recipe's account before its first verification — password set: ${shown(before)}`, before !== null, before?.set === false);
    const first = await c.present(recipe.tokenHash, 'magiclink');
    r.act(`the recipe's account: its sign-in token verified as magiclink — a session came back: ${first.accepted}, ${seen(first)}`, answered(first) && first.accepted);
    if (first.accepted) session = first;
    afterVerification = read(recipe.id);
    r.observe(`the recipe's account after its first verification — password set: ${shown(afterVerification)}`, afterVerification !== null, afterVerification?.set === false);
  }

  const withPassword = await c.accountWithPassword('p3-with');
  if (r.act(withPassword.made.ok ? 'an account created with a password: created' : notCreated('an account created with a password', withPassword), withPassword.made.ok)) {
    const state = read(withPassword.id);
    r.observe(`an account created with a password — password set: ${shown(state)}`, state !== null, state?.set === true);
  }

  const shaped = await c.accountLikeIdentityProvider('p3-idp');
  if (r.act(shaped.made.ok ? 'an identity-provider-shaped account: created' : notCreated('an identity-provider-shaped account', shaped), shaped.made.ok)) {
    identityProvider = read(shaped.id);
    r.observe(`an identity-provider-shaped account — password set: ${shown(identityProvider)}`, identityProvider !== null, identityProvider?.set === true);
  }

  if (session) {
    const updated = outcome((await session.client.auth.updateUser({ password: randomPassword() })).error);
    r.act(`the recipe's account: a password set on its link session — ${seen(updated)}`, answered(updated) && updated.ok);
    afterPassword = read(recipe.id);
    r.observe(`the recipe's account after the password was set — password set: ${shown(afterPassword)}`, afterPassword !== null, afterPassword?.set === true);
  } else {
    r.act('the recipe\'s account has no session; no password could be set on it', false);
  }

  const second = await c.accountByRecipe('p3-recovery');
  if (r.act(second.made.ok && second.id ? 'a second recipe account: created' : notCreated('a second recipe account', second), second.made.ok && Boolean(second.id))) {
    const earlier = read(second.id);
    const minted = await c.mint('recovery', second.email);
    if (r.act(`a second recipe account: password set before — ${shown(earlier)}; a recovery link issued: ${Boolean(minted.tokenHash)}, ${seen(minted)}`, earlier !== null && Boolean(minted.tokenHash))) {
      const opened = await c.present(minted.tokenHash, 'recovery');
      r.act(`a second recipe account: its recovery token verified as recovery — a session came back: ${opened.accepted}, ${seen(opened)}`, answered(opened) && opened.accepted);
      const later = read(second.id);
      recoveryUnchanged = later === null ? null : later.set === earlier.set && later.mark === earlier.mark;
      r.observe(
        `a second recipe account after a recovery token was verified — password set: ${shown(later)}; the stored value is unchanged: ${recoveryUnchanged ?? 'not read'}`,
        later !== null,
        recoveryUnchanged === true
      );
    }
  }

  if (!r.measured || !before || !afterVerification || !afterPassword || !identityProvider || recoveryUnchanged === null) {
    console.log('P3: not measured');
    return;
  }
  console.log(`P3: ${!before.set && !afterVerification.set && afterPassword.set ? 'held' : 'not held'}`);
  console.log(`P3-IDP: ${identityProvider.set ? 'set' : 'empty'}`);
  console.log(`P3-RECOVERY: ${recoveryUnchanged ? 'unchanged' : 'changed'}`);
}

// ── p4 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP4(c) {
  const r = recorder('p4');
  const answer = (read) => `status ${read.status}, password_set: ${read.passwordSet ?? 'not read'}, claimed ${read.claimed ?? '?'}, skipped ${read.skipped ?? '?'}`;

  const recipe = await c.accountByRecipe('p4-recipe');
  if (!r.act(recipe.made.ok && recipe.tokenHash ? 'a recipe account: created' : notCreated('a recipe account', recipe), recipe.made.ok && Boolean(recipe.tokenHash))) {
    console.log('P4: not measured');
    return;
  }
  const link = await c.present(recipe.tokenHash, 'magiclink');
  if (!r.act(`its sign-in token verified on a client that keeps the session in memory — a session came back: ${link.accepted}, ${seen(link)}`, answered(link) && link.accepted)) {
    console.log('P4: not measured');
    return;
  }
  const earlierToken = link.session.access_token;
  const earlierMark = digest(earlierToken);

  const beforeRead = await c.claim(earlierToken);
  r.observe(`claim_invitations read with the link session — ${answer(beforeRead)}`, beforeRead.status === 200 && beforeRead.passwordSet !== null, beforeRead.passwordSet === false);

  const updated = outcome((await link.client.auth.updateUser({ password: randomPassword() })).error);
  r.observe(`a password of sixteen characters set on that session — updated: ${updated.ok}, ${seen(updated)}`, answered(updated), updated.ok);

  const current = (await link.client.auth.getSession()).data?.session ?? null;
  r.act(
    `the client's access token after the update — present: ${current !== null}; its digest differs from the earlier one: ${current ? digest(current.access_token) !== earlierMark : 'not read'}`,
    current !== null
  );

  const laterRead = await c.claim(earlierToken);
  const refused = laterRead.status === 401 || laterRead.status === 403;
  r.observe(
    `claim_invitations read by a second client holding the access token as it was before the update — refused: ${refused}, ${answer(laterRead)}`,
    laterRead.status !== 0 && laterRead.status < 500 && laterRead.status !== 429,
    laterRead.status === 200 && laterRead.passwordSet === true
  );

  if (!r.measured) {
    console.log('P4: not measured');
    return;
  }
  if (updated.ok && laterRead.status === 200 && laterRead.passwordSet === true) {
    console.log('P4: held');
    return;
  }
  const refreshed = await link.client.auth.refreshSession();
  const refreshedToken = refreshed.data?.session?.access_token ?? null;
  const afterRefresh = refreshedToken ? await c.claim(refreshedToken) : { status: 0, passwordSet: null, claimed: null, skipped: null };
  r.act(
    `refreshSession() on the first client, then claim_invitations with the refreshed session — refreshed: ${refreshedToken !== null}, ${seen(outcome(refreshed.error))}; ${answer(afterRefresh)}`,
    true
  );
  console.log('P4: not held');
  console.log(`P4-FALLBACK: ${afterRefresh.status === 200 && afterRefresh.passwordSet === true ? 'refresh' : 'full-load'}`);
}

// ── p5pre ────────────────────────────────────────────────────────────────────────────────────────
async function rowP5pre(c) {
  const r = recorder('p5pre');
  const email = P5PRE_ADDRESS;
  const earlier = await c.userAt(email);
  if (!r.act(`the row's address read: ${earlier === null ? 'the users could not be read' : earlier ? 'an earlier account holds it' : 'no account holds it'}`, earlier !== null)) {
    console.log('P5-PRE: not made');
    return;
  }
  if (earlier) {
    const removed = outcome((await c.admin.auth.admin.deleteUser(earlier.id)).error);
    if (!r.act(`the earlier account removed — ${seen(removed)}`, removed.ok)) {
      console.log('P5-PRE: not made');
      return;
    }
  }
  const created = await c.admin.auth.admin.createUser({ email, password: c.sevenOf(email), email_confirm: true });
  const made = outcome(created.error);
  r.act(`an administrator's createUser with a password of ${CLIENT_MINIMUM - 1} characters, on the configuration the service started with — ${seen(made)}`, answered(made));
  if (made.ok && created.data?.user?.id) {
    c.spare.add(email);
    console.log('P5-PRE: created');
    return;
  }
  if (made.code !== 'weak_password') {
    r.act('the account was neither created nor refused as weak; nothing else was made', false);
    console.log('P5-PRE: not made');
    return;
  }
  const longer = await c.admin.auth.admin.createUser({ email, password: randomPassword(), email_confirm: true });
  const longerId = longer.data?.user?.id ?? null;
  if (!r.act(`the account made with a password of sixteen characters instead — ${seen(outcome(longer.error))}`, !longer.error && Boolean(longerId))) {
    console.log('P5-PRE: not made');
    return;
  }
  c.spare.add(email);
  const stored = c.storeSevenDirectly(longerId, email);
  if (!r.act(`the bcrypt hash of a password of ${CLIENT_MINIMUM - 1} characters stored for it directly in the database, at the cost of its stored hash, and checked against that password: ${stored}`, stored)) {
    console.log('P5-PRE: not made');
    return;
  }
  console.log('P5-PRE: stored directly');
}

// ── p5 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP5(c) {
  const r = recorder('p5');
  const verdict = () => {
    if (!r.measured) console.log('P5: not measured');
    else if (r.differed.length === 0) console.log('P5: held');
    else {
      console.log('P5: not held');
      console.log(`P5-DIFFERED: ${r.differed.join(', ')}`);
    }
  };
  const seven = () => randomPassword().slice(0, CLIENT_MINIMUM - 1);
  const eight = () => randomPassword().slice(0, CLIENT_MINIMUM);

  const earlier = await c.userAt(P5PRE_ADDRESS);
  if (!r.act(`the account the row p5pre made: ${earlier === null ? 'the users could not be read' : earlier ? 'found' : 'missing'}`, Boolean(earlier))) {
    if (earlier === undefined) console.log('P5-PRE: missing');
    return verdict();
  }

  const fresh = await c.signedInAccount('p5-fresh');
  if (r.act(fresh.client ? 'a fresh account with a password of sixteen characters: created and signed in' : `a fresh account: not signed in — ${seen(fresh.made)}; its two steps were not made`, fresh.client !== null)) {
    const short = outcome((await fresh.client.auth.updateUser({ password: seven() })).error);
    r.observe(`the user's own update to a password of ${CLIENT_MINIMUM - 1} characters — refused: ${!short.ok}, ${seen(short)}`, short.status !== 0 && short.status < 500, !short.ok && answered(short));
    const enough = outcome((await fresh.client.auth.updateUser({ password: eight() })).error);
    r.observe(`the user's own update to a password of ${CLIENT_MINIMUM} characters — accepted: ${enough.ok}, ${seen(enough)}`, enough.status !== 0 && enough.status < 500, enough.ok);
  }

  const byAdmin = outcome((await c.admin.auth.admin.createUser({ email: c.address('p5-admin-seven'), password: seven(), email_confirm: true })).error);
  r.observe(`an administrator's createUser with a password of ${CLIENT_MINIMUM - 1} characters — refused: ${!byAdmin.ok}, ${seen(byAdmin)}`, byAdmin.status !== 0 && byAdmin.status < 500, !byAdmin.ok && answered(byAdmin));

  const older = await c.signIn(P5PRE_ADDRESS, c.sevenOf(P5PRE_ADDRESS));
  r.observe(`a password sign-in with the ${CLIENT_MINIMUM - 1}-character password the account had before the restart — ${seen(older)}`, answered(older), older.status === 200);

  verdict();
}

// ── p6 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP6(c) {
  const r = recorder('p6');
  const read = (outcome) => outcome ?? 'nothing within the ceiling';
  const counted = (mails) => (mails === null ? 'not read' : String(mails.length));
  const lastServiceRequest = { at: 0 };
  const service = async (endpoint, body) => {
    const answer = await c.serviceMailRequest(endpoint, body);
    lastServiceRequest.at = Date.now();
    return answer;
  };

  // A link from the service role, and its token verified.
  const linked = await c.accountWithPassword('p6-link');
  if (!r.act(linked.made.ok ? 'an account with a password for the link and the change of address: created' : notCreated('an account with a password', linked), linked.made.ok)) {
    console.log('P6: not measured');
    return;
  }
  const minted = await c.mint('magiclink', linked.email);
  const generated = minted.ok && Boolean(minted.tokenHash);
  r.observe(`generateLink of the type magiclink — ${seen(minted)}; a token came back: ${Boolean(minted.tokenHash)}`, minted.status !== 0, generated);
  let session = null;
  if (generated) {
    session = await c.present(minted.tokenHash, 'magiclink');
    r.observe(`its token verified as magiclink — a session came back: ${session.accepted}, ${seen(session)}`, answered(session), session.accepted);
  } else {
    r.act('no token came back, so none was verified', false);
  }

  // The service's own one-time-code and recovery requests, for an address with an account and one without.
  const registered = await c.accountWithPassword('p6-registered');
  if (!r.act(registered.made.ok ? 'an account with a password for the service\'s own requests: created' : notCreated('an account with a password', registered), registered.made.ok)) {
    console.log('P6: not measured');
    return;
  }
  const unregistered = c.address('p6-unregistered');
  const otpRegistered = await service('otp', { email: registered.email, create_user: false });
  const otpUnregistered = await service('otp', { email: unregistered, create_user: false });
  // The service allows one mail of a kind per user a second; the recovery requests wait it out.
  await sleep(1_500);
  const recoverRegistered = await service('recover', { email: registered.email });
  const recoverUnregistered = await service('recover', { email: unregistered });
  r.act(`the service's own one-time-code request, create_user false — an address with an account: ${seen(otpRegistered)}; an address without: ${seen(otpUnregistered)}`, otpRegistered.status !== 0 && otpUnregistered.status !== 0);
  r.act(`the service's own recovery request — an address with an account: ${seen(recoverRegistered)}; an address without: ${seen(recoverUnregistered)}`, recoverRegistered.status !== 0 && recoverUnregistered.status !== 0);

  // The user's own change of address, on the verified session.
  const newAddress = c.address('p6-new');
  c.track(linked.email);
  c.track(newAddress);
  let change = null;
  if (session?.accepted) {
    change = outcome((await session.client.auth.updateUser({ email: newAddress })).error);
    lastServiceRequest.at = Date.now();
    r.act(`the user's own change of address on that session — ${seen(change)}`, change.status !== 0);
  } else {
    r.act('no session, so no change of address was asked', false);
  }

  // The function's two mails, each to an eligible address and with a witness.
  const invitee = c.address('p6-invitee');
  const seeded = await c.seedInvitation(invitee);
  let linkMails = null;
  let linkRequest = null;
  if (r.act(seeded ? 'an address with an open invitation: its invitation seeded' : 'an address with an open invitation: its invitation could not be seeded; its link request was not made', seeded)) {
    linkRequest = await c.witnessed({ operation: 'request-link', email: invitee });
    linkMails = await c.mailsOnce(invitee, linkRequest.outcome === 'sent' ? 1 : 0);
    r.observe(`the function's link request for it — status ${linkRequest.answer.status}; the witness read ${read(linkRequest.outcome)}; mails for the address — ${counted(linkMails)}`, linkRequest.opened && linkRequest.outcome !== null && linkMails !== null, linkRequest.outcome === 'sent' && linkMails?.length === 1);
  }
  const holder = await c.grantHolder('p6-holder');
  let recoveryMails = null;
  let recoveryRequest = null;
  if (r.act(holder.ok ? 'a grant holder: an account with a password, its invitation seeded and claimed on its own session' : `a grant holder: ${holder.step}; its recovery request was not made`, holder.ok)) {
    recoveryRequest = await c.witnessed({ operation: 'request-recovery', email: holder.email });
    recoveryMails = await c.mailsOnce(holder.email, recoveryRequest.outcome === 'sent' ? 1 : 0);
    r.observe(`the function's recovery request for it — status ${recoveryRequest.answer.status}; the witness read ${read(recoveryRequest.outcome)}; mails for the address — ${counted(recoveryMails)}`, recoveryRequest.opened && recoveryRequest.outcome !== null && recoveryMails !== null, recoveryRequest.outcome === 'sent' && recoveryMails?.length === 1);
  }

  // The service sends a mail before it answers; the catcher is read no sooner than five seconds after its last request.
  const settle = 5_000 - (Date.now() - lastServiceRequest.at);
  if (settle > 0) await sleep(settle);
  const held = {
    otpRegistered: await c.mailsFor(registered.email),
    otpUnregistered: await c.mailsFor(unregistered),
    oldAddress: await c.mailsFor(linked.email),
    newAddress: await c.mailsFor(newAddress)
  };
  r.observe(
    `mails the catcher holds after the service's own four requests — the address with an account: ${counted(held.otpRegistered)}; the address without: ${counted(held.otpUnregistered)}`,
    held.otpRegistered !== null && held.otpUnregistered !== null,
    held.otpRegistered?.length === 0 && held.otpUnregistered?.length === 0
  );
  r.observe(
    `mails the catcher holds after the change of address — the old address: ${counted(held.oldAddress)}; the new address: ${counted(held.newAddress)}`,
    held.oldAddress !== null && held.newAddress !== null,
    held.oldAddress?.length === 0 && held.newAddress?.length === 0
  );

  if (!r.measured) {
    console.log('P6: not measured');
    return;
  }
  const serviceSilent = held.otpRegistered.length === 0 && held.otpUnregistered.length === 0;
  const functionMailed = linkRequest?.outcome === 'sent' && linkMails?.length === 1 && recoveryRequest?.outcome === 'sent' && recoveryMails?.length === 1;
  console.log(`P6: ${generated && session?.accepted && serviceSilent && functionMailed ? 'held' : 'not held'}`);
  console.log(`P6-OTP: ${otpRegistered.status === otpUnregistered.status && otpRegistered.code === otpUnregistered.code ? 'uniform' : 'distinguishes'}`);
  console.log(`P6-EMAIL-CHANGE: ${held.oldAddress.length === 0 && held.newAddress.length === 0 ? 'no mail' : 'mail'}`);
}

// ── p7 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP7(c) {
  const r = recorder('p7');
  const known = await c.accountWithPassword('p7-with');
  const recipe = await c.accountByRecipe('p7-without');
  if (!r.act(known.made.ok ? 'an account with a password: created' : notCreated('an account with a password', known), known.made.ok)) {
    console.log('P7: not measured');
    return;
  }
  if (!r.act(recipe.made.ok ? 'an account made by the recipe, never signed in: created' : notCreated('an account made by the recipe', recipe), recipe.made.ok)) {
    console.log('P7: not measured');
    return;
  }
  const cases = [
    { name: 'an address with no account', email: c.address('p7-unknown'), answers: [] },
    { name: 'an account with a password, a wrong password', email: known.email, answers: [] },
    { name: 'an account with no password', email: recipe.email, answers: [] }
  ];

  // One request that is no sign-in, so that the first timed sign-in does not also pay for the connection.
  await boundedFetch(`${API}/auth/v1/health`).then((response) => response.arrayBuffer()).catch(() => null);
  for (let round = 0; round < SIGN_INS_PER_CASE; round += 1) {
    for (let turn = 0; turn < cases.length; turn += 1) {
      const next = cases[(round + turn) % cases.length];
      next.answers.push(await c.signIn(next.email, randomPassword()));
    }
  }

  const tenth = (ms) => Math.round(ms * 10) / 10;
  for (const one of cases) {
    const times = one.answers.map((a) => a.ms).sort((a, b) => a - b);
    one.statuses = [...new Set(one.answers.map((a) => a.status))].sort();
    one.codes = [...new Set(one.answers.map((a) => a.code))].sort();
    one.least = times[0];
    one.median = times[Math.floor(times.length / 2)];
    one.greatest = times[times.length - 1];
    r.act(
      `${one.name}: ${one.answers.length} sign-ins — statuses {${one.statuses.join(', ')}}; codes {${one.codes.join(', ')}}; least ${tenth(one.least)} ms, median ${tenth(one.median)} ms, greatest ${tenth(one.greatest)} ms`,
      one.answers.length === SIGN_INS_PER_CASE && one.answers.every((a) => answered(a))
    );
  }

  if (!r.measured) {
    console.log('P7: not measured');
    return;
  }
  const statuses = new Set(cases.flatMap((one) => one.statuses));
  const codes = new Set(cases.flatMap((one) => one.codes));
  const inside = cases.every((one) => cases.every((other) => other === one || (one.median >= other.least && one.median <= other.greatest)));
  console.log(`P7: ${statuses.size === 1 && codes.size === 1 && inside ? 'no difference' : 'difference'}`);
  console.log(`P7-ANSWERS: one status: ${statuses.size === 1}; one error code: ${codes.size === 1}; each median inside the other two ranges: ${inside}`);
}

// ── fn ───────────────────────────────────────────────────────────────────────────────────────────
async function rowFn(c) {
  const r = recorder('fn');
  const ACCEPTED = { accepted: true };
  const sameAnswer = (answer) => answer.status === 200 && isDeepStrictEqual(answer.json, ACCEPTED);
  const read = (outcome) => outcome ?? 'nothing within the ceiling';
  const ms = (answer) => `${Math.round(answer.ms)} ms`;
  /** The one mail for an address and its one link, when there is exactly one of each. */
  async function mailAndLink(email, least) {
    const mails = await c.mailsOnce(email, least);
    const link = mails && mails.length === 1 ? onlyLink(await c.linksOf(mails[0].ID)) : null;
    return { count: mails ? mails.length : null, subject: mails?.[0]?.Subject ?? null, link };
  }
  /** Whether a link is the callback of a locale with exactly the token and the named type, and no fragment. */
  const shaped = (link, locale, type) =>
    link !== null &&
    link.pathname === `/${locale}/api/auth/callback` &&
    isDeepStrictEqual([...link.searchParams.keys()].sort(), ['token_hash', 'type']) &&
    link.searchParams.get('type') === type &&
    link.hash === '';

  const verdict = () => {
    if (!r.measured) console.log('FN: not measured');
    else if (r.differed.length === 0) console.log('FN: held');
    else {
      console.log('FN: not held');
      console.log(`FN-DIFFERED: ${r.differed.join(', ')}`);
    }
  };

  const subjects = await treeSubjects();
  if (!r.act(subjects ? 'the subjects of the two mails were read from the function\'s module in the tree' : 'the subjects of the two mails could not be read from the function\'s module in the tree; no step that needs them was made', subjects !== null)) return verdict();

  // The first grant holder: the whole of a recovery.
  const first = await c.grantHolder('fn-holder-a');
  if (!r.act(first.ok ? 'the first grant holder: an account with a password, its invitation seeded and claimed on its own session' : `the first grant holder: ${first.step}; no step that needs it was made`, first.ok)) return verdict();
  const before = c.stored(first.id);
  if (!r.act(`the first grant holder: password set before the request — ${before ? before.set : 'not read'}`, before !== null)) return verdict();

  const recovery = await c.witnessed({ operation: 'request-recovery', email: first.email });
  r.observe(`the first grant holder: a recovery request — status ${recovery.answer.status}, the accepted body: ${isDeepStrictEqual(recovery.answer.json, ACCEPTED)}, answered in ${ms(recovery.answer)}`, recovery.opened && recovery.answer.status !== 0, sameAnswer(recovery.answer));
  r.observe(`the first grant holder: the witness of that request read ${read(recovery.outcome)}`, recovery.outcome !== null, recovery.outcome === 'sent');
  const firstMail = await mailAndLink(first.email, recovery.outcome === 'sent' ? 1 : 0);
  r.observe(
    `the first grant holder: mails for the address — ${firstMail.count ?? 'not read'}; the subject is the English recovery subject: ${firstMail.subject === subjects.recovery}; it is not the sign-in subject: ${firstMail.subject !== subjects.signIn}`,
    firstMail.count !== null,
    firstMail.count === 1 && firstMail.subject === subjects.recovery
  );
  r.observe(
    `the first grant holder: the mail holds one link, the same in its html and its text: ${firstMail.link !== null}; it has the path of the English callback, exactly the parameters token_hash and type, the type recovery and no fragment: ${shaped(firstMail.link, 'en', 'recovery')}`,
    firstMail.count !== null,
    shaped(firstMail.link, 'en', 'recovery')
  );
  if (firstMail.link === null) {
    r.act('the first grant holder: no link was read; its verification and the second read of the password fact were not made', false);
  } else {
    const session = await c.present(firstMail.link.searchParams.get('token_hash'), 'recovery');
    r.observe(`the first grant holder: the mailed token verified as recovery — a session came back: ${session.accepted}, ${seen(session)}`, answered(session), session.accepted);
    const after = c.stored(first.id);
    r.observe(
      `the first grant holder: password set after the verification — ${after ? after.set : 'not read'}; the stored value is unchanged: ${after ? after.mark === before.mark : 'not read'}`,
      after !== null,
      after !== null && after.set === before.set && after.mark === before.mark
    );
  }
  const firstUsers = await c.usersFor(first.email);
  r.observe(`the first grant holder: users for the address after the request — ${firstUsers ?? 'not read'}`, firstUsers !== null, firstUsers === 1);

  // The same address again, inside the minute.
  const again = await c.witnessed({ operation: 'request-recovery', email: first.email });
  const mailsAfterAgain = again.outcome ? await c.mailsOnce(first.email, 0) : null;
  r.observe(
    `the first grant holder, asked again straight after: the same answer: ${sameAnswer(again.answer)}, in ${ms(again.answer)}; the witness read ${read(again.outcome)}; mails for the address — ${mailsAfterAgain ? mailsAfterAgain.length : 'not read'}`,
    again.opened && again.outcome !== null && mailsAfterAgain !== null,
    sameAnswer(again.answer) && again.outcome === 'not-sent' && mailsAfterAgain !== null && mailsAfterAgain.length === 1
  );

  // An address with an open invitation and no account.
  const invited = c.address('fn-invited');
  const invitedSeeded = await c.seedInvitation(invited);
  const invitedUsers = await c.usersFor(invited);
  let invitedAnswer = null;
  if (
    r.act(
      `an address with an open invitation and no account: ${invitedSeeded ? 'its invitation seeded' : 'its invitation could not be seeded'}; users for the address before the request — ${invitedUsers ?? 'not read'}${invitedSeeded && invitedUsers === 0 ? '' : '; the steps that need it were not made'}`,
      invitedSeeded && invitedUsers === 0
    )
  ) {
    const asked = await c.witnessed({ operation: 'request-recovery', email: invited });
    const mail = await mailAndLink(invited, asked.outcome === 'sent' ? 1 : 0);
    invitedAnswer = asked.answer;
    r.observe(
      `an address with an open invitation and no account: the same answer: ${sameAnswer(asked.answer)}, in ${ms(asked.answer)}; the witness read ${read(asked.outcome)}; mails for the address — ${mail.count ?? 'not read'}; the subject is the English sign-in subject: ${mail.subject === subjects.signIn}; its one link is of the type magiclink on the English callback: ${shaped(mail.link, 'en', 'magiclink')}`,
      asked.opened && asked.outcome !== null && mail.count !== null,
      sameAnswer(asked.answer) && asked.outcome === 'sent' && mail.count === 1 && mail.subject === subjects.signIn && shaped(mail.link, 'en', 'magiclink')
    );
  }

  // An address with neither an account nor an invitation.
  const stranger = c.address('fn-stranger');
  const unknown = await c.witnessed({ operation: 'request-recovery', email: stranger });
  const strangerMails = unknown.outcome ? await c.mailsOnce(stranger, 0) : null;
  const strangerUsers = unknown.outcome ? await c.usersFor(stranger) : null;
  r.observe(
    `an address with neither an account nor an invitation: the same answer: ${sameAnswer(unknown.answer)}, in ${ms(unknown.answer)}; the witness read ${read(unknown.outcome)}; mails for the address — ${strangerMails ? strangerMails.length : 'not read'}; users for the address — ${strangerUsers ?? 'not read'}`,
    unknown.opened && unknown.outcome !== null && strangerMails !== null && strangerUsers !== null,
    sameAnswer(unknown.answer) && unknown.outcome === 'not-sent' && strangerMails !== null && strangerMails.length === 0 && strangerUsers === 0
  );

  // A sign-in link, then at once a recovery link, for one address: the two share a slot.
  const second = await c.grantHolder('fn-holder-b');
  let linkThenRecovery = null;
  if (r.act(second.ok ? 'the second grant holder: an account with a password, its invitation seeded and claimed on its own session' : `the second grant holder: ${second.step}; the steps that need it were not made`, second.ok)) {
    const link = await c.witnessed({ operation: 'request-link', email: second.email });
    const recoveryAfter = await c.witnessed({ operation: 'request-recovery', email: second.email });
    const mail = recoveryAfter.outcome ? await mailAndLink(second.email, link.outcome === 'sent' ? 1 : 0) : { count: null, subject: null, link: null };
    linkThenRecovery = [link.answer, recoveryAfter.answer];
    r.observe(
      `the second grant holder: a link request — the same answer: ${sameAnswer(link.answer)}; its witness read ${read(link.outcome)}; then at once a recovery request — the same answer: ${sameAnswer(recoveryAfter.answer)}, in ${ms(recoveryAfter.answer)}; its witness read ${read(recoveryAfter.outcome)}; mails for the address — ${mail.count ?? 'not read'}; the one mail is the sign-in mail: ${mail.subject === subjects.signIn}`,
      link.opened && recoveryAfter.opened && link.outcome !== null && recoveryAfter.outcome !== null && mail.count !== null,
      sameAnswer(link.answer) && sameAnswer(recoveryAfter.answer) && link.outcome === 'sent' && recoveryAfter.outcome === 'not-sent' && mail.count === 1 && mail.subject === subjects.signIn
    );
  }

  // Another site's headers, and a locale: neither reaches the link's origin, and the locale is the link's own.
  const third = await c.grantHolder('fn-holder-c');
  let hostileAnswer = null;
  if (r.act(third.ok ? 'the third grant holder: an account with a password, its invitation seeded and claimed on its own session' : `the third grant holder: ${third.step}; the steps that need it were not made`, third.ok)) {
    const hostile = await c.witnessed({ operation: 'request-recovery', email: third.email, locale: 'fi' }, { Origin: `https://${OTHER_SITE}`, 'X-Forwarded-Host': OTHER_SITE });
    const mail = await mailAndLink(third.email, hostile.outcome === 'sent' ? 1 : 0);
    hostileAnswer = hostile.answer;
    r.observe(
      `the third grant holder, asked with the Origin and X-Forwarded-Host of another site: the same answer: ${sameAnswer(hostile.answer)}; the witness read ${read(hostile.outcome)}; mails for the address — ${mail.count ?? 'not read'}; the link's origin equals the origin of the first mail's link: ${mail.link !== null && firstMail.link !== null && mail.link.origin === firstMail.link.origin}; the link names the other site nowhere: ${mail.link !== null && !mail.link.href.includes(OTHER_SITE)}`,
      hostile.opened && hostile.outcome !== null && mail.count !== null,
      sameAnswer(hostile.answer) && hostile.outcome === 'sent' && mail.count === 1 && mail.link !== null && firstMail.link !== null && mail.link.origin === firstMail.link.origin && !mail.link.href.includes(OTHER_SITE)
    );
    r.observe(
      `the third grant holder, asked in the locale fi: the subject is the Finnish recovery subject: ${mail.subject === subjects.recoveryFi}; its one link is of the type recovery on the Finnish callback: ${shaped(mail.link, 'fi', 'recovery')}`,
      mail.count !== null,
      mail.subject === subjects.recoveryFi && shaped(mail.link, 'fi', 'recovery')
    );
  }

  // Every answer against the first.
  const answers = [recovery.answer, again.answer, ...(invitedAnswer ? [invitedAnswer] : []), unknown.answer, ...(linkThenRecovery ?? []), ...(hostileAnswer ? [hostileAnswer] : [])];
  const alike = answers.every((answer) => answer.status === recovery.answer.status && isDeepStrictEqual(answer.json, recovery.answer.json));
  const times = answers.map((answer) => Math.round(answer.ms));
  r.observe(
    `the answers: ${answers.length} answers of the function, the first among them, were set against the first — each has its status and a body deep-equal to its body: ${alike}; answered in ${Math.min(...times)} to ${Math.max(...times)} ms`,
    answers.every((answer) => answer.status !== 0),
    alike && sameAnswer(recovery.answer)
  );

  verdict();
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length !== 1) usage('exactly one argument is taken, the rows');
const named = args[0].split(',');
for (const name of named) {
  if (!Object.hasOwn(ROWS, name)) usage(`unknown row '${name}'`);
}
if (new Set(named).size !== named.length) usage('a row is named twice');
if (named.includes('p5pre') && named.includes('p5')) usage('p5pre is run before the restart and p5 after it: name them in two runs');
const rows = Object.keys(ROWS).filter((name) => named.includes(name));

const flight = runsInFlight();
if (!flight.looked) {
  console.error(`${SELF}: tests/e2e-runs/ could not be searched for a run in flight — refusing`);
  process.exit(2);
}
if (flight.open.length > 0) {
  console.error(`${SELF}: an E2E run is in flight (a 'started' file with no 'ended' beside it): ${flight.open.join(' ')}`);
  process.exit(2);
}
const server = serverListening();
if (!server.looked) {
  console.error(`${SELF}: port ${server.port} could not be asked for a listener — refusing`);
  process.exit(2);
}
if (server.listening) {
  console.error(`${SELF}: a process listens on port ${server.port} — an E2E run is in flight`);
  process.exit(2);
}

const budget = rows.reduce((sum, name) => ({ signIns: sum.signIns + ROWS[name].signIns, verifications: sum.verifications + ROWS[name].verifications }), { signIns: 0, verifications: 0 });
console.log(`${SELF}: rows ${rows.join(',')}, started ${new Date().toISOString()}`);
console.log(
  `BUDGET ${budget.signIns} password sign-in(s) and ${budget.verifications} link verification(s); at most ${MOST_OF_A_KIND} of each, counted separately (the stack admits 30 of each in five minutes)`
);
if (budget.signIns > MOST_OF_A_KIND || budget.verifications > MOST_OF_A_KIND) {
  console.error(`${SELF}: the named rows pass ${MOST_OF_A_KIND} of one kind — name fewer rows in one run`);
  process.exit(2);
}

const stack = readStack();
let createClient = null;
try {
  ({ createClient } = await import('@supabase/supabase-js'));
} catch {
  createClient = null;
}
if (!stack || !createClient) {
  line('0 the stack', false, !stack ? "the two API keys and the database's address could not be read from 'supabase status -o env' — is the stack up?" : 'the client library could not be loaded — run yarn install');
} else {
  const health = await boundedFetch(`${API}/auth/v1/health`)
    .then((response) => response.json())
    .catch(() => null);
  const version = typeof health?.version === 'string' && /^v?[0-9.]{1,20}$/.test(health.version) ? health.version : 'unread';
  line('0 the stack', version !== 'unread', `both keys and the database's address captured; the auth service answers as version ${version}`);

  const run = `${Math.floor(Date.now() / 1000)}-${randomBytes(3).toString('hex')}`;
  const c = context(stack, createClient, run);
  let interrupted = false;
  const stop = () => {
    interrupted = true;
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    for (const name of rows) {
      if (interrupted) {
        line(`${name}`, false, 'interrupted before the row began');
        continue;
      }
      try {
        await ROWS[name].run(c);
      } catch (error) {
        line(`${name}`, false, `the row stopped on an exception of the kind ${error instanceof Error ? error.name : 'unknown'}`);
        console.log(`${name.toUpperCase()}: not measured`);
      }
    }
  } finally {
    await c.cleanup();
  }
  const counted = c.made.signIns === budget.signIns && c.made.verifications === budget.verifications;
  line('count', counted, `${c.made.signIns} password sign-in(s) and ${c.made.verifications} link verification(s) were made; ${budget.signIns} and ${budget.verifications} were announced`);
}

console.log(unmade ? `${SELF}: a step could not be made` : `${SELF}: every step was made`);
process.exit(unmade ? 1 : 0);
