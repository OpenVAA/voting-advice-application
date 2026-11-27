# Phase 184: Hosted Supabase Measurement and Conformance Probe - Pattern Map

**Mapped:** 2026-10-26
**Files analyzed:** 17
**Analogs found:** 15 / 17

Citations are content anchors (function names, constants, headings). Line numbers drift; grep for the anchor.
All analogs below were checked with `git ls-files` (tracked source, no mirrors).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `infra/scripts/probe-hosted.mjs` (entry) | utility / gate CLI | request-response (HTTP + psql) | `scripts/assert-hosted-settings-parity.mjs` (`gate`, `usage`, `FLAGS` argv loop) | role-match |
| `infra/scripts/probe/expected.mjs` | utility | file-I/O transform | parity guard `readChannel`, `readPageSize`, `readRoots`, `readConfig`, `DEFAULT_PATHS` | exact (same sources, D-16) |
| `infra/scripts/probe/checks.mjs` | utility (pure) | transform | parity guard `compareRow`, `check(inputs)` returning `{findings, channelErrors}` | exact |
| `infra/scripts/probe/sources.mjs` | utility | request-response | parity guard `import { execFileSync } from 'node:child_process'`; `check-drift.sh` `print_redacted` | partial |
| `infra/scripts/probe-hosted.test.ts` | test | transform | `packages/dev-seed/tests/hostedSettingsParityGate.test.ts` + parity guard `CASES`/`selfTest` | role-match |
| `infra/vitest.config.ts` | config | — | `tests/vitest.config.ts` | exact |
| `scripts/assert-unit-test-coverage.mjs` (`NON_WORKSPACE_SUITES`) | config/gate | — | itself (`NON_WORKSPACE_SUITES` entry for `tests/`) | exact |
| root `package.json` (`test:unit:infra`, chain into `test:unit`) | config | — | `test:unit:tests` script | exact |
| `infra/scripts/push-migrations.sh` | utility script | batch / CLI wrapper | `infra/scripts/check-drift.sh` | role-match |
| `infra/scripts/check-drift.sh` (linked-ref guard, header prereq 4) | utility script | — | its own `--target local` guard block | exact |
| `scripts/assert-hosted-settings-parity.mjs` (`inFamily` + `[functions.*]` rows + `CASES`) | gate | transform | its own `none(...)` rows and `CASES` | exact |
| `apps/supabase/supabase/config.toml` `[functions.account-access]` | config | — | `[functions.identity-callback]` block | exact |
| `packages/dev-seed/src/templates/smoke.ts` (name at discretion) | model/template | batch | `templates/e2e/perm/perm-closed-project.ts` (`buildMinimal`, `openForVoters`) | role-match |
| `packages/dev-seed/src/templates/index.ts` + `src/cli/help.ts` | config/registry | — | existing `BUILT_IN_TEMPLATES` entries; help's "Built-in templates:" list | exact |
| dev-seed template test | test | transform | `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts` (`runPipeline(template, BUILT_IN_OVERRIDES[name] ?? {})`) | role-match |
| `infra/envs/{scratch,staging}/supabase/*.tf` + `terraform.tfvars` (smtp object, `supabase_edge_function_secrets`, scratch `import {}`, scratch `faults.tf`) | config (IaC) | CRUD | `infra/envs/staging/supabase/main.tf` (`import` block, smtp args) ; `infra/modules/supabase/main.tf` `supabase_settings.smtp_secret` | role-match (secrets resource: no analog) |
| `infra/envs/staging/supabase/README.md` (runbook steps, first-administrator procedure, rows moved to "Observations") + evidence `184-*/evidence/184-NN-*.md` | docs | — | same README's "Not yet observed" / "Observations" tables; `183-*/evidence/183-NN-*.md` | exact |

## Pattern Assignments

### `infra/scripts/probe-hosted.mjs` + `infra/scripts/probe/*.mjs` (gate CLI, request-response)

**Analog:** `scripts/assert-hosted-settings-parity.mjs`

**Important structural deviation:** the parity guard runs its argv loop at top level (bottom of file, `const argv = process.argv.slice(2)` ... `gate({...})`), so it is NOT importable — its own Vitest spec spawns it (`hostedSettingsParityGate.test.ts`: "The guard is run as a child process and never imported"). The probe must instead keep `probe/*.mjs` free of top-level side effects so `probe-hosted.test.ts` can import `checks.mjs` directly (RESEARCH § Recommended Project Structure).

**Header doc-block pattern** (top of file, `HOSTED-SETTINGS PARITY GUARD.`): a long JSDoc stating what it requires, each class/check, and an explicit exit-code list:
```js
 *   0 - every key holds; or --self-test passed
 *   1 - at least one finding, or a channel could not be read; ...
 *   2 - usage error
```
Probe: 0 all PASS, 1 any FAIL, 2 could not run (D-13).

**Imports / repo root** (after header):
```js
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-hosted-settings-parity.mjs';
const DEFAULT_PATHS = {
  config: 'apps/supabase/supabase/config.toml',
  settings: 'infra/modules/supabase/hosted-settings.json',
  staticSettings: 'packages/app-shared/src/settings/staticSettings.ts',
  envsDir: 'infra/envs',
  moduleDir: 'infra/modules/supabase'
};
```
For `infra/scripts/probe/`, REPO_ROOT is `'../../..'` relative. Expected values come from these same paths plus the target root's `terraform.tfvars` (D-16) — no table of expected values in the probe.

**Channel read with withheld verdict** (`readChannel`, `gate`):
```js
function readChannel(absolute) {
  try {
    return { file: display(absolute), text: readFileSync(absolute, 'utf8') };
  } catch (error) {
    return { file: display(absolute), text: null, error: `could not be read (${error.code ?? error.message})` };
  }
}
...
  if (result.channelErrors.length > 0) {
    for (const { file, what } of result.channelErrors) console.log(`${file}: ${what}`);
    console.error(`... a channel could not be read, so no comparison was made and the verdict is withheld.`);
    process.exitCode = 1;   // probe: 2 (could not run)
    return;
  }
  for (const { file, id, what } of result.findings) console.log(`${file}: ${id}: ${what}`);
  process.exitCode = result.findings.length === 0 ? 0 : 1;
```
Probe adapts output to `PASS <name>` / `FAIL <name>: <finding>`; channel/source failures map to the cascade guard (a source unreachable => exit 2, never a wall of FAILs; D-17 "not a cascade").

**Reuse of parsers:** `readConfig(text)` (TOML table/key reader, for `[functions.*] verify_jwt`), `readPageSize(text)` (`dataAdapter.pageSize`), `readRootVariables(text)` (tfvars), `EXPECTED_GROUPS` (`api`, `auth`, `auth_hook`, `auth_send_email_hook`, `redirect_callback_paths`). Since the guard is not importable, copy the logic (or extract to a shared module only if the planner accepts touching the guard further).

**Argv pattern** (`usage`, `FLAGS`): `process.exitCode = 2` on usage error; `--flag <path>` resolved against `process.cwd()`; duplicate flag refused. Use `process.exitCode`, not `process.exit()`.

**Secret handling:** never accept service-role key (D-14); redact Management API bodies (RESEARCH Pitfall 6). Mirror `check-drift.sh` `print_redacted` intent and its "no flag for a database address" rule — psql connection via `PG*` env only.

**Seed check subprocess (`no-seed`):** run `psql -v ON_ERROR_STOP=1 -f infra/scripts/check-seed.sql` via `execFileSync`/`spawnSync`, reading status directly (never piped).

---

### `infra/scripts/probe-hosted.test.ts` (test)

**Analog:** `packages/dev-seed/tests/hostedSettingsParityGate.test.ts` (imports/REPO_ROOT shape) and the guard's `CASES` + `selfTest` (one case per finding id, "the case inputs equal the correct ones, so it tests nothing" anti-vacuity check).
```ts
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');   // infra/scripts → repo root
```
Pattern: a `correctInputs()` builder of recorded responses, then per-check cases each editing one field and asserting exactly that check name FAILs (mirrors D-17's "each FAIL matches its planted fault"), plus a cascade case (source unreachable => could-not-run, not N FAILs).

---

### `infra/vitest.config.ts` (config)

**Analog:** `tests/vitest.config.ts` — copy whole:
```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: { globals: true, environment: 'node', include: ['tests/utils/**/*.test.ts'] }
});
```
Change `include` to `['scripts/**/*.test.ts']` (root is `infra/`). Keep the header doc explaining it is not a workspace and how to run it alone.

### `scripts/assert-unit-test-coverage.mjs` + root `package.json`

```js
const NON_WORKSPACE_SUITES = [{ config: 'tests/vitest.config.ts', script: 'test:unit:tests' }];
```
Add `{ config: 'infra/vitest.config.ts', script: 'test:unit:infra' }`. Root `package.json`:
```json
"test:unit": "yarn assert:unit-coverage && turbo run test:unit && yarn test:unit:tests",
"test:unit:tests": "vitest run --config tests/vitest.config.ts",
```
Add `"test:unit:infra": "vitest run --config infra/vitest.config.ts"` and append `&& yarn test:unit:infra` to `test:unit` (Check 3 holds config + script + chain link together).

---

### `infra/scripts/push-migrations.sh` (CLI wrapper)

**Analog:** `infra/scripts/check-drift.sh`. Copy:
- Header comment shape: purpose, "How it checks", `Usage:` fenced block, flags list with OPTIONAL/REQUIRED, "A relative path is resolved against the REPO ROOT", "There is no flag for a database address", `Prerequisites. This script ASSERTS them; it never performs them:`, and an `Exit codes -- the caller must be able to branch on the status alone:` list.
- `set -euo pipefail`, `export LC_ALL=C`, `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"`.
- `fatal "<msg>" 2` precondition checks; tool loop `for tool in ...; do command -v "$tool" ...`.
- CLI is `node_modules/.bin/supabase` of the repo root (`"$CLI"`), with `--agent no --output-format text` (Pitfall 3, JSON for agent callers).
- Background-and-wait so signals reach the trap and status is read directly:
```bash
"$CLI" db diff "--$TARGET" --workdir "$WORKDIR" --agent no --output-format text </dev/null >"$DIFF_SQL" 2>"$DIFF_LOG" &
CLI_PID=$!
wait "$CLI_PID" || cli_status=$?
```
Wrapper flow (D-02): verify `<workdir>/supabase/.temp/project-ref` == given ref → `db push --linked --dry-run` → `db push --linked` (status read directly, never through a pipe; refuse interactive prompt, Pitfall 2) → `check-drift.sh --target linked --workdir <workdir>`. Second run must match `is up to date.` only (exact target word ASSUMED). Works from a dedicated linked workdir, never `apps/supabase` (Pitfall 1).

### `infra/scripts/check-drift.sh` (linked-ref guard)

Add a `linked` branch beside the existing `if [ "$TARGET" = "local" ]; then ... fi` guard (the block reading `LOCAL_PORT="$(toml_value "$CONFIG" "[db]" port)"` and the `case "${PGHOST:-}" in 127.0.0.1 | localhost | ::1)` check). Same `fatal "...; the two parts would judge two different databases" 2` phrasing. Checks per RESEARCH Item 7: ref file exists, 20 lowercase letters, `PGHOST=db.<ref>.supabase.co`+`PGUSER=postgres` or `*.pooler.supabase.com`+`PGUSER=*.<ref>`, refuse `PGPORT=6543`. Rewrite header prerequisite 4 ("For `--target linked` it cannot tell, and the caller answers for it.") to describe the new guard. If D-22 narrows the schema set, update the header paragraph "No schema list is given to the diff...".

---

### `scripts/assert-hosted-settings-parity.mjs` (widen to `[functions.*]`)

Edit `inFamily`:
```js
function inFamily(table) {
  return (
    table === UNREADABLE_TABLE ||
    table === 'api' ||
    table === 'api.tls' ||
    table === 'auth' ||
    table.startsWith('auth.')
  );
}
```
Add `table.startsWith('functions.')`. Classify with the existing helper `const none = (table, keys, why) => keys.map(...)` in `ROWS`, e.g. `...none('functions.identity-callback', ['verify_jwt'], '<why>')` and same for `account-access` (and any other live `[functions.*]` key, e.g. `send-email` if declared). Update header doc ("Every live key of the tables `[api]`, `[api.tls]`, `[auth]` and every `[auth.*]`..."), and add `CASES` entries (an unclassified `[functions.x]` key fails). Fixture text `CORRECT_CONFIG` must gain the `[functions.*]` blocks. `yarn lint:check` chains this guard; also note `PUSH_COMMAND`/`WRITER_DIRS` "one writer" scan covers `infra/` — `push-migrations.sh` must not contain the words of the config-push command.

### `apps/supabase/supabase/config.toml` `[functions.account-access]` (only if OBS-03 says so, D-09)

Copy the existing block:
```toml
[functions.identity-callback]
# The gateway does not verify a JWT for this function. The function verifies the identity
# provider's token itself, and binds its audience and issuer on every verification.
# `supabase functions deploy` reads this setting, so a deploy needs no flag for it.
verify_jwt = false
```
Comment under `apps/` is in comment-hygiene scope: present-tense, no phase/D-NN/`.planning` refs. `packages/dev-seed/tests/deploymentTemplates.test.ts` already asserts the identity-callback entry; extend it if account-access gets one.

---

### dev-seed smoke template (≥1001 nominations, D-18)

**Analog:** `packages/dev-seed/src/templates/e2e/perm/perm-closed-project.ts`
```ts
import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-closed-project-';

export const permClosedProjectTemplate: Template = {
  ...buildMinimal({ externalIdPrefix: P, candidates: 1, opinionQuestions: 1, infoQuestions: 0, settingsOverlay: {...} }),
  openForVoters: false
};
export default permClosedProjectTemplate;
```
Header doc: purpose, topology, ⚠ which project it touches, prefix discipline. For smoke: `candidates >= 1001`, small question set, `openForVoters: true` if that option wins the checkpoint, distinct prefix (keep `seed_`-compatible teardown in mind). Verify `buildMinimal` scales to 1001 (else use generator defaults like `default.ts` without its count-locked override).

Registration: `templates/index.ts` — import + entry in `BUILT_IN_TEMPLATES` (and `BUILT_IN_OVERRIDES` if any); `cli/help.ts` hard-coded "Built-in templates:" list ("Adding a built-in => update this file in the same commit"). `assertKnownRowProps.builtins.test.ts` walks `Object.keys(BUILT_IN_TEMPLATES)` so it covers the new template automatically; add a focused test asserting `runPipeline(template, {})` yields ≥1001 nominations and ≥1001 candidates.

---

### Terraform roots (scratch + staging)

**`import` block for scratch** — copy from `infra/envs/staging/supabase/main.tf`:
```hcl
import {
  to = module.supabase.supabase_project.this
  id = var.project_ref
}
```
Scratch currently lacks it and lacks `project_ref` variable/tfvars (Pitfall 5).

**smtp object** — module variable `smtp = object({ host, port (string), admin_email, sender_name })`, default null; staging root already passes `smtp`, `smtp_user`, `smtp_password` and its tfvars header says "The smtp object is added once the SMTP port ... has been measured". Scratch root must gain the same three args + variables (copy `infra/envs/staging/supabase/variables.tf` `variable "smtp"`, `"smtp_user"`, `"smtp_password"`). Secrets via `TF_VAR_*`, never tfvars.

**Separate-secret resource pattern** for `supabase_edge_function_secrets` — copy `infra/modules/supabase/main.tf` `resource "supabase_settings" "smtp_secret"` (count gated on null input, `depends_on`, explanatory comment on why it is separate). Module variables must not use `map`/`any` types (parity guard fails on that) — use `object({...})`.

**`faults.tf` (scratch only, D-17)** — `variable "plant_faults" { type = bool, default = false }` + `supabase_settings` with `count = var.plant_faults ? 1 : 0`, `depends_on = [module.supabase]`; must validate with default (CI `infra-validate`).

---

### README runbook + evidence

`infra/envs/staging/supabase/README.md`: steps are `### Step N: <title>` under `## Rehearsal on the throwaway project` / `## The persistent project`. Observed rows go into the existing `## Observations` table (`| Date (UTC) | Observation |`, e.g. `| 2026-10-22 | The import of ... |`), and settled rows are removed from `## Not yet observed` (`| Statement | Checked by |`). Do not add a third table. First-administrator procedure becomes a new step.

Evidence: `.planning/workstreams/deployment/phases/184-.../evidence/184-NN-<slug>.md`, as `183-*/evidence/183-01-baseline-gates.md`, `183-14-account-inventory.md`.

Todo append (D-12): `.planning/todos/pending/2026-10-11-migrate-to-supabase-publishable-keys-after-streams-merge.md`. `183-SECURITY.md` re-transfer note (D-21).

## Shared Patterns

### Exit-status discipline
**Source:** `infra/scripts/check-drift.sh` (verdict section) and parity guard `gate`.
0 = holds, 1 = finding, 2 = could not run; a part that could not run never yields 0 ("finding no drift is not a clean result"). Statuses read directly, never through a pipe (memory: gate status through a pipe hid 74 violations).

### No credentials on command lines
**Source:** `check-drift.sh` header ("There is no flag for a database address...Shell tracing must stay off"). Apply to push wrapper and probe: `PG*` env / password file only; access token from `SUPABASE_ACCESS_TOKEN`; anon key from env.

### Expected values from tracked files only
**Source:** parity guard `DEFAULT_PATHS`. Apply to probe (D-16, SUPA-11).

### Comment hygiene
Applies to `apps/`, `packages/` (config.toml comment, dev-seed template and its test): no phase/spike narrative, no `D-NN`, no `.planning/` paths. `infra/` and `scripts/` are outside `SCAN_ROOTS` of `scripts/assert-comment-hygiene.mjs` but follow the same intent.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `supabase_edge_function_secrets` resource | IaC | CRUD | Not used anywhere yet; follow `smtp_secret` shape + provider 1.11.0 docs (RESEARCH Item 12) |
| Probe HTTP/Management-API fetch layer (`sources.mjs`) | utility | request-response | No Node `fetch` client of hosted APIs in `scripts/`; use RESEARCH Item 4 endpoints and Pattern 3 cascade guard |

## Metadata

**Analog search scope:** `scripts/`, `infra/`, `tests/vitest.config.ts`, `packages/dev-seed/src/templates`, `packages/dev-seed/tests`, `apps/supabase/supabase/config.toml`, root `package.json`
**Files scanned:** ~20
**Pattern extraction date:** 2026-10-26
