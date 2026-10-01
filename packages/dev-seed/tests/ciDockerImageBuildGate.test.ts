/**
 * The Docker image build gate's PROPERTIES, asserted rather than described.
 *
 * ## What the gate is
 *
 * The `docker-image-build` job in `.github/workflows/main.yaml` builds the `production` target of `apps/frontend/Dockerfile` from the repo root, the image `docker-compose.dev.yml` and `render.example.yaml` deploy. The image copies `apps/`, `packages/`, `scripts/` and the root manifests and runs the root lifecycle scripts during `yarn install`, so a root lifecycle script that needs a file outside those directories breaks the image install and nothing else. No other job builds the image, so without this one that breakage reaches a deployment first.
 *
 * ## Why each property is asserted
 *
 * - **No `paths-filter` and no `if:`.** The breakage above needs no Dockerfile change: a new root script or a moved file is enough. A filter on `apps/frontend/Dockerfile` would skip the job in exactly that case, and an unasserted absence is one PR away from being narrowed back.
 * - **No push, no registry login, no secrets, no third-party action.** The job only proves the image builds. Publishing is a deployment decision, and a job that pushes needs credentials the pull-request context must not carry.
 * - **The Dockerfile still declares `AS production`.** A renamed stage makes `docker build --target production` fail with an error that names no invariant; this assertion names it.
 *
 * ## Why it lives in packages/dev-seed
 *
 * Same reason as its siblings `rpcNullabilityGate.test.ts` and `ciSecretScanFlags.test.ts`: `yarn test:unit` is `turbo run test:unit`, so a repo-meta spec needs a package to run in, and this package already reads repo-root files from its tests. Read `ciTypecheckGate.test.ts`'s docblock for the fuller version.
 *
 * ## Why comment lines are stripped
 *
 * The job's own comment block names `paths-filter`, `if:`, pushing and logging in, in order to say it has none of them. A text match over the raw block would redden on that prose, and the natural "fix" for the false red is deleting the explanation, which is backwards. So every behavioural assertion below runs over the job's lines with `#` comment lines removed.
 *
 * ⚠ It is a text-level spec, deliberately: no YAML parser is a dependency of this workspace. The job name and the step contents are matched verbatim, so renaming either reddens this file and sends the reader here.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const WORKFLOW = readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8');
const DOCKERFILE = readFileSync(resolve(REPO_ROOT, 'apps/frontend/Dockerfile'), 'utf8');

const JOB = 'docker-image-build';

/** A top-level job key in this workflow: exactly two spaces, a name, a colon, nothing else. */
const JOB_KEY_RE = /^ {2}[a-z0-9-]+:$/;

/**
 * The lines of one job's block, from just after its key to just before the next top-level job key.
 *
 * Throws rather than returning an empty block when the job is absent, because a helper that answers "no violations" for a job that does not exist is the vacuity this file exists to rule out.
 */
function jobBlock(jobName: string): string {
  const lines = WORKFLOW.split('\n');
  const start = lines.indexOf(`  ${jobName}:`);
  if (start === -1) throw new Error(`no job named '${jobName}' in .github/workflows/main.yaml`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (JOB_KEY_RE.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

/** Comment lines removed, so an assertion about the job's BEHAVIOUR is never satisfied or broken by the prose explaining it. */
const withoutComments = (block: string): string =>
  block
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');

/** The one `run:` line that invokes `docker build`, or the empty string when there is none. */
const dockerBuildLine = (block: string): string =>
  block
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^(-\s+)?run:\s+docker build\b/.test(line)) ?? '';

describe('the docker-image-build job builds the production image and publishes nothing', () => {
  it(`declares the ${JOB} job exactly once`, () => {
    // Guards every extraction below: a duplicated key would make `indexOf` read the first of two blocks and silently assert against the wrong one, and a renamed key would make it throw.
    expect(WORKFLOW.split(`\n  ${JOB}:\n`)).toHaveLength(2);
  });

  it('runs docker build on the production target of apps/frontend/Dockerfile with the repo root as context', () => {
    const line = dockerBuildLine(withoutComments(jobBlock(JOB)));
    expect(line).not.toBe('');
    expect(line).toContain('--file apps/frontend/Dockerfile');
    expect(line).toContain('--target production');
    // The context is the final argument, and it is the repo root the checkout leaves as the working directory.
    expect(line).toMatch(/\s\.$/);
  });

  it('pushes nothing and logs in nowhere', () => {
    const block = withoutComments(jobBlock(JOB));
    expect(block).not.toMatch(/--push\b/);
    expect(block).not.toMatch(/docker push\b/);
    expect(block).not.toMatch(/push:\s*true/);
    expect(block).not.toMatch(/login/i);
    expect(block).not.toMatch(/secrets\./);
  });

  it('uses no action other than the checkout', () => {
    const uses = withoutComments(jobBlock(JOB))
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^(-\s+)?uses:/.test(line))
      .map((line) => line.replace(/^(-\s+)?uses:\s*/, ''));
    expect(uses).toEqual(['actions/checkout@v4']);
  });

  it('carries no paths-filter and no if: key, so every change runs it', () => {
    const block = withoutComments(jobBlock(JOB));
    expect(block).not.toContain('paths-filter');
    expect(block).not.toMatch(/^\s*(-\s+)?if:/m);
  });

  it('writes down why, in the job itself', () => {
    // The absences above are only durable if the next reader can tell them from an oversight. Asserted on the raw block, where the comment lives.
    const raw = jobBlock(JOB);
    expect(raw).toContain('paths-filter');
    expect(raw).toContain('never pushes');
    expect(raw).toContain('ciDockerImageBuildGate.test.ts');
  });

  it('builds a stage the Dockerfile still declares', () => {
    expect(DOCKERFILE).toMatch(/^FROM\s+\S+\s+AS\s+production\s*$/m);
  });
});
