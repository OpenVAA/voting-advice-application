/**
 * Guards the trust inputs that a hand apply of the bootstrap root carries: the numeric ids of the repository and of its owner, the subjects each role trusts, and the plan role's permissions over the pipeline's state lock. A wrong id or subject makes a role unassumable, and nothing short of the first credentialed workflow run would show it, so the values are held here. The files are read as text; no Terraform runs and no account is reached.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const TFVARS = join(REPO_ROOT, 'infra/bootstrap/terraform.tfvars');
const MODULE_DIR = join(REPO_ROOT, 'infra/modules/github-oidc');

const REPOSITORY = 'repo:OpenVAA/voting-advice-application';

/** The tfvars file with every comment line removed, so a commented-out assignment counts as absent. */
function tfvars(): string {
  return readFileSync(TFVARS, 'utf8')
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');
}

/** The value of a top-level string assignment, or `undefined` when the name is not assigned. */
function stringValue(name: string): string | undefined {
  return new RegExp(`^${name}\\s*=\\s*"([^"]*)"\\s*$`, 'm').exec(tfvars())?.[1];
}

/** The strings of a top-level list assignment, `name = ["a", "b"]`, possibly spread over several lines. */
function listValue(name: string): Array<string> | undefined {
  const body = new RegExp(`^${name}\\s*=\\s*\\[([^\\]]*)\\]`, 'm').exec(tfvars())?.[1];
  return body === undefined ? undefined : [...body.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}

/** Every `.tf` file of the github-oidc module, by file name. */
function moduleFiles(): Map<string, string> {
  return new Map(
    readdirSync(MODULE_DIR)
      .filter((name) => name.endsWith('.tf'))
      .map((name) => [name, readFileSync(join(MODULE_DIR, name), 'utf8')])
  );
}

/** The text of one top-level block, from its header line to the closing brace at column 0. */
function block(source: string, header: string): string | undefined {
  const start = source.indexOf(`${header} {\n`);
  if (start < 0) return undefined;
  const end = source.indexOf('\n}\n', start);
  return source.slice(start, end < 0 ? undefined : end + 2);
}

describe('bootstrap terraform.tfvars and the github-oidc module', () => {
  it('assigns the numeric ids of the repository and of its owner', () => {
    expect(stringValue('github_repository_id')).toBe('546467466');
    expect(stringValue('github_repository_owner_id')).toBe('115159211');
  });

  it('lets the deploy role trust the staging and staging-destroy environments and nothing else', () => {
    expect(listValue('deploy_subjects')).toEqual([
      `${REPOSITORY}:environment:staging`,
      `${REPOSITORY}:environment:staging-destroy`
    ]);
  });

  it('lets the plan role trust pull requests and nothing else', () => {
    expect(listValue('plan_subjects')).toEqual([`${REPOSITORY}:pull_request`]);
  });

  it('pins neither trust to a workflow', () => {
    for (const [name, source] of moduleFiles()) {
      expect(source, name).not.toContain('job_workflow_ref');
    }
  });

  it('gives the plan role no policy that names the state lock', () => {
    for (const [name, source] of moduleFiles()) {
      expect(source, name).not.toContain('plan_lock');
    }
  });

  it('attaches to the plan role the read-only policy and its deny, and nothing else', () => {
    const attached = [...moduleFiles().values()].flatMap((source) =>
      [
        ...source.matchAll(
          /resource "aws_iam_role_policy_attachment" "\w+" \{\s*role\s*=\s*aws_iam_role\.plan\.name\s*policy_arn\s*=\s*(\S+)/g
        )
      ].map((m) => m[1])
    );
    expect(attached.sort()).toEqual(['"arn:aws:iam::aws:policy/ReadOnlyAccess"', 'aws_iam_policy.plan_deny.arn']);
  });

  it("keeps the deploy role's lock statement on the pipeline's lock object", () => {
    const policies = moduleFiles().get('policies.tf') ?? '';
    expect(policies).toMatch(
      /^\s*pipeline_lock_arn\s*=\s*"\$\{var\.state_bucket_arn\}\/\$\{var\.pipeline_state_key\}\.tflock"$/m
    );
    const document = block(policies, 'data "aws_iam_policy_document" "tfstate_pipeline"') ?? '';
    const lock = /statement \{\s*sid\s*=\s*"StateLock"([\s\S]*?)\n {2}\}/.exec(document)?.[1] ?? '';
    expect(lock).toMatch(/actions\s*=\s*\["s3:GetObject", "s3:PutObject", "s3:DeleteObject"\]/);
    expect(lock).toMatch(/resources\s*=\s*\[local\.pipeline_lock_arn\]/);
  });
});
