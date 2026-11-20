/**
 * Specification for the hosted-settings reference page, `developers-guide/deployment/hosted-settings` of the docs site: every hosted setting the Supabase module writes is listed on the page, by name, in backticks.
 *
 * The names are read from the module's files: every key of `hosted-settings.json` at any depth, a key whose value is `false` or an array included; the keys of the `auth_origin` and `auth_smtp` blocks of `settings.tf`; the attributes of the `auth_rate_limits` object of `variables.tf`; the keys of the `smtp_secret` settings resource of `main.tf`; and the strings of `function_secret_names` in `function-secrets.tf`. A name counts as listed only as a whole backticked token, so `mfa_totp_enroll_enabled` does not list `mfa_totp_verify_enabled` and a name in prose without backticks lists nothing. An absent page, an absent or unparsable source and a source block that cannot be found are each a problem naming the file, so the check never passes on empty input. The page's order is free; the problems list in the order the names are read from the sources.
 *
 * Every backticked token on the page shaped like a probe check's name, a prefix `api.`, `auth.`, `functions.`, `rows.`, `storage.` or `db.` or the name `no-seed`, is the `name` of a check of `infra/scripts/probe/checks.mjs`, so a how-to-verify cell never cites a check the probe does not run.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CHECKS } from './probe/checks.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');

/** The reference page, relative to the repository root. */
const PAGE_PATH = 'apps/docs/src/routes/(content)/developers-guide/deployment/hosted-settings/+page.md';

/** The module's files the names are read from, relative to the repository root. */
const SOURCE_PATHS = {
  settingsJson: 'infra/modules/supabase/hosted-settings.json',
  settingsTf: 'infra/modules/supabase/settings.tf',
  variablesTf: 'infra/modules/supabase/variables.tf',
  mainTf: 'infra/modules/supabase/main.tf',
  functionSecretsTf: 'infra/modules/supabase/function-secrets.tf'
} as const;

/** The name of one source file, a key of {@link SOURCE_PATHS}. */
type SourceKey = keyof typeof SOURCE_PATHS;

/** The probe's check registry, relative to the repository root, whose `name` values are the checks the page may cite. */
const CHECKS_PATH = 'infra/scripts/probe/checks.mjs';

/** What {@link hostedSettingsReferenceProblems} checks: the page text, the text of each source, each `undefined` when its file is absent, and the names of the probe's checks. */
type HostedSettingsReferenceInput = {
  /** The reference page's text. */
  page: string | undefined;
  /** The `name` of every check of the probe's registry. */
  checkNames: ReadonlyArray<string>;
} & Record<SourceKey, string | undefined>;

/** The names one source yields, or the problem that kept them from being read. */
type SourceNames = { names: Array<string> } | { problem: string };

/**
 * Every key of a parsed JSON value at any depth, in document order, each object's key before the keys inside its value; the items of an array are not descended into.
 *
 * @param value - The parsed value.
 * @returns The keys, an empty array for a value that is not an object.
 */
function jsonKeys(value: unknown): Array<string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, inner]) => [key, ...jsonKeys(inner)]);
}

/**
 * The keys assigned in a block of HCL: every `name =` at the start of a line of the block's text.
 *
 * @param block - The block's text, without its opening line.
 * @returns The keys, in the order they are written.
 */
function assignedKeys(block: string): Array<string> {
  return Array.from(block.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/gm), (match) => match[1]);
}

/**
 * The names of `hosted-settings.json`: every key at any depth.
 *
 * @param text - The file's text.
 * @returns The keys, or a problem when the text is not a JSON object.
 */
function settingsJsonNames(text: string): SourceNames {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { problem: `${SOURCE_PATHS.settingsJson}: is not valid JSON` };
  }
  const names = jsonKeys(parsed);
  return names.length === 0 ? { problem: `${SOURCE_PATHS.settingsJson}: holds no key` } : { names };
}

/** The two blocks of `settings.tf` whose keys the module writes, each matched from its opening line to the first line that is a closing brace. */
const SETTINGS_TF_BLOCKS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: 'auth_origin', pattern: /^\s*auth_origin\s*=\s*\{\n([\s\S]*?)^\s*\}/m },
  { label: 'auth_smtp', pattern: /^\s*auth_smtp\s*=[^\n]*\{\n([\s\S]*?)^\s*\}/m }
];

/**
 * The names of `settings.tf`: the keys of its `auth_origin` and `auth_smtp` blocks.
 *
 * @param text - The file's text.
 * @returns The keys, or a problem naming the first block that is not found.
 */
function settingsTfNames(text: string): SourceNames {
  const names: Array<string> = [];
  for (const { label, pattern } of SETTINGS_TF_BLOCKS) {
    const block = pattern.exec(text)?.[1];
    const keys = block === undefined ? [] : assignedKeys(block);
    if (keys.length === 0) return { problem: `${SOURCE_PATHS.settingsTf}: has no \`${label}\` block with keys` };
    names.push(...keys);
  }
  return { names };
}

/**
 * The names of `variables.tf`: the attributes of the `object({ ... })` type of the `auth_rate_limits` variable.
 *
 * @param text - The file's text.
 * @returns The attributes, or a problem when the variable or its object type is not found.
 */
function rateLimitNames(text: string): SourceNames {
  const block = /^variable\s+"auth_rate_limits"\s*\{[\s\S]*?type\s*=\s*object\(\{\n([\s\S]*?)^\s*\}\)/m.exec(text)?.[1];
  const names = block === undefined ? [] : assignedKeys(block);
  return names.length === 0
    ? { problem: `${SOURCE_PATHS.variablesTf}: has no \`auth_rate_limits\` variable with an object type` }
    : { names };
}

/**
 * The names of `main.tf`: the keys of the `jsonencode({ ... })` of the `smtp_secret` settings resource.
 *
 * @param text - The file's text.
 * @returns The keys, or a problem when the resource or its encoded object is not found.
 */
function smtpSecretNames(text: string): SourceNames {
  const block = /^resource\s+"supabase_settings"\s+"smtp_secret"\s*\{[\s\S]*?jsonencode\(\{\n([\s\S]*?)^\s*\}\)/m.exec(
    text
  )?.[1];
  const names = block === undefined ? [] : assignedKeys(block);
  return names.length === 0
    ? { problem: `${SOURCE_PATHS.mainTf}: has no \`smtp_secret\` settings resource with an encoded object` }
    : { names };
}

/**
 * The names of `function-secrets.tf`: every string of the `function_secret_names` local, up to the line that closes its `concat(`.
 *
 * @param text - The file's text.
 * @returns The names, or a problem when the local is not found.
 */
function functionSecretNames(text: string): SourceNames {
  const block = /^\s*function_secret_names\s*=\s*concat\(\n([\s\S]*?)^\s*\)/m.exec(text)?.[1];
  const names = block === undefined ? [] : Array.from(block.matchAll(/"([^"\n]+)"/g), (match) => match[1]);
  return names.length === 0
    ? { problem: `${SOURCE_PATHS.functionSecretsTf}: has no \`function_secret_names\` local with names` }
    : { names };
}

/** Each source with the reader of its names, in the order the problems list. */
const READERS: ReadonlyArray<{ key: SourceKey; read: (text: string) => SourceNames }> = [
  { key: 'settingsJson', read: settingsJsonNames },
  { key: 'settingsTf', read: settingsTfNames },
  { key: 'variablesTf', read: rateLimitNames },
  { key: 'mainTf', read: smtpSecretNames },
  { key: 'functionSecretsTf', read: functionSecretNames }
];

/** The shape of a probe check's name: a known prefix and a lower-case, hyphenated name, or `no-seed`. */
const PROBE_CHECK_SHAPE = /^(?:(?:api|auth|functions|rows|storage|db)\.[a-z0-9]+(?:-[a-z0-9]+)*|no-seed)$/;

/**
 * Every whole text in single backticks on a page.
 *
 * @param page - The page's text.
 * @returns The set of backticked tokens.
 */
function backtickedTokens(page: string): Set<string> {
  return new Set(Array.from(page.matchAll(/`([^`\n]+)`/g), (match) => match[1]));
}

/**
 * List every hosted setting the reference page does not list, and every probe check it cites that the registry does not define. It reads nothing but its arguments.
 *
 * @param input - The page text, the source texts and the check names, see {@link HostedSettingsReferenceInput}.
 * @returns One string per problem, each naming the setting and its file, the cited check and the registry, or the file that could not be read; an empty array when the page lists every name and cites only defined checks.
 */
function hostedSettingsReferenceProblems(input: HostedSettingsReferenceInput): Array<string> {
  const problems: Array<string> = [];
  if (input.page === undefined) problems.push(`${PAGE_PATH}: the page is absent`);
  const listed = backtickedTokens(input.page ?? '');
  const seen = new Set<string>();
  for (const { key, read } of READERS) {
    const path = SOURCE_PATHS[key];
    const text = input[key];
    if (text === undefined) {
      problems.push(`${path}: the file is absent`);
      continue;
    }
    const result = read(text);
    if ('problem' in result) {
      problems.push(result.problem);
      continue;
    }
    if (input.page === undefined) continue;
    for (const name of result.names) {
      if (seen.has(name)) continue;
      seen.add(name);
      if (!listed.has(name)) problems.push(`${name} (${path}): is not listed on the page in backticks`);
    }
  }
  if (input.checkNames.length === 0) {
    problems.push(`${CHECKS_PATH}: defines no check name`);
    return problems;
  }
  for (const token of listed) {
    if (PROBE_CHECK_SHAPE.test(token) && !input.checkNames.includes(token))
      problems.push(
        `${token}: is cited on the page as a probe check, but ${CHECKS_PATH} defines no check of that name`
      );
  }
  return problems;
}

/** A fixture `hosted-settings.json`, with a `false` leaf, an array and keys at two depths. */
const FIXTURE_JSON = JSON.stringify({
  api: { max_rows: 50000 },
  auth: { mailer_autoconfirm: false, mfa_totp_enroll_enabled: false, mfa_totp_verify_enabled: false },
  redirect_callback_paths: ['/auth/confirm']
});

/** A fixture `settings.tf` with both blocks, and a key outside them that is no setting. */
const FIXTURE_SETTINGS_TF = [
  'locals {',
  '  hosted = jsondecode(file("hosted-settings.json"))',
  '  auth_origin = {',
  '    site_url       = var.public_origin',
  '    uri_allow_list = "x"',
  '  }',
  '  auth_smtp = var.smtp == null ? null : {',
  '    smtp_host = var.smtp.host',
  '  }',
  '}',
  ''
].join('\n');

/** A fixture `variables.tf` with the rate-limit object and another variable before it. */
const FIXTURE_VARIABLES_TF = [
  'variable "region" {',
  '  type = string',
  '}',
  '',
  'variable "auth_rate_limits" {',
  '  description = "Rate limits."',
  '  type = object({',
  '    rate_limit_otp        = optional(number, 30)',
  '    rate_limit_email_sent = optional(number, 100)',
  '  })',
  '}',
  ''
].join('\n');

/** A fixture `main.tf` with the SMTP secret resource after the main settings resource. */
const FIXTURE_MAIN_TF = [
  'resource "supabase_settings" "this" {',
  '  auth = jsonencode(local.auth)',
  '}',
  '',
  'resource "supabase_settings" "smtp_secret" {',
  '  auth = jsonencode({',
  '    smtp_user = var.smtp_user',
  '    smtp_pass = var.smtp_password',
  '  })',
  '}',
  ''
].join('\n');

/** A fixture `function-secrets.tf` with names in both arms of the `concat(`. */
const FIXTURE_FUNCTION_SECRETS_TF = [
  'locals {',
  '  function_secret_names = concat(',
  '    ["PUBLIC_PROJECT_ID"],',
  '    var.smtp == null ? [] : ["SMTP_PASS"],',
  '  )',
  '}',
  ''
].join('\n');

/** Every name the fixture sources yield, in source order. */
const FIXTURE_NAMES: ReadonlyArray<string> = [
  'api',
  'max_rows',
  'auth',
  'mailer_autoconfirm',
  'mfa_totp_enroll_enabled',
  'mfa_totp_verify_enabled',
  'redirect_callback_paths',
  'site_url',
  'uri_allow_list',
  'smtp_host',
  'rate_limit_otp',
  'rate_limit_email_sent',
  'smtp_user',
  'smtp_pass',
  'PUBLIC_PROJECT_ID',
  'SMTP_PASS'
];

/** The check names of a fixture registry. */
const FIXTURE_CHECK_NAMES: ReadonlyArray<string> = ['auth.smtp', 'api.max-rows', 'no-seed'];

/**
 * Build a fixture page that lists the given names in a table, one backticked name per row, in reverse order.
 *
 * @param names - The names to list.
 * @returns The page text.
 */
function pageListing(names: ReadonlyArray<string>): string {
  return [
    '# Hosted Supabase settings',
    '',
    '| Setting | Value |',
    '| ------- | ----- |',
    ...[...names].reverse().map((name) => `| \`${name}\` | x |`),
    ''
  ].join('\n');
}

/**
 * Check a fixture page against the fixture sources, with any of them replaced.
 *
 * @param page - The page text, or `undefined` for an absent page.
 * @param overrides - Source texts or check names to use instead of the fixture ones.
 * @returns The problems found.
 */
function fixtureProblems(
  page: string | undefined,
  overrides: Partial<Omit<HostedSettingsReferenceInput, 'page'>> = {}
): Array<string> {
  return hostedSettingsReferenceProblems({
    page,
    checkNames: FIXTURE_CHECK_NAMES,
    settingsJson: FIXTURE_JSON,
    settingsTf: FIXTURE_SETTINGS_TF,
    variablesTf: FIXTURE_VARIABLES_TF,
    mainTf: FIXTURE_MAIN_TF,
    functionSecretsTf: FIXTURE_FUNCTION_SECRETS_TF,
    ...overrides
  });
}

describe('jsonKeys', () => {
  it('lists every key at every depth, a false leaf and an array key included, and no array item', () => {
    expect(jsonKeys({ a: { b: false, c: [{ d: 1 }] }, e: 0 })).toEqual(['a', 'b', 'c', 'e']);
  });
});

describe('hostedSettingsReferenceProblems', () => {
  it('finds nothing in a page that lists every name, in any order', () => {
    expect(fixtureProblems(pageListing(FIXTURE_NAMES))).toEqual([]);
  });

  it('names mailer_autoconfirm, a false leaf, when the page leaves it out', () => {
    const problems = fixtureProblems(pageListing(FIXTURE_NAMES.filter((name) => name !== 'mailer_autoconfirm')));
    expect(problems).toEqual([expect.stringContaining('mailer_autoconfirm')]);
    expect(problems[0]).toContain(SOURCE_PATHS.settingsJson);
  });

  it('does not count a name that only begins like a listed one, nor a name in prose without backticks', () => {
    const page = `${pageListing(FIXTURE_NAMES.filter((name) => name !== 'mfa_totp_verify_enabled'))}\nThe mfa_totp_verify_enabled switch is off. See \`mfa_totp_verify_enabled_x\`.\n`;
    expect(fixtureProblems(page)).toEqual([expect.stringContaining('mfa_totp_verify_enabled')]);
  });

  it('reports an absent page', () => {
    expect(fixtureProblems(undefined)).toEqual([expect.stringContaining(PAGE_PATH)]);
  });

  it.each<[SourceKey, string]>([
    ['settingsJson', '{ not json'],
    ['settingsTf', 'locals {\n  auth = merge()\n}\n'],
    ['variablesTf', 'variable "region" {\n  type = string\n}\n'],
    ['mainTf', 'resource "supabase_settings" "this" {\n  auth = jsonencode(local.auth)\n}\n'],
    ['functionSecretsTf', 'locals {\n  other = []\n}\n']
  ])('reports %s when its block cannot be found, naming the file', (key, text) => {
    expect(fixtureProblems(pageListing(FIXTURE_NAMES), { [key]: text })).toEqual([
      expect.stringContaining(SOURCE_PATHS[key])
    ]);
  });

  it('reports an absent source, naming the file', () => {
    expect(fixtureProblems(pageListing(FIXTURE_NAMES), { mainTf: undefined })).toEqual([
      `${SOURCE_PATHS.mainTf}: the file is absent`
    ]);
  });

  it('lists the problems in source order, whatever the page order', () => {
    const problems = fixtureProblems(pageListing([]));
    expect(problems.map((problem) => problem.split(' ')[0])).toEqual(FIXTURE_NAMES);
  });

  it('names a cited probe check that the registry does not define', () => {
    const page = `${pageListing(FIXTURE_NAMES)}\nVerify with \`auth.smtp\` and \`auth.made-up\`.\n`;
    const problems = fixtureProblems(page);
    expect(problems).toEqual([expect.stringContaining('auth.made-up')]);
    expect(problems[0]).toContain(CHECKS_PATH);
  });

  it('finds nothing in a page that cites only defined probe checks', () => {
    const page = `${pageListing(FIXTURE_NAMES)}\nVerify with \`auth.smtp\`, \`api.max-rows\` and \`no-seed\`.\n`;
    expect(fixtureProblems(page)).toEqual([]);
  });

  it('reports a registry with no check names, naming the file', () => {
    expect(fixtureProblems(pageListing(FIXTURE_NAMES), { checkNames: [] })).toEqual([
      expect.stringContaining(CHECKS_PATH)
    ]);
  });
});

/**
 * Read a file of the repository.
 *
 * @param path - The path relative to the repository root.
 * @returns The text, or `undefined` when the file is absent.
 */
function readRepositoryFile(path: string): string | undefined {
  const absolute = join(REPO_ROOT, path);
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : undefined;
}

describe('the hosted-settings reference page in the repository', () => {
  it('lists every hosted setting the Supabase module writes, and cites only checks the probe defines', () => {
    const sources = Object.fromEntries(
      Object.entries(SOURCE_PATHS).map(([key, path]) => [key, readRepositoryFile(path)])
    ) as Record<SourceKey, string | undefined>;
    const checkNames = CHECKS.map(({ name }) => name);
    expect(hostedSettingsReferenceProblems({ page: readRepositoryFile(PAGE_PATH), checkNames, ...sources })).toEqual(
      []
    );
  });
});
