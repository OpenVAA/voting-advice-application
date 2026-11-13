#!/usr/bin/env node
// 179-probe.mjs — measurements of what the RUNNING local auth service does with a change of address for an
// account that holds a placeholder address, with the passwordless creation recipe, with a session across a
// change of address and with a null value in `app_metadata`; and of what the RUNNING stack does when the
// edge runtime is replaced by a served function and the serve ends. Nothing of the application is asked:
// every step is a call to the auth service, to the mail catcher, to the database, to the container runtime
// or to the stack's own start and stop scripts.
//
// Usage: node 179-probe.mjs <rows>
//   <rows>  a comma-separated list out of p1,p2,p3,p4,p5,p6,p7,p8,p9. The row p8 restarts the stack and is
//           run alone; naming it beside another row is a usage error.
//
// Every address it makes begins with r179-probe- and carries the run's own id. Placeholder accounts are
// r179-probe-<run>-<n>@bank-auth.placeholder and typed addresses r179-probe-<run>-typed-<n>@example.com,
// a reserved domain; the mail transport of the local stack is its mail catcher.
//
// WHAT A LINE MEANS. Each step prints one line. PASS says that the step was made and that what the line
// states was observed; FAIL says that the step could not be made at all. A step whose observation is set
// against an assumption ends "(as assumed)" or "(NOT as assumed)"; either is a PASS, because the row is a
// measurement. After its steps a row prints its summary lines, each alone on its line:
//    P1: held | not held                     P1-DIFFERED: <steps> (only when not held)
//    P2: single-confirm | completes          P2-VERIFYOTP: <error|no-error> <session|no-session>
//    P3: first-refused | first-accepted      P3-SECOND: accepted | refused
//    P4-ISSUE: <status> <code>               P4-ISSUE-NEW: <status> <code>
//    P4-RACE: <status> <code>                P4-INVALID: <status> <code>      P4-DISTINGUISHABLE: yes | no
//    P5: held | not held                     P5-CONFIRMED: yes | no
//    P6: action-link-token | hashed-token | both | neither
//    P7: survives | revoked                  P7-FAILED: <getUser|refresh|both> (only when revoked)
//    P8: db-start-restores | stop-start-needed     P8-SERVE: <n> s     P8-RESTORE: <n> s
//    P9: null-removes | null-kept
// A row with a step that could not be made prints "<row>: not measured" instead of a verdict.
//
// The three kinds of account:
//    placeholder as today        an admin createUser with a placeholder address, email_confirm, no password
//                                and an app_metadata naming an identity provider, as identity-callback calls it;
//    placeholder by the invite   generateLink with the type invite for the placeholder, then updateUserById
//    recipe                      with the same app_metadata and email_confirm;
//    real                        an admin createUser with a typed address, email_confirm and a random password.
//
// The three calls of the email-change recipe: generateLink email_change_current with newEmail, generateLink
// email_change_new with newEmail, then the current link's hashed_token verified by POST /auth/v1/verify with
// the type email_change and the anon key. The new-address token is the `token` parameter of the
// email_change_new link's action_link. Whether an account's password is set is read with psql on the local
// database through private.user_password_set, one boolean per read.
//
// The row p8 generates an Edge file in a directory outside the repository from tests/tests/utils/testKeys.ts
// and the tracked template's SMTP keys, the way 179-bankauth.sh does; serves identity-callback with it; waits
// until the edge container carries that file's issuer, read back by name, and an OPTIONS request answers
// below 500; stops the serve; runs `yarn db:start` alone; then, in every case, `yarn db:stop` and
// `yarn db:start`. Both db commands write through tests/scripts/withhold-stack-keys.mjs into logs under
// tests/e2e-runs/179-unit/, and each status is read from the command's own process.
//
// THE LIMIT. The stack admits thirty link verifications in five minutes from one address of origin. Before
// its first step the script prints how many the named rows make and refuses when that passes twenty-eight.
// It also refuses while an E2E run is in flight: a `started` file with no `ended` beside it at any depth under
// tests/e2e-runs/, or a listener on the E2E server's port; for p8 also a listener on 8777 or 9443.
//
// Its last step, made in every case once the keys are read, deletes every user whose address begins with
// r179-probe- and the mails the catcher holds for the addresses it used, and confirms that no such user
// remains.
//
// What it never does: print a key, a token, a token hash, a link, a password, an address or a claim value;
// open any environment file but the tracked template. It prints statuses, error codes, booleans, counts and
// times.
//
// Exit codes: 0 when every step of the named rows was made, whatever the rows' verdicts; 1 when a step
// could not be made; 2 on a usage error or a refusal.

import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = '179-probe';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

const API = 'http://127.0.0.1:54321';
const MAIL_API = 'http://127.0.0.1:54324';
const ADDRESS_PREFIX = 'r179-probe-';
const PLACEHOLDER_DOMAIN = 'bank-auth.placeholder';
const TYPED_DOMAIN = 'example.com';
const METADATA_KEY = 'r179_probe_key';
const MOST_VERIFICATIONS = 28;
const REQUEST_CEILING_MS = 30_000;
/** How long the catcher is given to receive a mail the service might have handed over, before a count. */
const MAIL_SETTLE_MS = 3_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EDGE_CONTAINER = 'supabase_edge_runtime_openvaa-local';
const FUNCTIONS_DIR = path.join(REPO_ROOT, 'apps', 'supabase', 'supabase', 'functions');
const UNIT_DIR = path.join(REPO_ROOT, 'tests', 'e2e-runs', '179-unit');
const SERVE_CEILING_MS = 180_000;
const DB_COMMAND_CEILING_MS = 600_000;
/** The command that reads the served issuer, that one variable by name. */
const ISSUER_READ = 'printenv IDENTITY_PROVIDER_ISSUER'.split(' ');

/** The directory of the running Node first, so that `yarn` and `npx` resolve to the same toolchain. */
const CHILD_PATH = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}`;
const CHILD_ENV = { ...process.env, PATH: CHILD_PATH };

/** What each row makes of the limited call, and its body. */
const ROWS = {
  p1: { verifications: 2, run: rowP1 },
  p2: { verifications: 1, run: rowP2 },
  p3: { verifications: 4, run: rowP3 },
  p4: { verifications: 6, run: rowP4 },
  p5: { verifications: 1, run: rowP5 },
  p6: { verifications: 3, run: rowP6 },
  p7: { verifications: 3, run: rowP7 },
  p8: { verifications: 0, run: rowP8 },
  p9: { verifications: 0, run: rowP9 }
};

function usage(message) {
  console.error(`${SELF}: ${message}`);
  console.error(`usage: node 179-probe.mjs <rows>   <rows>: a comma-separated list out of ${Object.keys(ROWS).join(',')}; p8 alone`);
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
    /** A step whose observation is set against an assumption. Answers whether it was made. */
    observe(text, made, asAssumed) {
      const id = next();
      if (!made) {
        measured = false;
        line(id, false, text);
        return false;
      }
      if (!asAssumed) differed.push(id);
      line(id, true, `${text} (${asAssumed ? 'as assumed' : 'NOT as assumed'})`);
      return true;
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
/** True when the auth service itself answered: an HTTP status that is not its rate limit and not a gateway's. */
const answered = (o) => o.status >= 200 && o.status !== 429 && o.status !== 502 && o.status !== 503 && o.status !== 504;
const seen = (o) => `status ${o.status}, code ${o.code}`;
const randomPassword = () => randomBytes(12).toString('base64url');
const boundedFetch = (input, init = {}) => fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_CEILING_MS) });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const seconds = (ms) => Math.round(ms / 1000);

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

/** The value of a key in one table of config.toml, as text, or null. */
function configValue(table, key) {
  let text;
  try {
    text = readFileSync(path.join(REPO_ROOT, 'apps', 'supabase', 'supabase', 'config.toml'), 'utf8');
  } catch {
    return null;
  }
  let current = '';
  for (const raw of text.split('\n')) {
    const header = /^\s*\[{1,2}([^[\]]+)\]{1,2}\s*(?:#.*)?$/.exec(raw);
    if (header) {
      current = header[1].trim();
      continue;
    }
    if (current !== table) continue;
    const value = new RegExp(`^\\s*${key}\\s*=\\s*([A-Za-z0-9_]+)\\s*(?:#.*)?$`).exec(raw);
    if (value) return value[1];
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

/** Whether a process listens on a port; `looked` is false when the question could not be asked. */
function listening(port) {
  const asked = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  if (asked.error || (asked.status !== 0 && asked.status !== 1)) return { looked: false, listening: false };
  return { looked: true, listening: asked.status === 0 };
}

/** The two API keys and the database's address, or null when the stack does not report them. */
function readStack() {
  const r = spawnSync('yarn', ['supabase', 'status', '-o', 'env'], {
    cwd: path.join(REPO_ROOT, 'apps', 'supabase'),
    encoding: 'utf8',
    env: CHILD_ENV,
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
  const made = { verifications: 0 };
  /** Every address this run used, so that the cleanup removes the mails the catcher holds for them. */
  const asked = new Set();
  let serial = 0;

  const placeholderAddress = () => {
    serial += 1;
    const email = `${ADDRESS_PREFIX}${run}-${serial}@${PLACEHOLDER_DOMAIN}`;
    asked.add(email);
    return { email, matchValue: `${ADDRESS_PREFIX}${run}-${serial}` };
  };
  const typedAddress = () => {
    serial += 1;
    const email = `${ADDRESS_PREFIX}${run}-typed-${serial}@${TYPED_DOMAIN}`;
    asked.add(email);
    return email;
  };
  const identityMetadata = (matchValue) => ({ identity_provider: 'idura-ftn', identity_match_prop: 'sub', identity_match_value: matchValue });

  /** One query's single value, or null when it could not be read. */
  function sql(query) {
    const r = spawnSync('psql', ['-X', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1', '-c', query], {
      encoding: 'utf8',
      env: { ...CHILD_ENV, ...stack.database },
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000
    });
    return r.status === 0 ? String(r.stdout ?? '').trim() : null;
  }

  /** `private.user_password_set` for one user: a boolean, or null when it could not be read. */
  function passwordSet(userId) {
    if (!UUID.test(String(userId))) return null;
    const fact = sql(`SELECT private.user_password_set('${userId}'::uuid)`);
    return fact === 't' ? true : fact === 'f' ? false : null;
  }

  /** A placeholder account as identity-callback makes one today. */
  async function placeholderAsToday() {
    const { email, matchValue } = placeholderAddress();
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true, app_metadata: identityMetadata(matchValue) });
    return { email, id: data?.user?.id ?? null, made: outcome(error) };
  }

  /** A placeholder account by the invite recipe: generateLink invite, then updateUserById with app_metadata and email_confirm. */
  async function placeholderByInvite() {
    const { email, matchValue } = placeholderAddress();
    const invited = await admin.auth.admin.generateLink({ type: 'invite', email });
    const id = invited.data?.user?.id ?? null;
    if (invited.error || !id) return { email, id: null, invited: outcome(invited.error), updated: null };
    const updated = await admin.auth.admin.updateUserById(id, { app_metadata: identityMetadata(matchValue), email_confirm: true });
    return { email, id, invited: outcome(invited.error), updated: outcome(updated.error) };
  }

  /** A real account holding a typed address, with a password nobody keeps. */
  async function realAccount(email) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: randomPassword(), email_confirm: true });
    return { email, id: data?.user?.id ?? null, made: outcome(error) };
  }

  /**
   * One link from the service role. Answers its status and code, the response's `hashed_token` and the `token`
   * parameter of its `action_link`; neither is ever printed.
   */
  async function issue(type, email, newEmail) {
    const params = newEmail === undefined ? { type, email } : { type, email, newEmail };
    const { data, error } = await admin.auth.admin.generateLink(params);
    let linkToken = null;
    try {
      linkToken = new URL(String(data?.properties?.action_link ?? '')).searchParams.get('token');
    } catch {
      linkToken = null;
    }
    return { ...outcome(error), hashedToken: data?.properties?.hashed_token ?? null, linkToken };
  }

  /** A token presented by `POST /auth/v1/verify` with the anon key and no session. Answers status, codes and whether a session came back. */
  async function verifyRaw(tokenHash, type = 'email_change') {
    made.verifications += 1;
    const answer = await jsonCall(`${API}/auth/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: stack.anon, Authorization: `Bearer ${stack.anon}` },
      body: JSON.stringify({ type, token_hash: tokenHash ?? '' })
    });
    const bodyCode = Number.isInteger(answer.json?.code) ? answer.json.code : codeOf(answer.json?.code);
    return {
      status: answer.status,
      code: codeOf(answer.json?.error_code),
      bodyCode,
      session: typeof answer.json?.access_token === 'string' && answer.json.access_token !== ''
    };
  }

  /** A token presented through supabase-js `verifyOtp` on an anon client of its own. Answers the client too. */
  async function verifyClient(tokenHash, type) {
    made.verifications += 1;
    const client = anonClient();
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash ?? '', type });
    return { client, error: Boolean(error), session: data?.session ?? null, ...outcome(error) };
  }

  /** The three calls of the email-change recipe. Answers each call's outcome; the tokens stay in memory. */
  async function recipe(account, newEmail) {
    const current = await issue('email_change_current', account.email, newEmail);
    const next = await issue('email_change_new', account.email, newEmail);
    const verified = current.hashedToken ? await verifyRaw(current.hashedToken) : null;
    return { current, next, verified };
  }

  /** The account as the admin API reads it, or null. */
  async function userById(id) {
    if (!id) return null;
    const { data, error } = await admin.auth.admin.getUserById(id);
    return error ? null : (data?.user ?? null);
  }

  /** How many mails the catcher holds for an address, or null when it could not be asked. */
  async function mailCount(email) {
    const found = await jsonCall(`${MAIL_API}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    return found.status === 200 && Array.isArray(found.json?.messages) ? found.json.messages.length : null;
  }

  /** Every auth user, read page by page. Answers null when a page could not be read. */
  async function allUsers() {
    const users = [];
    for (let page = 1; page < 500; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !Array.isArray(data?.users)) return null;
      users.push(...data.users);
      if (data.users.length < 200) return users;
    }
    return null;
  }

  /** Deletes every user of the probe and the mails the catcher holds for its addresses, and confirms no such user remains. */
  async function cleanup() {
    const ours = (u) => String(u.email ?? '').toLowerCase().startsWith(ADDRESS_PREFIX);
    const users = await allUsers();
    const found = (users ?? []).filter(ours);
    let refused = 0;
    for (const user of found) {
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) refused += 1;
    }
    const after = await allUsers();
    const left = after ? after.filter(ours).length : null;
    let mails = 0;
    for (const email of asked) {
      const held = await jsonCall(`${MAIL_API}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
      if (held.status !== 200 || !Array.isArray(held.json?.messages)) {
        mails = null;
        break;
      }
      if (held.json.messages.length === 0) continue;
      const removed = await jsonCall(`${MAIL_API}/api/v1/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IDs: held.json.messages.map((mail) => mail.ID) })
      });
      if (removed.status !== 200) {
        mails = null;
        break;
      }
      mails += held.json.messages.length;
    }
    line(
      'cleanup',
      users !== null && refused === 0 && left === 0 && mails !== null,
      `${users === null ? 'the users could not be read' : `${found.length} user(s) of the probe found`}; ${refused} removal(s) refused; ${left ?? 'an unread number of'} left; ${mails ?? 'an unread number of'} mail(s) for its addresses removed`
    );
  }

  return {
    admin,
    anonClient,
    made,
    typedAddress,
    passwordSet,
    placeholderAsToday,
    placeholderByInvite,
    realAccount,
    issue,
    verifyRaw,
    verifyClient,
    recipe,
    userById,
    mailCount,
    cleanup
  };
}

/** The line of an account that could not be created; the steps that need it are not made. */
const created = (r, label, account) =>
  r.act(
    account.id && account.made.ok ? `${label}: created` : `${label}: could not be created — ${seen(account.made)}; the steps that need it were not made`,
    Boolean(account.id) && account.made.ok
  );
const issued = (o) => `issued: ${o.ok}, ${seen(o)}`;
const rawSeen = (v) => `status ${v.status}, body code ${v.bodyCode}, error code ${v.code}, a session came back: ${v.session}`;
/** The recipe's three calls, one line each. Answers whether all three were made and the verification single-confirmed. */
function recipeLines(r, label, t) {
  r.act(`${label}: email_change_current ${issued(t.current)}; a token hash came back: ${Boolean(t.current.hashedToken)}`, answered(t.current));
  r.act(`${label}: email_change_new ${issued(t.next)}; its action_link carries a token: ${Boolean(t.next.linkToken)}`, answered(t.next));
  if (!t.verified) {
    r.act(`${label}: no current token exists; its verification was not made`, false);
    return false;
  }
  return r.act(`${label}: the current token by POST /verify type email_change — ${rawSeen(t.verified)}`, answered(t.verified));
}
const notMeasured = (row) => console.log(`${row}: not measured`);

// ── p1 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP1(c) {
  const r = recorder('p1');
  const account = await c.placeholderAsToday();
  if (!created(r, 'a placeholder account as today', account)) return notMeasured('P1');
  const typed = c.typedAddress();
  const before = await c.userById(account.id);
  if (!r.act(`the account before — read: ${before !== null}; email_confirmed_at set: ${Boolean(before?.email_confirmed_at)}`, before !== null)) return notMeasured('P1');

  const current = await c.issue('email_change_current', account.email, typed);
  r.observe(`email_change_current with newEmail — ${issued(current)}; a token hash came back: ${Boolean(current.hashedToken)}`, answered(current), current.ok && Boolean(current.hashedToken));
  const next = await c.issue('email_change_new', account.email, typed);
  r.observe(`email_change_new with newEmail — ${issued(next)}; its action_link carries a token: ${Boolean(next.linkToken)}`, answered(next), next.ok && Boolean(next.linkToken));
  if (!current.hashedToken || !next.linkToken) {
    r.act('a token is missing; the verifications were not made', false);
    return notMeasured('P1');
  }

  const first = await c.verifyRaw(current.hashedToken);
  r.observe(`the current token by POST /verify type email_change — ${rawSeen(first)}`, answered(first), first.status === 200 && !first.session);
  const middle = await c.userById(account.id);
  r.observe(
    `after the current token — the address is still the placeholder: ${middle ? middle.email === account.email : 'not read'}; the pending address is the typed one: ${middle ? middle.new_email === typed : 'not read'}`,
    middle !== null,
    middle !== null && middle.email === account.email && middle.new_email === typed
  );

  const second = await c.verifyClient(next.linkToken, 'email_change');
  r.observe(`the new link's token by verifyOtp type email_change — an error came back: ${second.error}, ${seen(second)}, a session came back: ${second.session !== null}`, answered(second), !second.error && second.session !== null);

  const after = await c.userById(account.id);
  const isTyped = after ? after.email === typed : false;
  const pendingEmpty = after ? !after.new_email : false;
  const confirmedSame = after ? Boolean(before.email_confirmed_at) && after.email_confirmed_at === before.email_confirmed_at : false;
  r.observe(
    `the account afterwards — email is the typed address: ${after ? isTyped : 'not read'}; new_email empty: ${after ? pendingEmpty : 'not read'}; email_confirmed_at unchanged: ${after ? confirmedSame : 'not read'}`,
    after !== null,
    isTyped && pendingEmpty && confirmedSame
  );

  await sleep(MAIL_SETTLE_MS);
  const toPlaceholder = await c.mailCount(account.email);
  const toTyped = await c.mailCount(typed);
  r.observe(
    `mails the catcher holds ${MAIL_SETTLE_MS / 1000} s later — to the placeholder: ${toPlaceholder ?? 'not read'}; to the typed address: ${toTyped ?? 'not read'}`,
    toPlaceholder !== null && toTyped !== null,
    toPlaceholder === 0 && toTyped === 0
  );

  if (!r.measured) return notMeasured('P1');
  if (r.differed.length === 0) console.log('P1: held');
  else {
    console.log('P1: not held');
    console.log(`P1-DIFFERED: ${r.differed.join(', ')}`);
  }
}

// ── p2 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP2(c) {
  const r = recorder('p2');
  const account = await c.placeholderAsToday();
  if (!created(r, 'a fresh placeholder account as today', account)) return notMeasured('P2');
  const typed = c.typedAddress();
  const next = await c.issue('email_change_new', account.email, typed);
  if (!r.act(`email_change_new alone — ${issued(next)}; its action_link carries a token: ${Boolean(next.linkToken)}`, answered(next) && Boolean(next.linkToken))) return notMeasured('P2');
  const v = await c.verifyClient(next.linkToken, 'email_change');
  r.observe(`the new link's token by verifyOtp type email_change — an error came back: ${v.error}, ${seen(v)}, a session came back: ${v.session !== null}`, answered(v), !v.error && v.session === null);
  const after = await c.userById(account.id);
  const changed = after ? after.email === typed : null;
  r.observe(`the account afterwards — the address changed to the typed one: ${changed ?? 'not read'}; it is still pending: ${after ? after.new_email === typed : 'not read'}`, after !== null, changed === false);
  if (!r.measured) return notMeasured('P2');
  console.log(`P2: ${changed ? 'completes' : 'single-confirm'}`);
  console.log(`P2-VERIFYOTP: ${v.error ? 'error' : 'no-error'} ${v.session ? 'session' : 'no-session'}`);
}

// ── p3 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP3(c) {
  const r = recorder('p3');
  const account = await c.placeholderAsToday();
  if (!created(r, 'a fresh placeholder account as today', account)) return notMeasured('P3');
  const typed = c.typedAddress();
  const one = await c.recipe(account, typed);
  if (!recipeLines(r, 'the first triple', one)) return notMeasured('P3');
  const two = await c.recipe(account, typed);
  if (!recipeLines(r, 'the second triple', two)) return notMeasured('P3');
  if (!one.next.linkToken || !two.next.linkToken) {
    r.act('a new-address token is missing; the verifications were not made', false);
    return notMeasured('P3');
  }
  const first = await c.verifyRaw(one.next.linkToken);
  const firstAccepted = first.status === 200 && first.session;
  r.observe(`the first triple's new token by POST /verify — accepted: ${firstAccepted}, ${rawSeen(first)}`, answered(first), !firstAccepted);
  const second = await c.verifyRaw(two.next.linkToken);
  const secondAccepted = second.status === 200 && second.session;
  r.observe(`the second triple's new token by POST /verify — accepted: ${secondAccepted}, ${rawSeen(second)}`, answered(second), secondAccepted);
  if (!r.measured) return notMeasured('P3');
  console.log(`P3: ${firstAccepted ? 'first-accepted' : 'first-refused'}`);
  console.log(`P3-SECOND: ${secondAccepted ? 'accepted' : 'refused'}`);
}

// ── p4 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP4(c) {
  const r = recorder('p4');

  // (a) an address another account holds, asked for at issue.
  const held = c.typedAddress();
  const holder = await c.realAccount(held);
  const asker = await c.placeholderAsToday();
  let issueCurrent = null;
  let issueNew = null;
  if (created(r, 'a real account holding a typed address', holder) && created(r, 'a placeholder account asking for it', asker)) {
    issueCurrent = await c.issue('email_change_current', asker.email, held);
    r.observe(`email_change_current for the held address — ${seen(issueCurrent)}`, answered(issueCurrent), issueCurrent.status === 422 && issueCurrent.code === 'email_exists');
    issueNew = await c.issue('email_change_new', asker.email, held);
    r.observe(`email_change_new for the held address — ${seen(issueNew)}`, answered(issueNew), issueNew.status === 422 && issueNew.code === 'email_exists');
  }

  // (b) two placeholder accounts pending one address.
  const pending = c.typedAddress();
  const a = await c.placeholderAsToday();
  const b = await c.placeholderAsToday();
  let race = null;
  let invalid = null;
  if (created(r, 'placeholder account A', a) && created(r, 'placeholder account B', b)) {
    const tA = await c.recipe(a, pending);
    const tB1 = await c.recipe(b, pending);
    const tB2 = await c.recipe(b, pending);
    const madeA = recipeLines(r, "A's triple", tA);
    const madeB1 = recipeLines(r, "B's first triple", tB1);
    const madeB2 = recipeLines(r, "B's second triple", tB2);
    const allMade = madeA && madeB1 && madeB2;
    if (allMade && tA.next.linkToken && tB1.next.linkToken && tB2.next.linkToken) {
      const vA = await c.verifyRaw(tA.next.linkToken);
      const aAfter = await c.userById(a.id);
      const aChanged = aAfter ? aAfter.email === pending : null;
      r.observe(`A's new token — ${rawSeen(vA)}; A's address changed: ${aChanged ?? 'not read'}`, answered(vA) && aAfter !== null, vA.status === 200 && vA.session && aChanged === true);
      race = await c.verifyRaw(tB2.next.linkToken);
      const bAfter = await c.userById(b.id);
      r.act(`B's newest token, the address now A's — ${rawSeen(race)}; B's address changed: ${bAfter ? bAfter.email === pending : 'not read'}`, race.status > 0 && race.status !== 429 && bAfter !== null);
      invalid = await c.verifyRaw(tB1.next.linkToken);
      r.act(`B's first token, made invalid by its second triple — ${rawSeen(invalid)}`, invalid.status > 0 && invalid.status !== 429);
    } else {
      r.act('a triple of A or B could not be made; the verifications were not made', false);
    }
  }

  if (!r.measured) return notMeasured('P4');
  console.log(`P4-ISSUE: ${issueCurrent.status} ${issueCurrent.code}`);
  console.log(`P4-ISSUE-NEW: ${issueNew.status} ${issueNew.code}`);
  console.log(`P4-RACE: ${race.status} ${race.code}`);
  console.log(`P4-INVALID: ${invalid.status} ${invalid.code}`);
  console.log(`P4-DISTINGUISHABLE: ${race.status !== invalid.status || race.code !== invalid.code ? 'yes' : 'no'}`);
}

// ── p5 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP5(c) {
  const r = recorder('p5');
  const account = await c.placeholderByInvite();
  r.act(`generateLink invite for a placeholder — ${account.invited ? seen(account.invited) : 'not made'}; a user came back: ${Boolean(account.id)}`, Boolean(account.id));
  if (!account.id) return notMeasured('P5');
  r.act(`updateUserById with app_metadata and email_confirm — ${seen(account.updated)}`, account.updated.ok);
  const before = c.passwordSet(account.id);
  r.observe(`private.user_password_set before the magic link — ${before ?? 'not read'}`, before !== null, before === false);
  const user = await c.userById(account.id);
  const minted = user ? await c.issue('magiclink', user.email) : null;
  if (!r.act(`a magiclink for the account's current address — ${minted ? issued(minted) : 'the account could not be read'}`, minted !== null && answered(minted) && Boolean(minted.hashedToken))) return notMeasured('P5');
  const v = await c.verifyClient(minted.hashedToken, 'magiclink');
  r.observe(`the magic link verified — an error came back: ${v.error}, ${seen(v)}, a session came back: ${v.session !== null}`, answered(v), v.session !== null);
  const after = c.passwordSet(account.id);
  r.observe(`private.user_password_set after the magic link — ${after ?? 'not read'}`, after !== null, after === false);
  const afterUser = await c.userById(account.id);
  const confirmed = afterUser ? Boolean(afterUser.email_confirmed_at) : null;
  r.observe(`email_confirmed_at set — ${confirmed ?? 'not read'}`, confirmed !== null, confirmed === true);

  const control = await c.placeholderAsToday();
  let controlSet = null;
  if (created(r, 'the control: a placeholder account as today', control)) {
    controlSet = c.passwordSet(control.id);
    r.observe(`the control's private.user_password_set — ${controlSet ?? 'not read'}`, controlSet !== null, controlSet === true);
  }
  if (!r.measured) return notMeasured('P5');
  console.log(`P5: ${before === false && after === false && controlSet === true ? 'held' : 'not held'}`);
  console.log(`P5-CONFIRMED: ${confirmed ? 'yes' : 'no'}`);
}

// ── p6 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP6(c) {
  const r = recorder('p6');
  const account = await c.placeholderAsToday();
  if (!created(r, 'a fresh placeholder account as today', account)) return notMeasured('P6');
  const typed = c.typedAddress();
  const t = await c.recipe(account, typed);
  if (!recipeLines(r, 'the recipe up to the current token', t) || !t.next.hashedToken || !t.next.linkToken) {
    r.act('the new link lacks a token; the verifications were not made', false);
    return notMeasured('P6');
  }
  r.act(`the new link's hashed_token and its action_link token are equal: ${t.next.hashedToken === t.next.linkToken}`, true);
  const byHash = await c.verifyRaw(t.next.hashedToken);
  const hashVerifies = byHash.status === 200;
  r.observe(`the new link's hashed_token by POST /verify type email_change — ${rawSeen(byHash)}`, answered(byHash), !hashVerifies);
  const byLink = await c.verifyRaw(t.next.linkToken);
  const linkVerifies = byLink.status === 200;
  r.observe(`the action_link's token by POST /verify type email_change — ${rawSeen(byLink)}`, answered(byLink), linkVerifies);
  if (!r.measured) return notMeasured('P6');
  const verdict = linkVerifies && !hashVerifies ? 'action-link-token' : hashVerifies && !linkVerifies ? 'hashed-token' : hashVerifies ? 'both' : 'neither';
  console.log(`P6: ${verdict}`);
}

// ── p7 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP7(c) {
  const r = recorder('p7');
  const account = await c.placeholderAsToday();
  if (!created(r, 'a fresh placeholder account as today', account)) return notMeasured('P7');
  const minted = await c.issue('magiclink', account.email);
  if (!r.act(`a magiclink for the placeholder — ${issued(minted)}`, answered(minted) && Boolean(minted.hashedToken))) return notMeasured('P7');
  const signedIn = await c.verifyClient(minted.hashedToken, 'magiclink');
  const earlier = signedIn.session;
  if (!r.act(`signed in by the magic link on an anon client — ${seen(signedIn)}, a session came back: ${earlier !== null}`, earlier !== null)) return notMeasured('P7');

  const typed = c.typedAddress();
  const t = await c.recipe(account, typed);
  if (!recipeLines(r, 'the recipe from the service role', t) || !t.next.linkToken) return notMeasured('P7');
  const completed = await c.verifyClient(t.next.linkToken, 'email_change');
  const after = await c.userById(account.id);
  r.act(
    `the new link's token by verifyOtp on another anon client — ${seen(completed)}, a session came back: ${completed.session !== null}; the address changed: ${after ? after.email === typed : 'not read'}`,
    answered(completed) && after !== null && after.email === typed
  );

  const user = await c.anonClient().auth.getUser(earlier.access_token);
  const userOutcome = outcome(user.error);
  const userOk = !user.error && user.data?.user?.id === account.id;
  r.observe(`getUser with the access token from before the change — ${seen(userOutcome)}, the same user: ${userOk}`, answered(userOutcome), userOk);
  const refreshed = await c.anonClient().auth.refreshSession({ refresh_token: earlier.refresh_token });
  const refreshOutcome = outcome(refreshed.error);
  const refreshOk = !refreshed.error && Boolean(refreshed.data?.session);
  r.observe(`refreshSession with the refresh token from before the change — ${seen(refreshOutcome)}, a session came back: ${refreshOk}`, answered(refreshOutcome), refreshOk);
  if (!r.measured) return notMeasured('P7');
  if (userOk && refreshOk) console.log('P7: survives');
  else {
    console.log('P7: revoked');
    console.log(`P7-FAILED: ${!userOk && !refreshOk ? 'both' : !userOk ? 'getUser' : 'refresh'}`);
  }
}

// ── p8 ───────────────────────────────────────────────────────────────────────────────────────────
/** The script `npx tsx -e` runs from the repository root: the Edge file and the issuer it names, written into P8_SCRATCH. */
const EDGE_FILE_GENERATOR = `
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decryptionJwks } from "./tests/tests/utils/testKeys";
import { DEFAULT_TOKEN_OPTS } from "./tests/tests/utils/buildTestIdToken";
const out = process.env.P8_SCRATCH;
const template = readFileSync("apps/supabase/supabase/functions/.env.example", "utf8").split("\\n");
const fromTemplate = (name) => {
  const line = template.find((l) => l.startsWith(name + "="));
  if (!line || line.trim().length === name.length + 1) throw new Error("the tracked template sets no " + name);
  return line.trim();
};
const lines = [
  "IDENTITY_PROVIDER_TYPE=idura-ftn",
  "IDENTITY_PROVIDER_DECRYPTION_JWKS=" + JSON.stringify(decryptionJwks),
  "IDENTITY_PROVIDER_JWKS_URI=http://host.docker.internal:8777/jwks",
  "IDENTITY_PROVIDER_CLIENT_ID=" + DEFAULT_TOKEN_OPTS.audience,
  "IDENTITY_PROVIDER_ISSUER=" + DEFAULT_TOKEN_OPTS.issuer,
  "PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2",
  "SITE_URL=http://127.0.0.1:5273",
  fromTemplate("SMTP_HOST"),
  fromTemplate("SMTP_PORT"),
  fromTemplate("SMTP_FROM")
];
writeFileSync(join(out, "edge-p8.vars"), lines.join("\\n") + "\\n");
writeFileSync(join(out, "expected-issuer"), DEFAULT_TOKEN_OPTS.issuer + "\\n");
`;

/** The issuer the edge container carries, that one variable read by name, or '' when it cannot be read. */
function edgeIssuer() {
  const r = spawnSync('docker', ['exec', EDGE_CONTAINER, ...ISSUER_READ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15_000 });
  return r.status === 0 ? String(r.stdout ?? '').split('\n')[0].trim() : '';
}

/** The edge container's state: `running`, another state word, `absent`, or null when the question could not be asked. */
function edgeState() {
  const r = spawnSync('docker', ['ps', '-a', '--filter', `name=^${EDGE_CONTAINER}$`, '--format', '{{.State}}'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 15_000
  });
  if (r.status !== 0) return null;
  const state = String(r.stdout ?? '').split('\n')[0].trim();
  return state === '' ? 'absent' : /^[a-z]{1,20}$/.test(state) ? state : 'unreadable';
}

async function optionsStatus(fn) {
  try {
    const response = await boundedFetch(`${API}/functions/v1/${fn}`, { method: 'OPTIONS' });
    await response.arrayBuffer().catch(() => null);
    return response.status;
  } catch {
    return 0;
  }
}

/** The functions of the tree: every directory under the functions directory that holds an index.ts. */
function functionNames() {
  try {
    return readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(path.join(FUNCTIONS_DIR, d.name, 'index.ts')))
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

/** Whether the edge container runs, and each function's OPTIONS status, each waited for up to sixty seconds. */
async function functionsCheck() {
  const names = functionNames();
  const statuses = {};
  for (const fn of names) {
    let code = 0;
    for (let i = 0; i < 30; i += 1) {
      code = await optionsStatus(fn);
      if (code >= 200 && code < 500) break;
      await sleep(2_000);
    }
    statuses[fn] = code;
  }
  const state = edgeState();
  const allBelow500 = names.length > 0 && names.every((fn) => statuses[fn] >= 200 && statuses[fn] < 500);
  return { state, running: state === 'running', allBelow500, text: names.map((fn) => `${fn} ${statuses[fn]}`).join(', ') || 'no function found' };
}

/** One `yarn <script>` from the repository root, its output written through withhold-stack-keys.mjs into a log. Its own status and its time. */
function dbCommand(script, logFile) {
  return new Promise((resolve) => {
    const started = Date.now();
    let out;
    try {
      mkdirSync(path.dirname(logFile), { recursive: true });
      out = openSync(logFile, 'w');
    } catch {
      resolve({ status: null, ms: 0 });
      return;
    }
    const filter = spawn(process.execPath, [path.join(REPO_ROOT, 'tests', 'scripts', 'withhold-stack-keys.mjs')], { cwd: REPO_ROOT, stdio: ['pipe', out, out] });
    const command = spawn('yarn', [script], { cwd: REPO_ROOT, env: CHILD_ENV, stdio: ['ignore', 'pipe', 'pipe'] });
    let status = null;
    let open = 2;
    const endInput = () => {
      open -= 1;
      if (open === 0) filter.stdin.end();
    };
    command.stdout.on('data', (chunk) => filter.stdin.write(chunk));
    command.stderr.on('data', (chunk) => filter.stdin.write(chunk));
    command.stdout.on('end', endInput);
    command.stderr.on('end', endInput);
    const deadline = setTimeout(() => command.kill('SIGTERM'), DB_COMMAND_CEILING_MS);
    command.on('error', () => {
      clearTimeout(deadline);
      filter.stdin.end();
    });
    command.on('exit', (code) => {
      clearTimeout(deadline);
      status = code;
    });
    filter.on('close', () => {
      closeSync(out);
      resolve({ status, ms: Date.now() - started });
    });
  });
}

/** Stops a child started in its own process group: TERM to the group, then KILL after thirty seconds. Answers whether it ended. */
async function stopGroup(child, ended) {
  if (ended()) return true;
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
  for (let i = 0; i < 30 && !ended(); i += 1) await sleep(1_000);
  if (!ended()) {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch {
      child.kill('SIGKILL');
    }
    for (let i = 0; i < 10 && !ended(); i += 1) await sleep(1_000);
  }
  return ended();
}

async function rowP8(c, run) {
  const r = recorder('p8');
  const logBase = path.join(UNIT_DIR, `179-probe-p8-${run}`);
  let scratch = null;
  let child = null;
  let childEnded = true;
  try {
    scratch = mkdtempSync(path.join(os.tmpdir(), '179-probe-p8-'));
    const outside = !path.resolve(scratch).startsWith(REPO_ROOT + path.sep);
    if (!r.act(`a scratch directory was made outside the repository: ${outside}`, outside)) return notMeasured('P8');

    const generated = spawnSync('npx', ['--no-install', 'tsx', '-e', EDGE_FILE_GENERATOR], {
      cwd: REPO_ROOT,
      env: { ...CHILD_ENV, P8_SCRATCH: scratch },
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 120_000
    });
    const edgeFile = path.join(scratch, 'edge-p8.vars');
    const expected = existsSync(path.join(scratch, 'expected-issuer')) ? readFileSync(path.join(scratch, 'expected-issuer'), 'utf8').trim() : '';
    const made = generated.status === 0 && existsSync(edgeFile) && expected !== '';
    if (!r.act(`the Edge file was generated from the committed test keys and the tracked template — tsx exit ${generated.status ?? 'none'}; file and issuer present: ${made}`, made)) return notMeasured('P8');

    const serveLog = openSync(path.join(scratch, 'serve.log'), 'w');
    const serveStarted = Date.now();
    child = spawn('npx', ['--no-install', 'supabase', 'functions', 'serve', 'identity-callback', '--no-verify-jwt', '--env-file', edgeFile], {
      cwd: path.join(REPO_ROOT, 'apps', 'supabase', 'supabase'),
      env: CHILD_ENV,
      detached: true,
      stdio: ['ignore', serveLog, serveLog]
    });
    childEnded = false;
    let childStatus = null;
    child.on('exit', (code) => {
      childEnded = true;
      childStatus = code;
    });
    child.on('error', () => {
      childEnded = true;
    });
    closeSync(serveLog);

    let ready = false;
    let carries = false;
    let code = 0;
    while (Date.now() - serveStarted < SERVE_CEILING_MS && !childEnded) {
      carries = edgeIssuer() === expected;
      code = await optionsStatus('identity-callback');
      if (carries && code >= 200 && code < 500) {
        ready = true;
        break;
      }
      await sleep(2_000);
    }
    const serveSeconds = seconds(Date.now() - serveStarted);
    r.act(
      `the served identity-callback — the edge container carries the generated issuer: ${carries}; OPTIONS ${code}; ready: ${ready} after ${serveSeconds} s${childEnded ? `; the serve ended early with status ${childStatus ?? 'none'}` : ''}`,
      ready
    );

    const stopped = await stopGroup(child, () => childEnded);
    r.act(`the function server stopped: ${stopped}`, stopped);
    const afterStop = edgeState();
    r.act(`after the stop the edge container is: ${afterStop ?? 'not read'}`, afterStop !== null);

    const alone = await dbCommand('db:start', `${logBase}.db-start-alone.log`);
    const aloneCheck = await functionsCheck();
    r.act(
      `yarn db:start alone — exit ${alone.status ?? 'none'} after ${seconds(alone.ms)} s; then the edge container is: ${aloneCheck.state ?? 'not read'}; OPTIONS ${aloneCheck.text}`,
      alone.status !== null && aloneCheck.state !== null
    );
    const restoresAlone = alone.status === 0 && aloneCheck.running && aloneCheck.allBelow500;

    const stop = await dbCommand('db:stop', `${logBase}.db-stop.log`);
    const start = await dbCommand('db:start', `${logBase}.db-start.log`);
    const restoreSeconds = seconds(stop.ms + start.ms);
    const restoreCheck = await functionsCheck();
    r.act(`yarn db:stop — exit ${stop.status ?? 'none'} after ${seconds(stop.ms)} s; yarn db:start — exit ${start.status ?? 'none'} after ${seconds(start.ms)} s; ${restoreSeconds} s together`, stop.status === 0 && start.status === 0);
    r.act(`after db:stop and db:start the edge container is: ${restoreCheck.state ?? 'not read'}; OPTIONS ${restoreCheck.text}`, restoreCheck.running && restoreCheck.allBelow500);
    r.act(`the db logs, filtered: ${path.relative(REPO_ROOT, logBase)}.{db-start-alone,db-stop,db-start}.log`, true);

    if (!r.measured) return notMeasured('P8');
    console.log(`P8: ${restoresAlone ? 'db-start-restores' : 'stop-start-needed'}`);
    console.log(`P8-SERVE: ${serveSeconds} s`);
    console.log(`P8-RESTORE: ${restoreSeconds} s`);
  } finally {
    if (child && !childEnded) await stopGroup(child, () => childEnded);
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  }
}

// ── p9 ───────────────────────────────────────────────────────────────────────────────────────────
async function rowP9(c) {
  const r = recorder('p9');
  const account = await c.placeholderAsToday();
  if (!created(r, 'a fresh placeholder account as today', account)) return notMeasured('P9');
  const set = await c.admin.auth.admin.updateUserById(account.id, { app_metadata: { [METADATA_KEY]: 'set' } });
  const afterSet = await c.userById(account.id);
  const present = afterSet ? afterSet.app_metadata?.[METADATA_KEY] === 'set' : null;
  r.act(`updateUserById with the key set — ${seen(outcome(set.error))}; the key reads as set: ${present ?? 'not read'}`, !set.error && present === true);
  const cleared = await c.admin.auth.admin.updateUserById(account.id, { app_metadata: { [METADATA_KEY]: null } });
  const afterNull = await c.userById(account.id);
  const meta = afterNull?.app_metadata ?? null;
  const absent = meta ? !Object.hasOwn(meta, METADATA_KEY) : null;
  const othersKept = meta ? meta.identity_provider === 'idura-ftn' && typeof meta.identity_match_value === 'string' : null;
  r.act(
    `updateUserById with the key null — ${seen(outcome(cleared.error))}; the key is absent: ${absent ?? 'not read'}; it holds null: ${meta ? meta[METADATA_KEY] === null : 'not read'}; the other keys are kept: ${othersKept ?? 'not read'}`,
    !cleared.error && meta !== null
  );
  if (!r.measured) return notMeasured('P9');
  console.log(`P9: ${absent ? 'null-removes' : 'null-kept'}`);
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length !== 1) usage('exactly one argument is taken, the rows');
const named = args[0].split(',');
for (const name of named) {
  if (!Object.hasOwn(ROWS, name)) usage(`unknown row '${name}'`);
}
if (new Set(named).size !== named.length) usage('a row is named twice');
if (named.includes('p8') && named.length > 1) usage('p8 restarts the stack: name it alone');
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
const serverPort = /^\d{1,5}$/.test(process.env.FRONTEND_PORT ?? '') ? process.env.FRONTEND_PORT : '5273';
const ports = rows.includes('p8') ? [serverPort, '8777', '9443'] : [serverPort];
for (const port of ports) {
  const held = listening(port);
  if (!held.looked) {
    console.error(`${SELF}: port ${port} could not be asked for a listener — refusing`);
    process.exit(2);
  }
  if (held.listening) {
    console.error(`${SELF}: a process listens on port ${port} — refusing`);
    process.exit(2);
  }
}

const budget = rows.reduce((sum, name) => sum + ROWS[name].verifications, 0);
console.log(`${SELF}: rows ${rows.join(',')}, started ${new Date().toISOString()}`);
console.log(`BUDGET ${budget} link verification(s); at most ${MOST_VERIFICATIONS} (the stack admits 30 in five minutes)`);
if (budget > MOST_VERIFICATIONS) {
  console.error(`${SELF}: the named rows pass ${MOST_VERIFICATIONS} link verifications — name fewer rows in one run`);
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
  const doubleConfirm = configValue('auth.email', 'double_confirm_changes');
  const confirmations = configValue('auth.email', 'enable_confirmations');
  line('0 the configuration', doubleConfirm !== null, `config.toml [auth.email] double_confirm_changes = ${doubleConfirm ?? 'unread'}, enable_confirmations = ${confirmations ?? 'unread'}`);

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
        await ROWS[name].run(c, run);
      } catch (error) {
        line(`${name}`, false, `the row stopped on an exception of the kind ${error instanceof Error ? error.name : 'unknown'}`);
        console.log(`${name.toUpperCase()}: not measured`);
      }
    }
  } finally {
    await c.cleanup();
  }
  line('count', c.made.verifications === budget, `${c.made.verifications} link verification(s) were made; ${budget} were announced`);
}

console.log(unmade ? `${SELF}: a step could not be made` : `${SELF}: every step was made`);
process.exit(unmade ? 1 : 0);
