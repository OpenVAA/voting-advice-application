/**
 * Unit tests for `tests/scripts/withhold-stack-keys.mjs`, the filter the E2E wrapper writes the output of starting Supabase through, and for the rule that every harness script writing that output to a file uses it.
 *
 * The filter is run as the wrapper runs it: as a process, with the command's output on stdin.
 *
 * Every key in these fixtures is made up here, at run time. None is a key of any stack.
 *
 * Run: yarn test:unit:tests withholdStackKeys
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const SCRIPTS_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../scripts');
const FILTER = path.join(SCRIPTS_DIR, 'withhold-stack-keys.mjs');
const FILTER_NAME = path.basename(FILTER);

const FAKE = {
  anonKey: ['eyJ' + 'a'.repeat(33), 'b'.repeat(60), 'c'.repeat(43)].join('.'),
  serviceRoleKey: ['eyJ' + 'd'.repeat(33), 'e'.repeat(72), 'f'.repeat(43)].join('.'),
  publishableKey: 'sb_' + 'publishable_' + 'g'.repeat(31),
  secretKey: 'sb_' + 'secret_' + 'h'.repeat(31),
  jwtSecret: 'made-up-signing-secret-' + 'i'.repeat(32),
  s3AccessKey: '1a'.repeat(16),
  s3SecretKey: '2b'.repeat(32),
  dbPassword: 'made-up-database-password'
};
const FAKE_VALUES = Object.values(FAKE);
const DB_URL = `postgresql://postgres:${FAKE.dbPassword}@127.0.0.1:54322/postgres`;

/**
 * What makes a line key-shaped: a JSON web token, a key with the `sb_` prefix, a URL carrying a password, or a name ending in KEY or SECRET followed by a value. Written apart from the filter's own patterns, so that the two cannot be wrong in the same way.
 */
const KEY_SHAPED =
  /eyJ[A-Za-z0-9_-]{8,}\.|sb_(publishable|secret)_|:\/\/[^\s/:@]+:[^\s/@<]+@|(KEY|SECRET)[A-Z_]*["']?\s*[:=]/;

/** Lines the stack's start prints around its status, none of which holds a key. */
const ORDINARY_LINES = [
  'WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.',
  ' 0ca0d1b0 Downloading [==================>                                ]  12.5MB/33.1MB',
  'Applying migration 20250101000000_api_tokens.sql...',
  'NOTICE (42710): policy "questions_deny_all" for relation "public.questions" does not exist, skipping',
  'Seeding data from supabase/seed.sql...',
  'Stopped services: [supabase_imgproxy_openvaa supabase_pooler_openvaa]',
  'failed to start docker container: Error response from daemon: port is already allocated',
  'A new version of Supabase CLI is available: v2.120.0 (currently installed v2.118.0)',
  ''
];

/** The status as the CLI prints it when its output is not a terminal: one JSON object on one line. */
const STATUS_OBJECT = JSON.stringify({
  DB_URL,
  API_URL: 'http://127.0.0.1:54321',
  PUBLISHABLE_KEY: FAKE.publishableKey,
  SECRET_KEY: FAKE.secretKey,
  JWT_SECRET: FAKE.jwtSecret,
  ANON_KEY: FAKE.anonKey,
  SERVICE_ROLE_KEY: FAKE.serviceRoleKey,
  S3_PROTOCOL_ACCESS_KEY_ID: FAKE.s3AccessKey,
  S3_PROTOCOL_ACCESS_KEY_SECRET: FAKE.s3SecretKey,
  S3_PROTOCOL_REGION: 'local',
  message: ''
});

/** The status as the CLI prints it for a terminal: boxed tables with blank lines between them. */
const STATUS_TABLES = [
  '╭──────────────────────────────────────╮',
  '│ 🔧 Development Tools                 │',
  '├─────────┬────────────────────────────┤',
  '│ Studio  │ http://127.0.0.1:54323     │',
  '╰─────────┴────────────────────────────╯',
  '',
  '╭─────────────────────────────────────────────────────────────╮',
  '│ ⛁ Database                                                  │',
  '├─────┬───────────────────────────────────────────────────────┤',
  `│ URL │ ${DB_URL} │`,
  '╰─────┴───────────────────────────────────────────────────────╯',
  '',
  '╭──────────────────────────────────────────────────────────────╮',
  '│ 🔑 Authentication Keys                                       │',
  '├─────────────┬────────────────────────────────────────────────┤',
  `│ Publishable │ ${FAKE.publishableKey} │`,
  `│ Secret      │ ${FAKE.secretKey} │`,
  '╰─────────────┴────────────────────────────────────────────────╯',
  '',
  '╭───────────────────────────────────────────────────────────────────────────────╮',
  '│ 📦 Storage (S3)                                                               │',
  '├────────────┬──────────────────────────────────────────────────────────────────┤',
  `│ Access Key │ ${FAKE.s3AccessKey} │`,
  `│ Secret Key │ ${FAKE.s3SecretKey} │`,
  '│ Region     │ local                                                            │',
  '╰────────────┴──────────────────────────────────────────────────────────────────╯'
];

/** The status in the forms the CLI prints on request, and in the older plain form. */
const LABELLED_LINES = [
  `ANON_KEY="${FAKE.anonKey}"`,
  `SERVICE_ROLE_KEY="${FAKE.serviceRoleKey}"`,
  `JWT_SECRET="${FAKE.jwtSecret}"`,
  `S3_PROTOCOL_ACCESS_KEY_ID="${FAKE.s3AccessKey}"`,
  `S3_PROTOCOL_ACCESS_KEY_SECRET = "${FAKE.s3SecretKey}"`,
  `SECRET_KEY: ${FAKE.secretKey}`,
  `  "PUBLISHABLE_KEY": "${FAKE.publishableKey}",`,
  `        anon key: ${FAKE.anonKey}`,
  `service_role key: ${FAKE.serviceRoleKey}`,
  `      JWT secret: ${FAKE.jwtSecret}`,
  `   S3 Secret Key: ${FAKE.s3SecretKey}`
];

/**
 * Run the filter over some output.
 *
 * @param lines - The lines written to the filter's stdin.
 * @returns The lines the filter wrote, and its exit status.
 */
function filter(lines: ReadonlyArray<string>): { lines: Array<string>; status: number | null } {
  const result = spawnSync(process.execPath, [FILTER], { input: lines.join('\n') + '\n', encoding: 'utf8' });
  expect(result.stderr).toBe('');
  return { lines: result.stdout.replace(/\n$/, '').split('\n'), status: result.status };
}

/** How many of the lines are key-shaped. */
function keyShapedCount(lines: ReadonlyArray<string>): number {
  return lines.filter((line) => KEY_SHAPED.test(line)).length;
}

/** Assert that no made-up key, secret or password of the fixtures is anywhere in the output. */
function expectNoFakeValue(lines: ReadonlyArray<string>): void {
  const text = lines.join('\n');
  for (const value of FAKE_VALUES) expect(text.includes(value)).toBe(false);
}

describe('withhold-stack-keys.mjs', () => {
  it('copies output that holds no key unchanged, line for line', () => {
    const out = filter(ORDINARY_LINES);
    expect(out.status).toBe(0);
    expect(out.lines).toEqual(ORDINARY_LINES);
  });

  it('replaces the status object with one marker line and keeps the lines around it', () => {
    const input = [...ORDINARY_LINES.slice(0, 6), STATUS_OBJECT, ...ORDINARY_LINES.slice(7)];
    expect(keyShapedCount(input)).toBe(1);

    const out = filter(input);
    expect(out.status).toBe(0);
    expect(out.lines).toHaveLength(input.length);
    expect(out.lines.slice(0, 6)).toEqual(ORDINARY_LINES.slice(0, 6));
    expect(out.lines[6]).toMatch(/^\[withheld: /);
    expect(out.lines.slice(7)).toEqual(ORDINARY_LINES.slice(7));
    expect(keyShapedCount(out.lines)).toBe(0);
    expectNoFakeValue(out.lines);
  });

  it('replaces each status table with one marker line', () => {
    const input = ['supabase local development setup is running.', '', ...STATUS_TABLES, '', ORDINARY_LINES[7]];
    expect(keyShapedCount(input)).toBeGreaterThan(0);

    const out = filter(input);
    const marker = out.lines[2];
    expect(marker).toMatch(/^\[withheld: /);
    expect(out.lines).toEqual([input[0], '', marker, '', marker, '', marker, '', marker, '', ORDINARY_LINES[7]]);
    expectNoFakeValue(out.lines);
  });

  it('replaces every line labelled as a key or a secret, whichever form the status is printed in', () => {
    expect(keyShapedCount(LABELLED_LINES)).toBeGreaterThan(0);

    const out = filter(LABELLED_LINES);
    expect(out.lines).toHaveLength(LABELLED_LINES.length);
    for (const line of out.lines) expect(line).toMatch(/^\[withheld: /);
    expectNoFakeValue(out.lines);
  });

  it('replaces a key inside an ordinary line and keeps the rest of the line', () => {
    const out = filter([
      `DB_URL="${DB_URL}"`,
      `connecting to ${DB_URL} ...`,
      `request rejected for bearer ${FAKE.anonKey} (expired)`,
      `the client was created with ${FAKE.secretKey}`
    ]);
    expect(out.lines).toEqual([
      'DB_URL="postgresql://postgres:<withheld>@127.0.0.1:54322/postgres"',
      'connecting to postgresql://postgres:<withheld>@127.0.0.1:54322/postgres ...',
      'request rejected for bearer <withheld> (expired)',
      'the client was created with <withheld>'
    ]);
    expect(keyShapedCount(out.lines)).toBe(0);
  });
});

/** A command whose output ends with, or is, the stack's status. */
const STACK_COMMAND = /\b(yarn db:(start|reset)|supabase (start|status))\b/;
/** A redirect of standard output into a file: `>` or `>>` that is neither a descriptor duplication nor the null device. */
const FILE_REDIRECT = /(^|[^0-9&])>>?\s*(?!&|\/dev\/null)\S/;

/** Whether a line of a shell script writes the stack's status to a file without the filter. */
function writesStatusUnfiltered(line: string): boolean {
  const code = line.trim();
  if (code.startsWith('#')) return false;
  return STACK_COMMAND.test(code) && FILE_REDIRECT.test(code) && !code.includes(FILTER_NAME);
}

describe('harness scripts that write the output of starting the stack', () => {
  it('recognises an unfiltered redirect and accepts a filtered one', () => {
    expect(writesStatusUnfiltered('yarn db:start > "$RUN_DIR/db-start.log" 2>&1')).toBe(true);
    expect(writesStatusUnfiltered('(cd apps/supabase && supabase status -o env) >> "$LOG"')).toBe(true);
    expect(
      writesStatusUnfiltered(`yarn db:start 2>&1 | node "$SCRIPT_DIR/${FILTER_NAME}" > "$RUN_DIR/db-start.log"`)
    ).toBe(false);
    expect(writesStatusUnfiltered('yarn db:start > /dev/null 2>&1')).toBe(false);
    expect(writesStatusUnfiltered('echo "FATAL -- yarn db:start failed; see $RUN_DIR/db-start.log" >&2')).toBe(false);
    expect(writesStatusUnfiltered('# yarn db:start > "$RUN_DIR/db-start.log"')).toBe(false);
  });

  it('all go through the filter', () => {
    const scripts = fs.readdirSync(SCRIPTS_DIR).filter((name) => name.endsWith('.sh'));
    expect(scripts).toContain('e2e-run.sh');

    const offending: Array<string> = [];
    let filtered = 0;
    for (const name of scripts) {
      const lines = fs.readFileSync(path.join(SCRIPTS_DIR, name), 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (writesStatusUnfiltered(line)) offending.push(`${name}:${index + 1}`);
        if (STACK_COMMAND.test(line) && line.includes(FILTER_NAME)) filtered++;
      });
    }
    expect(offending).toEqual([]);
    // The wrapper writes the output of both `yarn db:start` and `yarn db:reset`; a count of zero would mean this test no longer reads the lines it is about.
    expect(filtered).toBeGreaterThanOrEqual(2);
  });
});
