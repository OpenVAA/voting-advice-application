/**
 * The shape of the `infra-validate` CI job, and the state keys of the Terraform roots it validates, asserted rather than described.
 *
 * The job formats and validates every Terraform root under `infra/`. It runs on pull requests, so it executes configuration a contributor wrote, and it is safe to do so only because it holds no credentials: `init -backend=false` reads no state and `validate` calls no cloud API. A later edit that gave the job a secret, an identity token or a credential action would still pass every run while turning the job into a door into the account. Each such absence is its own test below, so a failure names which one entered the job.
 *
 * The job's actions are pinned by commit SHA because a tag can be moved to other code. The job names the roots it must have validated, so an empty or short glob fails instead of passing on nothing; this spec keeps those names in the job.
 *
 * The state keys are read from the backend blocks on disk. Two roots sharing a key would overwrite each other's state, and a key outside the `hand/` and `pipeline/` prefixes would fall outside the deny statements that keep the pipeline away from the hand-applied state. The bootstrap root builds the deploy role's state access from its `pipeline_state_key` variable, and the pipeline root writes to its backend key; a difference would otherwise show only as a refused request in a workflow.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const JOB_KEY = 'infra-validate';
const JOB_HEADER = `  ${JOB_KEY}:`;

/** The roots the job must name, and must have validated, for its validation step to pass. */
const REQUIRED_ROOTS = [
  'infra/bootstrap',
  'infra/envs/staging/dns-mail',
  'infra/envs/staging/supabase',
  'infra/envs/staging/aws',
  'infra/envs/example/dns-mail',
  'infra/envs/example/supabase',
  'infra/envs/example/aws'
];

/**
 * The workflow with whole-line `#` comments dropped. The job's comment block is entitled to name what the job lacks, such as secrets or an identity token, and dropping comments first keeps that prose from failing the absence tests. It also keeps a comment line at job-key indentation from ending the slice below early.
 */
const WORKFLOW_LINES = readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8')
  .split('\n')
  .filter((line) => !/^\s*#/.test(line));

/**
 * The job's own block: from its key down to the next top-level job key, or to the end of the file. Sliced between markers rather than taken as everything after the key, so a job appended after this one is never read as part of it.
 */
const JOB_BLOCK = (() => {
  const start = WORKFLOW_LINES.indexOf(JOB_HEADER);
  if (start === -1) return '';
  const after = WORKFLOW_LINES.slice(start + 1);
  const next = after.findIndex((line) => /^ {2}\S/.test(line));
  return (next === -1 ? after : after.slice(0, next)).join('\n');
})();

/** The values of the job's `uses:` lines, trailing comments included. */
const USES = JOB_BLOCK.split('\n')
  .map((line) => line.trim())
  .filter((line) => /^(-\s+)?uses:/.test(line))
  .map((line) => line.replace(/^(-\s+)?uses:\s*/, ''));

/**
 * Read the S3 backend key of one Terraform file.
 * @param relativePath - The file, relative to the repository root.
 * @returns The key, or `undefined` when the file declares no S3 backend.
 */
function s3BackendKey(relativePath: string): string | undefined {
  const text = readFileSync(resolve(REPO_ROOT, relativePath), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(#|\/\/)/.test(line))
    .join('\n');
  const block = /backend\s+"s3"\s*\{([^}]*)\}/.exec(text);
  if (!block) return undefined;
  const key = /^\s*key\s*=\s*"([^"]*)"/m.exec(block[1]);
  if (!key) throw new Error(`${relativePath} declares an S3 backend whose key could not be read`);
  return key[1];
}

/**
 * Collect the S3 backend key of the bootstrap root and of every root directly under `infra/envs/<env>/`. A root with another backend, such as a local one, has no key and is skipped.
 * @returns One entry per root with an S3 backend.
 */
function backendKeys(): Array<{ root: string; key: string }> {
  const files = ['infra/bootstrap/backend.tf'];
  const envsDir = resolve(REPO_ROOT, 'infra/envs');
  for (const env of readdirSync(envsDir, { withFileTypes: true })) {
    if (!env.isDirectory()) continue;
    for (const root of readdirSync(resolve(envsDir, env.name), { withFileTypes: true })) {
      if (!root.isDirectory()) continue;
      const file = `infra/envs/${env.name}/${root.name}/main.tf`;
      if (existsSync(resolve(REPO_ROOT, file))) files.push(file);
    }
  }
  const keys: Array<{ root: string; key: string }> = [];
  for (const file of files) {
    const key = s3BackendKey(file);
    if (key !== undefined) keys.push({ root: dirname(file), key });
  }
  return keys;
}

describe('the infra-validate job is read whole', () => {
  it('declares the job exactly once', () => {
    // Guards the slice every assertion below reads from: a renamed or duplicated key would make them measure the wrong block or the empty string, and an empty string passes every absence test.
    expect(WORKFLOW_LINES.filter((line) => line === JOB_HEADER)).toHaveLength(1);
  });

  it('reaches the last step of the job, the settings type check', () => {
    // A slice cut short would pass the absence tests on what it did not read.
    expect(JOB_BLOCK).toContain('bash infra/scripts/check-settings-types.sh');
  });
});

describe('the infra-validate job checks what it claims to check', () => {
  it('sets up the pinned Terraform version without the wrapper that hides exit statuses', () => {
    expect(JOB_BLOCK).toContain('terraform_version: 1.16.5');
    expect(JOB_BLOCK).toContain('terraform_wrapper: false');
  });

  it('checks the formatting of everything under infra/', () => {
    expect(JOB_BLOCK).toContain('terraform fmt -check -recursive');
  });

  it('initialises every root without a backend and against the tracked lock files', () => {
    expect(JOB_BLOCK).toContain('-backend=false');
    expect(JOB_BLOCK).toContain('-lockfile=readonly');
    expect(JOB_BLOCK).toContain('validate');
  });

  it('runs the validation and type-check steps even after an earlier step failed', () => {
    // Without this a formatting failure would hide a validation failure in the same run.
    expect(JOB_BLOCK.match(/if: \$\{\{ !cancelled\(\) \}\}/g) ?? []).toHaveLength(2);
  });

  it('names every required root, so an empty or short glob cannot pass', () => {
    for (const root of REQUIRED_ROOTS) expect(JOB_BLOCK).toContain(root);
  });
});

describe('the infra-validate job pins its actions by commit SHA', () => {
  it('uses exactly two actions', () => {
    expect(USES).toHaveLength(2);
  });

  it('pins every action by a forty-character commit SHA', () => {
    // A tag can be moved to other code; a commit SHA cannot. A trailing comment naming the tag is allowed.
    for (const uses of USES) expect(uses).toMatch(/@[0-9a-f]{40}(\s+#.*)?$/);
  });
});

describe('the infra-validate job holds no credentials', () => {
  it('reads no secret', () => {
    expect(JOB_BLOCK).not.toMatch(/\bsecrets\./);
  });

  it('asks for no identity token', () => {
    expect(JOB_BLOCK).not.toContain('id-token');
  });

  it('uses no AWS credentials action', () => {
    expect(JOB_BLOCK).not.toContain('aws-actions/configure-aws-credentials');
  });

  it('uses no Supabase CLI setup action', () => {
    expect(JOB_BLOCK).not.toContain('supabase/setup-cli');
  });

  it('uploads no artifact', () => {
    // A plan file or a log uploaded from a job that runs contributor code is readable by anyone who can read the run.
    expect(JOB_BLOCK).not.toContain('actions/upload-artifact');
  });

  it('runs no Terraform plan, apply or import', () => {
    // Each of these needs a backend and a role; a validation job that ran one would need credentials it must not hold.
    expect(JOB_BLOCK).not.toMatch(/\bterraform\b(\s+-\S+)*\s+(plan|apply|import)\b/);
  });
});

describe('the state keys of the Terraform roots stay apart', () => {
  it('gives no two roots the same state key', () => {
    const keys = backendKeys().map(({ key }) => key);
    expect(keys.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('starts every state key with hand/ or pipeline/', () => {
    for (const { root, key } of backendKeys()) expect(key, root).toMatch(/^(hand|pipeline)\//);
  });

  it('puts only the roots named aws under pipeline/', () => {
    // The pipeline may write only the state of the roots it applies; every other root is applied by hand.
    for (const { root, key } of backendKeys()) {
      if (key.startsWith('pipeline/')) expect(root, key).toMatch(/\/aws$/);
    }
  });

  it('keeps pipeline_state_key of the bootstrap root equal to the backend key of the staging pipeline root', () => {
    const tfvars = readFileSync(resolve(REPO_ROOT, 'infra/bootstrap/terraform.tfvars'), 'utf8');
    const declared = /^\s*pipeline_state_key\s*=\s*"([^"]*)"/m.exec(tfvars)?.[1];
    expect(declared, 'pipeline_state_key is missing from infra/bootstrap/terraform.tfvars').toBeTruthy();
    expect(s3BackendKey('infra/envs/staging/aws/main.tf')).toBe(declared);
  });
});
