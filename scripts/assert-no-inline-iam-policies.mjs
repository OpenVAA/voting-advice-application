#!/usr/bin/env node

/**
 * NO-INLINE-IAM-POLICIES GUARD.
 *
 * What it forbids: any Terraform under `infra/` that gives an AWS identity a permission through an inline policy. Permissions come from AWS-managed or customer-managed policies attached by a separate attachment resource, so that every permission has a name, a version and one place to read it. An inline policy has none of the three: it lives inside the identity, is versioned by nothing, and is invisible to anyone reading the account's policy list.
 *
 * The banned forms, one finding name each (see `PATTERNS`):
 *   aws_iam_user_policy, aws_iam_role_policy, aws_iam_group_policy — the inline policy resource on a user, a role and a group.
 *   inline_policy — the inline policy block of a role, or any other use of the word.
 *   aws_ssoadmin_permission_set_inline_policy — an inline policy on an Identity Center permission set, which lands as an inline policy on the role that set creates in each account.
 *   aws_iam_policy_attachment — not an inline policy, but banned: the provider's own page for it (terraform-provider-aws v6.68.0, website/docs/r/iam_policy_attachment.html.markdown) warns that it "creates **exclusive** attachments of IAM policies. Across the entire AWS account, all of the users/roles/groups to which a single policy is attached must be declared by a single aws_iam_policy_attachment resource. This means that even any users/roles/groups that have the attached policy via any other mechanism (including other Terraform resources) will have that attached policy revoked by this resource." Use `aws_iam_role_policy_attachment`, `aws_iam_user_policy_attachment` or `aws_iam_group_policy_attachment`.
 *   aws_iam_*_policies_exclusive not empty — the user, role and group exclusive-policies resources attach nothing; they remove every inline policy not named in their `policy_names`. They are allowed only with `policy_names = []`, where they keep the identity free of inline policies on every apply. With a name in the list they protect an inline policy, so they are a finding. The resource's block is read from its `resource` line to its closing brace.
 *   .tf.json file — any file ending in `.tf.json` under the root is a path finding and is not parsed. Terraform reads JSON configuration as readily as HCL, and this guard reads only HCL lines, so a JSON file would be a way around it.
 *
 * What it leaves alone: trust policies (`assume_role_policy`, and the policy documents that feed one) and resource policies such as a bucket policy. Both describe who may reach a resource, not what an identity may do, and are outside the rule. The attachment resources for a single user, role or group, and the managed-policy resource itself, are what the rule asks for.
 *
 * The read is line-oriented and has no comment blanker, so a comment that names a banned form is a finding. Comments under `infra/` say "an inline policy" rather than naming the resource type.
 *
 * What this guard cannot see: a module sourced from outside `infra/` (the layout uses none); anything created through a CloudFormation stack resource, which can create any IAM object; and policies that already exist in an account, which an operator's read-only inventory script covers. Directories named `.terraform` (downloaded providers and modules) are skipped.
 *
 * A check that examined nothing must not report success: a root holding no `.tf` file exits 1.
 *
 * Usage:
 *   node scripts/assert-no-inline-iam-policies.mjs                # gate over infra/: exit 1 on any finding
 *   node scripts/assert-no-inline-iam-policies.mjs --root <dir>   # the same over another directory
 *   node scripts/assert-no-inline-iam-policies.mjs --self-test    # the fixture roots against their committed findings
 *
 * Output: one finding per line on stdout, as `<path>:<line>: <pattern-name>` for contents or `<path>: path matches <pattern-name>` for a path, with paths relative to the repository root. The closing summary line goes to stderr, so stdout holds findings and nothing else.
 *
 * Exit codes:
 *   0 - no finding; or --self-test passed
 *   1 - at least one finding; or no `.tf` file under the root; or an unreadable root; or --self-test found a difference
 *   2 - usage error
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-no-inline-iam-policies.mjs';
const DEFAULT_ROOT = 'infra';
const FIXTURE_DIR = 'scripts/fixtures/no-inline-iam-policies';
const FIXTURE_OK = `${FIXTURE_DIR}/ok`;
const FIXTURE_VIOLATIONS = `${FIXTURE_DIR}/violations`;
const FIXTURE_EXPECTED = `${FIXTURE_DIR}/expected.violations`;

/**
 * One row per banned form read line by line: the name a finding prints and its expression. The word boundaries keep `aws_iam_role_policy` from matching `aws_iam_role_policy_attachment` (an underscore follows, so no boundary) or `aws_iam_role_policies_exclusive` (a different word), and keep `inline_policy` from matching inside the permission-set resource's name (an underscore precedes it).
 */
const PATTERNS = [
  { name: 'aws_iam_user_policy', re: /\baws_iam_user_policy\b/ },
  { name: 'aws_iam_role_policy', re: /\baws_iam_role_policy\b/ },
  { name: 'aws_iam_group_policy', re: /\baws_iam_group_policy\b/ },
  { name: 'inline_policy', re: /\binline_policy\b/ },
  { name: 'aws_ssoadmin_permission_set_inline_policy', re: /\baws_ssoadmin_permission_set_inline_policy\b/ },
  { name: 'aws_iam_policy_attachment', re: /\baws_iam_policy_attachment\b/ }
];

/** The exclusive-policies resources, read as a block: allowed only when every `policy_names` in the block is an empty list. */
const EXCLUSIVE = {
  name: 'aws_iam_*_policies_exclusive not empty',
  start: /^\s*resource\s+"aws_iam_(?:user|role|group)_policies_exclusive"/
};

/** The path finding: a JSON configuration file. */
const TF_JSON = { name: '.tf.json file', test: (file) => file.endsWith('.tf.json') };

function fail(message) {
  console.error(`${SELF}: ${message}`);
  console.error(`usage: node ${SELF} [--root <dir>] | --self-test`);
  process.exit(2);
}

// ── Arguments ──
const argv = process.argv.slice(2);
let selfTest = false;
let root = null;
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--self-test') selfTest = true;
  else if (a === '--root') {
    const value = argv[(i += 1)];
    if (!value || value.startsWith('--')) fail('--root requires a directory');
    root = value;
  } else fail(`unexpected argument '${a}'`);
}
if (selfTest && root !== null) fail('--self-test takes no other flag');

/** A root given on the command line is read relative to where the command was run; the default is the repository's `infra/`. */
const rootAbs = root === null ? path.join(REPO_ROOT, DEFAULT_ROOT) : path.resolve(process.cwd(), root);

/** A path as findings print it: relative to the repository root when inside it, absolute otherwise. */
function display(abs) {
  const rel = path.relative(REPO_ROOT, abs);
  return rel.startsWith('..') || path.isAbsolute(rel) ? abs : rel.split(path.sep).join('/');
}

/** Every `.tf` and `.tf.json` file under `dir`, sorted, skipping directories named `.terraform`. Symbolic links are not followed. */
function walk(dir, out = { tf: [], tfJson: [] }) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.terraform') walk(abs, out);
    } else if (entry.isFile()) {
      if (TF_JSON.test(entry.name)) out.tfJson.push(abs);
      else if (entry.name.endsWith('.tf')) out.tf.push(abs);
    }
  }
  return out;
}

/**
 * The text of the block that opens on line `start`, up to the line where its braces balance. Returns null when the file ends first.
 */
function blockFrom(lines, start) {
  let depth = 0;
  let opened = false;
  for (let i = start; i < lines.length; i += 1) {
    for (const ch of lines[i]) {
      if (ch === '{') {
        depth += 1;
        opened = true;
      } else if (ch === '}') depth -= 1;
    }
    if (opened && depth <= 0) return lines.slice(start, i + 1).join('\n');
  }
  return null;
}

/** Whether an exclusive-policies block keeps the identity free of inline policies: at least one `policy_names` and every one an empty list. */
function exclusiveIsEmpty(block) {
  if (block === null) return false;
  const assignments = [...block.matchAll(/\bpolicy_names\s*=\s*/g)];
  if (assignments.length === 0) return false;
  return assignments.every((m) => /^\[\s*\]/.test(block.slice(m.index + m[0].length)));
}

/** The findings of one `.tf` file, in line order. */
function findingsOf(abs) {
  const shown = display(abs);
  const lines = readFileSync(abs, 'utf8').split('\n');
  const found = [];
  lines.forEach((line, i) => {
    for (const p of PATTERNS) if (p.re.test(line)) found.push(`${shown}:${i + 1}: ${p.name}`);
    if (EXCLUSIVE.start.test(line) && !exclusiveIsEmpty(blockFrom(lines, i)))
      found.push(`${shown}:${i + 1}: ${EXCLUSIVE.name}`);
  });
  return found;
}

/** Scan one root: the findings, and how many `.tf` files were read. */
function scanRoot(dirAbs) {
  let stat;
  try {
    stat = statSync(dirAbs);
  } catch {
    return { error: `cannot read '${display(dirAbs)}'` };
  }
  if (!stat.isDirectory()) return { error: `'${display(dirAbs)}' is not a directory` };
  const { tf, tfJson } = walk(dirAbs);
  const findings = [];
  for (const abs of tfJson) findings.push(`${display(abs)}: path matches ${TF_JSON.name}`);
  for (const abs of tf) findings.push(...findingsOf(abs));
  return { findings, read: tf.length };
}

if (selfTest) runSelfTest();
else gate();

// ── Gate ──
// The exit status is set rather than forced: writes to a pipe are asynchronous, and an immediate exit would drop findings that are still queued.
function gate() {
  const result = scanRoot(rootAbs);
  if (result.error) {
    console.error(`No-inline-IAM-policies guard — ${result.error}; nothing was examined.`);
    process.exitCode = 1;
    return;
  }
  for (const f of result.findings) console.log(f);
  if (result.read === 0) {
    console.error(
      `No-inline-IAM-policies guard — no .tf file under '${display(rootAbs)}', so nothing was examined. A check that examined nothing must not report success.`
    );
    process.exitCode = 1;
    return;
  }
  console.error(
    `No-inline-IAM-policies guard — ${result.read} .tf file(s) read under '${display(rootAbs)}'; ${result.findings.length} finding(s).`
  );
  process.exitCode = result.findings.length > 0 ? 1 : 0;
}

// ── Self-test: the fixture roots against their committed findings ──
function runSelfTest() {
  const bad = scanRoot(path.join(REPO_ROOT, FIXTURE_VIOLATIONS));
  const good = scanRoot(path.join(REPO_ROOT, FIXTURE_OK));
  let expected;
  try {
    expected = readFileSync(path.join(REPO_ROOT, FIXTURE_EXPECTED), 'utf8')
      .split('\n')
      .filter((l) => l.trim() !== '' && !l.startsWith('#'));
  } catch {
    console.error(`No-inline-IAM-policies guard — self-test FAILED: cannot read ${FIXTURE_EXPECTED}.`);
    process.exitCode = 1;
    return;
  }
  if (bad.error || good.error) {
    console.error(`No-inline-IAM-policies guard — self-test FAILED: ${bad.error ?? good.error}.`);
    process.exitCode = 1;
    return;
  }
  const observed = bad.findings;
  const missing = expected.filter((l) => !observed.includes(l));
  const unexpected = observed.filter((l) => !expected.includes(l));
  for (const l of missing) console.log(`self-test: expected but not reported: ${l}`);
  for (const l of unexpected) console.log(`self-test: reported but not expected: ${l}`);
  for (const l of good.findings) console.log(`self-test: reported on the clean root: ${l}`);
  const ok =
    missing.length === 0 &&
    unexpected.length === 0 &&
    observed.length === expected.length &&
    good.findings.length === 0 &&
    bad.read > 0 &&
    good.read > 0;
  console.error(
    `No-inline-IAM-policies guard — self-test ${ok ? 'passed' : 'FAILED'}: ${observed.length} finding(s) on the violating root, ${expected.length} expected; ${good.findings.length} on the clean root; ${bad.read + good.read} .tf file(s) read.`
  );
  process.exitCode = ok ? 0 : 1;
}
