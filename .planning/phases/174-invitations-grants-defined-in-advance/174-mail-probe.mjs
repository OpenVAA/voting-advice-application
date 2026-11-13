#!/usr/bin/env node
// 174-mail-probe.mjs — does a mail sent by an Edge Function of the RUNNING local stack reach the mail catcher?
//
// Usage: node 174-mail-probe.mjs
//
// The steps, one output line each, PASS or FAIL:
//   1. the two API keys are captured from `supabase status -o env` into variables;
//   2. the project the edge runtime was started for is read from its container, one named variable in one call;
//   3. one user is created through the auth admin API, with a confirmed address
//      r174-probe-mail-<epoch>@test.openvaa.local and a random password;
//   4. one grant row (project, <that project>, admin) is inserted for the user through the REST API;
//   5. the user signs in with the password grant;
//   6. `send-email` is called with the user's token, one template whose subject carries a nonce, and the
//      user's own id as the only recipient; it must answer 200 and report one message sent;
//   7. the mail catcher's API is polled, for at most 30 seconds, for a message to that address whose subject
//      carries the nonce;
//   8. in every case the user is deleted (the grant row goes with it) and is confirmed gone.
//
// What it never does: print a key, a token or the password; read any other container variable; open any
// environment file. The address, the project id and the nonce are not secrets and are printed.
//
// Exit codes: 0 when the function answered 200 and the message arrived, and the user is gone; 1 otherwise.

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

const API = 'http://127.0.0.1:54321';
const MAIL_API = 'http://127.0.0.1:54324';
const EDGE_CONTAINER = 'supabase_edge_runtime_openvaa-local';
const POLL_SECONDS = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The directory of the running Node first, so that `yarn` resolves to the same toolchain. */
const CHILD_PATH = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}`;

let failed = false;
const pass = (step, detail = '') => console.log(`PASS ${step}${detail ? ` — ${detail}` : ''}`);
const fail = (step, detail = '') => {
  failed = true;
  console.log(`FAIL ${step}${detail ? ` — ${detail}` : ''}`);
};

/** One request. Answers `{ status, json }`; a body that is not JSON gives `json: null`. Never throws. */
async function call(url, { method = 'GET', key, bearer, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (key) headers.apikey = key;
  if (bearer ?? key) headers.Authorization = `Bearer ${bearer ?? key}`;
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000)
    });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: response.status, json };
  } catch (error) {
    return { status: 0, json: null, error: error instanceof Error ? error.name : 'error' };
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

/** The project the edge runtime was started for: one named variable, one call. */
function readEdgeProjectId() {
  const r = spawnSync('docker', ['exec', EDGE_CONTAINER, ...'printenv PUBLIC_PROJECT_ID'.split(' ')], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });
  const value = (r.stdout ?? '').trim();
  return r.status === 0 && UUID.test(value) ? value : null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const keys = readKeys();
  if (!keys) return fail('1 keys', "could not read the two API keys from 'supabase status -o env' — is the stack up?");
  pass('1 keys', 'both captured');

  const projectId = readEdgeProjectId();
  if (!projectId) return fail('2 project', `the container ${EDGE_CONTAINER} reported no project id`);
  pass('2 project', `the edge runtime serves ${projectId}`);

  const epoch = Math.floor(Date.now() / 1000);
  const address = `r174-probe-mail-${epoch}@test.openvaa.local`;
  const password = randomBytes(24).toString('base64url');
  const nonce = randomBytes(8).toString('hex');

  const created = await call(`${API}/auth/v1/admin/users`, {
    method: 'POST',
    key: keys.service,
    body: { email: address, password, email_confirm: true }
  });
  const userId = created.json?.id;
  if (created.status !== 200 || !UUID.test(String(userId))) {
    return fail('3 user', `the admin API answered ${created.status} for ${address}`);
  }
  pass('3 user', `${address} created, confirmed by the service role`);

  try {
    const grant = await call(`${API}/rest/v1/grants`, {
      method: 'POST',
      key: keys.service,
      body: { user_id: userId, scope: 'project', target_id: projectId, role: 'admin' }
    });
    if (grant.status !== 201) return fail('4 grant', `the REST API answered ${grant.status}`);
    pass('4 grant', '(project, the served project, admin)');

    const session = await call(`${API}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      key: keys.anon,
      body: { email: address, password }
    });
    const token = session.json?.access_token;
    if (session.status !== 200 || typeof token !== 'string' || token === '') {
      return fail('5 sign-in', `the password grant answered ${session.status}`);
    }
    pass('5 sign-in', 'a session was issued');

    const subject = `r174 mail probe ${nonce}`;
    const sent = await call(`${API}/functions/v1/send-email`, {
      method: 'POST',
      key: keys.anon,
      bearer: token,
      body: {
        templates: { en: { subject, body: 'A probe message sent by the send-email Edge Function.' } },
        recipient_user_ids: [userId],
        project_id: projectId
      }
    });
    if (sent.status !== 200 || sent.json?.success !== true || sent.json?.sent !== 1) {
      return fail(
        '6 send-email',
        `answered ${sent.status}, sent ${sent.json?.sent ?? '-'}, failed ${sent.json?.failed ?? '-'}`
      );
    }
    pass('6 send-email', `answered 200, sent ${sent.json.sent}, failed ${sent.json.failed}`);

    const started = Date.now();
    let arrived = false;
    while (!arrived && Date.now() - started < POLL_SECONDS * 1000) {
      const found = await call(`${MAIL_API}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`);
      arrived = (found.json?.messages ?? []).some((m) => String(m.Subject ?? '').includes(nonce));
      if (!arrived) await sleep(1000);
    }
    const waited = Math.round((Date.now() - started) / 1000);
    if (!arrived) return fail('7 delivery', `no message with nonce ${nonce} to ${address} within ${POLL_SECONDS} s`);
    pass('7 delivery', `a message with nonce ${nonce} reached the catcher within ${waited} s`);
  } finally {
    const removed = await call(`${API}/auth/v1/admin/users/${userId}`, { method: 'DELETE', key: keys.service });
    const after = await call(`${API}/auth/v1/admin/users/${userId}`, { key: keys.service });
    if (removed.status === 200 && after.status === 404) pass('8 cleanup', 'the user is deleted and gone');
    else fail('8 cleanup', `delete answered ${removed.status}, the read after it ${after.status}`);
  }
}

await main();
console.log(failed ? '174-mail-probe: FAIL' : '174-mail-probe: PASS');
process.exit(failed ? 1 : 0);
