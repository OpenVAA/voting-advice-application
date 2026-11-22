/**
 * The on-demand deployment checks' WIRING, asserted rather than described.
 *
 * Five checks answer questions that only a running database or Docker can answer: whether migrations/ and schema/ build the same database, whether a deployed database still matches its migrations, whether a database holds anything of the local seed, whether a deployed database trusts `cf-connecting-ip`, and whether the frontend image behaves behind a reverse proxy. Each has a root script key so that a later step calls it by name, and the key must name the committed file it claims to run.
 *
 * None of them may be a link of `lint:check`. That chain runs with Node alone. A check that needs a database, placed in it, would either fail every run or be made to pass when it can compare nothing, and a green `lint:check` would then be read as a green check. The keys are `check:*`, not `assert:*`, because every `assert:*` key is a chain link.
 *
 * The schema-equivalence check runs in CI all the same, as a step of the `sql-lint` job, whose runner has Docker and the Supabase CLI. It is the only tie between `schema/` and `migrations/`, so a migration written without its `schema/` edit, or the reverse, reddens that job.
 *
 * The seed check runs in CI too, as a step of the `supabase-tests` job after `supabase start`. That stack holds the local seed, so the step requires the check to refuse it; a check that went blind reddens the job. The drift check runs in the deploy pipeline: `deploy.yml` calls it through `infra/scripts/push-migrations.sh` after each migration push.
 *
 * The bootstrap script writes rows into a deployment's database. It gets no script key, so that no convenient name can run it against whatever database the environment happens to point at; an operator runs it by hand.
 *
 * ⚠ The invariant asserted about `lint:check` is MEMBERSHIP of its `&&` links, never position, never the whole string, never the link count. Links may be appended to the chain freely.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `scripts/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../..');

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const SCRIPTS = ROOT_PACKAGE_JSON.scripts;
const LINT_CHECK_LINKS = SCRIPTS['lint:check'].split('&&').map((link) => link.trim());

/** Each on-demand check: its key, the exact command, and the committed file the command runs. */
const CHECKS = [
  {
    key: 'check:schema-equivalence',
    command: 'bash apps/supabase/scripts/check-schema-equivalence.sh',
    file: 'apps/supabase/scripts/check-schema-equivalence.sh'
  },
  {
    key: 'check:migration-drift',
    command: 'bash infra/scripts/check-drift.sh',
    file: 'infra/scripts/check-drift.sh'
  },
  {
    key: 'check:seed',
    command: 'psql -X -f infra/scripts/check-seed.sql',
    file: 'infra/scripts/check-seed.sql'
  },
  {
    key: 'check:deployment-settings',
    command: 'psql -X -f infra/scripts/check-deployment-settings.sql',
    file: 'infra/scripts/check-deployment-settings.sql'
  },
  {
    key: 'check:proxy-topology',
    command: 'bash infra/local/check-proxy-topology.sh',
    file: 'infra/local/check-proxy-topology.sh'
  }
] as const;

const BOOTSTRAP_FILE = 'infra/scripts/bootstrap.sql';

/**
 * The `run:` commands of a job in `.github/workflows/main.yaml`, in order: from its key down to the next top-level job key, with whole-line comments dropped. A multi-line `run: |` block yields `|`; its commands are read from `jobLines`.
 */
function jobRuns(job: string): Array<string> {
  return jobLines(job)
    .map((line) => line.trim())
    .filter((line) => /^(-\s+)?run:/.test(line))
    .map((line) => line.replace(/^(-\s+)?run:\s*/, ''));
}

/** The lines of a job in `.github/workflows/main.yaml`, from its key down to the next top-level job key, with whole-line comments dropped. */
function jobLines(job: string): Array<string> {
  const lines = readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*#/.test(line));
  const start = lines.indexOf(`  ${job}:`);
  if (start === -1) return [];
  const after = lines.slice(start + 1);
  const next = after.findIndex((line) => /^ {2}\S/.test(line));
  return next === -1 ? after : after.slice(0, next);
}

const SQL_LINT_RUNS = jobRuns('sql-lint');

describe('the on-demand deployment checks are callable by key and stay outside lint:check', () => {
  it.each(CHECKS)('runs `$command` from `$key` and keeps the file `$file` present', ({ key, command, file }) => {
    // Wired-but-deleted: a key naming a file that is gone fails only when someone calls it, with a bare "No such file".
    expect(command).toContain(file);
    expect(SCRIPTS[key]).toBe(command);
    expect(existsSync(resolve(REPO_ROOT, file))).toBe(true);
  });

  it.each(CHECKS)('keeps `$key` and `$file` out of every link of lint:check', ({ key, file }) => {
    for (const link of LINT_CHECK_LINKS) {
      expect(link).not.toContain(key);
      expect(link).not.toContain(file);
    }
  });

  it('keeps the bootstrap script present and run by no script key', () => {
    expect(existsSync(resolve(REPO_ROOT, BOOTSTRAP_FILE))).toBe(true);
    for (const [key, command] of Object.entries(SCRIPTS)) {
      expect({ key, runsBootstrap: command.includes('bootstrap.sql') }).toEqual({ key, runsBootstrap: false });
    }
  });
});

describe('the schema-equivalence check runs in CI', () => {
  it('runs `yarn check:schema-equivalence` in the sql-lint job, after the install and before the shared stack starts', () => {
    const install = SQL_LINT_RUNS.indexOf('yarn install --frozen-lockfile');
    const check = SQL_LINT_RUNS.indexOf('yarn check:schema-equivalence');
    const stackStart = SQL_LINT_RUNS.indexOf('supabase start');
    expect(install).toBeGreaterThan(-1);
    expect(check).toBeGreaterThan(install);
    expect(stackStart).toBeGreaterThan(check);
  });
});

describe('the seed check runs in CI against the seeded stack', () => {
  const lines = jobLines('supabase-tests').map((line) => line.trim());
  const stackStart = lines.indexOf('run: supabase start');
  const seedCheck = lines.findIndex((line) => line.includes('psql -X -f infra/scripts/check-seed.sql'));

  it('runs `check-seed.sql` in the supabase-tests job after `supabase start`', () => {
    expect(stackStart).toBeGreaterThan(-1);
    expect(seedCheck).toBeGreaterThan(stackStart);
  });

  it('requires status 3 and every finding class, and reruns when the check changes', () => {
    const step = lines.slice(seedCheck);
    expect(step.some((line) => /-ne 3\b/.test(line))).toBe(true);
    for (const finding of ['seed user:', 'local address:', 'demo key:']) {
      expect(lines.join('\n')).toContain(`'${finding}'`);
    }
    expect(lines).toContain("- 'infra/scripts/check-seed.sql'");
  });
});
