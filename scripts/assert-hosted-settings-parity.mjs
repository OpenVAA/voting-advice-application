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
 * while its `enable_send_email_hook` is true, each switch on its own. So a root can switch a compared key off. The value each switch takes is read from the root's call of the module the way Terraform resolves
 * it: the call's argument when it is a literal `true` or `false`; when it is `var.<switch>`, the root's
 * `terraform.tfvars` assignment, and without one the root variable's default; when the call omits the argument, the
 * module variable's default. Any other argument cannot be read and fails. A `false` written as the call's argument or
 * in `terraform.tfvars` fails unless it carries a trailing comment beginning `hook off until` and giving the reason;
 * such a root passes and is named in the census for that hook. A default of `false`, in the root or in the module,
 * fails with no exception, and so does a value that no tracked file holds. The origin is read from the same call:
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
 *   the JSON is encoded     The module reads `hosted-settings.json` through `jsondecode(file(...))` into `local.hosted`,
 *                           reads every group of the JSON as `local.hosted.<group>` (the group name matched as a whole
 *                           word, so a read of `auth_hook` is not a read of `auth`), and a settings resource takes
 *                           `jsonencode(local.auth)` and `jsonencode(local.api)`. A missing read names the group. This
 *                           is a text check: it shows that a group is read, not what value results. The evaluated proof
 *                           is `infra/scripts/check-settings-types.sh`, which the validation job runs.
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
 *                           `merge` is called, no file is read or string decoded besides `hosted-settings.json`, and no
 *                           variable has a type that holds `map` or `any`: each of these could bring in a key no word
 *                           of the code names, and so set a compared key with the comparison still green.
 *   the project protected   `main.tf` holds a `supabase_project` resource, and every such block, read by counting
 *                           braces, holds a `lifecycle` block with `prevent_destroy = true` and an `ignore_changes` list
 *                           naming `database_password`.
 *   no type trap            No conditional has an empty object as a branch: Terraform would unify the branches into a
 *                           map of strings, and booleans and numbers would be sent as strings.
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
 * How it reads (Node built-ins only, no TOML or HCL parser): `config.toml` by lines, a table starting at its `[name]`
 * header and ending at the next, a key being a `name = value` line with an optional trailing comment. A header is read
 * with spaces around its dots and the quotes around a quoted bare key removed; a header that still cannot be read is a
 * finding wherever it stands, and the keys under it count as unclassified. A value is read
 * only when its form can be read exactly: a bare boolean, an integer, a double-quoted string without `#` or `\`, or a
 * one-line array that `JSON.parse` accepts. Any other form, and a key written twice in one table, is a finding. The
 * hosted settings are parsed as JSON. `pageSize` is a line read inside the `dataAdapter` block, and each
 * `terraform.tfvars` and every variable default are line reads. The `.tf` files of the module and of each root are read
 * as text: comments (`#`, `//` and `/* *\/`) are removed outside double-quoted strings, blocks are found by counting
 * braces outside strings, and a module call's arguments are the lines written directly in its block; heredoc strings
 * are not recognised. The files scanned for a second writer are those `git ls-files` lists, so an untracked
 * file is never a finding. A channel that cannot be read withholds the verdict.
 *
 * Usage:
 *   node scripts/assert-hosted-settings-parity.mjs                      # gate over the repository's files
 *   node scripts/assert-hosted-settings-parity.mjs --self-test          # run the same check over embedded inputs
 *   node scripts/assert-hosted-settings-parity.mjs [--config <file>] [--settings <file>]
 *                                                  [--static-settings <file>] [--envs-dir <dir>]
 *                                                  [--module-dir <dir>]
 *     each flag replaces one input of the gate; a path is resolved against the working directory. `--module-dir`
 *     replaces the module directory for every check that reads its `.tf` files, `variables.tf` included
 *
 * Findings go to stdout as `<file>: <table>/<key>: <what and why>`; the summary and the census go to stderr.
 *
 * Exit codes:
 *   0 - every key holds; or --self-test passed
 *   1 - at least one finding, or a channel could not be read; or --self-test found a difference
 *   2 - usage error
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const HOOK_SWITCHES = [
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

/** The groups of the JSON the module must read, whether or not the JSON still holds them. */
const EXPECTED_GROUPS = ['api', 'auth', 'auth_hook', 'auth_send_email_hook', 'redirect_callback_paths'];

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

/** The read of the compared file into `local.hosted`, the one file the module may read. */
const HOSTED_READ =
  /(?<![A-Za-z0-9_])hosted\s*=\s*jsondecode\(\s*file\(\s*"(?:[^"\n]*\/)?hosted-settings\.json"\s*\)\s*\)/;

/** A call that reads a file or decodes a string, any of which could bring keys into the settings from elsewhere. */
const OTHER_READ =
  /(?<![A-Za-z0-9_])(?:jsondecode|yamldecode|csvdecode|base64decode|textdecodebase64|file|filebase64|templatefile|templatestring|fileset)\s*\(/g;

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
const PUSH_GAP = `[\\s\\\\"',\\[\\]]+`;
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

// ── Reading ──

const TABLE_HEADER = /^\s*\[\[?\s*([^\]]*?)\s*\]\]?\s*(?:#.*)?$/;
const TABLE_NAME = /^[A-Za-z0-9_.-]+$/;
const KEY_LINE = /^\s*([A-Za-z0-9_-]+)\s*=\s*(.*)$/;

/** The table that the keys after a header the line read cannot read are attributed to. It counts as in the family. */
const UNREADABLE_TABLE = '(unreadable)';

/** Whether a table belongs to the families this guard classifies. */
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
 * The name of a table header in its plain form: each dotted part trimmed, and a part that is a quoted bare key written
 * without its quotes, so `[auth . external . "github"]` is `auth.external.github`. Returns null when a part is still
 * not a bare key, such as a quoted part holding a dot or a space.
 */
function tableName(header) {
  const name = header
    .split('.')
    .map((part) => part.trim().replace(/^"([A-Za-z0-9_-]+)"$|^'([A-Za-z0-9_-]+)'$/, '$1$2'))
    .join('.');
  return TABLE_NAME.test(name) ? name : null;
}

/**
 * The value text of an assignment with its trailing comment removed, and whether a `#` sits inside a quoted string.
 *
 * @param rest - The text after `=`.
 */
function splitValue(rest) {
  let inQuote = false;
  let hashInQuote = false;
  let end = rest.length;
  for (let i = 0; i < rest.length; i += 1) {
    const c = rest[i];
    if (c === '"') inQuote = !inQuote;
    else if (c === '#') {
      if (inQuote) hashInQuote = true;
      else {
        end = i;
        break;
      }
    }
  }
  return { raw: rest.slice(0, end).trim(), hashInQuote };
}

/**
 * One value, when its form can be read exactly.
 *
 * @returns `{ ok: true, value }`, or `{ ok: false, what }` naming why it cannot be read.
 */
function parseValue(raw) {
  if (raw === 'true') return { ok: true, value: true };
  if (raw === 'false') return { ok: true, value: false };
  if (/^-?\d+$/.test(raw)) return { ok: true, value: Number(raw) };
  if (raw.includes('\\'))
    return { ok: false, what: 'the value holds a backslash, which the line read does not unescape' };
  if (raw.startsWith('"')) {
    try {
      const value = JSON.parse(raw);
      if (typeof value === 'string') return { ok: true, value };
    } catch {
      // fall through
    }
    return { ok: false, what: `the string ${raw} cannot be read exactly` };
  }
  if (raw.startsWith('[')) {
    try {
      const value = JSON.parse(raw);
      if (Array.isArray(value) && value.every((v) => ['string', 'number', 'boolean'].includes(typeof v)))
        return { ok: true, value };
    } catch {
      // fall through
    }
    return { ok: false, what: `the array ${raw} is not a one-line array that JSON.parse accepts` };
  }
  return { ok: false, what: `the value form ${raw === '' ? '(empty)' : raw} cannot be read exactly by a line read` };
}

/**
 * Every live key of the classified table families.
 *
 * @param text - The configuration text.
 * @returns `keys`, a map from `<table>/<key>` to the parsed value, and `problems`, one per key that cannot be read.
 */
function readConfig(text) {
  const keys = new Map();
  const problems = [];
  const seen = new Set();
  let table = null;
  text.split('\n').forEach((line, index) => {
    const header = TABLE_HEADER.exec(line);
    if (header) {
      const name = tableName(header[1]);
      if (name !== null) {
        table = name;
        return;
      }
      // Whatever table came before, the keys that follow belong to a table whose name cannot be read, so they are
      // attributed to one that is in the family and each fails as unclassified.
      problems.push({
        id: 'config/table-header',
        what: `line ${index + 1}: the table header '${line.trim()}' cannot be read, so the keys under it cannot be classified`
      });
      table = UNREADABLE_TABLE;
      return;
    }
    if (table === null || !inFamily(table)) return;
    if (/^\s*(?:#.*)?$/.test(line)) return;
    const assignment = KEY_LINE.exec(line);
    if (!assignment) {
      problems.push({
        id: `${table}/(line ${index + 1})`,
        what: `the line '${line.trim()}' is not a key the line read can read`
      });
      return;
    }
    const id = `${table}/${assignment[1]}`;
    if (seen.has(id)) {
      problems.push({ id, what: 'the key is written twice in one table, so which value applies cannot be read' });
      keys.delete(id);
      return;
    }
    seen.add(id);
    const { raw, hashInQuote } = splitValue(assignment[2]);
    if (hashInQuote) {
      problems.push({ id, what: 'a quoted value holds a #, which a line read would take for the start of a comment' });
      return;
    }
    const parsed = parseValue(raw);
    if (!parsed.ok) {
      problems.push({ id, what: parsed.what });
      return;
    }
    keys.set(id, parsed.value);
  });
  // A key that was readable once but written again counts as not readable.
  for (const p of problems) if (keys.has(p.id)) keys.delete(p.id);
  return { keys, problems, live: seen };
}

/**
 * `dataAdapter.pageSize` from the static settings, by a line read inside the `dataAdapter` block.
 *
 * @returns `{ ok: true, value }`, or `{ ok: false, what }`.
 */
function readPageSize(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^\s*dataAdapter\s*:\s*\{/.test(l));
  if (start === -1) return { ok: false, what: 'no `dataAdapter: {` block was found' };
  let depth = 0;
  const values = [];
  let unreadable = null;
  for (let i = start; i < lines.length; i += 1) {
    const code = lines[i].replace(/\/\/.*$/, '');
    if (i > start && depth === 1 && /^\s*pageSize\s*:/.test(code)) {
      const m = /^\s*pageSize\s*:\s*(\d+)\s*,?\s*$/.exec(code);
      if (m) values.push(Number(m[1]));
      else unreadable = lines[i].trim();
    }
    depth += (code.match(/\{/g) ?? []).length - (code.match(/\}/g) ?? []).length;
    if (depth <= 0) break;
  }
  if (unreadable !== null)
    return { ok: false, what: `the line '${unreadable}' is not a pageSize the line read can read` };
  if (values.length === 0) return { ok: false, what: 'the `dataAdapter` block holds no pageSize' };
  if (values.length > 1) return { ok: false, what: `the \`dataAdapter\` block holds pageSize ${values.length} times` };
  return { ok: true, value: values[0] };
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
 * `public_origin` and each hook switch of one root's variable file, by line reads.
 *
 * @returns `origin` (a string or null), `hooks` (per switch variable, `{ value, comment }` or null) and `problems`.
 */
function readRootVariables(text) {
  const problems = [];
  const origins = [];
  const assigned = Object.fromEntries(HOOK_SWITCHES.map((h) => [h.variable, []]));
  for (const line of text.split('\n')) {
    if (/^\s*public_origin\s*=/.test(line)) {
      const m = /^\s*public_origin\s*=\s*"([^"\\]*)"\s*(?:#.*)?$/.exec(line);
      if (m) origins.push(m[1]);
      else
        problems.push({
          id: 'auth/site_url',
          what: `the line '${line.trim()}' is not a public_origin the line read can read`
        });
    }
    for (const { variable, id } of HOOK_SWITCHES) {
      if (!new RegExp(`^\\s*${variable}\\s*=`).test(line)) continue;
      const m = new RegExp(`^\\s*${variable}\\s*=\\s*(true|false)\\s*(?:#\\s*(.*?))?\\s*$`).exec(line);
      if (m) assigned[variable].push({ value: m[1] === 'true', comment: m[2] ?? '' });
      else problems.push({ id, what: `the line '${line.trim()}' is not a ${variable} the line read can read` });
    }
  }
  if (origins.length > 1)
    problems.push({ id: 'auth/site_url', what: `public_origin is assigned ${origins.length} times` });
  const hooks = {};
  for (const { variable, id } of HOOK_SWITCHES) {
    const list = assigned[variable];
    if (list.length > 1) problems.push({ id, what: `${variable} is assigned ${list.length} times` });
    hooks[variable] = list.length === 1 ? list[0] : null;
  }
  return { origin: origins.length === 1 ? origins[0] : null, hooks, problems };
}

/**
 * The arguments written directly in a block, not in a block or a value nested inside it: one per line whose depth at
 * its start is the block's own, as `{ name, value, line }`. A value that spans lines is read up to the end of its first
 * line.
 *
 * @param body - A block from `blocksAt`, starting at its opening brace.
 * @param firstLine - The line number of the opening brace.
 */
function topLevelArguments(body, firstLine) {
  const found = [];
  let depth = 1;
  let inString = false;
  let line = firstLine;
  let lineDepth = 1;
  let lineStart = 1;
  let text = '';
  const flush = () => {
    const m = lineDepth === 1 ? /^\s*([A-Za-z0-9_-]+)\s*=\s*(.*?)\s*$/.exec(text) : null;
    if (m)
      found.push({
        name: m[1],
        value: m[2],
        line,
        expression: fullExpression(body, lineStart + text.indexOf('=') + 1)
      });
  };
  for (let i = 1; i < body.length; i += 1) {
    const c = body[i];
    if (c === '\n') {
      flush();
      line += 1;
      lineDepth = depth;
      lineStart = i + 1;
      inString = false;
      text = '';
      continue;
    }
    if (inString) {
      if (c === '\\') {
        text += c + (body[i + 1] ?? '');
        i += 1;
        continue;
      }
      if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if ('{[('.includes(c)) depth += 1;
    else if ('}])'.includes(c)) {
      depth -= 1;
      if (depth === 0) break;
    }
    text += c;
  }
  flush();
  return found;
}

/**
 * The whole expression that starts at `start`, across lines: up to the first line end, or the block's closing brace,
 * at which every bracket opened since `start` is closed again.
 */
function fullExpression(body, start) {
  let depth = 0;
  let inString = false;
  let i = start;
  for (; i < body.length; i += 1) {
    const c = body[i];
    if (inString) {
      if (c === '\\') i += 1;
      else if (c === '"' || c === '\n') inString = false;
    } else if (c === '"') inString = true;
    else if ('{[('.includes(c)) depth += 1;
    else if ('}])'.includes(c)) {
      if (depth === 0) break;
      depth -= 1;
    } else if (c === '\n' && depth === 0) break;
  }
  return body.slice(start, i).trim();
}

/** The arguments of a call written as its whole text, `name(a, b, ...)`, split at its top-level commas; null otherwise. */
function callArguments(expression, name) {
  const m = new RegExp(`^${name}\\s*\\(([\\s\\S]*)\\)$`).exec(expression);
  if (!m) return null;
  const args = [];
  let depth = 0;
  let inString = false;
  let from = 0;
  const inner = m[1];
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    if (inString) {
      if (c === '\\') i += 1;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if ('{[('.includes(c)) depth += 1;
    else if ('}])'.includes(c)) depth -= 1;
    else if (c === ',' && depth === 0) {
      args.push(inner.slice(from, i).trim());
      from = i + 1;
    }
  }
  args.push(inner.slice(from).trim());
  return args.filter((a) => a !== '');
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

/** Seconds of a duration of hours, minutes and seconds, or null for any other form. */
function durationSeconds(text) {
  if (typeof text !== 'string') return null;
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(text);
  if (!m || text === '') return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
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
function check(inputs) {
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
  const { keys, problems, live } = readConfig(inputs.config.text);
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

// ── Checking the structure ──

/**
 * A `.tf` text with its comments removed and its strings kept. Comments are `#` and `//` to the end of the line and
 * `/* *\/` (replaced by blanks, so line numbers hold), each only outside a double-quoted string.
 */
function hclCode(text) {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === '\\' && i + 1 < text.length) {
        out += text[i + 1];
        i += 1;
      } else if (c === '"' || c === '\n') inString = false;
    } else if (c === '"') {
      inString = true;
      out += c;
    } else if (c === '#' || (c === '/' && text[i + 1] === '/')) {
      while (i + 1 < text.length && text[i + 1] !== '\n') i += 1;
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop - 1;
    } else out += c;
  }
  return out;
}

/**
 * The text of every block whose header matches, from its opening brace to the matching closing one, braces inside
 * strings not counted. A block whose braces do not close is returned as null.
 *
 * @param code - Code from `hclCode`.
 * @param header - The source of a regular expression that ends with the opening brace.
 */
function blocks(code, header) {
  return blocksAt(code, header).map((b) => b.body);
}

/** As `blocks`, with each block's header match and the offset of its opening brace: `[{ match, open, body }]`. */
function blocksAt(code, header) {
  const found = [];
  const re = new RegExp(header, 'g');
  for (let m = re.exec(code); m !== null; m = re.exec(code)) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let inString = false;
    let body = null;
    for (let i = open; i < code.length && body === null; i += 1) {
      const c = code[i];
      if (inString) {
        if (c === '\\') i += 1;
        else if (c === '"' || c === '\n') inString = false;
      } else if (c === '"') inString = true;
      else if (c === '{') depth += 1;
      else if (c === '}') {
        depth -= 1;
        if (depth === 0) body = code.slice(open, i + 1);
      }
    }
    found.push({ match: m, open, body });
  }
  return found;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A key or name as a whole word: not part of a longer identifier. */
const asWord = (name) => new RegExp(`(?<![A-Za-z0-9_])${escapeRe(name)}(?![A-Za-z0-9_])`);
const lineAt = (text, index) => text.slice(0, index).split('\n').length;

/**
 * The structural findings of the module's `.tf` files against the JSON.
 *
 * @param module - `{ dir, files: [{ file, text }] }`.
 * @param settings - The parsed JSON.
 * @param settingsFile - The JSON's display name.
 * @param report - The findings collector.
 * @returns What the census reports: the files read and the groups found read.
 */
function checkModule(module, settings, settingsFile, report) {
  const files = module.files.map((f) => ({ file: f.file, name: path.basename(f.file), code: hclCode(f.text) }));
  const all = files.map((f) => f.code).join('\n');
  const DIR = module.dir;
  const firstFileWith = (re) => files.find((f) => re.test(f.code))?.file ?? DIR;

  // The JSON is encoded: read from its file, every group read, the settings resource taking the two encoded locals.
  if (!HOSTED_READ.test(all))
    report(
      DIR,
      'module/hosted-settings.json',
      'the module does not read hosted-settings.json into local.hosted through jsondecode(file(...)), so the compared file is not what the module sends'
    );
  const groups = [...new Set([...EXPECTED_GROUPS, ...Object.keys(settings)])];
  let groupsRead = 0;
  for (const group of groups) {
    if (asWord(`local.hosted.${group}`).test(all)) groupsRead += 1;
    else
      report(
        DIR,
        `module/local.hosted.${group}`,
        `the module's code does not read the JSON group ${group} as local.hosted.${group}, so its compared values are not sent; the JSON would be a dead file while the comparison stays green`
      );
  }
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

  // What local.auth and local.api are built from: nothing but the expected maps, and no other file read.
  const localArguments = files.flatMap((f) =>
    blocksAt(f.code, '(?<![A-Za-z0-9_])locals\\s*\\{')
      .filter((b) => b.body !== null)
      .flatMap((b) => topLevelArguments(b.body, lineAt(f.code, b.open)).map((a) => ({ file: f.file, ...a })))
  );
  const oneLine = (expression) => expression.replace(/\s+/g, ' ');
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
  const otherReads = all.replace(HOSTED_READ, '').match(OTHER_READ) ?? [];
  if (otherReads.length > 0)
    report(
      firstFileWith(OTHER_READ),
      'module/decode',
      `the module's code reads or decodes a file or a string besides hosted-settings.json (${[...new Set(otherReads.map((r) => r.replace(/\s*\($/, '')))].join(', ')}); a value read that way can carry any key into the settings that are sent`
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

  // The type trap.
  for (const { file, code } of files) {
    const re = /[?:]\s*(?:tomap\(\s*)?\{\s*\}/g;
    for (let m = re.exec(code); m !== null; m = re.exec(code))
      report(
        file,
        'module/empty-object-branch',
        `line ${lineAt(code, m.index)}: a conditional has an empty object as a branch; Terraform unifies both branches into a map of strings and sends booleans and numbers as strings`
      );
  }

  return { files: files.length, groupsRead, groups: groups.length };
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

// ── Self-test ──

const CORRECT_CONFIG = `
[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 50000

[api.tls]
enabled = false

[db]
port = 54322

[auth]
enabled = true
site_url = "http://127.0.0.1:5173"
additional_redirect_urls = ["https://127.0.0.1:3000", "http://localhost:5173/auth/confirm", "http://localhost:5173/*/auth/confirm"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = false
enable_anonymous_sign_ins = false
enable_manual_linking = false
minimum_password_length = 8
password_requirements = ""

[auth.rate_limit]
email_sent = 2
sms_sent = 30
anonymous_users = 30
token_refresh = 150
sign_in_sign_ups = 30
token_verifications = 30
web3 = 30

[auth.email]
enable_signup = true # the email provider
double_confirm_changes = true
enable_confirmations = true
secure_password_change = false
max_frequency = "1s"
otp_length = 6
otp_expiry = 3600

[auth.sms]
enable_signup = false
enable_confirmations = false
template = "Your code is {{ .Code }}"
max_frequency = "5s"

[auth.hook.custom_access_token]
enabled = true
uri = "pg-functions://postgres/public/custom_access_token_hook"

[auth.hook.send_email]
enabled = true
uri = "pg-functions://postgres/public/send_email_hook"

[auth.sms.twilio]
enabled = false
account_sid = ""
message_service_sid = ""
auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"

[auth.mfa]
max_enrolled_factors = 10

[auth.mfa.totp]
enroll_enabled = false
verify_enabled = false

[auth.mfa.phone]
enroll_enabled = false
verify_enabled = false
otp_length = 6
template = "Your code is {{ .Code }}"
max_frequency = "5s"

[auth.external.apple]
enabled = false
client_id = ""
secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"
redirect_uri = ""
url = ""
skip_nonce_check = false
email_optional = false

[auth.web3.solana]
enabled = false

[auth.third_party.firebase]
enabled = false

[auth.third_party.auth0]
enabled = false

[auth.third_party.aws_cognito]
enabled = false

[auth.third_party.clerk]
enabled = false

[auth.oauth_server]
enabled = false
authorization_url_path = "/oauth/consent"
allow_dynamic_registration = false

[edge_runtime]
enabled = true

[functions.identity-callback]
verify_jwt = false

[functions.account-access]
verify_jwt = false
`;

const CORRECT_SETTINGS = {
  api: { db_schema: 'public,graphql_public', db_extra_search_path: 'public,extensions', max_rows: 50000 },
  auth: {
    disable_signup: true,
    mailer_autoconfirm: false,
    external_email_enabled: true,
    external_phone_enabled: false,
    external_anonymous_users_enabled: false,
    security_manual_linking_enabled: false,
    jwt_exp: 3600,
    refresh_token_rotation_enabled: true,
    security_refresh_token_reuse_interval: 10,
    password_min_length: 8,
    password_required_characters: '',
    mailer_secure_email_change_enabled: true,
    security_update_password_require_reauthentication: false,
    mailer_otp_length: 6,
    mailer_otp_exp: 3600,
    smtp_max_frequency: 60,
    mfa_totp_enroll_enabled: false,
    mfa_totp_verify_enabled: false,
    mfa_phone_enroll_enabled: false,
    mfa_phone_verify_enabled: false,
    external_apple_enabled: false,
    external_web3_solana_enabled: false
  },
  auth_hook: {
    hook_custom_access_token_enabled: true,
    hook_custom_access_token_uri: 'pg-functions://postgres/public/custom_access_token_hook'
  },
  auth_send_email_hook: {
    hook_send_email_enabled: true,
    hook_send_email_uri: 'pg-functions://postgres/public/send_email_hook'
  },
  redirect_callback_paths: ['/auth/confirm', '/*/auth/confirm']
};

const CORRECT_STATIC = `export const staticSettings = {
  appVersion: { version: 1 },
  dataAdapter: {
    type: 'supabase',
    // Must equal max_rows.
    pageSize: 50000
  },
  colors: { light: { primary: '#2546a8' } }
};
`;

const CORRECT_VARIABLES = `variable "public_origin" {
  type = string
}

variable "enable_access_token_hook" {
  description = "Whether the hook is on."
  type        = bool
  default     = true
  nullable    = false
}

variable "enable_send_email_hook" {
  description = "Whether the other hook is on."
  type        = bool
  default     = true
  nullable    = false
}
`;

const CORRECT_MAIN_TF = `terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.11"
    }
  }
}

# Imported, never created. prevent_destroy is not in state; the password is never sent.
resource "supabase_project" "this" {
  organization_id   = var.organization_id
  name              = var.project_name
  region            = var.region
  database_password = var.database_password

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [database_password]
  }
}

resource "supabase_settings" "this" {
  project_ref = supabase_project.this.id
  api         = jsonencode(local.api)
  auth        = jsonencode(local.auth)
}

resource "supabase_settings" "smtp_secret" {
  count = var.smtp == null ? 0 : 1

  project_ref = supabase_project.this.id
  auth = jsonencode({
    smtp_user = var.smtp_user
    smtp_pass = var.smtp_password
  })
}
`;

const CORRECT_SETTINGS_TF = `# Built from hosted-settings.json: jwt_exp and every other compared key live there, never here.
locals {
  hosted = jsondecode(file("\${path.module}/hosted-settings.json"))

  auth_hook            = { for k, v in local.hosted.auth_hook : k => v if var.enable_access_token_hook }
  auth_send_email_hook = { for k, v in local.hosted.auth_send_email_hook : k => v if var.enable_send_email_hook }

  auth_rate_limits = {
    for k, v in var.auth_rate_limits : k => v
    if var.smtp != null || k != "rate_limit_email_sent"
  }

  auth_origin = {
    site_url       = var.public_origin
    uri_allow_list = join(",", [for p in local.hosted.redirect_callback_paths : "\${var.public_origin}\${p}"])
  }

  auth_smtp = var.smtp == null ? null : {
    smtp_host        = var.smtp.host
    smtp_port        = var.smtp.port
    smtp_admin_email = var.smtp.admin_email
    smtp_sender_name = var.smtp.sender_name
  }

  auth = merge(
    local.hosted.auth,
    local.auth_hook,
    local.auth_send_email_hook,
    local.auth_rate_limits,
    local.auth_origin,
    local.auth_smtp,
  )

  api = local.hosted.api
}
`;

const CORRECT_MODULE_VARIABLES = `${CORRECT_VARIABLES}
variable "auth_rate_limits" {
  type = object({
    rate_limit_otp             = optional(number, 30)
    rate_limit_verify          = optional(number, 30)
    rate_limit_token_refresh   = optional(number, 150)
    rate_limit_anonymous_users = optional(number, 30)
    rate_limit_sms_sent        = optional(number, 30)
    rate_limit_web3            = optional(number, 30)
    rate_limit_email_sent      = optional(number, 100)
  })
  default  = {}
  nullable = false
}

variable "smtp" {
  type = object({
    host        = string
    port        = string
    admin_email = string
    sender_name = string
  })
  default = null
}

variable "smtp_user" {
  type      = string
  sensitive = true
  default   = null
}

variable "smtp_password" {
  type      = string
  sensitive = true
  default   = null
}
`;

const CORRECT_WORKFLOW = `name: infra
on: pull_request
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - run: terraform validate
`;

const CORRECT_PACKAGE_JSON = `{
  "name": "@openvaa/supabase",
  "scripts": { "start": "supabase start", "push": "supabase db push --local" }
}
`;

/** A root's call of the module that passes the origin and both hook switches through from its variables. */
const ROOT_MAIN_TF = `provider "supabase" {}

module "supabase" {
  source = "../../../modules/supabase"

  public_origin            = var.public_origin
  enable_access_token_hook = var.enable_access_token_hook
  enable_send_email_hook   = var.enable_send_email_hook
}
`;

/** The root variables of that call, the hook switches with no default. */
const ROOT_VARIABLES_TF = `variable "public_origin" {
  type = string
}

variable "enable_access_token_hook" {
  type     = bool
  nullable = false
}

variable "enable_send_email_hook" {
  type     = bool
  nullable = false
}
`;

/** A root's call of the module that leaves both hook switches to the module's defaults. */
const ROOT_MAIN_TF_MODULE_DEFAULTS = `module "supabase" {
  source        = "../../../modules/supabase"
  public_origin = var.public_origin
}
`;

/**
 * The inputs the self-test edits: two roots, one passing both hook switches through from its terraform.tfvars and one
 * leaving them to the module's defaults.
 */
function correctInputs() {
  return {
    config: { file: 'config.toml', text: CORRECT_CONFIG },
    settings: { file: 'hosted-settings.json', text: JSON.stringify(CORRECT_SETTINGS, null, 2) },
    staticSettings: { file: 'staticSettings.ts', text: CORRECT_STATIC },
    variables: { file: 'variables.tf', text: CORRECT_VARIABLES },
    module: {
      dir: 'module',
      files: [
        { file: 'module/main.tf', text: CORRECT_MAIN_TF },
        { file: 'module/settings.tf', text: CORRECT_SETTINGS_TF },
        { file: 'module/variables.tf', text: CORRECT_MODULE_VARIABLES }
      ],
      error: null
    },
    writers: [
      { file: '.github/workflows/infra.yaml', text: CORRECT_WORKFLOW },
      { file: 'apps/supabase/package.json', text: CORRECT_PACKAGE_JSON }
    ],
    writersError: null,
    envsDir: 'envs',
    roots: [
      {
        name: 'staging',
        dir: 'envs/staging/supabase',
        tfvars: {
          file: 'envs/staging/supabase/terraform.tfvars',
          text:
            'public_origin            = "https://staging.example.org"\n' +
            'enable_access_token_hook = true\n' +
            'enable_send_email_hook   = true\n'
        },
        tf: [
          { file: 'envs/staging/supabase/main.tf', text: ROOT_MAIN_TF },
          { file: 'envs/staging/supabase/variables.tf', text: ROOT_VARIABLES_TF }
        ]
      },
      {
        name: 'example',
        dir: 'envs/example/supabase',
        tfvars: {
          file: 'envs/example/supabase/terraform.tfvars',
          text: '# A forker\'s root.\npublic_origin = "https://vaa.example.org"\n'
        },
        tf: [
          { file: 'envs/example/supabase/main.tf', text: ROOT_MAIN_TF_MODULE_DEFAULTS },
          { file: 'envs/example/supabase/variables.tf', text: 'variable "public_origin" {\n  type = string\n}\n' }
        ]
      }
    ]
  };
}

/** Edits of the hosted settings, applied to a parsed copy. */
function editSettings(edit) {
  return (inputs) => {
    const settings = JSON.parse(inputs.settings.text);
    edit(settings);
    inputs.settings.text = JSON.stringify(settings, null, 2);
  };
}
const editConfig = (from, to) => (inputs) => {
  inputs.config.text = inputs.config.text.replace(from, to);
};
const editRoot = (index, from, to) => (inputs) => {
  inputs.roots[index].tfvars.text = inputs.roots[index].tfvars.text.replace(from, to);
};
/** An edit of one `.tf` file of a root, by its file name. */
const editRootTf = (index, name, from, to) => (inputs) => {
  const file = inputs.roots[index].tf.find((f) => f.file.endsWith(`/${name}`));
  file.text = file.text.replace(from, to);
};
const editModule = (name, from, to) => (inputs) => {
  const file = inputs.module.files.find((f) => f.file === `module/${name}`);
  file.text = file.text.replace(from, to);
};
const addWriter = (file, text) => (inputs) => {
  inputs.writers.push({ file, text });
};
/** The push command as a line of a script, built from its words. */
const pushLine = (separator = ' ') => `npx ${PUSH_WORDS.join(separator)} --project-ref abcdefghijklmnopqrst`;

/**
 * The self-test cases: an edit of the correct inputs, the finding ids the check must report (in any order), and,
 * where it matters, the roots the census must name as not applying a hook, per switch variable, and the files the
 * findings must name.
 */
const CASES = [
  { name: 'the correct inputs', edit: () => {}, expected: [] },
  {
    name: 'hosted disable_signup false (a must-agree key changed on the hosted side)',
    edit: editSettings((s) => (s.auth.disable_signup = false)),
    expected: ['auth/enable_signup']
  },
  {
    name: 'hosted db_schema with an extra schema',
    edit: editSettings((s) => (s.api.db_schema = 'public,graphql_public,private')),
    expected: ['api/schemas']
  },
  {
    name: 'hosted hook enabled as the string "true"',
    edit: editSettings((s) => (s.auth_hook.hook_custom_access_token_enabled = 'true')),
    expected: ['auth.hook.custom_access_token/enabled']
  },
  {
    name: 'max_rows changed in config.toml only',
    edit: editConfig('max_rows = 50000', 'max_rows = 49999'),
    expected: ['api/max_rows']
  },
  {
    name: 'pageSize changed',
    edit: (i) => (i.staticSettings.text = i.staticSettings.text.replace('pageSize: 50000', 'pageSize: 1000')),
    expected: ['api/max_rows']
  },
  {
    name: 'hosted jwt_exp longer than local (weaker)',
    edit: editSettings((s) => (s.auth.jwt_exp = 7200)),
    expected: ['auth/jwt_expiry']
  },
  {
    name: 'hosted jwt_exp shorter than local (stricter, passes)',
    edit: editSettings((s) => (s.auth.jwt_exp = 1800)),
    expected: []
  },
  {
    name: 'hosted password_min_length shorter than local (weaker)',
    edit: editSettings((s) => (s.auth.password_min_length = 6)),
    expected: ['auth/minimum_password_length']
  },
  {
    name: 'hosted smtp_max_frequency below the local duration',
    edit: editSettings((s) => (s.auth.smtp_max_frequency = 0)),
    expected: ['auth.email/max_frequency']
  },
  {
    name: 'local max_frequency in a form the guard cannot read',
    edit: editConfig('max_frequency = "1s"', 'max_frequency = "1d"'),
    expected: ['auth.email/max_frequency']
  },
  {
    name: 'local password_requirements not empty',
    edit: editConfig('password_requirements = ""', 'password_requirements = "letters_digits"'),
    expected: ['auth/password_requirements']
  },
  {
    name: 'a redirect path ending in *',
    edit: editSettings((s) => (s.redirect_callback_paths[1] = '/*/auth/*')),
    expected: ['auth/additional_redirect_urls']
  },
  {
    name: 'a redirect path holding **',
    edit: editSettings((s) => (s.redirect_callback_paths[1] = '/**/auth/confirm')),
    expected: ['auth/additional_redirect_urls']
  },
  {
    name: 'a third redirect path',
    edit: editSettings((s) => s.redirect_callback_paths.push('/en/auth/confirm')),
    expected: ['auth/additional_redirect_urls']
  },
  {
    name: 'an origin on http',
    edit: editRoot(0, '"https://staging.example.org"', '"http://staging.example.org"'),
    expected: ['auth/site_url']
  },
  {
    name: 'an origin with a path',
    edit: editRoot(0, '"https://staging.example.org"', '"https://staging.example.org/fi"'),
    expected: ['auth/site_url']
  },
  {
    name: 'an origin on a loopback host',
    edit: editRoot(1, '"https://vaa.example.org"', '"https://127.0.0.1"'),
    expected: ['auth/site_url']
  },
  {
    name: 'an origin with a host wildcard',
    edit: editRoot(0, '"https://staging.example.org"', '"https://*.example.org"'),
    expected: ['auth/site_url', 'auth/additional_redirect_urls']
  },
  {
    name: 'no origin at all',
    edit: (i) => {
      i.roots[0].tfvars.text = i.roots[0].tfvars.text.replace(/^public_origin.*\n/m, '');
      i.roots[1].tfvars.text = i.roots[1].tfvars.text.replace(/^public_origin.*\n/m, '');
    },
    expected: ['auth/site_url', 'auth/site_url', 'auth/site_url'],
    files: ['envs', 'envs/example/supabase/terraform.tfvars', 'envs/staging/supabase/terraform.tfvars']
  },
  {
    name: 'one root whose terraform.tfvars assigns no public_origin, next to one that does',
    edit: editRoot(1, /^public_origin.*\n/m, ''),
    expected: ['auth/site_url'],
    files: ['envs/example/supabase/terraform.tfvars']
  },
  {
    name: 'a Supabase root with no terraform.tfvars, next to one that has it',
    edit: (i) => (i.roots[1].tfvars = { file: 'envs/example/supabase/terraform.tfvars', text: '', missing: true }),
    expected: ['root/terraform.tfvars'],
    files: ['envs/example/supabase/terraform.tfvars']
  },
  { name: 'no Supabase root at all', edit: (i) => (i.roots = []), expected: ['auth/site_url'] },
  {
    name: 'a root with the hook switched off and no comment',
    edit: editRoot(0, 'enable_access_token_hook = true', 'enable_access_token_hook = false'),
    expected: ['auth.hook.custom_access_token/enabled']
  },
  {
    name: 'a root with the hook switched off and the stated comment (passes, named in the census)',
    edit: editRoot(
      0,
      'enable_access_token_hook = true',
      'enable_access_token_hook = false # hook off until the function is deployed to this project'
    ),
    expected: [],
    hookOff: { enable_access_token_hook: ['staging'] }
  },
  {
    name: 'a root leaving the hook at a default of false',
    edit: (i) => (i.variables.text = i.variables.text.replace('default     = true', 'default     = false')),
    expected: ['auth.hook.custom_access_token/enabled']
  },
  {
    name: 'hosted send-email hook switched off',
    edit: editSettings((s) => (s.auth_send_email_hook.hook_send_email_enabled = false)),
    expected: ['auth.hook.send_email/enabled']
  },
  {
    name: 'hosted send-email hook pointed at another function',
    edit: editSettings(
      (s) => (s.auth_send_email_hook.hook_send_email_uri = 'pg-functions://postgres/public/custom_access_token_hook')
    ),
    expected: ['auth.hook.send_email/uri']
  },
  {
    name: 'a root with the send-email hook switched off and no comment',
    edit: editRoot(0, 'enable_send_email_hook   = true', 'enable_send_email_hook   = false'),
    expected: ['auth.hook.send_email/enabled']
  },
  {
    name: 'a root with the send-email hook switched off and the stated comment (passes, named in the census)',
    edit: editRoot(
      0,
      'enable_send_email_hook   = true',
      'enable_send_email_hook   = false # hook off until the function is deployed to this project'
    ),
    expected: [],
    hookOff: { enable_send_email_hook: ['staging'] }
  },
  {
    name: 'a root leaving the send-email hook at a default of false',
    edit: (i) =>
      (i.variables.text = i.variables.text.replace(
        /(variable "enable_send_email_hook"[^}]*default\s*=\s*)true/,
        '$1false'
      )),
    expected: ['auth.hook.send_email/enabled']
  },
  {
    name: 'a module that declares no send-email hook switch',
    edit: (i) => (i.variables.text = i.variables.text.replace('variable "enable_send_email_hook"', 'variable "other"')),
    expected: ['auth.hook.send_email/enabled']
  },
  // The value a root's call of the module sends, resolved the way Terraform resolves it.
  {
    name: 'a root that leaves the send-email hook out of terraform.tfvars, with a root default of false',
    edit: (i) => {
      editRoot(0, 'enable_send_email_hook   = true\n', '')(i);
      editRootTf(
        0,
        'variables.tf',
        'variable "enable_send_email_hook" {\n  type     = bool\n',
        'variable "enable_send_email_hook" {\n  type     = bool\n  default  = false\n'
      )(i);
    },
    expected: ['auth.hook.send_email/enabled'],
    files: ['envs/staging/supabase/variables.tf']
  },
  {
    name: 'a root that leaves the send-email hook out of terraform.tfvars, with a root default of true (passes)',
    edit: (i) => {
      editRoot(0, 'enable_send_email_hook   = true\n', '')(i);
      editRootTf(
        0,
        'variables.tf',
        'variable "enable_send_email_hook" {\n  type     = bool\n',
        'variable "enable_send_email_hook" {\n  type     = bool\n  default  = true\n'
      )(i);
    },
    expected: []
  },
  {
    name: 'a root that leaves the access-token hook out of terraform.tfvars, with no root default',
    edit: editRoot(0, 'enable_access_token_hook = true\n', ''),
    expected: ['auth.hook.custom_access_token/enabled'],
    files: ['envs/staging/supabase/terraform.tfvars']
  },
  {
    name: 'a module call passing the send-email hook a literal false',
    edit: editRootTf(
      0,
      'main.tf',
      'enable_send_email_hook   = var.enable_send_email_hook',
      'enable_send_email_hook   = false'
    ),
    expected: ['auth.hook.send_email/enabled'],
    files: ['envs/staging/supabase/main.tf']
  },
  {
    name: 'a module call passing a literal false with the stated comment (passes, named in the census)',
    edit: editRootTf(
      0,
      'main.tf',
      'enable_access_token_hook = var.enable_access_token_hook',
      'enable_access_token_hook = false # hook off until the function is deployed to this project'
    ),
    expected: [],
    hookOff: { enable_access_token_hook: ['staging'] }
  },
  {
    name: 'a module call passing a literal true over a terraform.tfvars false (passes: the call decides)',
    edit: (i) => {
      editRoot(0, 'enable_send_email_hook   = true', 'enable_send_email_hook   = false')(i);
      editRootTf(
        0,
        'main.tf',
        'enable_send_email_hook   = var.enable_send_email_hook',
        'enable_send_email_hook   = true'
      )(i);
    },
    expected: []
  },
  {
    name: 'a module call passing a hook switch an expression the guard cannot read',
    edit: editRootTf(
      0,
      'main.tf',
      'enable_access_token_hook = var.enable_access_token_hook',
      'enable_access_token_hook = local.hooks_on'
    ),
    expected: ['auth.hook.custom_access_token/enabled']
  },
  {
    name: 'a module call passing a hook switch from a variable the root does not declare',
    edit: editRootTf(0, 'variables.tf', 'variable "enable_access_token_hook"', 'variable "other"'),
    expected: ['auth.hook.custom_access_token/enabled']
  },
  {
    name: 'a module call passing a literal loopback origin',
    edit: editRootTf(
      0,
      'main.tf',
      'public_origin            = var.public_origin',
      'public_origin            = "https://127.0.0.1"'
    ),
    expected: ['auth/site_url'],
    files: ['envs/staging/supabase/main.tf']
  },
  {
    name: 'a module call passing the origin an expression the guard cannot read',
    edit: editRootTf(
      0,
      'main.tf',
      'public_origin            = var.public_origin',
      'public_origin            = local.origin'
    ),
    expected: ['auth/site_url']
  },
  {
    name: 'a root whose module block calls another module',
    edit: editRootTf(0, 'main.tf', '"../../../modules/supabase"', '"../../../modules/other"'),
    expected: ['root/module-call']
  },
  {
    name: 'an unclassified key added under [auth]',
    edit: editConfig('enable_manual_linking = false\n', 'enable_manual_linking = false\nsecurity_captcha = false\n'),
    expected: ['auth/security_captcha']
  },
  {
    name: 'an unclassified table added under [auth.*]',
    edit: editConfig(
      '[auth.web3.solana]',
      '[auth.hook.mfa_verification_attempt]\nenabled = true\n\n[auth.web3.solana]'
    ),
    expected: ['auth.hook.mfa_verification_attempt/enabled']
  },
  {
    name: 'a quoted table header after a table outside the family',
    edit: (i) => (i.config.text += '\n[auth.external."github"]\nenabled = true\n'),
    expected: ['auth.external.github/enabled']
  },
  {
    name: 'a table header with spaces around its dots after a table outside the family',
    edit: (i) => (i.config.text += '\n[auth . external . google]\nenabled = true\n'),
    expected: ['auth.external.google/enabled']
  },
  {
    name: 'a table header the line read cannot read, after a table outside the family',
    edit: (i) => (i.config.text += '\n[auth.external."git hub"]\nenabled = true\n'),
    expected: ['config/table-header', '(unreadable)/enabled']
  },
  {
    name: 'a classified key removed',
    edit: editConfig('enable_manual_linking = false\n', ''),
    expected: ['auth/enable_manual_linking']
  },
  {
    name: 'a classified key commented out',
    edit: editConfig('jwt_expiry = 3600', '# jwt_expiry = 3600'),
    expected: ['auth/jwt_expiry']
  },
  {
    name: 'an unclassified [functions.*] table added',
    edit: editConfig(
      '[functions.identity-callback]',
      '[functions.new-function]\nverify_jwt = false\n\n[functions.identity-callback]'
    ),
    expected: ['functions.new-function/verify_jwt']
  },
  {
    name: 'a classified [functions.*] table removed',
    edit: editConfig('[functions.identity-callback]\nverify_jwt = false\n', ''),
    expected: ['functions.identity-callback/verify_jwt']
  },
  {
    name: 'a quoted value containing #',
    edit: editConfig('site_url = "http://127.0.0.1:5173"', 'site_url = "http://127.0.0.1:5173/#x"'),
    expected: ['auth/site_url']
  },
  {
    name: 'a key written twice in one table',
    edit: editConfig('otp_length = 6\notp_expiry', 'otp_length = 6\notp_length = 8\notp_expiry'),
    expected: ['auth.email/otp_length']
  },
  {
    name: 'an array JSON.parse rejects',
    edit: editConfig('schemas = ["public", "graphql_public"]', 'schemas = ["public", "graphql_public",]'),
    expected: ['api/schemas']
  },
  {
    name: 'a hosted key no row compares',
    edit: editSettings((s) => (s.auth.mfa_max_enrolled_factors = 10)),
    expected: ['hosted/auth.mfa_max_enrolled_factors']
  },
  {
    name: 'a hosted key a row compares removed',
    edit: editSettings((s) => delete s.auth.mailer_otp_length),
    expected: ['auth.email/otp_length']
  },
  { name: 'hosted settings that are not JSON', edit: (i) => (i.settings.text = '{ "api": '), expected: ['(channel)'] },
  // The JSON is encoded.
  {
    name: 'the settings file without its read of the auth group (the hook groups still read)',
    edit: editModule('settings.tf', '    local.hosted.auth,\n', '    {},\n'),
    expected: ['module/local.hosted.auth', 'module/local.auth']
  },
  {
    name: 'the settings file without its read of the send-email hook group',
    edit: editModule(
      'settings.tf',
      '{ for k, v in local.hosted.auth_send_email_hook :',
      '{ for k, v in local.hosted.auth_hook :'
    ),
    expected: ['module/local.hosted.auth_send_email_hook']
  },
  {
    name: 'the auth group read only in a comment',
    edit: editModule('settings.tf', '    local.hosted.auth,\n', '    # local.hosted.auth,\n'),
    expected: ['module/local.hosted.auth', 'module/local.auth']
  },
  {
    name: 'the module reading another file than hosted-settings.json',
    edit: editModule('settings.tf', '/hosted-settings.json")', '/settings.json")'),
    expected: ['module/hosted-settings.json', 'module/decode']
  },
  {
    name: 'the settings resource taking another expression than the encoded auth local',
    edit: editModule('main.tf', 'auth        = jsonencode(local.auth)', 'auth        = jsonencode(local.hosted.auth)'),
    expected: ['module/supabase_settings.auth']
  },
  {
    name: 'the settings resource without the encoded api local',
    edit: editModule('main.tf', '  api         = jsonencode(local.api)\n', ''),
    expected: ['module/supabase_settings.api']
  },
  // Known keys and one owner per key.
  {
    name: 'a JSON key outside the known list (the local name written for the hosted one)',
    edit: editSettings((s) => (s.auth.jwt_expiry = 3600)),
    expected: ['hosted/auth.jwt_expiry', 'known/auth.jwt_expiry']
  },
  {
    name: 'an auth key in the api group',
    edit: editSettings((s) => (s.api.jwt_exp = 3600)),
    expected: ['hosted/api.jwt_exp', 'known/api.jwt_exp']
  },
  {
    name: 'a JSON-owned key written in a .tf text',
    edit: editModule(
      'settings.tf',
      '    site_url       = var.public_origin\n',
      '    site_url       = var.public_origin\n    jwt_exp        = 7200\n'
    ),
    expected: ['owned/jwt_exp']
  },
  {
    name: 'a JSON-owned key written as a quoted map key',
    edit: editModule(
      'settings.tf',
      '  api = local.hosted.api',
      '  api = merge(local.hosted.api, { "max_rows" = 1000 })'
    ),
    expected: ['owned/max_rows', 'module/local.api', 'module/merge']
  },
  {
    name: 'a known key the JSON does not hold, sent from the HCL',
    edit: editModule('settings.tf', '  api = local.hosted.api', '  api = merge(local.hosted.api, { db_pool = 10 })'),
    expected: ['owned/db_pool', 'module/local.api', 'module/merge']
  },
  // What local.auth and local.api are built from.
  {
    name: 'a map(any) variable merged last into local.auth',
    edit: (i) => {
      editModule('settings.tf', '    local.auth_smtp,\n  )', '    local.auth_smtp,\n    var.extra_auth,\n  )')(i);
      editModule(
        'variables.tf',
        'variable "smtp" {',
        'variable "extra_auth" {\n  type    = map(any)\n  default = {}\n}\n\nvariable "smtp" {'
      )(i);
    },
    expected: ['module/local.auth', 'module/variable-type']
  },
  {
    name: 'a second JSON file merged last into local.auth',
    edit: editModule(
      'settings.tf',
      '    local.auth_smtp,\n  )',
      '    local.auth_smtp,\n    jsondecode(file("${path.module}/extra.json")),\n  )'
    ),
    expected: ['module/local.auth', 'module/decode']
  },
  {
    name: 'the maps of local.auth in another order',
    edit: editModule(
      'settings.tf',
      '    local.hosted.auth,\n    local.auth_hook,\n',
      '    local.auth_hook,\n    local.hosted.auth,\n'
    ),
    expected: ['module/local.auth']
  },
  {
    name: 'a map merged into one of the maps local.auth merges',
    edit: editModule(
      'settings.tf',
      '= { for k, v in local.hosted.auth_hook : k => v if var.enable_access_token_hook }',
      '= merge(var.extra_hook, { for k, v in local.hosted.auth_hook : k => v if var.enable_access_token_hook })'
    ),
    expected: ['module/merge']
  },
  {
    name: 'a second file decoded into a local',
    edit: editModule(
      'settings.tf',
      '  api = local.hosted.api',
      '  api   = local.hosted.api\n  extra = yamldecode(file("${path.module}/extra.yaml"))'
    ),
    expected: ['module/decode']
  },
  {
    name: 'local.auth defined twice',
    edit: editModule(
      'settings.tf',
      '  api = local.hosted.api',
      '  api = local.hosted.api\n}\n\nlocals {\n  auth = local.hosted.auth'
    ),
    expected: ['module/local.auth', 'module/merge']
  },
  {
    name: 'an HCL-owned key misspelled',
    edit: editModule('variables.tf', '    rate_limit_verify ', '    rate_limit_verfy  '),
    expected: ['owned/rate_limit_verify']
  },
  {
    name: 'an HCL-owned key put in the JSON',
    edit: editSettings((s) => (s.auth.site_url = 'https://staging.example.org')),
    expected: ['hosted/auth.site_url', 'owned/site_url']
  },
  // The project block.
  {
    name: 'a project block without prevent_destroy (still named in a comment)',
    edit: editModule('main.tf', '    prevent_destroy = true\n', ''),
    expected: ['module/supabase_project']
  },
  {
    name: 'a project block with prevent_destroy false',
    edit: editModule('main.tf', 'prevent_destroy = true', 'prevent_destroy = false'),
    expected: ['module/supabase_project']
  },
  {
    name: 'a project block without the password ignore',
    edit: editModule('main.tf', 'ignore_changes  = [database_password]', 'ignore_changes  = [name]'),
    expected: ['module/supabase_project']
  },
  {
    name: 'a project block whose protections sit outside its lifecycle block',
    edit: editModule(
      'main.tf',
      '  lifecycle {\n    prevent_destroy = true\n    ignore_changes  = [database_password]\n  }\n',
      '  prevent_destroy = true\n  ignore_changes  = [database_password]\n'
    ),
    expected: ['module/supabase_project']
  },
  {
    name: 'a module whose main.tf holds no project block',
    edit: editModule('main.tf', 'resource "supabase_project" "this"', 'resource "supabase_projects" "this"'),
    expected: ['module/supabase_project']
  },
  // The type trap.
  {
    name: 'a conditional with an empty-object branch',
    edit: editModule('settings.tf', 'var.smtp == null ? null : {', 'var.smtp == null ? {} : {'),
    expected: ['module/empty-object-branch']
  },
  {
    name: 'a conditional with tomap({}) as its other branch',
    edit: editModule(
      'settings.tf',
      'auth_hook            = { for k, v in local.hosted.auth_hook : k => v if var.enable_access_token_hook }',
      'auth_hook            = var.enable_access_token_hook ? local.hosted.auth_hook : tomap({})'
    ),
    expected: ['module/empty-object-branch']
  },
  { name: 'a module directory with no .tf file', edit: (i) => (i.module.files = []), expected: ['(channel)'] },
  // One writer.
  {
    name: 'a workflow text holding the push command',
    edit: addWriter('.github/workflows/deploy.yaml', `${CORRECT_WORKFLOW}      - run: ${pushLine()}\n`),
    expected: ['writer/config-push'],
    files: ['.github/workflows/deploy.yaml']
  },
  {
    name: 'a package.json script holding the push command',
    edit: addWriter('package.json', `{ "scripts": { "settings": "${pushLine()}" } }\n`),
    expected: ['writer/config-push'],
    files: ['package.json']
  },
  {
    name: 'the push command split across a line continuation in an infra script',
    edit: addWriter('infra/scripts/apply.sh', `#!/usr/bin/env bash\n${pushLine(' \\\n  ')}\n`),
    expected: ['writer/config-push'],
    files: ['infra/scripts/apply.sh']
  },
  {
    name: 'the push command run through npx with a version pin',
    edit: addWriter('infra/scripts/apply.sh', `npx ${PUSH_WORDS[0]}@latest ${PUSH_WORDS[1]} ${PUSH_WORDS[2]}\n`),
    expected: ['writer/config-push']
  },
  {
    name: 'the push command run through bunx with an exact version',
    edit: addWriter('infra/scripts/apply.sh', `bunx ${PUSH_WORDS[0]}@2.40.0 ${PUSH_WORDS[1]} ${PUSH_WORDS[2]}\n`),
    expected: ['writer/config-push']
  },
  {
    name: 'the push command with a global flag before its middle word',
    edit: addWriter('scripts/settings.sh', `${PUSH_WORDS[0]} --debug ${PUSH_WORDS[1]} ${PUSH_WORDS[2]}\n`),
    expected: ['writer/config-push']
  },
  {
    name: 'the push command with a flag and its value before its middle word',
    edit: addWriter(
      'scripts/settings.sh',
      `${PUSH_WORDS[0]} --workdir apps/supabase ${PUSH_WORDS[1]} --debug ${PUSH_WORDS[2]}\n`
    ),
    expected: ['writer/config-push']
  },
  {
    name: 'the push command as the words of an exec-form array',
    edit: addWriter('scripts/settings.mjs', `spawnSync('npx', ["${PUSH_WORDS.join('", "')}"]);\n`),
    expected: ['writer/config-push']
  },
  {
    name: 'the push command in a script under apps/supabase/',
    edit: addWriter('apps/supabase/scripts/sync.sh', `${pushLine()}\n`),
    expected: ['writer/config-push'],
    files: ['apps/supabase/scripts/sync.sh']
  },
  {
    name: 'the push command in a script under tests/scripts/',
    edit: addWriter('tests/scripts/reset.sh', `${pushLine()}\n`),
    expected: ['writer/config-push'],
    files: ['tests/scripts/reset.sh']
  },
  {
    name: 'another command of the CLI that pushes the database, not the settings (passes)',
    edit: addWriter('apps/supabase/scripts/migrate.sh', `npx ${PUSH_WORDS[0]}@latest db ${PUSH_WORDS[2]} --local\n`),
    expected: []
  },
  {
    name: "the guard's own source and fixture directory holding the push command (excluded by path)",
    edit: (i) => {
      addWriter(SELF, pushLine())(i);
      addWriter('scripts/fixtures/hosted-settings-parity/notes.txt', pushLine())(i);
    },
    expected: []
  },
  {
    name: 'the push command in a file outside the scanned paths',
    edit: addWriter('docs/deploy.md', `Never run \`${pushLine()}\`.\n`),
    expected: []
  }
];

function selfTest() {
  let ok = true;
  const correct = JSON.stringify(correctInputs());
  for (const [index, { name, edit, expected, hookOff = {}, files }] of CASES.entries()) {
    const inputs = correctInputs();
    edit(inputs);
    if (index > 0 && JSON.stringify(inputs) === correct) {
      console.log(`self-test: FAIL  ${name}: the case inputs equal the correct ones, so it tests nothing`);
      ok = false;
      continue;
    }
    const result = check(inputs);
    const observed = result.channelErrors.length > 0 ? ['(channel)'] : result.findings.map((f) => f.id);
    const sortedObserved = [...observed].sort();
    const sortedExpected = [...expected].sort();
    let same =
      sortedObserved.length === sortedExpected.length && sortedObserved.every((o, i) => o === sortedExpected[i]);
    // The roots named as not applying a hook, per switch, as one comparable line.
    const offLine = (off) =>
      HOOK_SWITCHES.map(({ variable }) => (off[variable] ?? []).join(','))
        .map((roots, i) => (roots === '' ? '' : `${HOOK_SWITCHES[i].variable}=${roots}`))
        .filter((part) => part !== '')
        .join(' ');
    const observedOff = result.census ? offLine(result.census.hookOff) : '';
    const expectedOff = offLine(hookOff);
    if (same && result.census && observedOff !== expectedOff) same = false;
    const observedFiles = [...new Set(result.findings.map((f) => f.file))].sort().join(', ');
    const expectedFiles = files === undefined ? null : [...files].sort().join(', ');
    if (same && expectedFiles !== null && observedFiles !== expectedFiles) same = false;
    console.log(
      `self-test: ${same ? 'pass' : 'FAIL'}  ${name}: reported [${observed.join(', ')}], expected [${expected.join(', ')}]` +
        (observedOff !== '' || expectedOff !== ''
          ? `; hook not applied in [${observedOff}], expected [${expectedOff}]`
          : '') +
        (expectedFiles !== null ? `; in [${observedFiles}], expected [${expectedFiles}]` : '')
    );
    if (!same) ok = false;
  }
  console.error(`Hosted-settings parity guard — self-test ${ok ? 'passed' : 'FAILED'}: ${CASES.length} case(s).`);
  process.exitCode = ok ? 0 : 1;
}

// ── Gate ──

function display(absolute) {
  const relative = path.relative(REPO_ROOT, absolute);
  return relative.startsWith('..') || path.isAbsolute(relative) ? absolute : relative;
}

function readChannel(absolute) {
  try {
    return { file: display(absolute), text: readFileSync(absolute, 'utf8') };
  } catch (error) {
    return { file: display(absolute), text: null, error: `could not be read (${error.code ?? error.message})` };
  }
}

/**
 * The Supabase roots under the environments directory: every directory `<env>/<root>` that is named `supabase` or whose
 * `.tf` files call the Supabase module. A root without a `terraform.tfvars` is kept, marked missing, so that the check
 * reports it rather than skipping it.
 */
function readRoots(envsDir) {
  let entries;
  try {
    entries = readdirSync(envsDir, { withFileTypes: true });
  } catch (error) {
    return { roots: [], error: `could not be read as a directory (${error.code ?? error.message})` };
  }
  const byName = (a, b) => a.name.localeCompare(b.name);
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

/** The module's `.tf` files, one level deep, by name. */
function readModule(moduleDir) {
  let entries;
  try {
    entries = readdirSync(moduleDir, { withFileTypes: true });
  } catch (error) {
    return {
      dir: display(moduleDir),
      files: [],
      error: `could not be read as a directory (${error.code ?? error.message})`
    };
  }
  return { dir: display(moduleDir), files: readTfFiles(moduleDir), error: null };
}

/** The tracked files in the scope of the second-writer scan. A file listed but absent from the tree holds nothing. */
function readWriters() {
  let tracked;
  try {
    tracked = execFileSync('git', ['ls-files', '-z'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
      .split('\0')
      .filter((f) => f !== '');
  } catch (error) {
    return { writers: [], error: `could not list the tracked files (${error.message.split('\n')[0]})` };
  }
  const writers = [];
  for (const file of tracked.filter(writerInScope)) {
    try {
      writers.push({ file, text: readFileSync(path.join(REPO_ROOT, file), 'utf8') });
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') continue;
      return { writers, error: `${file} could not be read (${error.code ?? error.message})` };
    }
  }
  return { writers, error: null };
}

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
    `structure: ${structure.files} .tf file(s) of ${structure.dir}; ${structure.groupsRead} of ${structure.groups} JSON group(s) read; ` +
      `${HCL_OWNED_KEYS.length} HCL-owned key(s); ${structure.writersScanned} tracked file(s) scanned for a second writer of hosted settings.`
  );
  console.error(
    result.findings.length === 0
      ? `Hosted-settings parity guard — every classified key holds between ${inputs.config.file}, ${inputs.settings.file} and the Supabase roots under ${inputs.envsDir}.`
      : `Hosted-settings parity guard — ${result.findings.length} finding(s).`
  );
  process.exitCode = result.findings.length === 0 ? 0 : 1;
}

// ── Arguments ──

function usage(message) {
  console.error(`${SELF}: ${message}`);
  console.error(
    `usage: node ${SELF} [--self-test | [--config <file>] [--settings <file>] [--static-settings <file>] [--envs-dir <dir>] [--module-dir <dir>]]`
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
const argv = process.argv.slice(2);
const given = {};
let selfTestMode = false;
let usageError = null;
for (let i = 0; i < argv.length && usageError === null; i += 1) {
  const a = argv[i];
  if (a === '--self-test') selfTestMode = true;
  else if (a in FLAGS) {
    const value = argv[i + 1];
    i += 1;
    if (value === undefined || value.startsWith('--')) usageError = `${a} requires a path`;
    else if (FLAGS[a] in given) usageError = `${a} given twice`;
    else given[FLAGS[a]] = path.resolve(process.cwd(), value);
  } else usageError = `unexpected argument '${a}'`;
}
if (usageError === null && selfTestMode && Object.keys(given).length > 0)
  usageError = '--self-test takes no other flag';

if (usageError !== null) usage(usageError);
else if (selfTestMode) selfTest();
else {
  const paths = Object.fromEntries(Object.entries(DEFAULT_PATHS).map(([k, v]) => [k, path.resolve(REPO_ROOT, v)]));
  gate({ ...paths, ...given });
}
