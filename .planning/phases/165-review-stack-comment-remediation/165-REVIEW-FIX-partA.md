---
phase: 165-review-stack-comment-remediation
fixed_at: 2026-09-29T05:45:59Z
review_path: .planning/phases/165-review-stack-comment-remediation/165-REVIEW.md
scope: Part A only (A-WR-01..04, A-IN-01..10), fix_scope all
iteration: 1
findings_in_scope: 14
fixed: 14
skipped: 0
status: all_fixed
---

# Phase 165: Code Review Fix Report (Part A)

**Fixed at:** 2026-09-29T05:45:59Z
**Source review:** `165-REVIEW.md`, Part A
**Iteration:** 1
**Branch:** `ship/v2.15-13-review-fixes`, main working tree (`workflow.use_worktrees: false`, so no worktree was created)

**Summary:**
- Findings in scope: 14 (4 warnings, 10 info)
- Fixed: 14
- Skipped: 0
- Commits: 18, from `925954ff1` to `a62fca38b`: one per finding, plus 4 hygiene commits for files the fixes brought into the changed set (D-04)

No finding contradicted a decision in CONTEXT.md. No Info finding just restated a maintainer ruling, so none was skipped as `no_change_needed`.

## Fixed Issues

### A-WR-01: CI E2E runs lost Playwright's `forbidOnly` guard

**Files modified:** `tests/playwright.config.ts`
**Commits:** `925954ff1` (fix), `b7039042c` (D-04 hygiene)
**Applied fix:** `forbidOnly: !!process.env.CI || process.env.GITHUB_ACTIONS === 'true'`. `retries` and `workers` stay keyed on `CI`, which the wrapper unsets on purpose.
**Verified:** The config was evaluated three ways. With neither variable set, `forbidOnly` is `false`. With `GITHUB_ACTIONS=true` it is `true`, and with `CI=1` it is `true`.
**Hygiene:** The fix brought the whole file into the changed set, so a hygiene commit followed. It:
- removed review, decision, threat, plan and audit-finding ids and one artefact path (kept as `see phase 158`);
- rewrote the historical narrative;
- joined one broken comment line;
- corrected the timeout comment to "90s locally, 180s on GitHub Actions".

After it, the config loads with 100 projects, `tip-proofs.sh` exits 0, and the per-file gate is clean.

### A-WR-02: 33-entity-type-collision never builds a same-project collision

**Files modified:** `apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql`
**Commit:** `d20e00c47`
**Applied fix:** A new section 10 adds a confirmed, ToU-accepted candidate in `project_a`. It reuses `alliance_a`'s id and has no nomination. The id of `org_a` could not be reused, because §1 already holds a candidate with that primary key. The section has three pairs:
- `private.entity_has_confirmed_nomination`: `alliance` → true, `candidate` → false.
- `private.nomination_exists_in_contest`: `alliance` → true, `candidate` → false.
- As anon: the alliance's row count is 1 and the candidate's is 0.

The plan went from 42 to 48, and the file header names the new hops.
**Negative proof:** I ran it in-transaction and nothing was committed. I added `CREATE OR REPLACE` of both helpers without the `n.entity_type = p_entity_type` conjunct, then ran the test body. Tests 44, 46 and 48 failed ("have: true / want: false" and "have: 1 / want: 0"). The unmodified file passes 48/48. The applied functions were re-checked afterwards and still contain the conjunct.
**pgTAP:** full `test:db`: 34 files, PASS.

### A-WR-03: 18-entity-policies SELECT-family normaliser maps all four type literals to one placeholder

**Files modified:** `apps/supabase/supabase/tests/database/18-entity-policies.test.sql`
**Commit:** `18498dfea`
**Applied fix:** The normaliser now replaces only `'<left(tablename,-1)>'::entity_type` with `'OWN_TYPE'::entity_type`, the same way the self-update family does. It drops the all-types `ENT` mapping and the `'candidates'`/`'organizations'` → `TBL` replacements, which had no effect.

A companion assertion covers all eight entity SELECT policies, anon included. It requires `examined / own type present / foreign type present` = `8/8/0`. The plan went from 59 to 60.
**Negative proof:** In one transaction, `authenticated_select_candidates` was altered to pass `'organization'` to `entity_has_confirmed_nomination`. The old file's structural assertion stayed green. Only behavioural tests 35 and 43 failed, and only because they happen to cover that one policy. In the new file, 53 (the SELECT family: have 2, want 1) and 54 (the companion: have `8/8/1`) also fail.

### A-WR-04: CI E2E ran the whole-monorepo package watcher alongside the dev server

**Files modified:** `tests/scripts/e2e-run.sh`, `.github/workflows/main.yaml`, `tests/README.md`
**Commits:** `d2896ff0b` (fix), `69e48c6a4` and `a62fca38b` (D-04 hygiene)
**Verdict: the watcher is not needed in CI, so it is removed there.**

The wrapper gains `--no-watch`. The flag spawns `yarn dev:clean && yarn workspace @openvaa/frontend dev` instead of root `yarn dev`. That is the Vite process root `yarn dev` already starts as the second `concurrently` command, without `turbo watch` and without `--kill-others-on-fail`. `db:start` has already run in the wrapper's step 3.

Both guarantees act on that Vite process, so neither changes:
- **The served-checkout preflight** checks the `/@fs` echo from Vite.
- **The project scoping** comes from `PUBLIC_PROJECT_ID` (and `FRONTEND_PORT`), which are now exported inside the spawn subshell.

Other details:
- The process-group teardown is unchanged.
- `env-posture.txt` records `package_watcher=true|false`.
- Both CI E2E jobs pass `--no-watch`, because "Build all packages" has already built them. Local runs keep the watcher by default.

**Smoke run:** `tests/e2e-runs/165-fixA-wr04-nowatch` (`--no-db-reset --no-watch --project cold-entry-dataroot`): 5 passed, preflight OK 1, failed 0, `package_watcher=false`, no turbo output in `devserver.log`. This was one project, not the full suite, as instructed.
**Hygiene:** The wrapper and the README joined the changed set. The hygiene commits:
- removed plan, research, review and criterion references and stale line numbers;
- dropped the no-longer-true "no other shell script orchestrates E2E" claim;
- restored the collapsed usage examples and the exit-code table to one item per line;
- in the README, dropped the historical correction note and a claim the config contradicts ("auth-setup declared only under PLAYWRIGHT_VISUAL").

The `yarn dev` line allowlisted by `e2eDocPreconditionGate` was left verbatim, and that test passes 7/7.
**Status: fixed, requires CI verification.** The CI jobs themselves only run in Actions.

### A-IN-01: The comments overstate the trigger's reach

**Files modified:** `apps/supabase/supabase/schema/107-feedback.sql`, `apps/supabase/supabase/migrations/00001_initial_schema.sql` (regenerated)
**Commit:** `78f99e258`
**Applied fix:**
- **Header comment:** a NULL project arises only through ON DELETE SET NULL for the API roles, which have no feedback UPDATE policy. The service role and the owner can still write one by UPDATE.
- **Trigger comment:** now also says why the guard is INSERT-only.

Both comments sit outside any function body, so nothing reaches `prosrc`, `db:types` is not affected, and the regenerated migration diff is exactly those two lines. `assert:schema-migration-parity` is current.

### A-IN-02: Key masking is inconsistent across jobs

**Files modified:** `.github/workflows/main.yaml`
**Commit:** `4135ea0d7`
**Applied fix:** `dev-seed-integration` now runs `::add-mask::` on the service-role and anon keys, as the E2E jobs do, and its comment says so.

### A-IN-03: The duplicated key-writing step

**Files modified:** `tests/scripts/ci-write-local-keys.sh` (new, mode 755), `.github/workflows/main.yaml`
**Commits:** `ef20487ef` (fix), `6601f7bf2` (header line-break hygiene)
**Applied fix:** Both E2E jobs now call `tests/scripts/ci-write-local-keys.sh`. The script's body is the former step's, diffed line by line. The only changes:
- it resolves `apps/supabase` and `.env` from the script location, replacing `working-directory: apps/supabase`;
- the three `$GITHUB_ENV` appends are grouped into one redirect;
- it requires `GITHUB_ENV`.

`bash -n` passes.
**Not executed locally:** a session guard blocks any command that names a `.env` path, even a scratch copy. The GNU `sed -i` form also does not run on macOS. **Status: fixed, requires CI verification.**

### A-IN-04: The `setup-cli` version has nothing tying it to the `supabase` catalog version

**Files modified:** `packages/dev-seed/tests/rpcNullabilityGate.test.ts`
**Commit:** `7e64e3d4c`
**Applied fix:** A new describe block reads the `supabase` version `yarn.lock` resolves (2.83.0). It requires every `supabase/setup-cli` step in `main.yaml` to pin exactly that version, with the version read from that step's own lines. There are six pins, and the check fails if it finds none. With one pin changed to 2.82.0 (scratch, then restored), the test fails. The dev-seed suite passes 799/799.

### A-IN-05: The Paraglide compile flags duplicated `vite.config.ts`

**Files modified:**
- `apps/frontend/paraglide.options.ts` (new)
- `apps/frontend/scripts/compile-paraglide.ts` (new)
- `apps/frontend/vite.config.ts`
- `apps/frontend/package.json` (`paraglide:compile` script)
- `apps/frontend/tsconfig.json` (`files` gains the two new files)
- `.github/workflows/main.yaml`

**Commit:** `2c331f8c7`
**Applied fix:** A typed `PARAGLIDE_OPTIONS: CompilerOptions` has two consumers:
- `paraglideVitePlugin(...)`;
- Paraglide's `compile(...)`, run by `yarn workspace @openvaa/frontend paraglide:compile` (tsx, which the frontend already declares).

The CI step now calls that script.
**Verified:**
- The script's output matches the former CLI invocation file for file, apart from the absolute "Compiled from" path the CLI writes into the generated README.
- Vite's `loadConfigFromFile` still registers `unplugin-paraglide-js`.
- Frontend `typecheck`: 0 errors, 0 warnings.
- Frontend unit tests: 1890 passed.
- `assert:declared-binaries`: 0 violations.
- The generated `src/lib/paraglide`, which is gitignored, was restored afterwards.

### A-IN-06: A planning requirement id survived in a changed file

**Files modified:** `.github/workflows/main.yaml`
**Commit:** `972c17b0b`
**Applied fix:** The step is now named "Run dev-seed tests (incl. the operation budget)". No other planning id is left in `main.yaml`.

### A-IN-07: The identity-callback 500 echoes the configured provider keyword

**Files modified:** `apps/supabase/supabase/functions/identity-callback/index.ts`
**Commit:** `62a516c8f`
**Applied fix:** The unknown-provider arm logs the value with `console.error` and returns `{ error: 'Identity provider is not configured' }`. The explanatory comment is updated. No test asserted the old message.

### A-IN-08: `PROVIDER_CONFIGS` is typed `Record<string, ...>`

**Files modified:** `apps/supabase/supabase/functions/identity-callback/claimConfig.ts`, `claimConfig.test.ts`
**Commit:** `783e0e8cd`
**Applied fix:**
- `export type ProviderKeyword = 'signicat-ftn' | 'idura-ftn'`.
- `PROVIDER_CONFIGS = {...} satisfies Record<ProviderKeyword, ProviderClaimConfig>`. `as const` was left out, because it would make `extractClaims` readonly and break the interface.
- An own-key `isProviderKeyword` guard narrows the key inside `resolveProviderConfig`.

**Verified:**
- A scratch probe `PROVIDER_CONFIGS['signicat']` fails strict `tsc` with TS7053.
- The module and its test type-check clean.
- The claimConfig tests pass 32/32.

### A-IN-09: The optional `p_target_type` makes an untyped entity-scope RPC call compile

**Files modified:**
- `apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts`
- `apps/supabase/supabase/functions/send-email/callerAuthority.ts` (byte-identical copy)
- `apps/supabase/supabase/functions/invite-candidate/callerAuthority.test.ts`
- `.claude/skills/database/SKILL.md`

**Commit:** `a36b4016a`
**Applied fix:** `callerMayOnEntity(callerClient, entityType: EntityType, entityId, permission)` sits next to `callerMayOnProject`, and both share one fail-closed `askUserCan`. It has two properties:
- The type is a required parameter.
- A value outside `public.entity_type` is denied without a round trip.

The database skill routes future entity-scope questions to it. As part of the D-04 hygiene rewrite, the headers of the touched files lost `162-REVIEW CR-05, WR-09` and the `SPEC section N` references.

Tests:
- The new cases (call shape, false, RPC error, throw, blank ids, bad types) pass: 23/23 in the file.
- `assert:edge-env-defaults` (copy-drift) reports 0 violations.
- All supabase vitest suites pass: 195.

**Note for the maintainer:** no TypeScript caller asks at entity scope yet, so the helper is currently exercised only by its tests. The review asked for exactly this. If you would rather not ship an API with no production caller, revert `a36b4016a`; nothing else depends on it.

### A-IN-10: The skill reference was stale on file numbers and two signatures

**Files modified:** `.claude/skills/database/schema-reference.md`
**Commit:** `c771d5715`
**Applied fix:** The Utility Functions table was rebuilt.
- **Files:** every row now cites its defining schema file (010, 011, 105, 301, 400, 500, 501, 502, 503), each confirmed by grep. The old numbers 000, 006, 012, 014, 015, 016 and 017 are gone.
- **`grant_role_permissions`** is now `(grant_scope_type, grant_role_type, entity_type)`.
- **`resolve_email_variables`** is now `(uuid, uuid[], text, text)`.
- **Private hops:** `private.is_child_nominee` and `private.entity_has_confirmed_nomination` are schema-qualified.
- **`validate_nomination`** was also corrected to SECURITY DEFINER.

Signatures and security modes were read from `pg_proc` on the applied database.
**Left as is:** `.claude/skills/database/SKILL.md` § Service Patterns 5 also gives the stale three-argument `resolve_email_variables(p_user_ids, p_template_body, p_template_subject)`. That file was out of this finding's scope.

## Verification record

**Where it ran:** every gate ran in the **main checkout** (no worktree), against the local Supabase stack on 54322. The numbers are reproducible from this tree.

| Check | Result |
|---|---|
| `yarn workspace @openvaa/supabase test:db` (after the last DB-touching fix) | 34 files, 1261 tests, PASS |
| `apps/supabase` vitest (Edge Function units) | 15 files, 195 passed |
| `packages/dev-seed` vitest | 61 files, 799 passed |
| `apps/frontend` vitest | 109 files, 1890 passed |
| `apps/frontend` typecheck (svelte-check) | 0 errors, 0 warnings |
| `yarn typecheck:tests` | exit 0 |
| `assert:comment-hygiene`, `assert:edge-env-defaults`, `assert:schema-migration-parity`, `assert:declared-binaries`, `assert:edge-function-env`, `assert:rpc-nullability`, `assert:env-pair-registry`, `assert:project-scoped-queries` | all exit 0 |
| `hygiene-changed-files.sh --files` over all 21 files these commits changed outside `.claude/` | VERDICT: CLEAN |
| `tip-proofs.sh` | exit 0 |
| E2E | Smoke only: one project, `--no-watch`, 5 passed, preflight OK. The full suite is left to the orchestrator's re-gate, as instructed. |

**What the orchestrator still has to do:**
- **Hygiene reads:** none are recorded (`--check-reads`). `record-hygiene-read.sh` needs a `165-NN` plan id, and this fix run has none.
- **Newly changed files:** `apps/frontend/package.json`, `apps/frontend/tsconfig.json`, `apps/frontend/vite.config.ts`, the two `callerAuthority.ts` copies and their test, `tests/playwright.config.ts`, `tests/scripts/e2e-run.sh` and `tests/README.md` joined the branch's changed set through these fixes.
- **Unrelated local changes:** `apps/frontend/src/lib/layouts/main/MainContent.svelte` and `.planning/milestone.lock` were never staged.

---

_Fixed: 2026-09-29T05:45:59Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
