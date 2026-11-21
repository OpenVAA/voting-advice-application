#!/usr/bin/env node
// 174-fn-probe.mjs — one live run of the whole contract of the `account-access` Edge Function, against the
// RUNNING local stack: the edge runtime, the auth service, the database and the mail catcher.
//
// Usage: node 174-fn-probe.mjs
//
// It works in the default project that apps/supabase/supabase/seed.sql creates, with project-scope
// promises, so that no entity is needed. Every address it uses begins with r174-probe-fn- and carries the
// run's own id, so a run never meets an address of an earlier one.
//
// HOW A NEGATIVE IS ASSERTED. A link request is answered before its work is done, so "no mail was sent"
// and "no account was created" say nothing unless the work is known to be over. Every request whose
// effect is asserted negatively therefore carries a completion witness: the script opens one through
// `invitation_link_witness_open` with the service-role key, sends its id as `witness`, and polls
// `invitation_link_witness` (at most 30 seconds) until it reads `sent` or `not-sent`. Only then does it
// look at the mail catcher or at the accounts. Nothing here infers the end of a request's work from
// elapsed time or from another request's mail.
//
// The steps, one output line each, PASS or FAIL:
//    1  the two API keys are captured from `supabase status -o env` into variables;
//    2  invitations are seeded through `create_invitations` with the service-role key: (project, editor)
//       by email for the addresses A, D and E, and one with no email, whose code is kept;
//    3  check-code: the code answers `valid`; a string that names nothing answers `unknown`;
//    4  request-link for A: 200 and the accepted body; the witness reads `sent`; exactly one mail with the
//       English subject exists for A; its only link has the path /en/api/auth/callback and exactly the
//       query parameters token_hash and type=magiclink;
//    5  a second request-link for A straight after: the same answer; the witness reads `not-sent`; the
//       catcher still holds exactly one mail for A;
//    6  request-link for B, which has no invitation and no account: the same answer; the witness reads
//       `not-sent`; no mail exists for B and the admin API finds no user for B;
//    7  A's token verifies to a session whose access token carries an empty `grants` claim;
//       `claim_invitations` with that token returns one claimed specification and `password_set` false;
//       the refreshed token's `grants` claim is exactly that one grant;
//    8  request-link with the code and address C: a mail for C arrives; its token verifies; the claim
//       returns the code's specification; check-code now answers `used`;
//    9  C sets a password; code-sign-in with the code and that password answers `signed-in` with two
//       tokens and nothing else; with a wrong password it answers `invalid-credentials`; with a string
//       that names no code it answers a body deep-equal to that;
//   10  a request-link for D carrying `Origin: https://evil.example` and `X-Forwarded-Host: evil.example`
//       produces a mail whose link has the origin of A's link;
//   11  a request-link for E naming a witness id nobody opened is answered like any other, and the
//       service role then finds no witness record for that id. This request has no witness of its own by
//       construction, so the read follows the two latest things that can be observed: E's own mail, and
//       the finished witness of a further request for E made after it;
//   12  in every case: every invitation the run seeded, every invitation left for one of its addresses
//       and every user whose address begins with r174-probe-fn- is deleted, and none remains.
//
// What it never does: print a key, a code, a password, a token, a token hash or a link; read a container
// variable; open any environment file. Addresses, statuses, subjects and times are printed.
//
// Exit codes: 0 when every step passed; 1 otherwise.

import { spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

const API = 'http://127.0.0.1:54321';
const MAIL_API = 'http://127.0.0.1:54324';
const FUNCTION_URL = `${API}/functions/v1/account-access`;
/** The project apps/supabase/supabase/seed.sql creates. */
const PROJECT = '00000000-0000-0000-0000-000000000001';
const ADDRESS_PREFIX = 'r174-probe-fn-';
const ENGLISH_SUBJECT = 'Sign-in link for the voting advice application';
const WITNESS_POLL_SECONDS = 30;
const MAIL_POLL_SECONDS = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The directory of the running Node first, so that `yarn` resolves to the same toolchain. */
const CHILD_PATH = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}`;

let failed = false;
const pass = (step, detail = '') => console.log(`PASS ${step}${detail ? ` — ${detail}` : ''}`);
const fail = (step, detail = '') => {
  failed = true;
  console.log(`FAIL ${step}${detail ? ` — ${detail}` : ''}`);
};
/** One line per step: PASS when every check of the step holds, FAIL naming the first that does not. */
function verdict(step, checks, detail = '') {
  const broken = checks.find(([, ok]) => !ok);
  if (broken) fail(step, `not true: ${broken[0]}`);
  else pass(step, detail);
  return !broken;
}

/**
 * One POST through node:http, which writes every header as given. `fetch` may drop or rewrite a header such as
 * `Origin`, and the step that sends hostile headers must be sure they left this process.
 */
function rawPost(url, headers, body) {
  const started = Date.now();
  const payload = JSON.stringify(body);
  return new Promise((resolve) => {
    const req = httpRequest(
      url,
      { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) }, timeout: 30_000 },
      (res) => {
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
          resolve({ status: res.statusCode ?? 0, json, ms: Date.now() - started });
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (error) => resolve({ status: 0, json: null, ms: Date.now() - started, error: error.name }));
    req.end(payload);
  });
}

/** One request. Answers `{ status, json, ms }`; a body that is not JSON gives `json: null`. Never throws. */
async function call(url, { method = 'GET', apikey, bearer, body, headers = {} } = {}) {
  const all = { 'Content-Type': 'application/json', ...headers };
  if (apikey) all.apikey = apikey;
  if (bearer) all.Authorization = `Bearer ${bearer}`;
  if (Object.keys(headers).length > 0 && method === 'POST') return rawPost(url, all, body);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method,
      headers: all,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000)
    });
    const text = await response.text();
    const ms = Date.now() - started;
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: response.status, json, ms };
  } catch (error) {
    return { status: 0, json: null, ms: Date.now() - started, error: error instanceof Error ? error.name : 'error' };
  }
}

/** The two API keys, or null when the stack does not report them. */
function readKeys() {
  const r = spawnSync('yarn', ['supabase', 'status', '-o', 'env'], {
    cwd: path.join(REPO_ROOT, 'apps', 'supabase'),
    encoding: 'utf8',
    env: { ...process.env, PATH: CHILD_PATH },
    stdio: ['ignore', 'pipe', 'ignore']
  });
  const field = (name) => new RegExp(`^${name}="?([^"\\n]*)"?$`, 'm').exec(r.stdout ?? '')?.[1] ?? '';
  const anon = field('ANON_KEY');
  const service = field('SERVICE_ROLE_KEY');
  return anon && service ? { anon, service } : null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The claims of a JWT, or null. Nothing of the token is printed. */
function claimsOf(token) {
  try {
    return JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

const unescapeHtml = (value) =>
  value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function context(keys) {
  const service = (url, options = {}) => call(url, { apikey: keys.service, bearer: keys.service, ...options });
  const rpc = (name, body = {}) => service(`${API}/rest/v1/rpc/${name}`, { method: 'POST', body });

  /** Ask the function. The anon key travels as `apikey` and as bearer, as the application's client sends it. */
  const ask = (body, headers = {}) =>
    call(FUNCTION_URL, { method: 'POST', apikey: keys.anon, bearer: keys.anon, body: { project_id: PROJECT, ...body }, headers });

  /** Open a completion witness. Answers its id, or null. */
  async function openWitness() {
    const opened = await rpc('invitation_link_witness_open');
    return opened.status === 200 && UUID.test(String(opened.json)) ? opened.json : null;
  }

  /** Read a witness once: `sent`, `not-sent`, or null while it is open or when no record has that id. */
  async function readWitness(id) {
    const read = await rpc('invitation_link_witness', { p_id: id });
    return read.status === 200 && (read.json === 'sent' || read.json === 'not-sent') ? read.json : null;
  }

  /** Poll a witness until it reads a finished outcome. Answers the outcome, or null after the ceiling. */
  async function finishedWitness(id) {
    const started = Date.now();
    while (Date.now() - started < WITNESS_POLL_SECONDS * 1000) {
      const outcome = await readWitness(id);
      if (outcome) return outcome;
      await sleep(250);
    }
    return null;
  }

  /** A link request with a witness of its own. Answers the function's answer, and the witness's finished outcome. */
  async function witnessedLinkRequest(fields, headers = {}) {
    const witness = await openWitness();
    if (!witness) return { answer: { status: 0, json: null, ms: 0 }, outcome: null, opened: false };
    const answer = await ask({ operation: 'request-link', ...fields, witness }, headers);
    const outcome = await finishedWitness(witness);
    return { answer, outcome, opened: true };
  }

  /** The messages the catcher holds for an address, newest first. */
  async function mailsFor(address) {
    const found = await call(`${MAIL_API}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`);
    return found.status === 200 ? (found.json?.messages ?? []) : null;
  }

  /** Wait, at most 30 seconds, for the first message to an address. A positive wait only. */
  async function awaitMail(address) {
    const started = Date.now();
    while (Date.now() - started < MAIL_POLL_SECONDS * 1000) {
      const mails = await mailsFor(address);
      if (mails && mails.length > 0) return mails;
      await sleep(500);
    }
    return [];
  }

  /** The links of a message: every href of its html part, and every URL of its text part. */
  async function linksOf(messageId) {
    const message = await call(`${MAIL_API}/api/v1/message/${messageId}`);
    if (message.status !== 200) return null;
    const html = String(message.json?.HTML ?? '');
    const text = String(message.json?.Text ?? '');
    return {
      html: Array.from(html.matchAll(/href="([^"]*)"/g)).map((m) => unescapeHtml(m[1])),
      text: Array.from(text.matchAll(/https?:\/\/\S+/g)).map((m) => m[0])
    };
  }

  /** Every auth user, read page by page. Answers null when a page could not be read. */
  async function allUsers() {
    const users = [];
    for (let page = 1; page < 200; page += 1) {
      const listed = await service(`${API}/auth/v1/admin/users?page=${page}&per_page=200`);
      if (listed.status !== 200 || !Array.isArray(listed.json?.users)) return null;
      users.push(...listed.json.users);
      if (listed.json.users.length < 200) return users;
    }
    return null;
  }

  const verify = (tokenHash) =>
    call(`${API}/auth/v1/verify`, { method: 'POST', apikey: keys.anon, body: { type: 'magiclink', token_hash: tokenHash } });
  const claim = (accessToken) =>
    call(`${API}/rest/v1/rpc/claim_invitations`, { method: 'POST', apikey: keys.anon, bearer: accessToken, body: { p_project_id: PROJECT } });
  const refresh = (refreshToken) =>
    call(`${API}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', apikey: keys.anon, body: { refresh_token: refreshToken } });

  return { service, rpc, ask, openWitness, readWitness, finishedWitness, witnessedLinkRequest, mailsFor, awaitMail, linksOf, allUsers, verify, claim, refresh };
}

/** The one link of a sign-in mail, parsed, when the message holds exactly one in each part and the two agree; else null. */
function onlyLink(links) {
  if (!links) return null;
  if (links.html.length !== 1 || links.text.length !== 1 || links.html[0] !== links.text[0]) return null;
  try {
    return new URL(links.html[0]);
  } catch {
    return null;
  }
}

const PROJECT_EDITOR = { scope: 'project', target_type: null, target_id: PROJECT, role: 'editor' };
/** The four keys of a grant specification, in one order, so that two can be compared whatever order they arrived in. */
const spec = (value) =>
  value && typeof value === 'object'
    ? { scope: value.scope, target_type: value.target_type ?? null, target_id: value.target_id, role: value.role }
    : null;

async function main(keys) {
  const c = context(keys);
  const run = `${Math.floor(Date.now() / 1000)}-${randomBytes(3).toString('hex')}`;
  const address = (letter) => `${ADDRESS_PREFIX}${letter}-${run}@test.openvaa.local`;
  const [A, B, C, D, E] = ['a', 'b', 'c', 'd', 'e'].map(address);
  const password = randomBytes(24).toString('base64url');
  const seededIds = [];

  try {
    // 2 — seed.
    const seeded = await c.rpc('create_invitations', {
      p_project_id: PROJECT,
      p_invitations: [
        { scope: 'project', role: 'editor', email: A },
        { scope: 'project', role: 'editor' },
        { scope: 'project', role: 'editor', email: D },
        { scope: 'project', role: 'editor', email: E }
      ]
    });
    const rows = Array.isArray(seeded.json) ? seeded.json : [];
    for (const row of rows) if (UUID.test(String(row?.id))) seededIds.push(row.id);
    const code = rows[1]?.code;
    if (
      !verdict(
        '2 seed',
        [
          [`create_invitations answered 200 (it answered ${seeded.status})`, seeded.status === 200],
          ['four invitations were returned', rows.length === 4 && seededIds.length === 4],
          ['the item with no address returned a code and the three others none', typeof code === 'string' && code !== '' && [0, 2, 3].every((i) => rows[i]?.code === null)]
        ],
        `four (project, editor) invitations in ${PROJECT}: by email for ${A}, ${D} and ${E}, and one with a code`
      )
    ) {
      return;
    }

    // 3 — check-code.
    const valid = await c.ask({ operation: 'check-code', code });
    const unknown = await c.ask({ operation: 'check-code', code: `NO-SUCH-${randomBytes(4).toString('hex')}` });
    verdict(
      '3 check-code',
      [
        ['the seeded code answers 200 { status: valid }', valid.status === 200 && isDeepStrictEqual(valid.json, { status: 'valid' })],
        ['a string that names nothing answers 200 { status: unknown }', unknown.status === 200 && isDeepStrictEqual(unknown.json, { status: 'unknown' })]
      ],
      'the code answers valid; a string that names nothing answers unknown'
    );

    // 4 — request-link for A.
    const first = await c.witnessedLinkRequest({ email: A });
    const mailsA = first.outcome === 'sent' ? await c.mailsFor(A) : null;
    const linkA = mailsA && mailsA.length === 1 ? onlyLink(await c.linksOf(mailsA[0].ID)) : null;
    verdict(
      '4 request-link, an invited address',
      [
        ['a witness was opened', first.opened],
        [`the answer is 200 (it was ${first.answer.status})`, first.answer.status === 200],
        ['the body is { accepted: true }', isDeepStrictEqual(first.answer.json, { accepted: true })],
        [`the witness reads sent (it read ${first.outcome ?? 'nothing within the ceiling'})`, first.outcome === 'sent'],
        [`exactly one mail exists for A (found ${mailsA ? mailsA.length : 'none read'})`, Array.isArray(mailsA) && mailsA.length === 1],
        ['its subject is the English subject', mailsA?.[0]?.Subject === ENGLISH_SUBJECT],
        ['it holds one link, the same in its html and its text', linkA !== null],
        ['the link has the path /en/api/auth/callback', linkA?.pathname === '/en/api/auth/callback'],
        ['the link has exactly the query parameters token_hash and type', linkA !== null && isDeepStrictEqual([...linkA.searchParams.keys()].sort(), ['token_hash', 'type'])],
        ['type is magiclink and the link has no fragment', linkA?.searchParams.get('type') === 'magiclink' && linkA?.hash === '']
      ],
      `answered 200 { accepted: true } in ${first.answer.ms} ms; the witness read sent; one mail for ${A} with the English subject; its only link is ${linkA?.origin ?? '?'}/en/api/auth/callback with token_hash and type=magiclink`
    );
    const answerTimeA = first.answer.ms;

    // 5 — a second request for A straight after.
    const second = await c.witnessedLinkRequest({ email: A });
    const mailsAfterSecond = second.outcome ? await c.mailsFor(A) : null;
    verdict(
      '5 request-link, the same address again',
      [
        ['the status and body are deep-equal to the first', second.answer.status === first.answer.status && isDeepStrictEqual(second.answer.json, first.answer.json)],
        [`the witness reads not-sent (it read ${second.outcome ?? 'nothing within the ceiling'})`, second.outcome === 'not-sent'],
        [`after it, the catcher still holds exactly one mail for A (found ${mailsAfterSecond ? mailsAfterSecond.length : 'none read'})`, Array.isArray(mailsAfterSecond) && mailsAfterSecond.length === 1]
      ],
      `the same answer in ${second.answer.ms} ms; the witness read not-sent; then still one mail for ${A}`
    );

    // 6 — an address with no invitation and no account.
    const stranger = await c.witnessedLinkRequest({ email: B });
    const mailsB = stranger.outcome ? await c.mailsFor(B) : null;
    const usersAfterB = stranger.outcome ? await c.allUsers() : null;
    const usersForB = usersAfterB ? usersAfterB.filter((u) => String(u.email ?? '').toLowerCase() === B) : null;
    verdict(
      '6 request-link, an address nobody invited',
      [
        ['the status and body are deep-equal to the invited address’s', stranger.answer.status === first.answer.status && isDeepStrictEqual(stranger.answer.json, first.answer.json)],
        [`the witness reads not-sent (it read ${stranger.outcome ?? 'nothing within the ceiling'})`, stranger.outcome === 'not-sent'],
        [`after it, no mail exists for B (found ${mailsB ? mailsB.length : 'none read'})`, Array.isArray(mailsB) && mailsB.length === 0],
        [`after it, the admin API finds no user for B (found ${usersForB ? usersForB.length : 'the list could not be read'})`, Array.isArray(usersForB) && usersForB.length === 0]
      ],
      `the same answer in ${stranger.answer.ms} ms; the witness read not-sent; then no mail and no account for ${B} (${usersAfterB?.length ?? '?'} users read)`
    );
    console.log(`TIME request-link answered in ${answerTimeA} ms for the invited address and in ${stranger.answer.ms} ms for the uninvited one`);

    // 7 — A's link signs in, the claim writes the promised grant, the refreshed token carries it.
    const sessionA = linkA ? await c.verify(linkA.searchParams.get('token_hash')) : { status: 0, json: null };
    const grantsBefore = claimsOf(sessionA.json?.access_token)?.grants;
    const claimedA = sessionA.status === 200 ? await c.claim(sessionA.json.access_token) : { status: 0, json: null };
    const refreshedA = sessionA.status === 200 ? await c.refresh(sessionA.json.refresh_token) : { status: 0, json: null };
    const grantsAfter = claimsOf(refreshedA.json?.access_token)?.grants;
    verdict(
      '7 the link, the claim and the refresh',
      [
        [`the token verifies as magiclink to a session (status ${sessionA.status})`, sessionA.status === 200 && typeof sessionA.json?.access_token === 'string'],
        ['the access token carries an empty grants claim', Array.isArray(grantsBefore) && grantsBefore.length === 0],
        [`claim_invitations answers 200 (it answered ${claimedA.status})`, claimedA.status === 200],
        ['it claimed exactly one specification, the promised (project, editor)', Array.isArray(claimedA.json?.claimed) && claimedA.json.claimed.length === 1 && isDeepStrictEqual(spec(claimedA.json.claimed[0]), PROJECT_EDITOR)],
        ['it skipped nothing', Array.isArray(claimedA.json?.skipped) && claimedA.json.skipped.length === 0],
        ['password_set is false', claimedA.json?.password_set === false],
        [`the session refreshes (status ${refreshedA.status})`, refreshedA.status === 200],
        ['the refreshed token’s grants claim is exactly that one grant', Array.isArray(grantsAfter) && grantsAfter.length === 1 && isDeepStrictEqual(spec(grantsAfter[0]), PROJECT_EDITOR)]
      ],
      'the token verified to a session with an empty grants claim; the claim returned one (project, editor) and password_set false; the refreshed token carries exactly that grant'
    );

    // 8 — the code and address C.
    const byCode = await c.witnessedLinkRequest({ email: C, code });
    const mailsC = byCode.outcome === 'sent' ? await c.mailsFor(C) : null;
    const linkC = mailsC && mailsC.length === 1 ? onlyLink(await c.linksOf(mailsC[0].ID)) : null;
    const sessionC = linkC ? await c.verify(linkC.searchParams.get('token_hash')) : { status: 0, json: null };
    const claimedC = sessionC.status === 200 ? await c.claim(sessionC.json.access_token) : { status: 0, json: null };
    const used = await c.ask({ operation: 'check-code', code });
    verdict(
      '8 request-link with a code, then the claim',
      [
        ['the answer is deep-equal to the others', byCode.answer.status === first.answer.status && isDeepStrictEqual(byCode.answer.json, first.answer.json)],
        [`the witness reads sent (it read ${byCode.outcome ?? 'nothing within the ceiling'})`, byCode.outcome === 'sent'],
        [`exactly one mail exists for C (found ${mailsC ? mailsC.length : 'none read'})`, Array.isArray(mailsC) && mailsC.length === 1],
        ['it holds one link', linkC !== null],
        [`its token verifies (status ${sessionC.status})`, sessionC.status === 200],
        ['the claim returns the code’s specification and nothing else', claimedC.status === 200 && Array.isArray(claimedC.json?.claimed) && claimedC.json.claimed.length === 1 && isDeepStrictEqual(spec(claimedC.json.claimed[0]), PROJECT_EDITOR)],
        ['password_set is false', claimedC.json?.password_set === false],
        ['check-code now answers 200 { status: used }', used.status === 200 && isDeepStrictEqual(used.json, { status: 'used' })]
      ],
      `the witness read sent; one mail for ${C}; its token verified; the claim returned the code’s (project, editor); check-code now answers used`
    );

    // 9 — C sets a password; code sign-in.
    const passwordSet = sessionC.status === 200 ? await call(`${API}/auth/v1/user`, { method: 'PUT', apikey: keys.anon, bearer: sessionC.json.access_token, body: { password } }) : { status: 0 };
    const signedIn = await c.ask({ operation: 'code-sign-in', code, password });
    const wrongPassword = await c.ask({ operation: 'code-sign-in', code, password: `${password}-wrong` });
    const noSuchCode = await c.ask({ operation: 'code-sign-in', code: `NO-SUCH-${randomBytes(4).toString('hex')}`, password });
    verdict(
      '9 code sign-in',
      [
        [`C sets a password (status ${passwordSet.status})`, passwordSet.status === 200],
        ['the right password answers 200 { result: signed-in }', signedIn.status === 200 && signedIn.json?.result === 'signed-in'],
        ['with two tokens and nothing else', signedIn.json !== null && isDeepStrictEqual(Object.keys(signedIn.json ?? {}).sort(), ['access_token', 'refresh_token', 'result']) && typeof signedIn.json.access_token === 'string' && signedIn.json.access_token !== '' && typeof signedIn.json.refresh_token === 'string' && signedIn.json.refresh_token !== ''],
        ['the session is the claimant’s', String(claimsOf(signedIn.json?.access_token)?.email ?? '').toLowerCase() === C],
        ['a wrong password answers 200 { result: invalid-credentials }', wrongPassword.status === 200 && isDeepStrictEqual(wrongPassword.json, { result: 'invalid-credentials' })],
        ['a string that names no code answers a status and body deep-equal to that', noSuchCode.status === wrongPassword.status && isDeepStrictEqual(noSuchCode.json, wrongPassword.json)]
      ],
      'the right password answers signed-in with two tokens and nothing else; a wrong password and an unknown code answer the same invalid-credentials body'
    );

    // 10 — hostile origin headers.
    const hostile = await c.witnessedLinkRequest({ email: D }, { Origin: 'https://evil.example', 'X-Forwarded-Host': 'evil.example' });
    const mailsD = hostile.outcome === 'sent' ? await c.mailsFor(D) : null;
    const linkD = mailsD && mailsD.length === 1 ? onlyLink(await c.linksOf(mailsD[0].ID)) : null;
    verdict(
      '10 the origin of the link',
      [
        [`the witness reads sent (it read ${hostile.outcome ?? 'nothing within the ceiling'})`, hostile.outcome === 'sent'],
        ['exactly one mail exists for D, with one link', linkD !== null],
        ['the link’s origin equals the origin of A’s link', linkA !== null && linkD?.origin === linkA.origin],
        ['the link names the hostile host nowhere', linkD !== null && !linkD.href.includes('evil.example')]
      ],
      `with Origin and X-Forwarded-Host naming evil.example, the mail for ${D} links to ${linkD?.origin ?? '?'}, as A’s does`
    );

    // 11 — a witness nobody opened.
    const unopened = randomUUID();
    const withUnopened = await c.ask({ operation: 'request-link', email: E, witness: unopened });
    const mailsE = await c.awaitMail(E);
    const follower = await c.witnessedLinkRequest({ email: E });
    const unopenedRead = follower.outcome ? await c.rpc('invitation_link_witness', { p_id: unopened }) : { status: 0, json: undefined };
    verdict(
      '11 a witness nobody opened',
      [
        ['the answer is deep-equal to the others', withUnopened.status === first.answer.status && isDeepStrictEqual(withUnopened.json, first.answer.json)],
        [`the request did its work: one mail arrived for E (found ${mailsE.length})`, mailsE.length === 1],
        [`a further request for E finished after it (its witness read ${follower.outcome ?? 'nothing within the ceiling'})`, follower.outcome === 'not-sent'],
        [`the service role then reads no outcome for the unopened id (status ${unopenedRead.status})`, unopenedRead.status === 200 && unopenedRead.json === null]
      ],
      'answered like any other; after its mail and a later request’s finished witness, the service role reads no record for that id'
    );
  } finally {
    // 12 — cleanup, in every case.
    const removals = [];
    if (seededIds.length > 0) {
      removals.push(await c.service(`${API}/rest/v1/invitations?id=in.(${seededIds.join(',')})`, { method: 'DELETE' }));
    }
    removals.push(await c.service(`${API}/rest/v1/invitations?email=like.${ADDRESS_PREFIX}*`, { method: 'DELETE' }));
    removals.push(await c.service(`${API}/rest/v1/invitations?pending_email=like.${ADDRESS_PREFIX}*`, { method: 'DELETE' }));
    const users = (await c.allUsers()) ?? [];
    const ours = users.filter((u) => String(u.email ?? '').startsWith(ADDRESS_PREFIX));
    for (const user of ours) {
      removals.push(await c.service(`${API}/auth/v1/admin/users/${user.id}`, { method: 'DELETE' }));
    }

    const leftById = seededIds.length > 0 ? await c.service(`${API}/rest/v1/invitations?select=id&id=in.(${seededIds.join(',')})`) : { status: 200, json: [] };
    const leftByAddress = await c.service(`${API}/rest/v1/invitations?select=id&or=(email.like.${ADDRESS_PREFIX}*,pending_email.like.${ADDRESS_PREFIX}*)`);
    const usersAfter = await c.allUsers();
    const oursAfter = usersAfter ? usersAfter.filter((u) => String(u.email ?? '').startsWith(ADDRESS_PREFIX)) : null;
    verdict(
      '12 cleanup',
      [
        ['every removal was accepted', removals.every((r) => r.status === 200 || r.status === 204)],
        ['no seeded invitation remains', leftById.status === 200 && Array.isArray(leftById.json) && leftById.json.length === 0],
        ['no invitation remains for an address of the probe', leftByAddress.status === 200 && Array.isArray(leftByAddress.json) && leftByAddress.json.length === 0],
        ['no user of the probe remains', Array.isArray(oursAfter) && oursAfter.length === 0]
      ],
      `${seededIds.length} seeded invitation(s) and ${ours.length} user(s) deleted; none remains`
    );
  }
}

const keys = readKeys();
if (!keys) {
  fail('1 keys', "could not read the two API keys from 'supabase status -o env' — is the stack up?");
} else {
  pass('1 keys', 'both captured');
  await main(keys);
}
console.log(failed ? '174-fn-probe: FAIL' : '174-fn-probe: PASS');
process.exit(failed ? 1 : 0);
