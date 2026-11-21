# Phase 183: Terraform Foundation and Supabase as Code - Pattern Map

**Mapped:** 2026-10-11
**Files analyzed:** 16 file groups (9 with a codebase analog, 7 HCL groups without)
**Analogs found:** 9 / 16

Analogs are cited by path and quoted text. Line numbers are hints only; the quoted text is the anchor.
Every analog path below was checked with `git ls-files` in the worktree and is tracked.

The repository has no `infra/` directory, no `.tf` file and no Terraform tooling. For every HCL file the
planner uses `183-RESEARCH.md` (sections Q1, Q3, Q4, Q7, Q8, Q10, "Architecture Patterns", "Code Examples").
No analog is forced on them. See "No Analog Found".

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/assert-hosted-settings-parity.mjs` (new; name is a proposal) | utility (lint guard) | transform (line-read TOML + JSON, compare) | `scripts/assert-auth-signup-closed.mjs` | exact |
| `scripts/assert-no-inline-iam-policies.mjs` (new; name is a proposal) | utility (lint guard) | batch (file scan) | `scripts/assert-no-candidate-app-names.mjs` (scan, flags) + `scripts/assert-auth-signup-closed.mjs` (embedded cases) | role-match |
| `scripts/fixtures/<guard>/…` (new, if the fixture form is chosen) | test fixture | file-I/O | `scripts/fixtures/grant-permission-enum/` and `scripts/fixtures/assert-no-candidate-app-names.input.ts` | exact |
| `package.json` (modified: two `assert:*` keys, two `lint:check` links) | config | — | the file itself: `"assert:auth-signup-closed"` and the tail of `"lint:check"` | exact |
| `packages/dev-seed/tests/<name>Gate.test.ts` (new; one or two specs) | test | request-response (reads repo-root files) | `packages/dev-seed/tests/assertEnvPairRegistryGate.test.ts` (chain wiring) + `packages/dev-seed/tests/nodeEngineGate.test.ts` (CI job slice) | exact |
| `.github/workflows/main.yaml` (modified: `infra-validate` job) | config (CI) | batch | the `node-engine-range-negative-control` job in the same file | role-match |
| `.gitignore` (modified: Terraform entries) | config | — | the file itself: the `scripts/.vacuity-probe-*.mjs` block and the `!.env.example` re-assertion block | exact |
| `.dockerignore` (modified: `infra`, research recommendation) | config | — | the file itself (two lines) | exact |
| `infra/scripts/account-inventory.sh` (new) | utility (operator script) | batch (read-only CLI calls) | `tests/scripts/ci-write-local-keys.sh` (header, strict mode) + `tests/scripts/visual-container.sh` (flags, exit-code table) | role-match |
| `infra/README.md`, `infra/scripts/README.md` (new; the runbook and the INFRA-18 record) | documentation | — | `tests/IDURA-TEST-RUNBOOK.md` (operator runbook) + `apps/supabase/README.md` § "Local auth and Edge runtime configuration" | role-match |
| `infra/modules/supabase/hosted-settings.json` (new) | config (data read by HCL and a guard) | — | `security/audit-baseline.json` (a tracked JSON a guard parses) | partial |
| `infra/bootstrap/*.tf`, `terraform.tfvars`, `.terraform.lock.hcl` | config (IaC root) | — | none | none |
| `infra/modules/{state-bucket,github-oidc,registry,budget,dns-zone,mail-ses,supabase}/*.tf` | config (IaC module) | — | none | none |
| `infra/envs/staging/{dns-mail,supabase,aws}/*` | config (IaC root) | — | none | none |
| `infra/envs/example/{dns-mail,supabase,aws}/*` | config (IaC root) | — | none | none |
| `infra/envs/scratch/supabase/*` | config (IaC root, local state) | — | none | none |
| `infra/.terraform-version` | config | — | none | none |

Not expected to change, stated so the planner does not add it by reflex: `.prettierignore`. Research assumes
Prettier skips `.tf`, `.tfvars` and `.hcl` (assumption A16) and reads `.gitignore`. `.prettierignore` already
holds `scripts/fixtures/`, so guard fixtures are outside `format:check`. Only if `yarn format:check` goes red
on a file under `infra/` does this file gain an entry.

## Pattern Assignments

### `scripts/assert-hosted-settings-parity.mjs` (lint guard, transform)

**Analog:** `scripts/assert-auth-signup-closed.mjs` (220 lines; read whole). It already reads the same
`config.toml` with the same technique D-14 rules.

**Docblock shape** — an upper-case title line that a gate spec later greps for, then what it requires, what it
cannot see, how it reads, usage, exit codes:

```javascript
#!/usr/bin/env node

/**
 * AUTH-SIGNUP-CLOSED GUARD.
 *
 * What it requires: three keys of `apps/supabase/supabase/config.toml`, each inside its own table.
 ...
 * What this guard cannot see: it reads the file, and the auth container reads the file only when the stack starts. ...
 *
 * It is a line-oriented read (Node built-ins only, no TOML parser): a table starts at its `[name]` header and ends at the next header, and a key is a `name = value` line with an optional trailing comment. The configuration file holds no multi-line value, which is what makes that reading exact.
 *
 * Usage:
 *   node scripts/assert-auth-signup-closed.mjs               # gate: exit 1 naming every key that does not hold
 *   node scripts/assert-auth-signup-closed.mjs --self-test   # run the same check over embedded configuration texts
 *
 * Exit codes:
 *   0 - all three keys hold; or --self-test passed
 *   1 - at least one key does not hold, or the file cannot be read; or --self-test found a difference
 *   2 - usage error
 */
```

**Imports and constants** (anchor `const REPO_ROOT = path.resolve(`):

```javascript
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-auth-signup-closed.mjs';
const CONFIG = 'apps/supabase/supabase/config.toml';
```

**The classification table** — the analog's `REQUIRED` array is the model for the four-class table of D-13.
Each row carries a `why` that is printed with a finding:

```javascript
/** The three requirements. `why` is printed with a finding, so a failing run says what the value protects. */
const REQUIRED = [
  {
    table: 'auth',
    key: 'enable_signup',
    value: 'false',
    why: 'public sign-up must be closed: an invitation is claimed by a confirmed address, and users are created by the service role only'
  },
```

**The TOML line read** (anchor `const TABLE_HEADER =`). Reuse it; it distinguishes live, commented-out and
duplicated keys, and scopes a key to its table (the file has `enable_signup` under three tables):

```javascript
const TABLE_HEADER = /^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*(?:#.*)?$/;

function readKey(text, table, key) {
  const live = new RegExp(`^\\s*${key}\\s*=\\s*(.*?)\\s*(?:#.*)?$`);
  const commented = new RegExp(`^\\s*#+\\s*${key}\\s*=`);
  const values = [];
  let commentedOut = false;
  let current = '';
  for (const line of text.split('\n')) {
    const header = TABLE_HEADER.exec(line);
    if (header) {
      current = header[1];
      continue;
    }
    if (current !== table) continue;
    const assignment = live.exec(line);
    if (assignment) values.push(assignment[1]);
    else if (commented.test(line)) commentedOut = true;
  }
  return { values, commentedOut };
}
```

What the new guard adds over this reader, with no analog in the tree:

- It must enumerate every live key of `[api]`, `[api.tls]`, `[auth]` and `[auth.*]`, not look up named keys,
  so that an unclassified key fails (D-13) and a table row with no key in the file fails (research Q2,
  "Tally"). The same loop serves: collect `current + '/' + key` for every line the `live` shape matches.
- The `live` expression strips a trailing `# …` comment. That is exact only while no value contains `#`.
  Values such as `"pg-functions://postgres/public/custom_access_token_hook"` and `"Your code is {{ .Code }}"`
  hold none today; the guard should fail closed on a quoted value containing `#` instead of misreading it.
- Array values (`schemas = ["public", "graphql_public"]`) are one line each in the file; parse the captured
  text with `JSON.parse`, which accepts that TOML array syntax, and fail closed if it throws.

**Findings to stdout, summary to stderr, status set and not forced** (anchor `function gate()`):

```javascript
function gate() {
  let text;
  try {
    text = readFileSync(path.resolve(REPO_ROOT, CONFIG), 'utf8');
  } catch (error) {
    console.error(
      `${SELF}: could not read '${CONFIG}' (${error.message}). A configuration this guard cannot read is never reported as closed.`
    );
    process.exitCode = 1;
    return;
  }
  const findings = check(text);
  for (const finding of findings) console.log(`${CONFIG}: ${describe(finding)}`);
  console.error(
    findings.length === 0
      ? `Auth-signup-closed guard — ${REQUIRED.length} key(s) hold in ${CONFIG}.`
      : `Auth-signup-closed guard — ${findings.length} of ${REQUIRED.length} key(s) do not hold in ${CONFIG}. ...`
  );
  process.exitCode = findings.length === 0 ? 0 : 1;
}
```

**Self-test with embedded cases** (anchors `const CORRECT =` and `const CASES = [`). A correct text, one
mutation per case with the expected finding ids, and a check that a case actually differs:

```javascript
const CASES = [
  { name: 'the required configuration', text: CORRECT, expected: [] },
  {
    name: '[auth] enable_signup = true',
    text: CORRECT.replace('enable_signup = false\n\n[auth.rate_limit]', 'enable_signup = true\n\n[auth.rate_limit]'),
    expected: ['auth/enable_signup']
  },
```

```javascript
    if (name !== CASES[0].name && text === CORRECT) {
      console.log(`self-test: FAIL  ${name}: the case text equals the required configuration, so it tests nothing`);
      ok = false;
      continue;
    }
```

Research's validation table (C5e) asks for one red case per class: A, S, D, an unclassified key, a stale table
row, and `pageSize`. Each is one `CASES` entry (or one fixture pair).

**Argument dispatch** (the analog's last lines):

```javascript
const args = process.argv.slice(2);
if (args.length === 0) gate();
else if (args.length === 1 && args[0] === '--self-test') selfTest();
else {
  console.error(`${SELF}: unexpected argument(s) '${args.join(' ')}'`);
  console.error(`usage: node ${SELF} [--self-test]`);
  process.exitCode = 2;
}
```

**Divergence the planner must plan for.** The analog takes no path argument. Research asks for injectable
paths (`--config <file> --settings <file>`, and a `pageSize` source) so the guard is seen failing without
editing the real files. The flag-loop model is in `scripts/assert-no-candidate-app-names.mjs` (anchor
`// ── Arguments ──`), copied under the next heading. Keep the analog's rule that an unknown argument is
exit 2.

**Three-channel comparison with a census line.** `max_rows` must agree in `config.toml`, the JSON and
`staticSettings.ts`. `scripts/assert-grant-permission-enum.mjs` compares three channels and withholds the
verdict when one cannot be read (anchor `a channel could not be read`):

```javascript
  const schemaSrc = readOrNull(SCHEMA_FILE);
  const generatedSrc = readOrNull(GENERATED_FILE);
  if (schemaSrc === null || generatedSrc === null) {
    console.error(
      `[ERROR] ${SELF}: a channel could not be read, so no comparison was made and the verdict is withheld.`
    );
    process.exitCode = 1;
    return;
  }
```

```javascript
  console.log(`Grant enum membership guard — census (canon / schema / generated):`);
```

The third channel's text to line-read, in `packages/app-shared/src/settings/staticSettings.ts`:

```typescript
  dataAdapter: {
    type: 'supabase',
    supportsContestantApp: true,
    supportsAdminApp: true,
    // Must equal PostgREST `max_rows` in apps/supabase/supabase/config.toml (50000) or a hosted project's API setting.
    pageSize: 50000
  },
```

**JSON read that fails closed.** `scripts/assert-declared-binaries.mjs` (anchor `function readJson(`):

```javascript
function readJson(filePath) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { ok: false, missing: error.code === 'ENOENT', message: error.message };
  }
}
```

**Extra assertions research assigns to this guard**, none of which has an analog beyond "one more finding
kind in the same loop": every key of the JSON is in a committed list of known hosted keys (pitfall 1); no
key name owned by the JSON appears in the module's `.tf` files (Pattern 2, "Why"); the Supabase module
still holds `resource "supabase_project"` with `prevent_destroy = true` (A-05); `supabase config push`
appears in no workflow, `infra/`, `scripts/` or `package.json` (C5d). For C5d the guard's own source and
fixtures spell the phrase; copy the structural self-exclusion of `assert-no-candidate-app-names.mjs`
(`const SELF_PATHS = [SELF, 'scripts/fixtures/assert-no-candidate-app-names.'];`).

---

### `scripts/assert-no-inline-iam-policies.mjs` (lint guard, batch scan)

**Analogs:** `scripts/assert-no-candidate-app-names.mjs` for a pattern table, flags and per-line findings;
`scripts/assert-auth-signup-closed.mjs` for the docblock and the embedded-case self-test if no fixture
directory is wanted.

**Pattern table** (anchor `const PATTERNS = [`). One row per banned form, the `name` being what a finding
prints:

```javascript
/** Each pattern: its group, the name a finding prints, the expression, and an optional path scope. */
const PATTERNS = [
  // ── symbols ──
  { group: 'symbols', name: 'CandApp', re: /CandApp(?!Auth(?:Callback|Logout))/ },
```

The rows for this guard come from research Q5: `aws_iam_user_policy`, `aws_iam_role_policy`,
`aws_iam_group_policy`, an `inline_policy` block, `aws_ssoadmin_permission_set_inline_policy`; the three
`aws_iam_*_policies_exclusive` resources unless `policy_names = []`; any `infra/**/*.tf.json` file as a path
finding; and, as a recommendation beyond INFRA-17, `aws_iam_policy_attachment`. Word boundaries matter:
`aws_iam_role_policy` must not match `aws_iam_role_policy_attachment` or `aws_iam_role_policies_exclusive`.
The analog's lookahead style (`re: /CandApp(?!Auth…)/`) is the model.

**Finding format and output channels** (analog docblock):

```
 * Output: one finding per line on stdout, as `<path>:<line>: <pattern-name>` for contents or `<path>: path matches <pattern-name>` for a path. The closing summary line goes to stderr, so stdout holds findings and nothing else.
```

**Flag loop and usage error** (anchor `// ── Arguments ──`). This is the model for `--root <dir>`:

```javascript
function fail(message) {
  console.error(`${SELF}: ${message}`);
  console.error(
    `usage: node ${SELF} [--report] [--only <group>[,<group>]] [--self-test]   (groups: ${GROUPS.join(', ')})`
  );
  process.exit(2);
}

const argv = process.argv.slice(2);
let report = false;
let selfTest = false;
let only = null;
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--report') report = true;
  else if (a === '--self-test') selfTest = true;
  else if (a === '--only') {
    const value = argv[(i += 1)];
    if (!value) fail('--only requires a group list');
    ...
  } else fail(`unexpected argument '${a}'`);
}
if (selfTest && (report || only)) fail('--self-test takes no other flag');
```

**The scan and its closing line** (anchor `function scan() {`):

```javascript
// The exit status is set rather than forced: writes to a pipe are asynchronous, and an immediate exit would drop findings that are still queued.
function scan() {
  ...
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter(Boolean);
  ...
    text.split('\n').forEach((line, i) => {
      for (const name of matchNames(line, file, patterns)) emit(`${file}:${i + 1}: ${name}`, name);
    });
  ...
  console.error(
    `No-candidate-app-names guard — ${scanned} tracked file(s) scanned; ${findings} finding(s) (${groupSummary}).`
  );
  process.exitCode = findings > 0 && !report ? 1 : 0;
}
```

**Divergence the planner must decide: how the file set is found.** The analog lists files with
`git ls-files`, and says so: "The file set is `git ls-files`, so an untracked file is never a finding." The
red control research specifies for C2b is "one run through `yarn lint:check` with a planted file". A planted,
uncommitted `.tf` file is untracked, so a guard built on `git ls-files` would stay green on it and the
control would read as a broken guard. Two ways out, pick one in the plan:

- walk the directory with `readdirSync`, as `scripts/assert-declared-binaries.mjs` does (anchor
  `for (const entry of readdirSync(dir).sort()) {`) and `scripts/assert-schema-migration-parity.mjs` does. A
  walk must skip `.terraform/` directories, which hold downloaded provider and module files after an `init`;
- keep `git ls-files` and have the red control `git add` the planted file (and unstage it afterwards).

A walk also makes `--root <fixture dir>` trivial. With either choice, a scan that found zero `.tf` files
under the real root should fail, not pass: the tree's rule is that a check which examined nothing does not
report success (see `scripts/assert-env-pairs-agree.mjs`, anchor `A check that examined nothing must not
report success`).

**Comment blanking.** A `.tf` comment that names a banned resource (`# never aws_iam_role_policy`) would be a
false finding on a line scan. `scripts/assert-edge-function-env.mjs` exports a comment blanker that keeps
offsets (`export function blankComments(text, family)`, `export const TS_FAMILY = { c: true };`), backed by
`scripts/lib/comment-spans.mjs`. HCL uses `#`, `//` and `/* */`. The planner either reuses that helper with a
family that fits HCL, or states in the guard's header that a comment naming a banned form is a finding and
keeps such names out of `infra/` comments. The second is simpler and matches how the name guard treats
prose.

**The header should name what a text guard cannot see** (research Q5): a module from outside `infra/`, a
`*.tf.json` file (hence the path finding), and `aws_cloudformation_stack`. The model sentence is the analog's
"What this guard cannot see: …" paragraph in `assert-auth-signup-closed.mjs`.

---

### `scripts/fixtures/<guard>/…` (test fixtures)

**Analogs:** two forms exist; either is acceptable.

Flat pair, used by `scripts/assert-no-candidate-app-names.mjs`:

```javascript
const FIXTURE_INPUT = 'scripts/fixtures/assert-no-candidate-app-names.input.ts';
const FIXTURE_EXPECTED = 'scripts/fixtures/assert-no-candidate-app-names.expected.ts.violations';
```

The self-test compares observed against expected in both directions (anchor
`// ── Self-test: the fixture against its committed findings ──`):

```javascript
  const expected = readFileSync(FIXTURE_EXPECTED, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '' && !l.startsWith('#'));
  const missing = expected.filter((l) => !observed.includes(l));
  const unexpected = observed.filter((l) => !expected.includes(l));
  for (const l of missing) console.log(`self-test: expected but not reported: ${l}`);
  for (const l of unexpected) console.log(`self-test: reported but not expected: ${l}`);
  const ok = missing.length === 0 && unexpected.length === 0 && observed.length === expected.length;
```

Directory with a clean file, a violating file and the expected findings, used by
`scripts/assert-grant-permission-enum.mjs`: `scripts/fixtures/grant-permission-enum/enums.ok.sql`,
`enums.violations.sql`, `expected.violations`. This form fits `--root <dir>` and `--settings <file>`: a
fixture root with one `.tf` file per banned form, and a fixture JSON whose `max_rows` is 49999.

Three placement rules that follow from files already in the tree:

- Fixtures go under `scripts/fixtures/`, never under `infra/`. Under `infra/` the inline-policy guard would
  report its own fixtures, and `terraform fmt -check -recursive infra` and the validate loop would read
  them.
- `.prettierignore` already lists `scripts/fixtures/` with the reason "reformatting an input file silently
  shifts every line number and reddens `--self-test`". No new entry is needed.
- `scripts/assert-no-candidate-app-names.mjs` scans every tracked file, fixtures included. Fixture text must
  not spell the Contestant app with the word that guard forbids.

---

### `package.json` (two script keys, two chain links)

**Analog:** the newest guard's wiring in the same file.

```json
    "assert:edge-function-env": "node scripts/assert-edge-function-env.mjs",
    "assert:auth-signup-closed": "node scripts/assert-auth-signup-closed.mjs",
```

and the tail of `lint:check`:

```
… && yarn assert:grant-permission-enum && yarn assert:edge-function-env && yarn assert:auth-signup-closed"
```

Copy exactly: key `assert:<name>`, value `node scripts/assert-<name>.mjs` with no argument, and
` && yarn assert:<name>` appended at the end of the chain. The value must stay argument-free because the gate
specs assert it with `toBe('node scripts/assert-<name>.mjs')`.

A script that cannot run in `lint:check` takes a different prefix. `assertEnvPairRegistryGate.test.ts` states
the rule: "Its script key is deliberately `check:env-pairs-agree` rather than `assert:*`, because every
existing `assert:*` key IS a chain link". The account-side inventory is a shell script the operator runs
with credentials; it gets no `assert:*` key.

---

### `packages/dev-seed/tests/<name>Gate.test.ts` (wiring spec)

**Analog:** `packages/dev-seed/tests/assertEnvPairRegistryGate.test.ts` (59 lines), the smallest complete
wiring spec. Note that `assert-auth-signup-closed` has no gate spec of its own; the new guards should not
copy that gap.

**Imports and repo root:**

```typescript
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
```

**The three wiring assertions** (membership of the chain, key points at the file, file is recognisable):

```typescript
  it('keeps `yarn assert:env-pair-registry` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:env-pair-registry');
  });

  it('points the registered script at the guard it claims to run', () => {
    expect(ROOT_PACKAGE_JSON.scripts['assert:env-pair-registry']).toBe('node scripts/assert-env-pair-registry.mjs');
  });

  it('keeps the guard file itself present and recognisable', () => {
    expect(readFileSync(resolve(REPO_ROOT, 'scripts/assert-env-pair-registry.mjs'), 'utf8')).toContain(
      'CROSS-RUNTIME ENV-PAIR REGISTRY GUARD'
    );
  });
```

The third assertion greps the guard's upper-case docblock title, so each new guard's title line is a
contract with its spec.

**The rule every sibling spec repeats** — assert membership only:

> The invariant asserted here is MEMBERSHIP of the `&&` chain, never terminal position, never the whole
> string, never the link count.

**Exercising the guard from the spec.** Two existing ways:

- run it as a child process, as `packages/dev-seed/tests/projectScopingGate.test.ts` does:
  `spawnSync(process.execPath, [resolve(REPO_ROOT, GUARD_PATH)], { cwd: REPO_ROOT, encoding: 'utf8' })`, then
  assert on `status` and `stdout`. With `--root` and `--settings` flags this needs no copy of the guard and
  no edit of a real file;
- import it, as `packages/dev-seed/tests/edgeFunctionEnvGate.test.ts` does
  (`import(pathToFileURL(GUARD_PATH).href)`). That requires the guard to export its functions and to run
  `main()` only when executed directly, as `scripts/assert-env-pairs-agree.mjs` ends:
  `if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();`

**Asserting the shape of the `infra-validate` job**, if the plan wants it. Model:
`packages/dev-seed/tests/nodeEngineGate.test.ts`, which reads the workflow as text, drops whole-line
comments, and slices one job between its key and the next:

```typescript
const JOB_KEY = 'node-engine-range-negative-control';
const JOB_HEADER = `  ${JOB_KEY}:`;

const WORKFLOW_LINES = readFileSync(resolve(REPO_ROOT, '.github/workflows/main.yaml'), 'utf8')
  .split('\n')
  .filter((line) => !/^\s*#/.test(line));

const JOB_BLOCK = (() => {
  const start = WORKFLOW_LINES.indexOf(JOB_HEADER);
  if (start === -1) return '';
  const after = WORKFLOW_LINES.slice(start + 1);
  const next = after.findIndex((line) => /^ {2}\S/.test(line));
  return (next === -1 ? after : after.slice(0, next)).join('\n');
})();
```

and guards the slice itself before reading from it:

```typescript
  it('declares the negative-control job exactly once', () => {
    expect(WORKFLOW_LINES.filter((line) => line === JOB_HEADER)).toHaveLength(1);
  });
```

Useful assertions for `infra-validate` in that style: the block contains `-backend=false`; it contains no
`secrets.` and no `aws-actions/configure-aws-credentials` (D-16, "needs no credentials"); every `uses:` line
the milestone adds carries a 40-character SHA.

Run command: `yarn workspace @openvaa/dev-seed test:unit` (`"test:unit": "vitest run"`).

---

### `.github/workflows/main.yaml` — the `infra-validate` job

**Analog:** the `node-engine-range-negative-control` job, the only job with no Yarn install and no Supabase
stack. It is the last job in the file today.

**The comment block above a job** says why it exists and what it deliberately lacks:

```yaml
  # It invokes the guard by path rather than reimplementing the comparison, so deleting the guard
  # breaks this job.
  #
  # No install, no Yarn, no cache: the guard imports only Node built-ins, which is what lets it run
  # from `preinstall`.
```

The `dependency-audit` job's block has the sentence closest to D-16: "No `TURBO_TOKEN` / `TURBO_TEAM`: the
job runs no turbo task, and credentials it does not use would only widen its blast radius."

**Job skeleton and step naming** (two-space job key, quoted step names, `ubuntu-latest`):

```yaml
  node-engine-range-negative-control:
    runs-on: ubuntu-latest

    steps:
      - name: "Checkout source code"
        uses: actions/checkout@v7

      - name: "Setup Node.js 22.x (deliberately out of range)"
        uses: actions/setup-node@v7
        with:
          node-version: "22.x"
```

**A step that must fail loudly reads its status directly and emits `::error::`:**

```yaml
        run: |
          STATUS=0
          OUTPUT="$(node scripts/assert-node-engine.mjs 2>&1)" || STATUS=$?
          if [ "$STATUS" -eq 0 ]; then
            echo "::error::assert-node-engine exited 0 under $(node -v), which the declared engines.node range does not admit. ..."
            exit 1
          fi
```

Use this idiom for the step research asks for, which fails when the root glob matches fewer roots than
expected, so an empty loop cannot pass. The one-line form is in the `sql-lint` job:

```yaml
        run: command -v psql || { echo "::error::psql not found on the runner - lint-schema.mjs cannot reach the database without it"; exit 1; }
```

**The job body itself has no analog.** Take it from `183-RESEARCH.md` Q9 (`hashicorp/setup-terraform` at
commit `dfe3c3f87815947d99a8997f908cb6525fc44e9e` with the `# v4.0.1` trailing comment, `terraform fmt -check
-recursive -diff infra`, the `init -backend=false -input=false -lockfile=readonly` and `validate` loop).

**Facts of the file that bind the new job:**

- Triggers. The workflow runs on `push` to `main` and `"ci-evidence/**"` and on pull requests into `main`.
  The comment at the top of the file states the catch for an evidence commit: "A commit that touches only
  markdown produces no run at all, and a missing run reads like a passing one, so every evidence commit must
  touch at least one non-`.md` path." A commit that adds `.tf` files satisfies it; a commit that only edits
  `infra/README.md` does not.
- Pins. Every existing `uses:` line is a tag (`actions/checkout@v7`, `actions/setup-node@v7`, …). The file
  has no SHA-pinned action yet, so the new line is the first of its kind and its `# v4.0.1` comment is the
  convention being set. Whether the new job's `actions/checkout` line is pinned by SHA is a reading of D-16
  the plan must state (research Q9, "checkout").
- Existing specs that read this file. `ciDockerImageBuildGate.test.ts` asserts the `uses:` list of the
  `docker-image-build` job only, and `nodeEngineGate.test.ts` slices its own job to the next job key and
  forbids `node-version-file` anywhere in the file. A job appended after the last one is safe for both.

---

### `.gitignore` (Terraform entries)

**Analog:** the file itself. A block is a comment that says why, then the patterns:

```gitignore
# Supabase CLI local state (rewritten on every CLI run — machine-local, never shared)
supabase/.branches/
supabase/.temp/
```

The patterns come from `183-RESEARCH.md` Q11, written by hand (A-11), not from the standard template.

**Order matters in this file, and the file records the lesson.** Anchor `# RE-ASSERTED AFTER `.env.*`,
DELIBERATELY.`:

```gitignore
# RE-ASSERTED AFTER `.env.*`, DELIBERATELY. Git applies these patterns in order, so the
# `!.env.example` on line 4 is undone by the `.env.*` above — which silently re-ignored EVERY
# `.env.example` in the tree. ...
!.env.example
```

Consequences for the new block:

- Append it at the end of the file, or check each pattern against the lines after it. The proof is the pair
  of `git check-ignore -v` commands in research Q11, which also shows `terraform.tfvars` and
  `.terraform.lock.hcl` are not ignored (exit 1).
- Patterns already present that reach into `infra/`: `*.log` (so `crash.log` is covered already), `.env.*`,
  and the depth-free directory names `dist/`, `build/`, `target/`, `vendor/`, `tmp/`, `coverage/`, `.cache/`.
  No module or root directory may take one of those names; it would be ignored without an error.
- Existing comments in this file cite phase numbers ("Phase 138 per-run E2E evidence dirs"). Do not copy
  that. Research records the current rule for a public repository: no `.planning/` paths and no decision ids
  in comments.

---

### `.dockerignore` (add `infra`)

**Analog:** the file itself, in full:

```
# Avoid uploading node_modules or module builds to the container because we install and build everything there
**/node_modules
**/build
```

One comment line stating the reason, then the pattern. The file has no trailing newline today.
`packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` reads the Docker build wiring; the plan should run
`yarn workspace @openvaa/dev-seed test:unit` after the edit.

---

### `infra/scripts/account-inventory.sh` (operator script, read-only)

**Analogs:** `tests/scripts/ci-write-local-keys.sh` for the header and strict mode;
`tests/scripts/visual-container.sh` for a script with flags and a documented exit-code table.

**Header and strict mode** (`ci-write-local-keys.sh`, first lines):

```bash
#!/usr/bin/env bash
#
# ci-write-local-keys.sh -- Write the running local Supabase stack's anon and service-role keys
#                           into the repo-root .env and export them to later CI steps.
#
# Usage (GitHub Actions only, after `supabase start`):
#   tests/scripts/ci-write-local-keys.sh
#
# ... Each value is masked before use and never echoed; `set -x` must not be added.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
```

**A required precondition stated as a parameter expansion:**

```bash
: "${GITHUB_ENV:?ci-write-local-keys.sh runs only on GitHub Actions, which sets GITHUB_ENV}"
```

**Fail with a named reason:**

```bash
test -n "$ANON_KEY" || { echo "::error::ANON_KEY missing from supabase status"; exit 1; }
```

(The `::error::` prefix is for Actions; the operator script prints a plain message.)

**Flags and exit codes documented in the header** (`visual-container.sh`):

```bash
#   -h, --help              Print this header and exit 0.
...
# Exit codes -- the caller must be able to branch on the status alone:
#   0:  Playwright reported success
#   1:  Playwright reported failures
#   2:  usage error
```

Use that shape for `--assert-no-inline-user-policies` (research's test map names the flag) and for the
self-test over canned output (validation row C2c). The command body is in research Q5. One adjustment the
body needs under `set -euo pipefail`: the `aws organizations describe-organization … 2>&1 | head -2` line
returns non-zero in a standalone account, which is a normal case, and would end the script there. Capture
its status instead of letting it propagate.

The script prints names and counts only. Its header should say, as the analog does for its own secrets, that
it prints no credential and that `set -x` must not be added.

---

### `infra/README.md` and `infra/scripts/README.md` (runbook, INFRA-18 record)

**Analog:** `tests/IDURA-TEST-RUNBOOK.md`, the one operator runbook in the tracked tree. `docs/` holds only
`docs/key-generation.md`, and `.agents/code-review-checklist.md` is a review checklist, not a procedure.

**Structure to copy** — a purpose paragraph, a flow diagram in a fenced block, prerequisites, numbered steps,
troubleshooting, key files:

```markdown
# Bank Auth — Manual Full-Flow Testing Runbook (Idura)
## Flow overview
## Prerequisites
## Step 1 — Generate BOTH key pairs
## Step 2 — Configure the root `.env`
## Step 3 — Make the Edge Function see its env (the main gotcha)
### Option A (recommended) — serve the function with the root env file
## Troubleshooting (Idura specifics)
## Key files (for reference)
```

**Commands in fenced `bash` blocks with placeholders in angle brackets:**

```bash
PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=urn:my:application:identifier:<NNN>   # your Idura application URN
IDURA_DOMAIN=<your-subdomain>.idura.broker
```

**A trap is a blockquote that names the symptom:**

```markdown
> **The JWKS path is `/.well-known/jwks`, not `/.well-known/openid-configuration/jwks`.**
> ... The wrong path costs a 404 at the signature-verify
> step, surfacing as `ERR_JWKS_URI_HTTP_STATUS` / `stage=jwks-fetch`.
```

Research's pitfalls 1 to 13 each have a "Warning signs" line that fits this form.

**A settings table with the guard named beside it** — `apps/supabase/README.md`, section "Local auth and Edge
runtime configuration":

```markdown
| Table            | Key                    | Value          | Effect                                                                                   |
| ---------------- | ---------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `[auth]`         | `enable_signup`        | `false`        | no unauthenticated caller can create a user; users are created by the service role only  |
```

```markdown
`[auth.email] enable_signup` stays `true`: ... `yarn assert:auth-signup-closed` (a link of `yarn lint:check`) fails when
either auth key, or that one, changes.
```

Use it for the hosted-settings classes and for the four NS records of INFRA-18 (research Q6 has the table).

**What the runbook has that the analog lacks**, from research Q12 and the anti-patterns:

- every step ends with what the operator returns, and that list is non-secret output only;
- a status is never read through a pipe. Research's form:
  `terraform plan -destroy -input=false -no-color > /tmp/destroy.log 2>&1; status=$?`;
- secrets arrive as `TF_VAR_…` exports in one shell session and are written to no file.

Markdown under `infra/` is inside `yarn format:check` (`.prettierignore` does not exclude it), so tables must
be Prettier-clean. Markdown-only commits produce no CI run (`paths-ignore: "**.md"`).

---

### `infra/modules/supabase/hosted-settings.json` (data file a guard parses)

**Analog (partial):** `security/audit-baseline.json`, a tracked JSON that `scripts/assert-dependency-audit.mjs`
reads and refuses to run without (anchor `const BASELINE_PATH = resolve(REPO_ROOT,
'security/audit-baseline.json');`):

```javascript
      `the accepted-advisory baseline ${BASELINE_LABEL} does not exist. This gate cannot run without it, and it will not proceed as though the accepted set were empty. ...`
```

What carries over: the guard resolves the file from the repository root by a constant path, and a missing or
unparseable file is exit 1, never an empty comparison. What does not: that file documents itself with a
top-level `"note"` string. The settings JSON is merged into the request body group by group
(`local.hosted.auth`, `local.hosted.api`, …), so a prose key inside a group would be sent to the provider;
keep prose out of the file and put the explanation in the module's `.tf` comments and the guard's table.

The content skeleton is in `183-RESEARCH.md`, "Pattern 2". The file must be Prettier-clean: `format:check`
covers JSON under `infra/`.

## Shared Patterns

### Guard anatomy
**Source:** `scripts/assert-auth-signup-closed.mjs`
**Apply to:** both new guards

- Node built-ins only; `#!/usr/bin/env node`; ESM `.mjs`.
- Exit codes 0 / 1 / 2 as documented in the docblock; an unreadable input is 1.
- `process.exitCode = …`, not `process.exit(…)`, on the finding path. The reason is written in
  `scripts/assert-no-candidate-app-names.mjs`: "writes to a pipe are asynchronous, and an immediate exit would
  drop findings that are still queued."
- Findings on stdout (`console.log`), the one-line summary on stderr (`console.error`).
- `--self-test` as a separate mode with its own summary line: `… — self-test passed: N case(s).`

### A check that examined nothing fails
**Source:** `scripts/assert-env-pairs-agree.mjs`
**Apply to:** both guards, the `infra-validate` root loop, the inventory's assert mode

```javascript
  if (compared === 0 && pairs.length > 0) {
    fail(
      `not one of the ${pairs.length} derived pair(s) had both members set in '${target}', so ` +
        'nothing was compared. A check that examined nothing must not report success — ...'
    );
    process.exitCode = 1;
```

### Chain membership, and reading a red link
**Source:** `package.json` `lint:check`; `packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts`
**Apply to:** the wiring tasks and every red control

`lint:check` is one `&&` chain that starts with `turbo run lint && eslint tests && yarn typecheck:tests &&
yarn typecheck`. A red earlier link means the new guard never runs. For a red control, run the guard by
itself as well, and read the exit status without a pipe.

### Comments in new files
**Source:** `CLAUDE.md`; `scripts/assert-no-candidate-app-names.mjs`; `scripts/assert-comment-hygiene.mjs`
**Apply to:** every new file under `infra/` and `scripts/`

- The name guard scans every tracked file. No HCL comment, resource name, variable or runbook sentence may
  name the Contestant app with the forbidden word.
- `assert-comment-hygiene` reads `const SCAN_ROOTS = ['apps', 'packages', 'tests'];`, so the new gate spec
  under `packages/dev-seed/tests/` is inside its scan and `infra/` and `scripts/` are not. The rules are
  followed in all three: no `.planning/` paths, no phase or decision ids.

### Secrets never printed
**Source:** `tests/scripts/ci-write-local-keys.sh` ("never echoed; `set -x` must not be added");
`scripts/assert-env-pairs-agree.mjs` ("No value, no prefix, no length, no hash")
**Apply to:** the inventory script, the runbook, any step that touches Terraform output

## No Analog Found

The planner uses `183-RESEARCH.md` for these. Nothing in the repository is HCL, and no existing file
provisions cloud resources (`render.example.yaml` and `docker-compose.dev.yml` are a different tool and a
different model, and copying their shape would mislead).

| File | Role | Data Flow | Reason | Research section to use |
|------|------|-----------|--------|-------------------------|
| `infra/bootstrap/{backend,versions,providers,main,variables,outputs}.tf`, `terraform.tfvars` | IaC root | — | No Terraform in the tree | Q3 (backend, migration), Q10 (layout, default tags), "Backend and versions of a root" |
| `infra/modules/state-bucket/*.tf` | IaC module | — | same | Q3 "Bucket hardening" |
| `infra/modules/github-oidc/*.tf` | IaC module | — | same | Q4, "OIDC provider and the deploy role" |
| `infra/modules/registry/*.tf` | IaC module | — | same | Q10 "Registry" |
| `infra/modules/budget/*.tf` | IaC module | — | same | Q8 |
| `infra/modules/dns-zone/*.tf`, `infra/modules/mail-ses/*.tf` | IaC module | — | same | Q6, Q7 |
| `infra/modules/supabase/*.tf` | IaC module | — | same | Q1, "Pattern 2", "The Supabase project block" |
| `infra/envs/staging/{dns-mail,supabase,aws}/*`, `infra/envs/example/{…}/*`, `infra/envs/scratch/supabase/*` | IaC root | — | same | Q10, "Pattern 1", "Pattern 3" |
| `infra/**/.terraform.lock.hcl` | generated, tracked | — | Written by `terraform providers lock`, not by hand | Q9 note on `-lockfile=readonly` |
| `infra/.terraform-version` | config | — | The tree pins tool versions in `package.json` `engines` and in workflow `with:` blocks; no version file exists | Standard Stack (1.16.5) |

Repository facts that still bind these files even without an analog:

- `terraform.tfvars` is tracked and public. D-10 lists what may be in it: the account id, the bucket name,
  the domain, the Supabase project ref. An address or a secret may not (A-03).
- Directory names `build`, `dist`, `target`, `vendor`, `tmp`, `coverage` are ignored at any depth by
  `.gitignore`.
- `.tf` files are outside ESLint, Prettier (assumed) and the comment-hygiene scan; `terraform fmt` in the
  `infra-validate` job is their only format gate.

## Metadata

**Analog search scope:** `scripts/`, `scripts/fixtures/`, `scripts/lib/`, `packages/dev-seed/tests/`,
`.github/workflows/main.yaml`, `.gitignore`, `.dockerignore`, `.prettierignore`, `package.json`, `docs/`,
`tests/scripts/`, `tests/IDURA-TEST-RUNBOOK.md`, `apps/supabase/README.md`, `security/`,
`packages/app-shared/src/settings/staticSettings.ts`
**Files read:** 13 in full or in the relevant part
**Project skills:** `.claude/skills/` holds `components`, `data`, `database`, `filters`, `matching` and
`ship-review-stack`. None covers infrastructure, guards or CI, so none was loaded.
**Not run:** no `terraform` command, no cloud call, no Docker or Supabase stack.
**Pattern extraction date:** 2026-10-11
