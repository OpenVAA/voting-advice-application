/**
 * The shape of the `infra-validate` CI job, and the state keys of the Terraform roots it validates, asserted rather than described.
 *
 * The job formats and validates every Terraform root under `infra/`. It runs on pull requests, so it executes configuration a contributor wrote, and it is safe to do so only because it holds no credentials: `init -backend=false` reads no state and `validate` calls no cloud API. Its `GITHUB_TOKEN` may only read the repository's contents and is not kept in `.git/config` after checkout, since the later steps run a script and provider binaries the pull request controls. A later edit that gave the job a secret, an identity token, a wider token or a credential action would still pass every run while turning the job into a door into the account. Each such absence is its own test below, so a failure names which one entered the job.
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
 * A workflow's lines with whole-line `#` comments dropped. The job's comment block is entitled to name what the job lacks, such as secrets or an identity token, and dropping comments first keeps that prose from failing the absence tests. It also keeps a comment line at job-key indentation from ending the slice below early.
 * @param text - The workflow file.
 * @returns Its lines, comments dropped.
 */
function uncommented(text: string): Array<string> {
  return text.split('\n').filter((line) => !/^\s*#/.test(line));
}

/**
 * The block of one key: its own line and every line after it that is blank or indented deeper, so a key appended after it is never read as part of it.
 * @param lines - Lines from `uncommented`.
 * @param header - The key's whole line, indentation included, such as `  infra-validate:`. A line that starts with it and carries an inline value also opens the block.
 * @returns The block, or the empty string when the key is absent.
 */
function blockOf(lines: Array<string>, header: string): string {
  const start = lines.findIndex((line) => line === header || line.startsWith(`${header} `));
  if (start === -1) return '';
  const indent = header.length - header.trimStart().length;
  const after = lines.slice(start + 1);
  const next = after.findIndex((line) => line.trim() !== '' && line.length - line.trimStart().length <= indent);
  return [lines[start], ...(next === -1 ? after : after.slice(0, next))].join('\n');
}

/**
 * The grants a job's `permissions:` block makes, one `<scope>: <level>` per entry, or the inline value of a one-line `permissions: <value>`.
 * @param jobBlock - A job's block from `blockOf`.
 * @returns The entries, `['(none)']` when the job declares no permissions, so that an absent block never equals a correct one.
 */
function jobPermissions(jobBlock: string): Array<string> {
  const block = blockOf(jobBlock.split('\n'), '    permissions:');
  if (block === '') return ['(none)'];
  const [first, ...rest] = block.split('\n');
  const inline = first.replace(/^\s*permissions:\s*/, '').trim();
  return inline !== ''
    ? [inline]
    : rest
        .map((line) => line.trim())
        .filter((line) => line !== '')
        .map((line) => line.replace(/\s+/g, ' '));
}

/**
 * The `actions/checkout` steps of a job that keep the job's token in `.git/config`: every checkout step whose own block does not set `persist-credentials: false`.
 * @param jobBlock - A job's block from `blockOf`.
 * @returns One entry per such step, its `uses:` line.
 */
function checkoutsKeepingToken(jobBlock: string): Array<string> {
  const lines = jobBlock.split('\n');
  const found: Array<string> = [];
  lines.forEach((line, i) => {
    if (!/^\s*(-\s+)?uses:\s*actions\/checkout@/.test(line)) return;
    let stepStart = i;
    while (stepStart > 0 && !/^\s*-\s/.test(lines[stepStart])) stepStart -= 1;
    const stepIndent = lines[stepStart].length - lines[stepStart].trimStart().length;
    const after = lines.slice(stepStart + 1);
    const next = after.findIndex((l) => l.trim() !== '' && l.length - l.trimStart().length <= stepIndent);
    const step = [lines[stepStart], ...(next === -1 ? after : after.slice(0, next))].join('\n');
    if (!/^\s*persist-credentials:\s*false\s*$/m.test(step)) found.push(line.trim());
  });
  return found;
}

const WORKFLOW_LINES = uncommented(readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8'));

/** The job's own block, from its key down to the next key at job indentation or less, or to the end of the file. */
const JOB_BLOCK = blockOf(WORKFLOW_LINES, JOB_HEADER);

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
  it("grants its token nothing but read access to the repository's contents", () => {
    // A job without its own permissions block gets the repository's default grant, which may be read and write.
    expect(jobPermissions(JOB_BLOCK)).toEqual(['contents: read']);
  });

  it('keeps the token out of .git/config, so the steps after checkout cannot read it from there', () => {
    expect(JOB_BLOCK).toContain('actions/checkout@');
    expect(checkoutsKeepingToken(JOB_BLOCK)).toEqual([]);
  });

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

describe('the job-shape readers catch what they exist to catch', () => {
  // Red controls on made-up workflow text: each reader must flag the shape the tests above forbid, so a reader that
  // stopped matching cannot leave those tests green.
  /**
   * The block of a made-up job named like this one.
   * @param body - The job's lines after `runs-on`.
   * @returns The block, as the tests above read it.
   */
  function job(body: string): string {
    return blockOf(uncommented(`jobs:\n  ${JOB_KEY}:\n    runs-on: ubuntu-latest\n${body}`), JOB_HEADER);
  }

  it('reads no permissions block as none, not as the correct one', () => {
    expect(jobPermissions(job('    steps:\n      - run: true\n'))).toEqual(['(none)']);
  });

  it('reads a one-line write-all grant', () => {
    expect(jobPermissions(job('    permissions: write-all\n'))).toEqual(['write-all']);
  });

  it('reads a grant beside contents: read', () => {
    expect(jobPermissions(job('    permissions:\n      contents: read\n      id-token: write\n'))).toEqual([
      'contents: read',
      'id-token: write'
    ]);
  });

  it('flags a checkout step that keeps the default persist-credentials', () => {
    const body =
      '    steps:\n      - name: "Checkout"\n        uses: actions/checkout@0000000000000000000000000000000000000000\n';
    expect(checkoutsKeepingToken(job(body))).toHaveLength(1);
  });

  it('flags a checkout step whose persist-credentials: false belongs to another step', () => {
    const body =
      '    steps:\n      - uses: actions/checkout@0000000000000000000000000000000000000000\n' +
      '      - uses: other/action@0000000000000000000000000000000000000000\n        with:\n          persist-credentials: false\n';
    expect(checkoutsKeepingToken(job(body))).toHaveLength(1);
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
