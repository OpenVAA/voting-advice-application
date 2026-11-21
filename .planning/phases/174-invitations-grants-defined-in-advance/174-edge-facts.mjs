#!/usr/bin/env node
// 174-edge-facts.mjs — what the RUNNING local edge runtime and auth service do, asked through the probe
// function `r174-probe`. That function is never committed: it is served only between two restarts.
//
// Usage:
//   node 174-edge-facts.mjs           every fact, one output line each
//   node 174-edge-facts.mjs marker    only the literal the served probe answers with (the code-change check)
//
// The facts, in order:
//   A3        the status of a call to the probe made three ways: the anon key as `apikey` and bearer; the
//             `apikey` header alone; no key at all;
//   caller    the names of the request headers the function saw, and the values of the four
//             forwarded-address headers, per call that reached it;
//   A4        the time to the probe's answer when it also hands a three-second task to
//             `EdgeRuntime.waitUntil`, and when (if ever, within 30 seconds) that task's mail reached the
//             catcher;
//   settings  the two keys of GET /auth/v1/settings as the function reads them, with their types;
//   redirect  the Location of GET /auth/v1/verify with an invalid token for a callback URL on SITE_URL and
//             for one on another origin, redirects not followed;
//   A7        the error object of `auth.admin.generateLink({ type: 'invite' })` for a confirmed user;
//   re-issue  two `magiclink` tokens issued in a row for one address: the status of verifying the first,
//             then of verifying the second.
//
// It creates one confirmed user r174-probe-facts-<epoch>@test.openvaa.local through the auth admin API and
// deletes it at the end, in every case.
//
// What it never does: print a key, a token or a token hash; read a container variable; open any environment
// file. The address, the nonce, header names and forwarded addresses of the local network are printed.
//
// Exit codes: 0 when every fact was measured and the user is gone; 1 otherwise. A fact's VALUE never
// changes the exit code: a mail that did not arrive is printed as such, and exits 0.

import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');

const API = 'http://127.0.0.1:54321';
const MAIL_API = 'http://127.0.0.1:54324';
const PROBE = `${API}/functions/v1/r174-probe`;
const POLL_SECONDS = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORWARDED_HEADERS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'sb-forwarded-for'];

/** The directory of the running Node first, so that `yarn` resolves to the same toolchain. */
const CHILD_PATH = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}`;

let incomplete = false;
const fact = (name, detail) => console.log(`FACT ${name} — ${detail}`);
const missing = (name, detail) => {
  incomplete = true;
  console.log(`MISSING ${name} — ${detail}`);
};

/** One request. Answers `{ status, json, ms }`; a body that is not JSON gives `json: null`. Never throws. */
async function call(url, { method = 'GET', apikey, bearer, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (apikey) headers.apikey = apikey;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method,
      headers,
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

/** A Location with everything after the path removed: the fragment carries only the auth service's error text. */
const bare = (location) => (typeof location === 'string' ? location.replace(/[#?].*$/, '') : 'none');

async function markerOnly(keys) {
  const answer = await call(PROBE, { method: 'POST', apikey: keys.anon, bearer: keys.anon, body: { op: 'background' } });
  if (answer.status !== 200 || typeof answer.json?.marker !== 'string') {
    return missing('marker', `the probe answered ${answer.status}`);
  }
  fact('marker', answer.json.marker);
}

async function main(keys) {
  const epoch = Math.floor(Date.now() / 1000);
  const address = `r174-probe-facts-${epoch}@test.openvaa.local`;
  const nonce = randomBytes(8).toString('hex');

  const created = await call(`${API}/auth/v1/admin/users`, {
    method: 'POST',
    apikey: keys.service,
    bearer: keys.service,
    body: { email: address, email_confirm: true }
  });
  const userId = created.json?.id;
  if (created.status !== 200 || !UUID.test(String(userId))) {
    return missing('user', `the admin API answered ${created.status} for ${address}`);
  }
  fact('user', `${address} created, confirmed by the service role`);

  try {
    // A3 and the caller observation: three ways of calling, none of which starts a background task.
    const ways = [
      ['the anon key as apikey and bearer', { apikey: keys.anon, bearer: keys.anon }],
      ['the apikey header only', { apikey: keys.anon }],
      ['no key', {}]
    ];
    const seen = [];
    for (const [label, auth] of ways) {
      const answer = await call(PROBE, { method: 'POST', ...auth, body: { op: 'background' } });
      const reached = answer.status === 200 && Array.isArray(answer.json?.header_names);
      fact('A3', `a call with ${label}: status ${answer.status}${reached ? ', reached the function' : ', did not reach the function'}`);
      seen.push(reached ? answer.json : null);
    }
    const reachedCalls = seen.map((s, i) => (s ? i + 1 : null)).filter(Boolean);
    if (reachedCalls.length === 0) {
      missing('caller', 'no call reached the function');
    } else {
      seen.forEach((s, i) => {
        if (s) fact('caller', `header names seen in call ${i + 1}: ${s.header_names.join(', ')}`);
      });
      for (const name of FORWARDED_HEADERS) {
        const values = seen.map((s, i) => (s ? `call ${i + 1} ${s.forwarded?.[name] ?? 'absent'}` : `call ${i + 1} not reached`));
        const distinct = new Set(seen.filter(Boolean).map((s) => s.forwarded?.[name] ?? 'absent'));
        fact('caller', `${name}: ${values.join('; ')} — ${distinct.size === 1 ? 'the same' : 'differs'} across the calls that reached the function`);
      }
    }

    // A4: the answer first, the mail afterwards.
    const background = await call(PROBE, {
      method: 'POST',
      apikey: keys.anon,
      bearer: keys.anon,
      body: { op: 'background', to: address, nonce }
    });
    if (background.status !== 200 || background.json?.background !== true) {
      missing('A4', `the probe answered ${background.status} and started no background task`);
    } else {
      fact('A4', `the answer came after ${background.ms} ms, the task it handed over waits 3000 ms before it sends`);
      const answeredAt = Date.now();
      let arrivedAfter = null;
      while (arrivedAfter === null && Date.now() - answeredAt < POLL_SECONDS * 1000) {
        const found = await call(`${MAIL_API}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`);
        if ((found.json?.messages ?? []).some((m) => String(m.Subject ?? '').includes(nonce))) {
          arrivedAfter = Date.now() - answeredAt;
        } else {
          await sleep(500);
        }
      }
      fact(
        'A4',
        arrivedAfter === null
          ? `the mail with nonce ${nonce} DID NOT ARRIVE within ${POLL_SECONDS} s of the answer`
          : `the mail with nonce ${nonce} arrived ${arrivedAfter} ms after the answer`
      );
    }

    // Settings, the redirect question and A7, asked from inside the function.
    const facts = await call(PROBE, {
      method: 'POST',
      apikey: keys.anon,
      bearer: keys.anon,
      body: { op: 'facts', existing_email: address }
    });
    if (facts.status !== 200 || !facts.json) {
      missing('settings, redirect, A7', `the probe answered ${facts.status}`);
    } else {
      const f = facts.json;
      fact(
        'settings',
        `status ${f.settings_status}; disable_signup ${JSON.stringify(f.disable_signup)} (${f.disable_signup_type}); mailer_autoconfirm ${JSON.stringify(f.mailer_autoconfirm)} (${f.mailer_autoconfirm_type})`
      );
      fact('redirect', `a callback URL on SITE_URL: status ${f.redirect_admitted?.status}, Location without query and fragment ${bare(f.redirect_admitted?.location)}`);
      fact('redirect', `a callback URL on another origin: status ${f.redirect_refused?.status}, Location without query and fragment ${bare(f.redirect_refused?.location)}`);
      if (!f.invite_existing_error_keys) {
        fact('A7', 'generateLink with the type invite for a confirmed user returned NO error');
      } else {
        const keysOf = Object.entries(f.invite_existing_error_keys)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join(', ');
        fact('A7', `own enumerable keys of the error: ${keysOf || 'none'}`);
        const read = f.invite_existing_error_read ?? {};
        fact('A7', `read by property: name=${JSON.stringify(read.name)}, code=${JSON.stringify(read.code)}, status=${JSON.stringify(read.status)}, message=${JSON.stringify(read.message)}`);
      }
    }

    // Re-issue: two magiclink tokens in a row, the first verified first.
    const issue = () =>
      call(`${API}/auth/v1/admin/generate_link`, {
        method: 'POST',
        apikey: keys.service,
        bearer: keys.service,
        body: { type: 'magiclink', email: address }
      });
    const first = await issue();
    const second = await issue();
    const firstHash = first.json?.hashed_token;
    const secondHash = second.json?.hashed_token;
    if (first.status !== 200 || second.status !== 200 || typeof firstHash !== 'string' || typeof secondHash !== 'string') {
      missing('re-issue', `the two issues answered ${first.status} and ${second.status}`);
    } else {
      fact('re-issue', `two tokens issued; verification_type ${first.json.verification_type} and ${second.json.verification_type}; the two hashes ${firstHash === secondHash ? 'are equal' : 'differ'}`);
      const verify = (hash) =>
        call(`${API}/auth/v1/verify`, { method: 'POST', apikey: keys.anon, body: { type: 'magiclink', token_hash: hash } });
      const firstVerify = await verify(firstHash);
      const secondVerify = await verify(secondHash);
      const describe = (v) =>
        `${v.status}${v.status === 200 ? (typeof v.json?.access_token === 'string' ? ' with a session' : ' without a session') : ` ${v.json?.error_code ?? ''}`.trimEnd()}`;
      fact('re-issue', `verifying the FIRST token after the second was issued: ${describe(firstVerify)}`);
      fact('re-issue', `verifying the SECOND token after that: ${describe(secondVerify)}`);
    }
  } finally {
    const removed = await call(`${API}/auth/v1/admin/users/${userId}`, { method: 'DELETE', apikey: keys.service, bearer: keys.service });
    const after = await call(`${API}/auth/v1/admin/users/${userId}`, { apikey: keys.service, bearer: keys.service });
    if (removed.status === 200 && after.status === 404) fact('cleanup', 'the probe user is deleted and gone');
    else missing('cleanup', `delete answered ${removed.status}, the read after it ${after.status}`);
  }
}

const mode = process.argv[2];
if (mode !== undefined && mode !== 'marker') {
  console.error('usage: node 174-edge-facts.mjs [marker]');
  process.exit(2);
}
const keys = readKeys();
if (!keys) {
  missing('keys', "could not read the two API keys from 'supabase status -o env' — is the stack up?");
} else if (mode === 'marker') {
  await markerOnly(keys);
} else {
  fact('keys', 'both captured');
  await main(keys);
}
console.log(incomplete ? '174-edge-facts: INCOMPLETE' : '174-edge-facts: every fact measured');
process.exit(incomplete ? 1 : 0);
