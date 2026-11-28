/**
 * The inline-policy check of the AWS account, run from the unit gate without credentials.
 *
 * `infra/scripts/check-inline-policies.sh` is run by an operator with credentials, and the lines it prints are pasted into a public record. Its collection runs here against an `aws` stub on the PATH; its judge, line formatting, error-code reading and scrub are run by sourcing the script, which then defines its functions and runs nothing, so each is fed lines the collection never produces as well.
 */

import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `infra/scripts` → repo root. */
const REPO_ROOT = resolve(HERE, '../..');

const SCRIPT_PATH = 'infra/scripts/check-inline-policies.sh';
const ACCOUNT_ID = '471112560111';
const OTHER_ACCOUNT = '111122223333';
// Built from parts so that the source holds no access-key-shaped literal.
const KEY_ID = 'AKIA' + 'IOSFODNN7EXAMPLE';
const TEMP_KEY_ID = 'ASIA' + 'IOSFODNN7EXAMPLE';

/** Sources the script and runs `snippet` in that shell, with `stdin` as its input. */
function sourced(snippet: string, stdin = ''): { status: number | null; stdout: string } {
  const result = spawnSync('bash', ['-c', `. "$1"; ${snippet}`, 'check-inline-policies-test', SCRIPT_PATH], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    input: stdin,
    env: { PATH: process.env.PATH ?? '', OPENVAA_ACCOUNT_ID: ACCOUNT_ID }
  });
  return { status: result.status, stdout: result.stdout };
}

/** The judge's exit status over the given collected lines. */
function judge(mode: 'users' | 'under', input: string): number | null {
  const lines = input === '' ? '\n' : `${input}\n`;
  return sourced(mode === 'users' ? 'evaluate users' : 'evaluate under /openvaa/', lines).status;
}

const CALLER_OK = `caller account=${ACCOUNT_ID} principal=assumed-role/openvaa-admin expected-account=${ACCOUNT_ID} match=yes`;
const CALLER_OTHER = `caller account=${OTHER_ACCOUNT} principal=assumed-role/openvaa-admin expected-account=${ACCOUNT_ID} match=no`;
const CLEAN_USERS = `users examined=2
user user-1 path=other inline=[] attached=[AdministratorAccess] groups=[] tags=[]
user openvaa-staging-smtp path=/openvaa/ inline=[] attached=[openvaa-ses-send] groups=[] tags=[Project]`;
const CLEAN = `${CALLER_OK}\n${CLEAN_USERS}`;

describe('the judge of the IAM users', () => {
  it.each([
    ['a clean set passes', 0, CLEAN],
    [
      'a user with an inline policy fails',
      1,
      `${CALLER_OK}
users examined=2
user user-1 path=other inline=[] attached=[] groups=[] tags=[]
user user-2 path=other inline=[AmazonSesSendingAccess] attached=[] groups=[] tags=[InvokedBy=SESConsole]`
    ],
    ['an account with no IAM user passes once the list was read', 0, `${CALLER_OK}\nusers examined=0`],
    ['empty input is nothing examined and fails', 1, ''],
    ['an unreadable user list fails', 1, `${CALLER_OK}\nerror users AccessDenied`],
    [
      'an unreadable inline list fails',
      1,
      `${CALLER_OK}
users examined=1
user user-1 path=other inline=error(AccessDenied) attached=[] groups=[] tags=[]`
    ],
    ['a clean set with no caller line fails', 1, CLEAN_USERS],
    ['a clean set read in another account fails', 1, `${CALLER_OTHER}\n${CLEAN_USERS}`],
    [
      'a caller line naming another account fails even when it claims a match',
      1,
      `caller account=${OTHER_ACCOUNT} principal=user expected-account=${OTHER_ACCOUNT} match=yes\n${CLEAN_USERS}`
    ],
    ['an unreadable caller fails', 1, `error caller AccessDenied\n${CLEAN_USERS}`]
  ])('%s', (_name, expected, input) => {
    expect(judge('users', input)).toBe(expected);
  });
});

describe('the judge of the roles and users under /openvaa/', () => {
  it.each([
    [
      'clean roles under the path pass',
      0,
      `${CALLER_OK}
users examined=0
role openvaa-plan path=/openvaa/ inline=[]
role openvaa-staging-deploy path=/openvaa/ inline=[]
role AWSReservedSSO_AdministratorAccess_0a1b path=/aws-reserved/sso.amazonaws.com/ inline=[Legacy]
roles examined=3`
    ],
    [
      'a role under the path with an inline policy fails',
      1,
      `${CALLER_OK}
users examined=0
role openvaa-plan path=/openvaa/ inline=[Leftover]
roles examined=1`
    ],
    [
      'a user under the path with an inline policy fails',
      1,
      `${CALLER_OK}
users examined=1
user openvaa-staging-smtp path=/openvaa/ inline=[ses] attached=[] groups=[] tags=[]
role openvaa-plan path=/openvaa/ inline=[]
roles examined=1`
    ],
    [
      'nothing under the path is nothing examined and fails',
      1,
      `${CALLER_OK}
users examined=1
user user-1 path=other inline=[] attached=[] groups=[] tags=[]
role SomeRole path=/ inline=[]
roles examined=1`
    ],
    ['empty input is nothing examined and fails', 1, ''],
    ['an unreadable role list fails', 1, `${CALLER_OK}\nusers examined=0\nerror roles AccessDenied`],
    [
      'clean roles read in another account fail',
      1,
      `${CALLER_OTHER}
users examined=0
role openvaa-plan path=/openvaa/ inline=[]
roles examined=1`
    ]
  ])('%s', (_name, expected, input) => {
    expect(judge('under', input)).toBe(expected);
  });
});

describe('the collection, against an aws stub', () => {
  let dir = '';
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'openvaa-inline-policies-test-'));
    // The caller is in the account named by the file `account`; every other call is recorded in `calls` and answers with no line.
    writeFileSync(
      join(dir, 'aws'),
      `#!/usr/bin/env bash
case "$1 $2" in
  "sts get-caller-identity") a="$(cat "${dir}/account")"; printf '%s\\t%s\\n' "$a" "arn:aws:sts::$a:assumed-role/openvaa-admin/session" ;;
  *) printf '%s %s\\n' "$1" "$2" >> "${dir}/calls" ;;
esac
`
    );
    chmodSync(join(dir, 'aws'), 0o755);
  });
  afterAll(() => {
    if (dir !== '') rmSync(dir, { recursive: true, force: true });
  });

  function assert(account: string, ...args: Array<string>): { status: number | null; calls: string } {
    writeFileSync(join(dir, 'account'), account);
    writeFileSync(join(dir, 'calls'), '');
    const result = spawnSync('bash', [SCRIPT_PATH, ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { PATH: [dir, process.env.PATH ?? ''].join(delimiter), OPENVAA_ACCOUNT_ID: ACCOUNT_ID }
    });
    return { status: result.status, calls: readFileSync(join(dir, 'calls'), 'utf8') };
  }

  it('reads no list and exits 1 when the caller is in another account', () => {
    const { status, calls } = assert(OTHER_ACCOUNT, '--assert-no-inline-under', '/openvaa/');
    expect(calls).not.toContain('list-');
    expect(status).toBe(1);
  });

  it('reads the user list in the account, and passes over no user', () => {
    const { status, calls } = assert(ACCOUNT_ID, '--assert-no-inline-user-policies');
    expect(calls).toContain('iam list-users');
    expect(status).toBe(0);
  });
});

describe('the line formatting', () => {
  const formatted = sourced(`
    tab="$(printf '\\t')"
    fmt_caller ${ACCOUNT_ID} "arn:aws:sts::${ACCOUNT_ID}:assumed-role/AWSReservedSSO_AdministratorAccess_0a1b/matti.meikalainen@example.org"
    fmt_caller ${ACCOUNT_ID} "arn:aws:sts::${ACCOUNT_ID}:assumed-role/openvaa-admin/botocore-session-1712345678"
    fmt_caller ${ACCOUNT_ID} "arn:aws:iam::${ACCOUNT_ID}:user/maija.virtanen@example.org"
    fmt_user 1 / "pekka.example@example.org" "[]" "[AdministratorAccess]" "[admins]" "$(fmt_tags "Owner\${tab}someone@example.org")"
    fmt_user 2 / "Teppo.Testaaja" "[AmazonSesSendingAccess]" "[]" "[]" "$(fmt_tags "InvokedBy\${tab}SESConsole
Contact\${tab}teppo@example.org
cost center\${tab}42")"
    fmt_user 3 /openvaa/ "openvaa-staging-smtp" "[]" "[openvaa-ses-send]" "[]" "$(fmt_tags "Project\${tab}openvaa")"
    fmt_user 5 / "media-uploader" "[s3-static-media-access]" "[]" "[]" "$(fmt_tags "${KEY_ID}\${tab}media upload key
${TEMP_KEY_ID}\${tab}session")"
    fmt_user 4 /openvaa/ "svc@example.org" "$(join_list "Inline@example.org")" "[]" "[]" "[]"
    fmt_role /openvaa/ "openvaa-plan" "[]"
  `).stdout;

  it.each([
    ['no @', '@'],
    ['no address session name', 'matti'],
    ['no plain session name', 'botocore-session'],
    ["no IAM user caller's own name", 'maija'],
    ['no user outside /openvaa/ named by address', 'pekka'],
    ['no user outside /openvaa/ named like a person', 'Teppo'],
    ['no tag value other than InvokedBy', 'someone'],
    ['no long-lived access key id', 'AKIA'],
    ['no temporary access key id', 'ASIA'],
    ["no access key's description tag value", 'media upload']
  ])('prints %s', (_name, needle) => {
    expect(formatted).not.toContain(needle);
  });

  it.each([
    ['an assumed role by its role name', 'principal=assumed-role/AWSReservedSSO_AdministratorAccess_0a1b '],
    ['an IAM user caller as the word user', 'principal=user '],
    ['a user outside /openvaa/ as user-<n>', 'user user-2 path=other inline=[AmazonSesSendingAccess]'],
    ['InvokedBy with its value, other tags by their key', 'tags=[InvokedBy=SESConsole,Contact,cost_center]'],
    ['a user under /openvaa/ by name', 'user openvaa-staging-smtp path=/openvaa/'],
    ['a name with an @ under /openvaa/ as redacted', 'user redacted path=/openvaa/ inline=[redacted]'],
    [
      'a tag keyed by an access key id as access-key-description',
      'user user-5 path=other inline=[s3-static-media-access] attached=[] groups=[] tags=[access-key-description,access-key-description]'
    ]
  ])('prints %s', (_name, needle) => {
    expect(formatted).toContain(needle);
  });

  it('fails the judge on the formatted lines, users with an inline policy among them', () => {
    expect(judge('users', `${formatted.replace(/\n$/, '')}\nusers examined=5`)).toBe(1);
  });
});

describe('the error code of a failed call', () => {
  function errCode(stderr: string): string {
    return sourced('f="$(mktemp)"; cat > "$f"; err_code_of "$f"; rm -f "$f"', `${stderr}\n`).stdout;
  }

  it('is taken from the parentheses, and the message is not passed on', () => {
    const code = errCode(
      `An error occurred (AccessDenied) when calling the ListUsers operation: User: arn:aws:sts::${ACCOUNT_ID}:assumed-role/Admin/matti@example.org is not authorized`
    );
    expect(code).toBe('AccessDenied');
    expect(code).not.toContain('matti');
  });

  it('has a code of its own for missing credentials', () => {
    expect(errCode('Unable to locate credentials. You can configure credentials elsewhere.')).toBe('NoCredentials');
  });

  it('is Unknown for an unknown failure', () => {
    expect(errCode('something else went wrong for matti@example.org')).toBe('Unknown');
  });
});

describe('the scrub, the second barrier over every printed line', () => {
  it('lets no @ and no session name through', () => {
    const scrubbed = sourced(
      'scrub',
      'caller principal=assumed-role/Admin/matti@example.org owner=a@b.example\n'
    ).stdout;
    expect(scrubbed).not.toContain('@');
    expect(scrubbed).not.toContain('matti');
  });

  it('turns every access key id into redacted-key-id', () => {
    const scrubbed = sourced(
      'scrub',
      `user user-2 path=other inline=[] attached=[] groups=[] tags=[${KEY_ID},${TEMP_KEY_ID}]\n`
    ).stdout;
    expect(scrubbed).not.toContain('IOSFODNN7EXAMPLE');
    expect(scrubbed).toContain('tags=[redacted-key-id,redacted-key-id]');
  });
});
