#!/usr/bin/env node

/**
 * HOSTED-SETTINGS PARITY GUARD.
 *
 * What it requires: the security-relevant API and auth settings of a hosted Supabase project, as the Terraform module
 * sends them, are the settings the local stack runs the test suite with, or stricter where stricter is safe. The local
 * side is `apps/supabase/supabase/config.toml`. The hosted side is `infra/modules/supabase/hosted-settings.json`, which
 * the module encodes, plus the origin and the two hook switches that each Supabase root passes to the module, read from
 * its `.tf` files and its tracked `terraform.tfvars`. A Supabase root is a directory `infra/envs/<env>/<root>` that is
 * named `supabase` or whose `.tf` files call the module. The frontend's page size, `dataAdapter.pageSize` in
 * `packages/app-shared/src/settings/staticSettings.ts`, is a third channel for one key.
 *
 * Every live key of the tables `[api]`, `[api.tls]`, `[auth]`, every `[auth.*]` and every `[functions.*]` is in exactly
 * one of four classes:
 *
 *   must agree              The hosted value equals the local one (some keys are inverted, or a list against a
 *                           comma-separated string). `max_rows` must also equal `pageSize`: three ways.
 *   hosted may be stricter  The hosted value may be stricter than the local one, never weaker.
 *   differs by design       The hosted value is different on purpose and is held to a rule instead: the site address is
 *                           each root's `public_origin`, an https origin with no path that is not a loopback host; the
 *                           redirect allow list is that origin followed by each of two fixed callback paths, each the
 *                           path suffix of a local entry, none with `**`, a trailing `*` or a `*` in the host.
 *   not compared            A local switch or port, a limit sized for the test suite, a setting inert while its
 *                           provider is off, or a setting the hosted API is not yet known to accept. Each row says why.
 *
 * A live key in no class fails, and so does a classified key that is no longer live in the file, so the table cannot go
 * stale in either direction. A hosted key that no row reads fails for the same reason.
 *
 * Two rules keep the comparison from passing on nothing. The origin rule fails when no Supabase root yields a
 * `public_origin`: a check that examined nothing does not report success. So does each root on its own: a Supabase
 * root with no `terraform.tfvars`, or whose `terraform.tfvars` assigns no `public_origin` it passes on, fails, so that
 * one good root cannot hide a skipped one. And the module sends each hook's keys only while that hook's switch is
 * true: the access-token hook's keys while a root's `enable_access_token_hook` is true, the send-email hook's keys
 * while its `enable_send_email_hook` is true, each switch on its own. So a root can switch a compared key off. The
 * value each switch takes is read from the root's call of the module the way Terraform resolves it: the call's
 * argument when it is a literal `true` or `false`; when it is `var.<switch>`, the root's `terraform.tfvars`
 * assignment, and without one the root variable's default; when the call omits the argument, the module variable's
 * default. Any other argument cannot be read and fails. A `false` written as the call's argument or in
 * `terraform.tfvars` fails unless it carries a trailing comment beginning `hook off until` and giving the reason; such
 * a root passes and is named in the census for that hook. A default of `false`, in the root or in the module, fails
 * with no exception, and so does a value that no tracked file holds. The origin is read from the same call:
 * `var.public_origin` is the root's `terraform.tfvars` assignment, and a plain string is the origin itself. A later
 * variable that can switch a compared key off must be given the same rule here: add it to the list of hook switches.
 *
 * While the send-email hook is on, the hosted auth service sends no mail of its own: the hook's function takes every
 * mail and sends none, and the application's own function sends the mails. The hosted SMTP settings and mail rate
 * limit then govern no mail the auth service sends. This guard compares neither of them.
 *
 * The comparison is worth something only while the module really sends the compared file, keeps its project protected,
 * and is the only writer of hosted settings. So the guard also requires, of the `.tf` files of the Supabase module
 * (`infra/modules/supabase`, or the directory `--module-dir` names):
 *
 *   the JSON is sent        A settings resource takes `jsonencode(local.auth)` and `jsonencode(local.api)`; what those
 *                           locals hold is evaluated by `infra/modules/supabase/tests/settings.tftest.hcl`.
 *   known keys              Every key of the JSON's `api` group is a known key of the hosted API settings, and every key
 *                           of its `auth`, `auth_hook` and `auth_send_email_hook` groups a known key of the hosted auth
 *                           settings. The lists were read from the API client that provider 1.11.0 compiles against
 *                           (`pkg/api/types.gen.go` of the Supabase CLI's `pkg/v1.2.3`) and must be read again when the
 *                           provider pin moves. The provider drops an unknown key in silence, so a misspelled key would
 *                           be compared here and never sent.
 *   one owner per key       A key the JSON owns is not written as a word in the module's code: a later map in the
 *                           `merge` would override the compared value. Each of the fifteen keys the HCL owns (the site
 *                           address, the redirect allow list, the seven rate limits and the six SMTP keys) is written in
 *                           the module's code, is absent from the JSON and is a known key; no other known key is written
 *                           there. A misspelled HCL key is then seen as the correct one going missing.
 *   nothing else merged     `local.auth` is exactly `merge(local.hosted.auth, local.auth_hook,
 *                           local.auth_send_email_hook, local.auth_rate_limits, local.auth_origin, local.auth_smtp)`, in
 *                           that order, and `local.api` is exactly `local.hosted.api`, each defined once. No other
 *                           `merge` is called, and no variable has a type that holds `map` or `any`: each of these could
 *                           bring in a key no word of the code names, and so set a compared key with the comparison
 *                           still green.
 *   the project protected   `main.tf` holds a `supabase_project` resource, and every such block, read by counting
 *                           braces, holds a `lifecycle` block with `prevent_destroy = true` and an `ignore_changes` list
 *                           naming `database_password`.
 *   one writer              The CLI's command that pushes the local configuration to a hosted project appears in no
 *                           tracked file under `.github/workflows/`, `infra/`, `scripts/`, `apps/supabase/` or
 *                           `tests/scripts/`, and in no tracked `package.json`. It is matched however it is spelled:
 *                           with a version pin such as `@latest` on the CLI's name, with flags before or after its
 *                           middle word, split across a line continuation, or as the words of an array. This guard's
 *                           source and its fixture directory are excluded by path; the source builds the command from
 *                           its words, so it does not hold the command whole.
 *
 * The module's code is its `.tf` text with comments removed and strings kept, so a key named in a comment counts as
 * neither present nor misplaced, and a key quoted as a map key counts as written.
 *
 * What this guard cannot see: a provider or setting that exists only on the hosted side and is in neither file (for
 * example a social login switched on in the dashboard), and what a hosted project actually serves. It compares the
 * declared files; an applied project is observed by other means.
 *
 * How it reads (Node built-ins only, no TOML or HCL parser): `config.toml` by lines, through
 * `scripts/lib/config-toml.mjs`. A table header is first written in its plain form, spaces around its dots and the
 * quotes around a quoted bare key removed; a header that still cannot be read is a finding wherever it stands, and the
 * keys under it count as unclassified. A value is read only when its form can be read exactly: a bare boolean, an
 * integer, a double-quoted string without `#` or `\`, or a one-line array that `JSON.parse` accepts. Any other form,
 * and a key written twice in one table, is a finding. The hosted settings are parsed as JSON. `pageSize` is a line
 * read inside the `dataAdapter` block, through `scripts/lib/static-settings.mjs`, each `terraform.tfvars` is a line read through
 * `scripts/lib/tfvars.mjs`, and every variable default is a line read. The `.tf`
 * files of the module and of each root are read as text through `scripts/lib/hcl-text.mjs`: comments are removed
 * outside double-quoted strings, blocks are found by counting braces outside strings, and a module call's arguments are
 * the lines written directly in its block; heredoc strings are not recognised. The files scanned for a second writer
 * are those `git ls-files` lists, so an untracked file is never a finding. A channel that cannot be read withholds the
 * verdict.
 *
 * Usage:
 *   node scripts/assert-hosted-settings-parity.mjs                      # gate over the repository's files
 *   node scripts/assert-hosted-settings-parity.mjs [--config <file>] [--settings <file>]
 *                                                  [--static-settings <file>] [--envs-dir <dir>]
 *                                                  [--module-dir <dir>]
 *     each flag replaces one input of the gate; a path is resolved against the working directory. `--module-dir`
 *     replaces the module directory for every check that reads its `.tf` files, `variables.tf` included
 *
 * Findings go to stdout as `<file>: <table>/<key>: <what and why>`; the summary and the census go to stderr.
 *
 * Exit codes:
 *   0 - every key holds
 *   1 - at least one finding, or a channel could not be read
 *   2 - usage error
 */

import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { plainHeaders, readConfig, UNREADABLE_TABLE } from './lib/config-toml.mjs';
import { asWord, blocks, blocksAt, callArguments, hclCode, lineAt, topLevelArguments } from './lib/hcl-text.mjs';
import { readPageSize } from './lib/static-settings.mjs';
import { trackedFiles } from './lib/text-guard.mjs';
import { readTfvarsBool, readTfvarsString } from './lib/tfvars.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-hosted-settings-parity.mjs';
const DEFAULT_PATHS = {
  config: 'apps/supabase/supabase/config.toml',
  settings: 'infra/modules/supabase/hosted-settings.json',
  staticSettings: 'packages/app-shared/src/settings/staticSettings.ts',
  envsDir: 'infra/envs',
  moduleDir: 'infra/modules/supabase'
};

const CLASS_NAMES = {
  agree: 'must agree',
  stricter: 'hosted may be stricter',
  design: 'differs by design',
  none: 'not compared'
};

// ── The classification table ──
// One row per local key: its class, the hosted group and key where there is one, the comparison, and a `why` that a
// finding prints. Comparisons: `same`, `inverted`, `set` (a local list against a comma-separated hosted string, as a
// set), `list` (the same, in order), `maxRows` (three ways), `atMost`, `atLeast`, `durationAtLeast`, `requirements`,
// `origin` and `redirects`.

const agree = (table, key, group, hostedKey, compare, why) => ({
  table,
  key,
  cls: 'agree',
  hosted: [group, hostedKey],
  compare,
  why
});
const stricter = (table, key, hostedKey, compare, why) => ({
  table,
  key,
  cls: 'stricter',
  hosted: ['auth', hostedKey],
  compare,
  why
});
const none = (table, keys, why) => keys.map((key) => ({ table, key, cls: 'none', why }));

/** Why a function's gateway setting is not compared: the CLI deploys it from config.toml itself. */
const DEPLOYED_FROM_THIS_FILE =
  "the CLI's function deploy reads this setting from this file, so the deployed value cannot drift from it; the conformance probe compares the value the project serves";

const ROWS = [
  // must agree
  agree('api', 'schemas', 'api', 'db_schema', 'set', 'every exposed schema is an API surface'),
  agree(
    'api',
    'extra_search_path',
    'api',
    'db_extra_search_path',
    'list',
    'the search path decides which function or table an unqualified name resolves to'
  ),
  agree(
    'api',
    'max_rows',
    'api',
    'max_rows',
    'maxRows',
    'the frontend reads each collection in one request and does not paginate, so a smaller cap truncates a response without an error'
  ),
  agree(
    'auth',
    'enable_refresh_token_rotation',
    'auth',
    'refresh_token_rotation_enabled',
    'same',
    'without rotation a stolen refresh token stays usable'
  ),
  agree(
    'auth',
    'refresh_token_reuse_interval',
    'auth',
    'security_refresh_token_reuse_interval',
    'same',
    'the server-side session refresh is tested at this interval'
  ),
  agree(
    'auth',
    'enable_signup',
    'auth',
    'disable_signup',
    'inverted',
    'public sign-up must be closed: users are created by the service role only'
  ),
  agree(
    'auth',
    'enable_anonymous_sign_ins',
    'auth',
    'external_anonymous_users_enabled',
    'same',
    'an anonymous sign-in creates a user without an address'
  ),
  agree(
    'auth',
    'enable_manual_linking',
    'auth',
    'security_manual_linking_enabled',
    'same',
    'manual linking lets a signed-in user attach another identity'
  ),
  agree(
    'auth.email',
    'enable_signup',
    'auth',
    'external_email_enabled',
    'same',
    'this key switches the email provider, and password sign-in and recovery depend on it'
  ),
  agree(
    'auth.email',
    'double_confirm_changes',
    'auth',
    'mailer_secure_email_change_enabled',
    'same',
    'an address change must be confirmed from the old address as well as the new; the address confirmation of an identity-provider account relies on it'
  ),
  agree(
    'auth.email',
    'enable_confirmations',
    'auth',
    'mailer_autoconfirm',
    'inverted',
    'an address counts as confirmed only after a mailed link is opened or the service role vouches for it'
  ),
  agree(
    'auth.email',
    'secure_password_change',
    'auth',
    'security_update_password_require_reauthentication',
    'same',
    'a different value changes a password flow the test suite does not cover'
  ),
  agree(
    'auth.email',
    'otp_length',
    'auth',
    'mailer_otp_length',
    'same',
    'every mailed link also mints a one-time code for its address, accepted in its place, so a shorter hosted code can be guessed'
  ),
  agree('auth.sms', 'enable_signup', 'auth', 'external_phone_enabled', 'same', 'the phone provider must stay off'),
  agree(
    'auth.hook.custom_access_token',
    'enabled',
    'auth_hook',
    'hook_custom_access_token_enabled',
    'same',
    "the access-token hook puts the claims the database's row-level security reads into every token"
  ),
  agree(
    'auth.hook.custom_access_token',
    'uri',
    'auth_hook',
    'hook_custom_access_token_uri',
    'same',
    'the hook must be the database function the claims come from'
  ),
  agree(
    'auth.hook.send_email',
    'enabled',
    'auth_send_email_hook',
    'hook_send_email_enabled',
    'same',
    'the send-email hook keeps the auth service from sending mail of its own; the application sends its mails itself'
  ),
  agree(
    'auth.hook.send_email',
    'uri',
    'auth_send_email_hook',
    'hook_send_email_uri',
    'same',
    'the hook must be the database function that takes every mail and sends none'
  ),
  agree(
    'auth.mfa.totp',
    'enroll_enabled',
    'auth',
    'mfa_totp_enroll_enabled',
    'same',
    'a factor switched on changes the sign-in surface'
  ),
  agree(
    'auth.mfa.totp',
    'verify_enabled',
    'auth',
    'mfa_totp_verify_enabled',
    'same',
    'a factor switched on changes the sign-in surface'
  ),
  agree(
    'auth.mfa.phone',
    'enroll_enabled',
    'auth',
    'mfa_phone_enroll_enabled',
    'same',
    'a factor switched on changes the sign-in surface'
  ),
  agree(
    'auth.mfa.phone',
    'verify_enabled',
    'auth',
    'mfa_phone_verify_enabled',
    'same',
    'a factor switched on changes the sign-in surface'
  ),
  agree(
    'auth.external.apple',
    'enabled',
    'auth',
    'external_apple_enabled',
    'same',
    'a social provider switched on is a sign-in path the test suite does not cover'
  ),
  agree(
    'auth.web3.solana',
    'enabled',
    'auth',
    'external_web3_solana_enabled',
    'same',
    'a wallet sign-in switched on is a sign-in path the test suite does not cover'
  ),
  // hosted may be stricter
  stricter(
    'auth',
    'jwt_expiry',
    'jwt_exp',
    'atMost',
    'an access token is a bearer credential; a hosted lifetime longer than the tested one widens what a stolen token can do'
  ),
  stricter(
    'auth',
    'minimum_password_length',
    'password_min_length',
    'atLeast',
    'a shorter hosted minimum lets a direct call to the auth service set a password the screens would refuse'
  ),
  stricter(
    'auth.email',
    'otp_expiry',
    'mailer_otp_exp',
    'atMost',
    'a mailed sign-in or recovery link is a bearer credential, and this bounds how long one can be used'
  ),
  stricter(
    'auth.email',
    'max_frequency',
    'smtp_max_frequency',
    'durationAtLeast',
    'a shorter hosted interval lets a caller have mail sent to an address more often'
  ),
  stricter(
    'auth',
    'password_requirements',
    'password_required_characters',
    'requirements',
    'hosted password composition rules may only add to the local ones'
  ),
  // differs by design
  {
    table: 'auth',
    key: 'site_url',
    cls: 'design',
    compare: 'origin',
    why: "the hosted site address is each root's public origin: https, no path, not a loopback host"
  },
  {
    table: 'auth',
    key: 'additional_redirect_urls',
    cls: 'design',
    compare: 'redirects',
    why: 'the hosted redirect allow list is the origin followed by two fixed callback paths; a wildcard there turns a closed redirect boundary into an open one'
  },
  // not compared
  ...none('api', ['enabled', 'port'], 'a local service switch and port'),
  ...none('api.tls', ['enabled'], 'local TLS only'),
  ...none('auth', ['enabled'], 'a local service switch'),
  ...none(
    'auth.rate_limit',
    ['email_sent', 'sms_sent', 'anonymous_users', 'token_refresh', 'sign_in_sign_ups', 'token_verifications', 'web3'],
    "local limits serve a test suite on one address; hosted limits are set in the module's auth_rate_limits variable"
  ),
  ...none('auth.sms', ['enable_confirmations', 'template', 'max_frequency'], 'inert while the phone provider is off'),
  ...none(
    'auth.sms.twilio',
    ['enabled', 'account_sid', 'message_service_sid', 'auth_token'],
    'inert while the phone provider is off'
  ),
  ...none('auth.mfa', ['max_enrolled_factors'], 'inert while every factor is off'),
  ...none('auth.mfa.phone', ['otp_length', 'template', 'max_frequency'], 'inert while the phone factor is off'),
  ...none(
    'auth.external.apple',
    ['client_id', 'secret', 'redirect_uri', 'url', 'skip_nonce_check', 'email_optional'],
    'inert while the provider is disabled'
  ),
  ...none('auth.third_party.firebase', ['enabled'], 'third-party auth is a separate API and a separate resource'),
  ...none('auth.third_party.auth0', ['enabled'], 'third-party auth is a separate API and a separate resource'),
  ...none('auth.third_party.aws_cognito', ['enabled'], 'third-party auth is a separate API and a separate resource'),
  ...none('auth.third_party.clerk', ['enabled'], 'third-party auth is a separate API and a separate resource'),
  ...none(
    'auth.oauth_server',
    ['enabled', 'allow_dynamic_registration'],
    'the hosted API refused an auth update holding these two keys without authorization_url_path on 2026-10-22, so the module does not send them'
  ),
  ...none(
    'auth.oauth_server',
    ['authorization_url_path'],
    'the hosted settings of a new project do not hold this key, and whether the hosted API accepts it has not been observed'
  ),
  ...none('functions.identity-callback', ['verify_jwt'], DEPLOYED_FROM_THIS_FILE),
  ...none('functions.account-access', ['verify_jwt'], DEPLOYED_FROM_THIS_FILE)
];

/** Local redirect entries that have no hosted counterpart, each with the reason. */
const LOCAL_ONLY_REDIRECTS = [
  { entry: 'https://127.0.0.1:3000', why: "the CLI template's default; no app here serves it" }
];

/** How many callback paths the hosted allow list is built from. */
const REDIRECT_PATH_COUNT = 2;

/** The trailing comment that lets a root switch a hook off. */
const HOOK_OFF_REASON = /^hook off until\s+\S/;

/**
 * The variables by which a root can switch a compared key off: each hook's switch, the local key it turns off, and the
 * name the census uses. Each is held to the same rule.
 */
export const HOOK_SWITCHES = [
  { variable: 'enable_access_token_hook', id: 'auth.hook.custom_access_token/enabled', label: 'access-token hook' },
  { variable: 'enable_send_email_hook', id: 'auth.hook.send_email/enabled', label: 'send-email hook' }
];

// ── The structure the comparison rests on ──

/**
 * The known keys of the hosted settings, per settings attribute of the provider. Read from the request bodies
 * `V1UpdatePostgrestConfigBody` and `UpdateAuthConfigBody` of the API client that provider 1.11.0 compiles against;
 * the auth list holds the keys this module can use, not all 234. Read them again when the provider pin moves.
 */
const KNOWN_HOSTED_KEYS = {
  api: ['db_schema', 'db_extra_search_path', 'max_rows', 'db_pool'],
  auth: [
    'site_url',
    'uri_allow_list',
    'disable_signup',
    'mailer_autoconfirm',
    'external_email_enabled',
    'external_phone_enabled',
    'external_anonymous_users_enabled',
    'security_manual_linking_enabled',
    'jwt_exp',
    'refresh_token_rotation_enabled',
    'security_refresh_token_reuse_interval',
    'password_min_length',
    'password_required_characters',
    'mailer_secure_email_change_enabled',
    'security_update_password_require_reauthentication',
    'mailer_otp_length',
    'mailer_otp_exp',
    'smtp_max_frequency',
    'hook_custom_access_token_enabled',
    'hook_custom_access_token_uri',
    'hook_send_email_enabled',
    'hook_send_email_uri',
    'rate_limit_email_sent',
    'rate_limit_sms_sent',
    'rate_limit_anonymous_users',
    'rate_limit_token_refresh',
    'rate_limit_otp',
    'rate_limit_verify',
    'rate_limit_web3',
    'mfa_totp_enroll_enabled',
    'mfa_totp_verify_enabled',
    'mfa_phone_enroll_enabled',
    'mfa_phone_verify_enabled',
    'mfa_max_enrolled_factors',
    'external_apple_enabled',
    'external_web3_solana_enabled',
    'oauth_server_enabled',
    'oauth_server_allow_dynamic_registration',
    'oauth_server_authorization_path',
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_pass',
    'smtp_admin_email',
    'smtp_sender_name',
    'security_sb_forwarded_for_enabled'
  ]
};

/** The settings attribute each group of keys in the JSON is sent through. */
const GROUP_ATTRIBUTE = { api: 'api', auth: 'auth', auth_hook: 'auth', auth_send_email_hook: 'auth' };

/** The groups of the JSON that are not settings keys but the input of a rule. */
const RULE_GROUPS = ['redirect_callback_paths'];

/** The keys the HCL owns, because their values depend on the environment: fifteen, each sent from the module's code. */
const HCL_OWNED_KEYS = [
  'site_url',
  'uri_allow_list',
  'rate_limit_email_sent',
  'rate_limit_sms_sent',
  'rate_limit_anonymous_users',
  'rate_limit_token_refresh',
  'rate_limit_otp',
  'rate_limit_verify',
  'rate_limit_web3',
  'smtp_host',
  'smtp_port',
  'smtp_user',
  'smtp_admin_email',
  'smtp_sender_name',
  'smtp_pass'
];

/** The maps `local.auth` merges, in order: the JSON's auth group, the two hook groups, then the four the HCL builds. */
const AUTH_MERGE = [
  'local.hosted.auth',
  'local.auth_hook',
  'local.auth_send_email_hook',
  'local.auth_rate_limits',
  'local.auth_origin',
  'local.auth_smtp'
];

/** What `local.api` is: the JSON's api group and nothing else. */
const API_VALUE = 'local.hosted.api';

/** The words of the CLI's command that would be a second writer of hosted settings; never held whole in this file. */
const PUSH_WORDS = ['supabase', 'config', 'push'];
/** What may stand between two words: blanks, line continuations, and the quotes, commas and brackets of an array. */
const PUSH_GAP = '[\\s\\\\"\',\\[\\]]+';
/** A flag between two words, such as a global `--debug` or `--workdir <dir>`, with its value if it takes one. */
const PUSH_FLAG = `--?[A-Za-z][\\w-]*(?:=[^\\s"',\\]]*|${PUSH_GAP}(?!-)[^\\s"',\\]]+)?`;
/**
 * The command, however it is spelled: the CLI name with an optional `@<version>` (as `npx` and `bunx` run it), then the
 * two words, with any number of flags in either gap.
 */
const PUSH_COMMAND = new RegExp(
  `\\b${PUSH_WORDS[0]}(?:@[^\\s"',\\]]+)?(?:${PUSH_GAP}${PUSH_FLAG})*${PUSH_GAP}${PUSH_WORDS[1]}(?:${PUSH_GAP}${PUSH_FLAG})*${PUSH_GAP}${PUSH_WORDS[2]}\\b`,
  'g'
);

/** The tracked files scanned for a second writer, and the paths of this guard excluded from the scan. */
const WRITER_DIRS = ['.github/workflows/', 'infra/', 'scripts/', 'apps/supabase/', 'tests/scripts/'];
const WRITER_SELF_PATHS = [SELF, 'scripts/fixtures/hosted-settings-parity/'];
const writerInScope = (file) =>
  (WRITER_DIRS.some((d) => file.startsWith(d)) || file === 'package.json' || file.endsWith('/package.json')) &&
  !WRITER_SELF_PATHS.some((p) => file.startsWith(p));

// ── Gate ──

/** Read every channel from `paths`, run `check` over them, print the findings and the census, and set the exit code. */
function gate(paths) {
  const envsDir = paths.envsDir;
  const { roots, error } = readRoots(envsDir);
  const { writers, error: writersError } = readWriters();
  const inputs = {
    config: readChannel(paths.config),
    settings: readChannel(paths.settings),
    staticSettings: readChannel(paths.staticSettings),
    variables: readChannel(path.join(paths.moduleDir, 'variables.tf')),
    module: readModule(paths.moduleDir),
    writers,
    writersError,
    envsDir: display(envsDir),
    roots,
    rootsError: error
  };
  const result = check(inputs);
  if (result.channelErrors.length > 0) {
    for (const { file, what } of result.channelErrors) console.log(`${file}: ${what}`);
    console.error(
      `Hosted-settings parity guard — a channel could not be read, so no comparison was made and the verdict is withheld.`
    );
    process.exitCode = 1;
    return;
  }
  for (const { file, id, what } of result.findings) console.log(`${file}: ${id}: ${what}`);
  console.error(censusLine(result.census));
  console.error(`max_rows compared three ways: config.toml ${show(result.census.maxRows)}.`);
  const { structure } = result.census;
  console.error(
    `structure: ${structure.files} .tf file(s) of ${structure.dir}; ` +
      `${HCL_OWNED_KEYS.length} HCL-owned key(s); ${structure.writersScanned} tracked file(s) scanned for a second writer of hosted settings.`
  );
  console.error(
    result.findings.length === 0
      ? `Hosted-settings parity guard — every classified key holds between ${inputs.config.file}, ${inputs.settings.file} and the Supabase roots under ${inputs.envsDir}.`
      : `Hosted-settings parity guard — ${result.findings.length} finding(s).`
  );
  process.exitCode = result.findings.length === 0 ? 0 : 1;
}

/**
 * The Supabase roots under the environments directory, in name order: every directory `<env>/<root>` that is named
 * `supabase` or whose `.tf` files call the Supabase module. A root without a `terraform.tfvars` is kept, marked
 * missing, so that the check reports it rather than skipping it.
 */
function readRoots(envsDir) {
  let entries;
  try {
    entries = readdirSync(envsDir, { withFileTypes: true });
  } catch (error) {
    return { roots: [], error: `could not be read as a directory (${error.code ?? error.message})` };
  }
  function byName(a, b) {
    return a.name.localeCompare(b.name);
  }
  const roots = [];
  for (const env of entries.filter((e) => e.isDirectory()).sort(byName)) {
    let children;
    try {
      children = readdirSync(path.join(envsDir, env.name), { withFileTypes: true });
    } catch (error) {
      return { roots, error: `${env.name} could not be read as a directory (${error.code ?? error.message})` };
    }
    for (const child of children.filter((e) => e.isDirectory() && e.name !== '.terraform').sort(byName)) {
      const dir = path.join(envsDir, env.name, child.name);
      const tf = readTfFiles(dir);
      const callsModule = supabaseCalls(tf.filter((f) => typeof f.text === 'string')).length > 0;
      if (child.name !== 'supabase' && !callsModule) continue;
      const file = path.join(dir, 'terraform.tfvars');
      let exists = false;
      try {
        exists = statSync(file).isFile();
      } catch {
        exists = false;
      }
      roots.push({
        name: child.name === 'supabase' ? env.name : `${env.name}/${child.name}`,
        dir: display(dir),
        tfvars: exists ? readChannel(file) : { file: display(file), text: '', missing: true },
        tf
      });
    }
  }
  return { roots, error: null };
}

/** The `.tf` files of one directory, one level deep, sorted by name. */
function readTfFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.tf'))
    .map((e) => e.name)
    .sort()
    .map((name) => readChannel(path.join(dir, name)));
}

/** The tracked files in the scope of the second-writer scan. A file listed but absent from the tree holds nothing. */
function readWriters() {
  let tracked;
  try {
    tracked = trackedFiles({ skip: (file) => !writerInScope(file) });
  } catch (error) {
    return { writers: [], error: `could not list the tracked files (${error.message.split('\n')[0]})` };
  }
  const writers = [];
  for (const file of tracked) {
    try {
      writers.push({ file, text: readFileSync(path.join(REPO_ROOT, file), 'utf8') });
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') continue;
      return { writers, error: `${file} could not be read (${error.code ?? error.message})` };
    }
  }
  return { writers, error: null };
}

/** One input file as `{ file, text }`, or with `text` null and an `error` when it cannot be read. */
function readChannel(absolute) {
  try {
    return { file: display(absolute), text: readFileSync(absolute, 'utf8') };
  } catch (error) {
    return { file: display(absolute), text: null, error: `could not be read (${error.code ?? error.message})` };
  }
}

/** The module's `.tf` files, one level deep, by name. */
function readModule(moduleDir) {
  try {
    return { dir: display(moduleDir), files: readTfFiles(moduleDir), error: null };
  } catch (error) {
    return {
      dir: display(moduleDir),
      files: [],
      error: `could not be read as a directory (${error.code ?? error.message})`
    };
  }
}

/** A path as printed: relative to the repository when inside it, absolute otherwise. */
function display(absolute) {
  const relative = path.relative(REPO_ROOT, absolute);
  return relative.startsWith('..') || path.isAbsolute(relative) ? absolute : relative;
}

// ── Checking ──

/**
 * The findings for one set of inputs.
 *
 * @param inputs - `config`, `settings`, `staticSettings` and `variables` as `{ file, text }`, `envsDir` as a display
 *   name, `roots` as `[{ name, dir, tfvars: { file, text }, tf: [{ file, text }] }]`, one per Supabase root with its
 *   variable file and its `.tf` files, `module` as
 *   `{ dir, files: [{ file, text }], error }`, the module's `.tf` files, and `writers` as `[{ file, text }]`, the files
 *   scanned for a second writer (any outside the scope are skipped).
 * @returns `channelErrors` (when not empty, no comparison was made), `findings` as `{ file, id, what }`, and `census`.
 */
export function check(inputs) {
  const channelErrors = [];
  for (const channel of ['config', 'settings', 'staticSettings', 'variables'])
    if (typeof inputs[channel].text !== 'string')
      channelErrors.push({ file: inputs[channel].file, what: inputs[channel].error ?? 'could not be read' });
  for (const root of inputs.roots)
    for (const channel of root.tfvars.missing ? root.tf : [root.tfvars, ...root.tf])
      if (typeof channel.text !== 'string')
        channelErrors.push({ file: channel.file, what: channel.error ?? 'could not be read' });
  if (inputs.rootsError) channelErrors.push({ file: inputs.envsDir, what: inputs.rootsError });
  if (inputs.module.error) channelErrors.push({ file: inputs.module.dir, what: inputs.module.error });
  else if (inputs.module.files.length === 0) channelErrors.push({ file: inputs.module.dir, what: 'holds no .tf file' });
  for (const file of inputs.module.files)
    if (typeof file.text !== 'string') channelErrors.push({ file: file.file, what: file.error ?? 'could not be read' });
  if (inputs.writersError) channelErrors.push({ file: 'git ls-files', what: inputs.writersError });
  let settings;
  if (channelErrors.length === 0) {
    try {
      settings = JSON.parse(inputs.settings.text);
    } catch (error) {
      channelErrors.push({ file: inputs.settings.file, what: `is not JSON (${error.message})` });
    }
    if (settings !== undefined && (settings === null || typeof settings !== 'object' || Array.isArray(settings)))
      channelErrors.push({ file: inputs.settings.file, what: 'is not a JSON object' });
  }
  if (channelErrors.length > 0) return { channelErrors, findings: [], census: null };

  const findings = [];
  const report = (file, id, what) => {
    const same = findings.find((f) => f.file === file && f.id === id);
    if (same) same.what += `; ${what}`;
    else findings.push({ file, id, what });
  };
  const CONFIG = inputs.config.file;
  const SETTINGS = inputs.settings.file;

  // The local keys: every live key classified, every classified key live.
  const { keys, problems, live } = readFamilyConfig(inputs.config.text);
  for (const p of problems) report(CONFIG, p.id, p.what);
  const rowsById = new Map(ROWS.map((r) => [`${r.table}/${r.key}`, r]));
  const counts = { agree: 0, stricter: 0, design: 0, none: 0, unclassified: 0 };
  for (const id of live) {
    const row = rowsById.get(id);
    if (row) counts[row.cls] += 1;
    else {
      counts.unclassified += 1;
      report(
        CONFIG,
        id,
        'the live key is in no class of this guard; classify it, with its reason, before it can be relied on or ignored'
      );
    }
  }
  for (const [id, row] of rowsById)
    if (!live.has(id))
      report(
        CONFIG,
        id,
        `the key is classified as '${CLASS_NAMES[row.cls]}' but is not live in the file; remove or correct its row`
      );

  // The hosted keys: every key read by a row, every key a row reads present.
  const read = new Set(ROWS.filter((r) => r.hosted).map((r) => r.hosted.join('.')));
  for (const [group, value] of Object.entries(settings)) {
    if (group === 'redirect_callback_paths') continue;
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      report(SETTINGS, `hosted/${group}`, 'the group is not an object of settings');
      continue;
    }
    for (const key of Object.keys(value))
      if (!read.has(`${group}.${key}`))
        report(
          SETTINGS,
          `hosted/${group}.${key}`,
          'no row of this guard compares the hosted key; classify the local key it belongs to'
        );
  }

  const pageSize = readPageSize(inputs.staticSettings.text);
  if (!pageSize.ok) report(inputs.staticSettings.file, 'api/max_rows', pageSize.what);

  // The roots: the origin and the hook switches of each call of the module, each read the way Terraform resolves it.
  const origins = [];
  const hookOff = Object.fromEntries(HOOK_SWITCHES.map((h) => [h.variable, []]));
  for (const root of inputs.roots) {
    if (root.tfvars.missing) {
      report(
        root.tfvars.file,
        'root/terraform.tfvars',
        `${root.name} is a Supabase root with no terraform.tfvars, so the origin and the hook switches it sends are in no tracked file and none of them is checked`
      );
      continue;
    }
    const vars = readRootVariables(root.tfvars.text);
    for (const p of vars.problems) report(root.tfvars.file, p.id, p.what);
    const calls = supabaseCalls(root.tf);
    if (calls.length === 0) {
      report(
        root.dir,
        'root/module-call',
        `${root.name} holds no module block whose source ends in modules/supabase, so what the root sends cannot be traced`
      );
      continue;
    }
    for (const call of calls) {
      const where = calls.length === 1 ? root.name : `${root.name} (module.${call.label})`;
      const origin = resolveOrigin({ call, where, root, tfvarsOrigin: vars.origin });
      if (origin.finding) report(origin.finding.file, 'auth/site_url', origin.finding.what);
      else origins.push({ root: where, ...origin.origin });
      for (const { variable, id } of HOOK_SWITCHES) {
        const value = resolveSwitch({
          variable,
          call,
          where,
          root,
          tfvarsHook: vars.hooks[variable],
          moduleVariables: inputs.variables
        });
        if (value.finding) report(value.finding.file, id, value.finding.what);
        else if (value.off) {
          if (HOOK_OFF_REASON.test(value.off.comment)) hookOff[variable].push(where);
          else
            report(
              value.off.file,
              id,
              `${variable} = false switches the compared hook keys off for ${where}; it needs a trailing comment '# hook off until <reason>'`
            );
        }
      }
    }
  }
  if (origins.length === 0)
    report(
      inputs.envsDir,
      'auth/site_url',
      'no Supabase root under this directory yields a public_origin, so the origin rule examined nothing; a check that examined nothing does not report success'
    );
  for (const { file, origin } of origins)
    for (const problem of originProblems(origin))
      report(file, 'auth/site_url', `${problem} — ${rowsById.get('auth/site_url').why}`);

  // The rows.
  for (const row of ROWS) {
    const id = `${row.table}/${row.key}`;
    if (row.cls === 'none' || !keys.has(id)) continue;
    const local = keys.get(id);
    if (row.compare === 'origin') continue;
    if (row.compare === 'redirects') {
      const problemsHere = redirectProblems(
        local,
        settings.redirect_callback_paths,
        origins.map((o) => o.origin)
      );
      if (problemsHere.length > 0) report(SETTINGS, id, `${problemsHere.join('; ')} — ${row.why}`);
      continue;
    }
    const [group, key] = row.hosted;
    const groupValue = settings[group];
    if (groupValue === null || typeof groupValue !== 'object' || !(key in groupValue)) {
      report(SETTINGS, id, `the hosted settings hold no ${group}.${key} — ${row.why}`);
      continue;
    }
    if (row.compare === 'maxRows' && !pageSize.ok) continue;
    const problem = compareRow(row, local, groupValue[key], pageSize.ok ? pageSize.value : undefined);
    if (problem === null) continue;
    let file = SETTINGS;
    if (row.compare === 'maxRows') {
      const hosted = groupValue[key];
      if (hosted === pageSize.value && local !== hosted) file = CONFIG;
      else if (local === hosted) file = inputs.staticSettings.file;
    }
    report(file, id, `${problem} — ${row.why}`);
  }

  // The structure: the module encodes the JSON, each key has one owner, the project keeps its protections, no second
  // writer exists.
  const structure = checkModule(inputs.module, settings, SETTINGS, report);
  const writersScanned = checkWriters(inputs.writers, report);

  const census = {
    live: live.size,
    counts,
    origins: origins.length,
    roots: inputs.roots.length,
    hookOff,
    maxRows: keys.get('api/max_rows'),
    structure: { ...structure, dir: inputs.module.dir, writersScanned }
  };
  return { channelErrors: [], findings, census };
}

// ── Reading ──

/** Whether a table belongs to the families this guard classifies. `UNREADABLE_TABLE`, the table the keys after a header the line read cannot read are attributed to, counts as in the family. */
function inFamily(table) {
  return (
    table === UNREADABLE_TABLE ||
    table === 'api' ||
    table === 'api.tls' ||
    table === 'auth' ||
    table.startsWith('auth.') ||
    table.startsWith('functions.')
  );
}

/**
 * Every live key of the classified table families, read by `readConfig` after each table header is written in its
 * plain form. A header that still cannot be read is a finding wherever it stands, and the keys under it are attributed
 * to a table that is in the family, so that each fails as unclassified.
 *
 * @param text - The configuration text.
 * @returns `keys`, `problems` and `live`, as `readConfig` returns them.
 */
function readFamilyConfig(text) {
  const plain = plainHeaders(text);
  const headerProblems = plain.unreadable.map(({ line, index }) => ({
    id: 'config/table-header',
    what: `line ${index + 1}: the table header '${line.trim()}' cannot be read, so the keys under it cannot be classified`
  }));
  const { keys, problems, live } = readConfig(plain.text, { inTables: inFamily });
  return { keys, problems: [...headerProblems, ...problems], live };
}

/**
 * The default of one boolean variable, read from the first of `files` that declares it.
 *
 * @param files - `[{ file, text }]`, the `.tf` files of a module or a root.
 * @returns `{ declared: false }`; or `{ declared: true, file, ok: true, value }`, where `value` is `true`, `false` or
 *   `null` for no default; or `{ declared: true, file, ok: false, what }`.
 */
function readBoolDefault(files, variable) {
  for (const { file, text } of files) {
    const lines = text.split('\n');
    const start = lines.findIndex((l) => new RegExp(`^\\s*variable\\s+"?${variable}"?\\s*\\{`).test(l));
    if (start === -1) continue;
    const values = [];
    for (let i = start + 1; i < lines.length && !/^\}/.test(lines[i]); i += 1) {
      const m = /^\s*default\s*=\s*(\S+)\s*(?:#.*)?$/.exec(lines[i]);
      if (m) values.push(m[1]);
    }
    if (values.length === 0) return { declared: true, file, ok: true, value: null };
    if (values.length > 1)
      return { declared: true, file, ok: false, what: `the variable ${variable} has ${values.length} default lines` };
    if (values[0] !== 'true' && values[0] !== 'false')
      return { declared: true, file, ok: false, what: `the default ${values[0]} of ${variable} is not a bare boolean` };
    return { declared: true, file, ok: true, value: values[0] === 'true' };
  }
  return { declared: false };
}

/**
 * `public_origin` and each hook switch of one root's variable file, by the line reads of `scripts/lib/tfvars.mjs`.
 *
 * @returns `origin` (a string or null), `hooks` (per switch variable, `{ value, comment }` or null) and `problems`.
 */
function readRootVariables(text) {
  const problems = [];
  const origin = readTfvarsString(text, 'public_origin');
  if (!origin.ok) problems.push({ id: 'auth/site_url', what: origin.what });
  const hooks = {};
  for (const { variable, id } of HOOK_SWITCHES) {
    const hook = readTfvarsBool(text, variable);
    if (!hook.ok) problems.push({ id, what: hook.what });
    hooks[variable] = hook.ok && hook.value !== null ? { value: hook.value, comment: hook.comment } : null;
  }
  return { origin: origin.ok ? origin.value : null, hooks, problems };
}

/** A module source that names the Supabase module. */
const SUPABASE_MODULE_SOURCE = /(?:^|\/)modules\/supabase\/?$/;

/**
 * The calls of the Supabase module in one root's `.tf` files: every `module` block whose `source` ends in
 * `modules/supabase`, with its arguments. Each argument carries the trailing comment of its line in the file as
 * written, since the code it is read from has its comments removed.
 *
 * @param tfFiles - `[{ file, text }]`.
 * @returns `[{ file, label, args: [{ name, value, line, comment }] }]`.
 */
function supabaseCalls(tfFiles) {
  const calls = [];
  for (const { file, text } of tfFiles) {
    const raw = text.split('\n');
    const code = hclCode(text);
    for (const { match, open, body } of blocksAt(code, '(?<![A-Za-z0-9_.])module\\s+"?([A-Za-z0-9_-]+)"?\\s*\\{')) {
      if (body === null) continue;
      const args = topLevelArguments(body, lineAt(code, open)).map((a) => {
        const after = raw[a.line - 1].slice(raw[a.line - 1].indexOf('=') + 1);
        return { ...a, comment: /(?:#|\/\/)\s*(.*?)\s*$/.exec(after)?.[1] ?? '' };
      });
      const source = /^"([^"]*)"$/.exec(args.find((a) => a.name === 'source')?.value ?? '')?.[1];
      if (source !== undefined && SUPABASE_MODULE_SOURCE.test(source)) calls.push({ file, label: match[1], args });
    }
  }
  return calls;
}

/**
 * The value one hook switch takes in one call of the module, resolved the way Terraform resolves it: the argument of the
 * module call; when that is `var.<switch>`, the root's `terraform.tfvars` assignment and then the root variable's
 * default; when the call omits it, the module variable's default.
 *
 * @returns `{ on: true }`; `{ off: { file, comment } }`, a `false` held to the hook-off rule; or `{ finding: { file,
 *   what } }`, a value that is false with no way to exempt it, or that cannot be traced to a tracked file.
 */
function resolveSwitch({ variable, call, where, root, tfvarsHook, moduleVariables }) {
  const args = call.args.filter((a) => a.name === variable);
  if (args.length > 1)
    return { finding: { file: call.file, what: `${where} passes ${variable} ${args.length} times to the module` } };
  if (args.length === 0) {
    const d = readBoolDefault([moduleVariables], variable);
    if (!d.declared)
      return {
        finding: {
          file: moduleVariables.file,
          what: `${where} leaves ${variable} to the module, which declares no such variable`
        }
      };
    if (!d.ok)
      return { finding: { file: d.file, what: `${where} leaves ${variable} to the module's default, and ${d.what}` } };
    if (d.value === null)
      return {
        finding: {
          file: d.file,
          what: `${where} omits ${variable} from its module call, and the module declares no default for it`
        }
      };
    if (!d.value)
      return {
        finding: {
          file: d.file,
          what: `${where} leaves ${variable} at the module's default, which is false; the default must be true so the compared hook keys are sent`
        }
      };
    return { on: true };
  }
  const [arg] = args;
  if (arg.value === 'true') return { on: true };
  if (arg.value === 'false') return { off: { file: call.file, comment: arg.comment } };
  if (arg.value !== `var.${variable}`)
    return {
      finding: {
        file: call.file,
        what: `${where} passes ${variable} = ${arg.value} to the module; only var.${variable}, true or false can be read, so the value the hook takes cannot be traced`
      }
    };
  const d = readBoolDefault(root.tf, variable);
  if (!d.declared)
    return { finding: { file: call.file, what: `${where} passes var.${variable}, which the root does not declare` } };
  if (tfvarsHook !== null)
    return tfvarsHook.value ? { on: true } : { off: { file: root.tfvars.file, comment: tfvarsHook.comment } };
  if (!d.ok)
    return { finding: { file: d.file, what: `${where} leaves ${variable} out of terraform.tfvars, and ${d.what}` } };
  if (d.value === null)
    return {
      finding: {
        file: root.tfvars.file,
        what: `${where} leaves ${variable} out of terraform.tfvars and its variable has no default, so the value the hook takes is in no tracked file`
      }
    };
  if (!d.value)
    return {
      finding: {
        file: d.file,
        what: `${where} leaves ${variable} out of terraform.tfvars, and the root's default is false; a root switches a hook off only by an assignment in terraform.tfvars that carries the stated comment`
      }
    };
  return { on: true };
}

/**
 * The public origin one call of the module sends: the root's `terraform.tfvars` assignment when the call passes
 * `var.public_origin`, the string itself when it passes a string literal.
 *
 * @returns `{ origin: { file, origin } }`, or `{ finding: { file, what } }`.
 */
function resolveOrigin({ call, where, root, tfvarsOrigin }) {
  const args = call.args.filter((a) => a.name === 'public_origin');
  if (args.length !== 1)
    return {
      finding: { file: call.file, what: `${where} passes public_origin ${args.length} times to the module, not once` }
    };
  const [arg] = args;
  if (arg.value === 'var.public_origin') {
    if (tfvarsOrigin !== null) return { origin: { file: root.tfvars.file, origin: tfvarsOrigin } };
    return {
      finding: {
        file: root.tfvars.file,
        what: `${where} passes var.public_origin, and its terraform.tfvars assigns none, so the origin it sends is not checked`
      }
    };
  }
  const literal = /^"([^"\\$%]*)"$/.exec(arg.value);
  if (literal) return { origin: { file: call.file, origin: literal[1] } };
  return {
    finding: {
      file: call.file,
      what: `${where} passes public_origin = ${arg.value} to the module; only var.public_origin or a plain string can be read, so the origin cannot be checked`
    }
  };
}

// ── Comparing ──

const show = (v) => JSON.stringify(v);

/** Problems of one public origin under the site-address rule. */
function originProblems(origin) {
  let url;
  try {
    url = new URL(origin);
  } catch {
    return [`${show(origin)} is not a URL`];
  }
  const problems = [];
  if (url.protocol !== 'https:') problems.push(`${show(origin)} is not https`);
  if (origin.includes('*')) problems.push(`${show(origin)} has a wildcard in the host`);
  if (origin !== `${url.protocol}//${url.host}`)
    problems.push(
      `${show(origin)} is not a bare origin (a path, a trailing slash, a query, a fragment, credentials or a non-canonical spelling)`
    );
  const host = url.hostname;
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    /^127\./.test(host) ||
    host === '[::1]' ||
    host === '0.0.0.0' ||
    host === '[::]'
  )
    problems.push(`${show(origin)} is a loopback host`);
  return problems;
}

/** Problems of the redirect rule: the hosted callback paths against the local entries, for every origin. */
function redirectProblems(localEntries, paths, origins) {
  const problems = [];
  if (!Array.isArray(localEntries) || !localEntries.every((e) => typeof e === 'string'))
    return ['the local additional_redirect_urls is not a list of strings'];
  if (!Array.isArray(paths) || !paths.every((p) => typeof p === 'string'))
    return ['the hosted redirect_callback_paths is not a list of strings'];
  if (paths.length !== REDIRECT_PATH_COUNT)
    problems.push(`the hosted redirect_callback_paths holds ${paths.length} entries, not ${REDIRECT_PATH_COUNT}`);
  if (new Set(paths).size !== paths.length) problems.push('the hosted redirect_callback_paths holds a path twice');
  const matched = new Set();
  for (const p of paths) {
    if (!p.startsWith('/')) problems.push(`the path ${show(p)} does not start with /, so it would extend the host`);
    if (p.includes('**')) problems.push(`the path ${show(p)} holds **`);
    if (p.endsWith('*')) problems.push(`the path ${show(p)} ends in *`);
    const local = localEntries.filter(
      (e) => e.endsWith(p) && /^[a-z]+:\/\/[^/]+$/.test(e.slice(0, e.length - p.length))
    );
    if (local.length === 0) problems.push(`the path ${show(p)} is not the path suffix of any local entry`);
    for (const e of local) matched.add(e);
    for (const origin of origins) {
      const entry = `${origin}${p}`;
      const host = entry.replace(/^[a-z]+:\/\//, '').split('/')[0];
      if (host.includes('*')) problems.push(`the hosted entry ${show(entry)} has a wildcard in the host`);
    }
  }
  const listed = LOCAL_ONLY_REDIRECTS.map((l) => l.entry);
  for (const e of localEntries)
    if (!matched.has(e) && !listed.includes(e))
      problems.push(`the local entry ${show(e)} has no hosted callback path and is not listed as local-only`);
  for (const l of LOCAL_ONLY_REDIRECTS)
    if (!localEntries.includes(l.entry))
      problems.push(`the local-only entry ${show(l.entry)} is no longer in the local list; remove it from the guard`);
  if (localEntries[0] !== undefined && !listed.includes(localEntries[0]))
    problems.push(`the first local entry ${show(localEntries[0])} is not the listed local-only entry`);
  return problems;
}

/**
 * The comparison of one classified row whose key is live and readable.
 *
 * @returns A description of what does not hold, or null.
 */
function compareRow(row, local, hosted, pageSize) {
  const [group, key] = row.hosted;
  const name = `${group}.${key}`;
  switch (row.compare) {
    case 'same':
      return local === hosted ? null : `local ${show(local)}, hosted ${name} ${show(hosted)}; they must be equal`;
    case 'inverted':
      if (typeof local !== 'boolean' || typeof hosted !== 'boolean')
        return `local ${show(local)}, hosted ${name} ${show(hosted)}; both must be booleans`;
      return local === !hosted
        ? null
        : `local ${show(local)}, hosted ${name} ${show(hosted)}; the hosted key is the inverse and must be ${show(!local)}`;
    case 'set':
    case 'list': {
      if (!Array.isArray(local) || typeof hosted !== 'string')
        return `local ${show(local)}, hosted ${name} ${show(hosted)}; a list against a comma-separated string is required`;
      const split = hosted.split(',').map((s) => s.trim());
      const same =
        row.compare === 'list'
          ? split.length === local.length && split.every((s, i) => s === local[i])
          : split.length === local.length &&
            new Set(split).size === split.length &&
            local.every((l) => split.includes(l));
      return same
        ? null
        : `local ${show(local)}, hosted ${name} ${show(hosted)}; they must hold the same ${row.compare === 'list' ? 'list in order' : 'set'}`;
    }
    case 'maxRows':
      return local === hosted && hosted === pageSize
        ? null
        : `config.toml ${show(local)}, hosted ${name} ${show(hosted)}, dataAdapter.pageSize ${show(pageSize)}; all three must be equal`;
    case 'atMost':
    case 'atLeast': {
      if (!Number.isInteger(local) || !Number.isInteger(hosted))
        return `local ${show(local)}, hosted ${name} ${show(hosted)}; both must be integers`;
      const ok = row.compare === 'atMost' ? hosted <= local : hosted >= local;
      return ok
        ? null
        : `hosted ${name} ${hosted} is weaker than local ${local}; it must be ${row.compare === 'atMost' ? 'at most' : 'at least'} the local value`;
    }
    case 'durationAtLeast': {
      const seconds = durationSeconds(local);
      if (seconds === null)
        return `the local ${show(local)} is not a duration of hours, minutes and seconds this guard can read`;
      if (!Number.isInteger(hosted)) return `hosted ${name} ${show(hosted)} must be an integer number of seconds`;
      return hosted >= seconds
        ? null
        : `hosted ${name} ${hosted} s is weaker than the local ${local} (${seconds} s); it must be at least the local value`;
    }
    case 'requirements':
      if (typeof local !== 'string' || typeof hosted !== 'string')
        return `local ${show(local)}, hosted ${name} ${show(hosted)}; both must be strings`;
      if (local === '') return null;
      return `the local value ${show(local)} is not empty, and this guard has no ranking of composition rules to compare it with hosted ${show(hosted)}; extend the guard rather than guess`;
    default:
      return `the guard has no comparison '${row.compare}'`;
  }
}

/** Seconds of a duration of hours, minutes and seconds, or null for any other form. */
function durationSeconds(text) {
  if (typeof text !== 'string') return null;
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(text);
  if (!m || text === '') return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

// ── Checking the structure ──

/**
 * The structural findings of the module's `.tf` files against the JSON.
 *
 * @param module - `{ dir, files: [{ file, text }] }`.
 * @param settings - The parsed JSON.
 * @param settingsFile - The JSON's display name.
 * @param report - The findings collector.
 * @returns What the census reports: the files read.
 */
function checkModule(module, settings, settingsFile, report) {
  const files = module.files.map((f) => ({ file: f.file, name: path.basename(f.file), code: hclCode(f.text) }));
  const all = files.map((f) => f.code).join('\n');
  const DIR = module.dir;
  const firstFileWith = (re) => files.find((f) => re.test(f.code))?.file ?? DIR;

  // The JSON is sent: the settings resource takes the two encoded locals.
  const settingsBlocks = files.flatMap((f) => blocks(f.code, 'resource\\s+"supabase_settings"\\s+"[^"\\n]*"\\s*\\{'));
  for (const attribute of ['auth', 'api'])
    if (
      !settingsBlocks.some(
        (b) =>
          b !== null &&
          new RegExp(`(?<![A-Za-z0-9_.])${attribute}\\s*=\\s*jsonencode\\(\\s*local\\.${attribute}\\s*\\)`).test(b)
      )
    )
      report(
        DIR,
        `module/supabase_settings.${attribute}`,
        `no supabase_settings resource takes ${attribute} = jsonencode(local.${attribute}), so the settings built from the JSON are not what is sent`
      );

  // What local.auth and local.api are built from: nothing but the expected maps.
  const localArguments = files.flatMap((f) =>
    blocksAt(f.code, '(?<![A-Za-z0-9_])locals\\s*\\{')
      .filter((b) => b.body !== null)
      .flatMap((b) => topLevelArguments(b.body, lineAt(f.code, b.open)).map((a) => ({ file: f.file, ...a })))
  );
  function oneLine(expression) {
    return expression.replace(/\s+/g, ' ');
  }
  const authDefinitions = localArguments.filter((a) => a.name === 'auth');
  const authIsMerge = authDefinitions.length === 1 && callArguments(authDefinitions[0].expression, 'merge') !== null;
  if (authDefinitions.length !== 1)
    report(DIR, 'module/local.auth', `local.auth is defined ${authDefinitions.length} times, not once`);
  else if ((callArguments(authDefinitions[0].expression, 'merge') ?? []).join(', ') !== AUTH_MERGE.join(', '))
    report(
      authDefinitions[0].file,
      'module/local.auth',
      `local.auth is ${oneLine(authDefinitions[0].expression)}, not merge(${AUTH_MERGE.join(', ')}) in that order; any other map merged into it could set a compared key, and the comparison would stay green`
    );
  const apiDefinitions = localArguments.filter((a) => a.name === 'api');
  if (apiDefinitions.length !== 1)
    report(DIR, 'module/local.api', `local.api is defined ${apiDefinitions.length} times, not once`);
  else if (apiDefinitions[0].expression !== API_VALUE)
    report(
      apiDefinitions[0].file,
      'module/local.api',
      `local.api is ${oneLine(apiDefinitions[0].expression)}, not ${API_VALUE}; anything else could set a compared key, and the comparison would stay green`
    );
  const merges = (all.match(/(?<![A-Za-z0-9_])merge\s*\(/g) ?? []).length - (authIsMerge ? 1 : 0);
  if (merges > 0)
    report(
      firstFileWith(/(?<![A-Za-z0-9_])merge\s*\(/),
      'module/merge',
      `the module's code calls merge ${merges} time(s) besides local.auth; a merged map can carry any key into the settings that are sent`
    );
  for (const { file, code } of files)
    for (const { body, open } of blocksAt(code, '(?<![A-Za-z0-9_])variable\\s+"?([A-Za-z0-9_-]+)"?\\s*\\{')) {
      if (body === null) continue;
      const type = topLevelArguments(body, lineAt(code, open)).find((a) => a.name === 'type');
      if (type !== undefined && /(?<![A-Za-z0-9_])(?:any|map)(?![A-Za-z0-9_])/.test(type.expression))
        report(
          file,
          'module/variable-type',
          `line ${type.line}: a variable of type ${oneLine(type.expression)} has keys its type does not fix, so it can carry any key into the settings that are sent`
        );
    }

  // Known keys: each key of a settings group known to the settings attribute it is sent through.
  const jsonOwned = new Set();
  for (const [group, value] of Object.entries(settings)) {
    if (RULE_GROUPS.includes(group) || value === null || typeof value !== 'object' || Array.isArray(value)) continue;
    const attribute = GROUP_ATTRIBUTE[group];
    if (attribute === undefined) {
      report(
        settingsFile,
        `known/${group}`,
        `the group is sent through no settings attribute this guard knows (${Object.keys(GROUP_ATTRIBUTE).join(', ')})`
      );
      continue;
    }
    for (const key of Object.keys(value)) {
      jsonOwned.add(key);
      if (!KNOWN_HOSTED_KEYS[attribute].includes(key))
        report(
          settingsFile,
          `known/${group}.${key}`,
          `${key} is not a known key of the hosted ${attribute} settings; the provider drops an unknown key in silence, so it would be compared here and never sent. Read the key from the API client the pinned provider compiles against before adding it to the list`
        );
    }
  }

  // One owner per key.
  const allKnown = new Set([...KNOWN_HOSTED_KEYS.api, ...KNOWN_HOSTED_KEYS.auth]);
  for (const key of HCL_OWNED_KEYS) {
    if (!allKnown.has(key))
      report(SELF, `owned/${key}`, 'the guard lists the key as owned by the HCL but not as a known hosted key');
    if (jsonOwned.has(key))
      report(
        settingsFile,
        `owned/${key}`,
        'the key depends on the environment and is owned by the HCL; in the JSON it is either overridden or overrides'
      );
    if (!asWord(key).test(all))
      report(
        DIR,
        `owned/${key}`,
        "the HCL owns the key but the module's code does not write it; a misspelled key is dropped by the provider in silence"
      );
  }
  for (const key of jsonOwned) {
    // An HCL-owned key in the JSON is reported above, against the JSON.
    if (HCL_OWNED_KEYS.includes(key)) continue;
    const re = asWord(key);
    if (re.test(all))
      report(
        firstFileWith(re),
        `owned/${key}`,
        "the JSON owns the key, and the module's code writes it too; a later map in the merge would override the compared value"
      );
  }
  for (const key of allKnown) {
    if (jsonOwned.has(key) || HCL_OWNED_KEYS.includes(key)) continue;
    const re = asWord(key);
    if (re.test(all))
      report(
        firstFileWith(re),
        `owned/${key}`,
        "a known hosted key that neither the JSON nor the HCL owns is written in the module's code; a compared setting belongs in the JSON with its row here"
      );
  }

  // The project block keeps its protections.
  const projectHeader = 'resource\\s+"supabase_project"\\s+"[^"\\n]*"\\s*\\{';
  const projects = files.flatMap((f) => blocks(f.code, projectHeader).map((body) => ({ file: f.file, body })));
  const inMain = files.filter((f) => f.name === 'main.tf').some((f) => new RegExp(projectHeader).test(f.code));
  if (!inMain)
    report(
      DIR,
      'module/supabase_project',
      'main.tf holds no supabase_project resource; a renamed or removed block plans the destroy of the project with no protection'
    );
  for (const { file, body } of projects) {
    const lifecycles = body === null ? [] : blocks(body, '(?<![A-Za-z0-9_])lifecycle\\s*\\{').filter((b) => b !== null);
    if (body === null) report(file, 'module/supabase_project', "the project block's braces do not close");
    if (!lifecycles.some((b) => /(?<![A-Za-z0-9_])prevent_destroy\s*=\s*true(?![A-Za-z0-9_])/.test(b)))
      report(
        file,
        'module/supabase_project',
        'the project block has no lifecycle prevent_destroy = true, so a plan may destroy the project'
      );
    if (
      !lifecycles.some((b) =>
        /(?<![A-Za-z0-9_])ignore_changes\s*=\s*\[[^\]]*(?<![A-Za-z0-9_])database_password(?![A-Za-z0-9_])[^\]]*\]/.test(
          b
        )
      )
    )
      report(
        file,
        'module/supabase_project',
        'the project block does not ignore changes to database_password, so the first apply after an import would send the exported password to the project'
      );
  }

  return { files: files.length };
}

/**
 * The second-writer findings: the CLI's configuration-push command in a file of the scanned scope.
 *
 * @returns How many files were scanned.
 */
function checkWriters(writers, report) {
  let scanned = 0;
  for (const { file, text } of writers) {
    if (!writerInScope(file)) continue;
    scanned += 1;
    PUSH_COMMAND.lastIndex = 0;
    for (let m = PUSH_COMMAND.exec(text); m !== null; m = PUSH_COMMAND.exec(text))
      report(
        file,
        'writer/config-push',
        `line ${lineAt(text, m.index)}: the CLI's configuration-push command writes the local auth settings to a hosted project; the Terraform settings resource is the only writer of hosted settings`
      );
  }
  return scanned;
}

// ── Output ──

function censusLine(census) {
  const { counts } = census;
  const classes = Object.entries(CLASS_NAMES).map(([cls, name]) => `${name} ${counts[cls]}`);
  if (counts.unclassified > 0) classes.push(`unclassified ${counts.unclassified}`);
  return (
    `census: ${census.live} live key(s) of [api], [api.tls], [auth], [auth.*] and [functions.*]: ${classes.join(', ')}; ` +
    `${census.origins} origin(s) checked across ${census.roots} Supabase root(s); ` +
    HOOK_SWITCHES.map(({ variable, label }) => {
      const roots = census.hookOff[variable];
      return `${label} not applied in: ${roots.length === 0 ? 'none' : roots.join(', ')}`;
    }).join('; ') +
    '.'
  );
}

// ── Arguments ──

function usage(message) {
  console.error(`${SELF}: ${message}`);
  console.error(
    `usage: node ${SELF} [--config <file>] [--settings <file>] [--static-settings <file>] [--envs-dir <dir>] [--module-dir <dir>]`
  );
  process.exitCode = 2;
}

const FLAGS = {
  '--config': 'config',
  '--settings': 'settings',
  '--static-settings': 'staticSettings',
  '--envs-dir': 'envsDir',
  '--module-dir': 'moduleDir'
};
/** Parses the arguments and runs the gate. */
function main(argv) {
  const given = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!(a in FLAGS)) return usage(`unexpected argument '${a}'`);
    const value = argv[i + 1];
    i += 1;
    if (value === undefined || value.startsWith('--')) return usage(`${a} requires a path`);
    if (FLAGS[a] in given) return usage(`${a} given twice`);
    given[FLAGS[a]] = path.resolve(process.cwd(), value);
  }
  const paths = Object.fromEntries(Object.entries(DEFAULT_PATHS).map(([k, v]) => [k, path.resolve(REPO_ROOT, v)]));
  gate({ ...paths, ...given });
}

// Imported, the module only provides `check`; run, it is the gate.
if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))
  main(process.argv.slice(2));
