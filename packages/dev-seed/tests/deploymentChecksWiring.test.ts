/**
 * The on-demand deployment checks' WIRING, asserted rather than described.
 *
 * Four checks answer questions that only a running database or Docker can answer: whether migrations/ and schema/ build the same database, whether a deployed database still matches its migrations, whether a database holds anything of the local seed, and whether the frontend image behaves behind a reverse proxy. Each has a root script key so that a later step calls it by name, and the key must name the committed file it claims to run.
 *
 * None of them may be a link of `lint:check`. That chain runs with Node alone. A check that needs a database, placed in it, would either fail every run or be made to pass when it can compare nothing, and a green `lint:check` would then be read as a green check. The keys are `check:*`, not `assert:*`, because every `assert:*` key is a chain link.
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
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

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
    key: 'check:proxy-topology',
    command: 'bash infra/local/check-proxy-topology.sh',
    file: 'infra/local/check-proxy-topology.sh'
  }
] as const;

const BOOTSTRAP_FILE = 'infra/scripts/bootstrap.sql';

describe('the on-demand deployment checks are callable by key and stay outside lint:check', () => {
  it('runs the schema equivalence check from `check:schema-equivalence`', () => {
    expect(SCRIPTS['check:schema-equivalence']).toBe('bash apps/supabase/scripts/check-schema-equivalence.sh');
  });

  it('runs the migration drift check from `check:migration-drift`', () => {
    expect(SCRIPTS['check:migration-drift']).toBe('bash infra/scripts/check-drift.sh');
  });

  it('runs the seed check from `check:seed`', () => {
    expect(SCRIPTS['check:seed']).toBe('psql -X -f infra/scripts/check-seed.sql');
  });

  it('runs the proxy topology check from `check:proxy-topology`', () => {
    expect(SCRIPTS['check:proxy-topology']).toBe('bash infra/local/check-proxy-topology.sh');
  });

  it.each(CHECKS)('keeps the file `$file` that `$key` names present', ({ key, command, file }) => {
    // Wired-but-deleted: a key naming a file that is gone fails only when someone calls it, with a bare "No such file".
    expect(command).toContain(file);
    expect(SCRIPTS[key]).toContain(file);
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
