/**
 * Holds the deployment key's length limit equal in the four places that state it: the bootstrap root's validation of `var.deployments`, the resolver every workflow starts with, the migration push and the deployed smoke's target check. A key the root admits and the pipeline refuses would leave a deployment whose roles exist and whose workflows all stop at `bad_key`. The files are read as text; nothing runs.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** The limit every source must state. */
const DEPLOYMENT_KEY_MAX_LENGTH = 15;

/** One statement of the limit: the file, what it is, and how to read the number from the file's text. */
type Source = { path: string; what: string; read: (text: string) => number | undefined };

/** The number of the first capture group of `pattern` in `text`, or `undefined` when it does not match. */
function captured(pattern: RegExp, text: string): number | undefined {
  const match = pattern.exec(text);
  return match ? Number(match[1]) : undefined;
}

const SOURCES: Array<Source> = [
  {
    path: 'infra/bootstrap/variables.tf',
    what: 'the key validation of variable "deployments"',
    read: (text) => captured(/can\(regex\("\^\[a-z\]\[a-z0-9-\]\*\$", k\)\) && length\(k\) <= (\d+)/, text)
  },
  {
    path: 'infra/bootstrap/variables.tf',
    what: 'the error message of the key validation',
    read: (text) => captured(/be at most (\d+) characters long, and keep <name_prefix>-<key>-frontend/, text)
  },
  {
    path: 'infra/scripts/resolve-deployment.sh',
    // The resolver measures the key as a JSON string, its two quotes included.
    what: 'the length test of an owned key, less its two quotes',
    read: (text) => {
      const quoted = captured(/\[ "\$\{#line\}" -gt (\d+) \]/, text);
      return quoted === undefined ? undefined : quoted - 2;
    }
  },
  {
    path: 'infra/scripts/resolve-deployment.sh',
    what: 'the bad_key refusal message',
    read: (text) => captured(/refuse bad_key "[^"]*at most (\d+) characters"/, text)
  },
  {
    path: 'infra/scripts/push-migrations.sh',
    what: 'DEPLOYMENT_KEY_MAX_LENGTH',
    read: (text) => captured(/^DEPLOYMENT_KEY_MAX_LENGTH=(\d+)$/m, text)
  },
  {
    path: 'tests/tests/utils/deployedTarget.ts',
    what: 'DEPLOYMENT_KEY_MAX_LENGTH',
    read: (text) => captured(/^const DEPLOYMENT_KEY_MAX_LENGTH = (\d+);$/m, text)
  }
];

describe('the deployment key length limit', () => {
  it.each(SOURCES.map((source) => [`${source.path}: ${source.what}`, source] as const))(
    'is 15 characters in %s',
    (_label, source) => {
      const limit = source.read(readFileSync(join(REPO_ROOT, source.path), 'utf8'));
      expect(limit, `${source.path}: ${source.what} is not found`).toBeDefined();
      expect(limit, `${source.path}: ${source.what} names ${limit}, not ${DEPLOYMENT_KEY_MAX_LENGTH}`).toBe(
        DEPLOYMENT_KEY_MAX_LENGTH
      );
    }
  );

  it('reports a red copy of variables.tf that names another limit', () => {
    const text = readFileSync(join(REPO_ROOT, 'infra/bootstrap/variables.tf'), 'utf8').replace(
      'length(k) <= 15',
      'length(k) <= 20'
    );
    expect(SOURCES[0].read(text)).toBe(20);
  });
});
