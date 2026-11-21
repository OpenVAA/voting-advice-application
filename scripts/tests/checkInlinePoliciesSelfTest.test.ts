/**
 * The account-side inline-policy check's own self-test, run from the unit gate.
 *
 * `infra/scripts/check-inline-policies.sh` is run by an operator with credentials, and the lines it prints are pasted into a public record. Its `--self-test` mode needs no credentials: it feeds canned lines to the judge and canned values to the redaction, so a change to either is caught here rather than on an operator's machine.
 *
 * The script is run as a child process, so no copy of its cases exists here to drift from the real ones.
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `scripts/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../..');

const SCRIPT_PATH = 'infra/scripts/check-inline-policies.sh';

describe('the inline-policy check of the AWS account', () => {
  it('passes every case of its credential-free self-test', () => {
    const result = spawnSync('bash', [SCRIPT_PATH, '--self-test'], { cwd: REPO_ROOT, encoding: 'utf8' });
    expect(result.status).toBe(0);
    // The summary line reads `self-test: <n> cases, <m> failed`; the space keeps `10 failed` from matching.
    expect(result.stdout).toContain(' 0 failed');
  });
});
