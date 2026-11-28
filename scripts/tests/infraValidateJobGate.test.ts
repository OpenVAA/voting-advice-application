/**
 * The shape of the `infra-validate` CI job, and the state keys of the Terraform roots it validates, asserted rather than described.
 *
 * The job formats and validates every Terraform root under `infra/`. It runs on pull requests, so it executes configuration a contributor wrote, and it is safe to do so only because it holds no credentials: `init -backend=false` reads no state and `validate` calls no cloud API. Its `GITHUB_TOKEN` may only read the repository's contents and is not kept in `.git/config` after checkout, since the later steps run a script and provider binaries the pull request controls. A later edit that gave the job a secret, an identity token, a wider token or a credential action would still pass every run while turning the job into a door into the account. Each such absence is its own test below, so a failure names which one entered the job. The workflow-level `env:` and `permissions:` reach the job too, so they are held to the same rules, and each reader the tests rely on is run against made-up workflow text that it must flag.
 *
 * The job's actions are pinned by commit SHA because a tag can be moved to other code. Its validation and module tests are `infra/scripts/terraform-checks.sh`, which names the roots it must have validated, so an empty or short glob fails instead of passing on nothing; this spec holds the job to calling that script and reads the names from it. The script's own behaviour is tested beside it, in `infra/scripts/terraform-checks.test.ts`.
 *
 * The state keys are read from the backend blocks on disk, in whichever `.tf` file of a root they sit, and every root must yield one, so a root whose backend the reader missed fails by name instead of dropping out. Two roots sharing a key would overwrite each other's state, and a key outside the `hand/` and `pipeline/` prefixes would fall outside the deny statements that keep the pipeline away from the hand-applied state. The bootstrap root builds each deployment's state access from the key `pipeline/<deployment>/aws/terraform.tfstate`, and that deployment's pipeline root writes to its backend key; a difference would otherwise show only as a refused request in a workflow.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { terraformChecksArray } from '../../infra/scripts/terraformChecksLists';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `scripts/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../..');

const JOB_KEY = 'infra-validate';
const JOB_HEADER = `  ${JOB_KEY}:`;

/** The script that runs the job's validation and module tests. */
const CHECKS_SCRIPT = 'infra/scripts/terraform-checks.sh';
const CHECKS_TEXT = readFileSync(resolve(REPO_ROOT, CHECKS_SCRIPT), 'utf8');

/** The roots the script must have validated for the validation step to pass, read from its `REQUIRED_ROOTS` array. */
const REQUIRED_ROOTS = terraformChecksArray('REQUIRED_ROOTS');

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

/**
 * A read of a credential: the `secrets` context in an expression, by property, by index or whole (as in `toJSON(secrets)`), a `secrets:` key passing secrets to a called workflow, or the job's own token as `github.token`.
 */
const CREDENTIAL_READ = /\$\{\{[^}]*\bsecrets\b|\bsecrets\s*[.[:]|\bgithub\.token\b/;

/**
 * A grant a workflow-level `permissions:` block could make that reaches past reading: any write, or an identity token.
 */
const WIDE_GRANT = /\bwrite\b|write-all|id-token/;

const WORKFLOW_LINES = uncommented(readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8'));

/** The job's own block, from its key down to the next key at job indentation or less, or to the end of the file. */
const JOB_BLOCK = blockOf(WORKFLOW_LINES, JOB_HEADER);

/** The values of the job's `uses:` lines, trailing comments included. */
const USES = JOB_BLOCK.split('\n')
  .map((line) => line.trim())
  .filter((line) => /^(-\s+)?uses:/.test(line))
  .map((line) => line.replace(/^(-\s+)?uses:\s*/, ''));

/**
 * The steps of a job, in order, each as the value of its `- name:` line and its own lines up to the next step.
 * @param jobBlock - A job's block from `blockOf`.
 * @returns One entry per named step.
 */
function jobSteps(jobBlock: string): Array<{ name: string; block: string }> {
  const lines = jobBlock.split('\n');
  const starts = lines.flatMap((line, i) => (/^\s*-\s+name:/.test(line) ? [i] : []));
  return starts.map((start, n) => ({
    name: lines[start].replace(/^\s*-\s+name:\s*/, '').replace(/^"(.*)"$/, '$1'),
    block: lines.slice(start, starts[n + 1] ?? lines.length).join('\n')
  }));
}

/** The roots that keep their state in a local backend on purpose, and so have no S3 key. */
const LOCAL_BACKEND_ROOTS = ['infra/envs/scratch/supabase'];

/** One backend block of a root: the file it is in, its type, and its key when it is an S3 backend. */
type Backend = { file: string; type: string; key?: string };

/**
 * Read the backend blocks of one root from all of its `.tf` files, wherever in them the block sits.
 * @param files - The root's `.tf` files, each as its name and text.
 * @returns One entry per backend block.
 */
function rootBackends(files: Array<{ file: string; text: string }>): Array<Backend> {
  const found: Array<Backend> = [];
  for (const { file, text } of files) {
    const code = text
      .split('\n')
      .filter((line) => !/^\s*(#|\/\/)/.test(line))
      .join('\n');
    for (const block of code.matchAll(/backend\s+"([^"]*)"\s*\{([^}]*)\}/g)) {
      if (block[1] !== 's3') {
        found.push({ file, type: block[1] });
        continue;
      }
      const key = /^\s*key\s*=\s*"([^"]*)"/m.exec(block[2]);
      if (!key) throw new Error(`${file} declares an S3 backend whose key could not be read`);
      found.push({ file, type: 's3', key: key[1] });
    }
  }
  return found;
}

/**
 * Every Terraform root the job validates: the bootstrap root and every directory directly under `infra/envs/<env>/` that holds a `.tf` file, each with the backends read from all of its `.tf` files.
 * @returns One entry per root.
 */
function roots(): Array<{ root: string; backends: Array<Backend> }> {
  const dirs = ['infra/bootstrap'];
  const envsDir = resolve(REPO_ROOT, 'infra/envs');
  for (const env of readdirSync(envsDir, { withFileTypes: true })) {
    if (!env.isDirectory()) continue;
    for (const root of readdirSync(resolve(envsDir, env.name), { withFileTypes: true }))
      if (root.isDirectory()) dirs.push(`infra/envs/${env.name}/${root.name}`);
  }
  return dirs
    .map((root) => {
      const names = readdirSync(resolve(REPO_ROOT, root)).filter((name) => name.endsWith('.tf'));
      const files = names.map((name) => ({
        file: `${root}/${name}`,
        text: readFileSync(resolve(REPO_ROOT, root, name), 'utf8')
      }));
      return { root, files };
    })
    .filter(({ files }) => files.length > 0)
    .map(({ root, files }) => ({ root, backends: rootBackends(files) }));
}

/**
 * The S3 state key of every root that has one.
 * @returns One entry per root with an S3 backend.
 */
function backendKeys(): Array<{ root: string; key: string }> {
  return roots().flatMap(({ root, backends }) =>
    backends.flatMap(({ key }) => (key === undefined ? [] : [{ root, key }]))
  );
}

describe('the infra-validate job is read whole', () => {
  it('declares the job exactly once', () => {
    // Guards the slice every assertion below reads from: a renamed or duplicated key would make them measure the wrong block or the empty string, and an empty string passes every absence test.
    expect(WORKFLOW_LINES.filter((line) => line === JOB_HEADER)).toHaveLength(1);
  });

  it('reaches the last step of the job, the test of the bootstrap root', () => {
    // A slice cut short would pass the absence tests on what it did not read.
    expect(JOB_BLOCK).toContain(`run: ${CHECKS_SCRIPT} test-bootstrap`);
  });
});

describe('the infra-validate job checks what it claims to check', () => {
  it('sets up the pinned Terraform version without the wrapper that hides exit statuses', () => {
    expect(JOB_BLOCK).toMatch(/terraform_version: \d+\.\d+\.\d+/);
    expect(JOB_BLOCK).toContain('terraform_wrapper: false');
  });

  it('checks the formatting of everything under infra/', () => {
    expect(JOB_BLOCK).toContain('terraform fmt -check -recursive');
  });

  it('validates every root through the shared script, without a backend and against the tracked lock files', () => {
    expect(JOB_BLOCK).toContain(`run: ${CHECKS_SCRIPT} validate`);
    expect(CHECKS_TEXT).toContain('terraform -chdir="$root" init -backend=false -input=false -lockfile=readonly');
    expect(CHECKS_TEXT).toContain('terraform -chdir="$root" validate');
  });

  it('runs every check after the formatting check even when an earlier step failed', () => {
    // Without this a formatting failure would hide a validation or module test failure in the same run.
    const steps = jobSteps(JOB_BLOCK);
    const formatting = steps.findIndex(({ block }) => block.includes('terraform fmt -check'));
    expect(formatting).toBeGreaterThan(-1);
    const later = steps.slice(formatting + 1);
    expect(later.map(({ name }) => name)).toEqual([
      'Validate every Terraform root',
      'Test every Terraform module that has tests',
      'Plan the example roots with mock providers',
      'Test the bootstrap root with a mock provider'
    ]);
    for (const { name, block } of later) expect(block, name).toMatch(/^\s*if: \$\{\{ !cancelled\(\) \}\}\s*$/m);
    expect(JOB_BLOCK.match(/if: \$\{\{ !cancelled\(\) \}\}/g) ?? []).toHaveLength(later.length);
  });

  it('tests every module directory that has tests, the Supabase module settings test among them', () => {
    // The settings types of the Supabase module are proven by its `terraform test` file, which the script's loop runs; there is no step of its own.
    expect(CHECKS_TEXT).toContain('for tests in infra/modules/*/tests/; do');
    expect(CHECKS_TEXT).toMatch(/terraform -chdir="\$module" test\b/);
    expect(existsSync(resolve(REPO_ROOT, 'infra/modules/supabase/tests/settings.tftest.hcl'))).toBe(true);
  });

  it('leaves the required roots to the script, which names every root of the backend checks below', () => {
    // The list is read from the script; an unreadable list would empty every check that iterates it.
    expect(REQUIRED_ROOTS).toContain('infra/bootstrap');
    expect(REQUIRED_ROOTS.length).toBeGreaterThan(1);
    for (const root of REQUIRED_ROOTS) expect(JOB_BLOCK).not.toContain(root);
  });
});

describe('the infra-validate job pins its actions by commit SHA', () => {
  it('uses at least one action, so the SHA check below cannot pass on an empty list', () => {
    expect(USES.length).toBeGreaterThan(0);
  });

  it('pins every action by a forty-character commit SHA', () => {
    // A tag can be moved to other code; a commit SHA cannot. A trailing comment naming the tag is allowed.
    for (const uses of USES) expect(uses).toMatch(/@[0-9a-f]{40}(\s+#.*)?$/);
  });
});

describe('the infra-validate job holds no credentials', () => {
  it('reads no secret and no token', () => {
    expect(JOB_BLOCK).not.toMatch(CREDENTIAL_READ);
  });

  it('inherits no credential from the workflow level', () => {
    // Workflow-level env reaches every job; workflow-level permissions are held too, in case the job's own block that replaces them is ever removed.
    expect(blockOf(WORKFLOW_LINES, 'env:')).not.toMatch(CREDENTIAL_READ);
    expect(blockOf(WORKFLOW_LINES, 'permissions:')).not.toMatch(WIDE_GRANT);
  });

  it("grants its token nothing but read access to the repository's contents", () => {
    // A job without its own permissions block gets the repository's default grant, which may be read and write.
    expect(jobPermissions(JOB_BLOCK)).toEqual(['contents: read']);
  });

  it('keeps the token out of .git/config, so the steps after checkout cannot read it from there', () => {
    expect(JOB_BLOCK).toContain('actions/checkout@');
    expect(checkoutsKeepingToken(JOB_BLOCK)).toEqual([]);
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

  it('runs no Terraform plan, apply or import, in the job or in the script it calls', () => {
    // Each of these needs a backend and a role; a validation job that ran one would need credentials it must not hold.
    expect(JOB_BLOCK).not.toMatch(/\bterraform\b(\s+-\S+)*\s+(plan|apply|import)\b/);
    const commands = [...CHECKS_TEXT.matchAll(/^\s*terraform -chdir="\$\w+" (\w+)/gm)].map(([, command]) => command);
    expect(new Set(commands)).toEqual(new Set(['init', 'validate', 'test']));
  });
});

describe('the job-shape readers catch what they exist to catch', () => {
  // Red controls on made-up workflow text: each reader must flag the shape the tests above forbid, so a reader that stopped matching cannot leave those tests green.
  /**
   * The block of a made-up job named like this one.
   * @param body - The job's lines after `runs-on`.
   * @returns The block, as the tests above read it.
   */
  function job(body: string): string {
    return blockOf(uncommented(`jobs:\n  ${JOB_KEY}:\n    runs-on: ubuntu-latest\n${body}`), JOB_HEADER);
  }

  it('flags a secret read by index, a whole secrets context and the job token', () => {
    for (const read of [
      "${{ secrets['AWS_KEY'] }}",
      '${{ toJSON(secrets) }}',
      '${{ github.token }}',
      '${{ secrets.X }}'
    ])
      expect(job(`    env:\n      X: ${read}\n`), read).toMatch(CREDENTIAL_READ);
    expect(job('    secrets: inherit\n')).toMatch(CREDENTIAL_READ);
  });

  it('flags a workflow-level env reading a secret and a workflow-level identity-token grant', () => {
    const lines = uncommented(
      "name: x\nenv:\n  KEY: ${{ secrets['AWS_KEY'] }}\npermissions:\n  id-token: write\njobs:\n  a:\n    runs-on: ubuntu-latest\n"
    );
    expect(blockOf(lines, 'env:')).toMatch(CREDENTIAL_READ);
    expect(blockOf(lines, 'permissions:')).toMatch(WIDE_GRANT);
    expect(blockOf(uncommented('permissions: write-all\njobs:\n'), 'permissions:')).toMatch(WIDE_GRANT);
    expect(blockOf(uncommented('permissions:\n  contents: read\njobs:\n'), 'permissions:')).not.toMatch(WIDE_GRANT);
  });

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
  it('reads one backend in every root, an S3 one unless the root is allowed a local one', () => {
    // A root whose backend the reader missed, wherever the block sits, would drop out of every check below.
    for (const { root, backends } of roots()) {
      expect(backends, root).toHaveLength(1);
      if (LOCAL_BACKEND_ROOTS.includes(root)) expect(backends[0].type, root).toBe('local');
      else expect(backends[0].type, root).toBe('s3');
    }
  });

  it('yields an S3 key for every root the job must validate, except the allowed local ones', () => {
    const withKey = new Set(backendKeys().map(({ root }) => root));
    for (const root of REQUIRED_ROOTS) expect(withKey.has(root), root).toBe(true);
    for (const root of LOCAL_BACKEND_ROOTS) expect(roots().map((r) => r.root)).toContain(root);
  });

  it('reads a backend from backend.tf as readily as from main.tf', () => {
    // Red control on made-up files: the layout of infra/bootstrap, where the backend has a file of its own.
    const backends = rootBackends([
      { file: 'main.tf', text: 'provider "aws" {}\n' },
      {
        file: 'backend.tf',
        text: 'terraform {\n  # backend "s3" { key = "not/this" }\n  backend "s3" {\n    key = "hand/x/terraform.tfstate"\n  }\n}\n'
      }
    ]);
    expect(backends).toEqual([{ file: 'backend.tf', type: 's3', key: 'hand/x/terraform.tfstate' }]);
    expect(rootBackends([{ file: 'main.tf', text: 'terraform {}\n' }])).toEqual([]);
  });

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

  it("keeps the bootstrap root's pipeline state key of every deployment equal to the backend key of its pipeline root", () => {
    const main = readFileSync(resolve(REPO_ROOT, 'infra/bootstrap/main.tf'), 'utf8');
    expect(main, 'infra/bootstrap/main.tf derives no pipeline state key from the deployment key').toMatch(
      /^\s*pipeline_state_keys\s*=\s*\{\s*for k in keys\(var\.deployments\)\s*:\s*k\s*=>\s*"pipeline\/\$\{k\}\/aws\/terraform\.tfstate"\s*\}$/m
    );
    const map = JSON.parse(
      readFileSync(resolve(REPO_ROOT, 'infra/bootstrap/deployments.auto.tfvars.json'), 'utf8')
    ) as {
      deployments: Record<string, unknown>;
    };
    const keys = Object.keys(map.deployments);
    expect(keys).toContain('staging');
    for (const key of keys) {
      expect(backendKeys().find(({ root }) => root === `infra/envs/${key}/aws`)?.key, key).toBe(
        `pipeline/${key}/aws/terraform.tfstate`
      );
    }
  });
});
