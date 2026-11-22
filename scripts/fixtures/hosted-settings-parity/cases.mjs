/**
 * The self-test inputs and cases of `scripts/assert-hosted-settings-parity.mjs`: a correct set of inputs, the edits
 * the cases apply to a fresh copy of it, and each case's expected findings. The guard's `--self-test` runs every case
 * through its check.
 *
 * This directory is excluded from the guard's second-writer scan by path, so the push command may appear here.
 */

/** The guard these cases test, as its second-writer scan names it. */
const GUARD = 'scripts/assert-hosted-settings-parity.mjs';

/** The words of the CLI's configuration-push command, as the guard holds them. */
const PUSH_WORDS = ['supabase', 'config', 'push'];

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
export function correctInputs() {
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
/** Replaces text of the local configuration. */
function editConfig(from, to) {
  return (inputs) => {
    inputs.config.text = inputs.config.text.replace(from, to);
  };
}

/** Replaces text of one root's `terraform.tfvars`. */
function editRoot(index, from, to) {
  return (inputs) => {
    inputs.roots[index].tfvars.text = inputs.roots[index].tfvars.text.replace(from, to);
  };
}

/** Replaces text of one `.tf` file of a root, by its file name. */
function editRootTf(index, name, from, to) {
  return (inputs) => {
    const file = inputs.roots[index].tf.find((f) => f.file.endsWith(`/${name}`));
    file.text = file.text.replace(from, to);
  };
}

/** Replaces text of one of the module's `.tf` files. */
function editModule(name, from, to) {
  return (inputs) => {
    const file = inputs.module.files.find((f) => f.file === `module/${name}`);
    file.text = file.text.replace(from, to);
  };
}

/** Adds a file to those scanned for a second writer. */
function addWriter(file, text) {
  return (inputs) => {
    inputs.writers.push({ file, text });
  };
}

/** The push command as a line of a script, built from its words. */
function pushLine(separator = ' ') {
  return `npx ${PUSH_WORDS.join(separator)} --project-ref abcdefghijklmnopqrst`;
}

/**
 * The self-test cases: an edit of the correct inputs, the finding ids the check must report (in any order), and,
 * where it matters, the roots the census must name as not applying a hook, per switch variable, and the files the
 * findings must name.
 */
export const CASES = [
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
    expected: ['config/table-header', 'unreadable-table-header/enabled']
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
  // The JSON is sent.
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
    expected: ['module/local.auth']
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
      addWriter(GUARD, pushLine())(i);
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
