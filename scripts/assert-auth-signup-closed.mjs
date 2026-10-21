#!/usr/bin/env node

/**
 * AUTH-SIGNUP-CLOSED GUARD.
 *
 * What it requires: seven keys of `apps/supabase/supabase/config.toml`, each inside its own table.
 *
 *   [auth]        enable_signup = false         No unauthenticated caller may create a user. An invitation is claimed by the account whose address is confirmed, so a confirmed address has to be something only its owner or the service role can produce. While public sign-up is open, anyone can register an address they do not control, and a later mailed link then confirms the account of whoever registered it first. Users are created by the service role only.
 *   [auth]        minimum_password_length = 8   The length the Contestant App's password rule asks for. With a smaller value a direct call to the auth service can set a password the screens would refuse. The composition rules are the client's alone.
 *   [auth.email]  enable_confirmations = true   An address counts as confirmed only after a mailed link is opened, or after the service role vouches for it. With auto-confirmation, an account created through sign-up carries a confirmed address without any mail, so this is the second lock behind the first key.
 *   [auth.email]  enable_signup = true          This key switches the email provider itself, not public sign-up. With it off the auth service refuses password sign-in and password recovery.
 *   [auth.email]  otp_expiry = 3600             The life of a mailed sign-in or recovery link, in seconds. A link is a bearer credential: whoever holds it is signed in, so how long it can be used is bounded and pinned here.
 *   [auth.hook.send_email]  enabled = true   The auth service hands every mail it would send to the hook below instead of sending it. The application's mails are sent by the account-access Edge Function alone, behind its own checks, throttle and texts; without the hook the service's own one-time-code and recovery endpoints mail its default English text to any address a caller names. The hook stops the mail and nothing else: what those endpoints answer is unchanged.
 *   [auth.hook.send_email]  uri = "pg-functions://postgres/public/send_email_hook"   The database function that receives those mails and sends none.
 *
 * Together the first and the third make `auth.users.email_confirmed_at` mean one of two things and nothing else: a mail sent to the address was opened, or a service-side call vouched for the address.
 *
 * A key counts only inside its own table. `enable_signup` and `enable_confirmations` also exist under `[auth.sms]`, and neither of those satisfies or violates a requirement here; nor does `minimum_password_length` or `otp_expiry` written in any table but its own. A key that is absent, commented out or written twice fails, as does any value other than the bare literal required.
 *
 * What this guard cannot see: it reads the file, and the auth container reads the file only when the stack starts. The running local service is observed by the E2E project `auth-service-contract`. A hosted project's copies of these settings live in its dashboard and no file in this repository sets them.
 *
 * It is a line-oriented read (Node built-ins only, no TOML parser): a table starts at its `[name]` header and ends at the next header, and a key is a `name = value` line with an optional trailing comment. The configuration file holds no multi-line value, which is what makes that reading exact.
 *
 * Usage:
 *   node scripts/assert-auth-signup-closed.mjs               # gate: exit 1 naming every key that does not hold
 *   node scripts/assert-auth-signup-closed.mjs --self-test   # run the same check over embedded configuration texts
 *
 * Exit codes:
 *   0 - all seven keys hold; or --self-test passed
 *   1 - at least one key does not hold, or the file cannot be read; or --self-test found a difference
 *   2 - usage error
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-auth-signup-closed.mjs';
const CONFIG = 'apps/supabase/supabase/config.toml';

/** The requirements. `why` is printed with a finding, so a failing run says what the value protects. */
const REQUIRED = [
  {
    table: 'auth',
    key: 'enable_signup',
    value: 'false',
    why: 'public sign-up must be closed: an invitation is claimed by a confirmed address, and users are created by the service role only'
  },
  {
    table: 'auth',
    key: 'minimum_password_length',
    value: '8',
    why: "a direct call to the auth service must not set a password the Contestant App's screens would refuse"
  },
  {
    table: 'auth.email',
    key: 'enable_confirmations',
    value: 'true',
    why: 'an address counts as confirmed only after a mailed link is opened or the service role vouches for it'
  },
  {
    table: 'auth.email',
    key: 'enable_signup',
    value: 'true',
    why: 'this key switches the email provider itself, and password sign-in and password recovery depend on it'
  },
  {
    table: 'auth.email',
    key: 'otp_expiry',
    value: '3600',
    why: 'a mailed sign-in or recovery link is a bearer credential, and this bounds how long one can be used'
  },
  {
    table: 'auth.hook.send_email',
    key: 'enabled',
    value: 'true',
    why: "the auth service must send no mail of its own: the application's mails are the account-access function's, behind its checks and throttle"
  },
  {
    table: 'auth.hook.send_email',
    key: 'uri',
    value: '"pg-functions://postgres/public/send_email_hook"',
    why: 'the mail hook must be the database function that sends nothing'
  }
];

const TABLE_HEADER = /^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*(?:#.*)?$/;

/**
 * Every occurrence of `key` inside `table`: the values of the live assignments, and whether a commented-out assignment is there.
 *
 * @param text - The configuration text.
 * @param table - The dotted table name, without brackets.
 * @param key - The bare key name.
 * @returns The live values in file order, and whether the table holds a commented-out assignment of the key.
 */
function readKey(text, table, key) {
  const live = new RegExp(`^\\s*${key}\\s*=\\s*(.*?)\\s*(?:#.*)?$`);
  const commented = new RegExp(`^\\s*#+\\s*${key}\\s*=`);
  const values = [];
  let commentedOut = false;
  let current = '';
  for (const line of text.split('\n')) {
    const header = TABLE_HEADER.exec(line);
    if (header) {
      current = header[1];
      continue;
    }
    if (current !== table) continue;
    const assignment = live.exec(line);
    if (assignment) values.push(assignment[1]);
    else if (commented.test(line)) commentedOut = true;
  }
  return { values, commentedOut };
}

/**
 * The findings for one configuration text, one per requirement that does not hold.
 *
 * @param text - The configuration text.
 * @returns One finding per failed requirement: the table, the key, what was found and what is required.
 */
function check(text) {
  const findings = [];
  for (const { table, key, value, why } of REQUIRED) {
    const { values, commentedOut } = readKey(text, table, key);
    let found;
    if (values.length === 0) found = commentedOut ? 'commented out' : 'absent';
    else if (values.length > 1) found = `written ${values.length} times (${values.join(', ')})`;
    else if (values[0] !== value) found = values[0] === '' ? 'empty' : values[0];
    else continue;
    findings.push({ table, key, found, required: value, why });
  }
  return findings;
}

/** One finding as a line of output. */
function describe({ table, key, found, required, why }) {
  return `[${table}] ${key} is ${found}; required: ${key} = ${required} — ${why}`;
}

/** The configuration the self-test edits: every key at its required value, beside same-named keys of another table. */
const CORRECT = `
[auth]
enabled = true
site_url = "http://127.0.0.1:5173"
# Public sign-up.
enable_signup = false
minimum_password_length = 8
password_requirements = ""

[auth.rate_limit]
email_sent = 2

[auth.email]
enable_signup = true # the email provider
enable_confirmations = true
otp_length = 6
otp_expiry = 3600

[auth.sms]
enable_signup = false
enable_confirmations = false

[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"

[auth.hook.send_email]
enabled = true
uri = "pg-functions://postgres/public/send_email_hook"
`;

/**
 * The self-test cases: a configuration text and the keys the check must report for it, as `table/key`, in the
 * order of `REQUIRED`. A case named "present only in" moves the key to another table, which must not stand in
 * for the key's own; `[auth.sms] enable_signup = false` stays in place in every case.
 */
const CASES = [
  { name: 'the required configuration', text: CORRECT, expected: [] },
  {
    name: '[auth] enable_signup = true',
    text: CORRECT.replace(
      'enable_signup = false\nminimum_password_length',
      'enable_signup = true\nminimum_password_length'
    ),
    expected: ['auth/enable_signup']
  },
  {
    name: '[auth.email] enable_confirmations = false',
    text: CORRECT.replace('enable_confirmations = true', 'enable_confirmations = false'),
    expected: ['auth.email/enable_confirmations']
  },
  {
    name: '[auth.email] enable_signup = false',
    text: CORRECT.replace('enable_signup = true # the email provider', 'enable_signup = false # the email provider'),
    expected: ['auth.email/enable_signup']
  },
  {
    name: 'enable_signup absent from [auth], present only in [auth.sms]',
    text: CORRECT.replace('enable_signup = false\nminimum_password_length', 'minimum_password_length'),
    expected: ['auth/enable_signup']
  },
  {
    name: '[auth] minimum_password_length = 6',
    text: CORRECT.replace('minimum_password_length = 8', 'minimum_password_length = 6'),
    expected: ['auth/minimum_password_length']
  },
  {
    name: '[auth] minimum_password_length absent',
    text: CORRECT.replace('minimum_password_length = 8\n', ''),
    expected: ['auth/minimum_password_length']
  },
  {
    name: '[auth] minimum_password_length commented out',
    text: CORRECT.replace('minimum_password_length = 8', '# minimum_password_length = 8'),
    expected: ['auth/minimum_password_length']
  },
  {
    name: 'minimum_password_length absent from [auth], present only in [auth.email]',
    text: CORRECT.replace('minimum_password_length = 8\n', '').replace(
      'otp_length = 6',
      'otp_length = 6\nminimum_password_length = 8'
    ),
    expected: ['auth/minimum_password_length']
  },
  {
    name: '[auth.email] otp_expiry = 86400',
    text: CORRECT.replace('otp_expiry = 3600', 'otp_expiry = 86400'),
    expected: ['auth.email/otp_expiry']
  },
  {
    name: '[auth.email] otp_expiry absent',
    text: CORRECT.replace('otp_expiry = 3600\n', ''),
    expected: ['auth.email/otp_expiry']
  },
  {
    name: '[auth.email] otp_expiry commented out',
    text: CORRECT.replace('otp_expiry = 3600', '# otp_expiry = 3600'),
    expected: ['auth.email/otp_expiry']
  },
  {
    name: 'otp_expiry absent from [auth.email], present only in [auth]',
    text: CORRECT.replace('otp_expiry = 3600\n', '').replace(
      'password_requirements = ""',
      'password_requirements = ""\notp_expiry = 3600'
    ),
    expected: ['auth.email/otp_expiry']
  },
  {
    name: '[auth.hook.send_email] switched off',
    text: CORRECT.replace('[auth.hook.send_email]\nenabled = true', '[auth.hook.send_email]\nenabled = false'),
    expected: ['auth.hook.send_email/enabled']
  },
  {
    name: '[auth.hook.send_email] absent, the access-token hook left in place',
    text: CORRECT.replace(
      '\n[auth.hook.send_email]\nenabled = true\nuri = "pg-functions://postgres/public/send_email_hook"\n',
      ''
    ),
    expected: ['auth.hook.send_email/enabled', 'auth.hook.send_email/uri']
  },
  {
    name: '[auth.hook.send_email] with another URI',
    text: CORRECT.replace('public/send_email_hook"', 'public/custom_access_token_hook"'),
    expected: ['auth.hook.send_email/uri']
  },
  {
    name: '[auth.email] enable_confirmations commented out',
    text: CORRECT.replace('enable_confirmations = true', '# enable_confirmations = true'),
    expected: ['auth.email/enable_confirmations']
  },
  {
    name: '[auth] enable_signup commented out',
    text: CORRECT.replace(
      'enable_signup = false\nminimum_password_length',
      '# enable_signup = false\nminimum_password_length'
    ),
    expected: ['auth/enable_signup']
  }
];

function selfTest() {
  let ok = true;
  for (const { name, text, expected } of CASES) {
    if (name !== CASES[0].name && text === CORRECT) {
      console.log(`self-test: FAIL  ${name}: the case text equals the required configuration, so it tests nothing`);
      ok = false;
      continue;
    }
    const observed = check(text).map((f) => `${f.table}/${f.key}`);
    const same = observed.length === expected.length && observed.every((o, i) => o === expected[i]);
    console.log(
      `self-test: ${same ? 'pass' : 'FAIL'}  ${name}: reported [${observed.join(', ')}], expected [${expected.join(', ')}]`
    );
    if (!same) ok = false;
  }
  console.error(`Auth-signup-closed guard — self-test ${ok ? 'passed' : 'FAILED'}: ${CASES.length} case(s).`);
  process.exitCode = ok ? 0 : 1;
}

function gate() {
  let text;
  try {
    text = readFileSync(path.resolve(REPO_ROOT, CONFIG), 'utf8');
  } catch (error) {
    console.error(
      `${SELF}: could not read '${CONFIG}' (${error.message}). A configuration this guard cannot read is never reported as closed.`
    );
    process.exitCode = 1;
    return;
  }
  const findings = check(text);
  for (const finding of findings) console.log(`${CONFIG}: ${describe(finding)}`);
  console.error(
    findings.length === 0
      ? `Auth-signup-closed guard — ${REQUIRED.length} key(s) hold in ${CONFIG}.`
      : `Auth-signup-closed guard — ${findings.length} of ${REQUIRED.length} key(s) do not hold in ${CONFIG}. The auth container reads the file when the stack starts: after correcting it, run \`yarn db:stop\` then \`yarn db:start\`.`
  );
  process.exitCode = findings.length === 0 ? 0 : 1;
}

const args = process.argv.slice(2);
if (args.length === 0) gate();
else if (args.length === 1 && args[0] === '--self-test') selfTest();
else {
  console.error(`${SELF}: unexpected argument(s) '${args.join(' ')}'`);
  console.error(`usage: node ${SELF} [--self-test]`);
  process.exitCode = 2;
}
