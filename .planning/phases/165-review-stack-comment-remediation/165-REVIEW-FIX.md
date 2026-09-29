---
phase: 165-review-stack-comment-remediation
fixed_at: 2026-09-29
review_path: .planning/phases/165-review-stack-comment-remediation/165-REVIEW.md
iteration: 1
fix_scope: all
findings_in_scope: 40
fixed: 38
skipped: 0
no_change_needed: 2
status: all_fixed
---

# Phase 165: Code Review Fix Report (merged)

The maintainer chose "fix warnings + info". Three `gsd-code-fixer` passes ran sequentially on the main checkout, one per review part. 38 findings are fixed in atomic commits. 2 needed no change: B-IN-03 and C-IN-07, each restating a maintainer ruling.

| Part | In scope | Fixed | No change needed |
|---|---|---|---|
| A | 14 | 14 | 0 |
| B | 12 | 11 | 1 (B-IN-03) |
| C | 14 | 13 | 1 (C-IN-07) |

# Part A

Source: `165-REVIEW-FIX-partA.md`


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

# Part B

Source: `165-REVIEW-FIX-partB.md`


# Phase 165: Code Review Fix Report (Part B)

**Fixed at:** 2026-09-29T06:06:59Z
**Source review:** `165-REVIEW.md`, Part B (detail in `165-REVIEW-partB.md`)
**Iteration:** 1
**Branch:** `ship/v2.15-13-review-fixes`, main working tree. `workflow.use_worktrees` is `false`, so no worktree was created. Every gate below ran in the main checkout, and the numbers can be reproduced from this tree.

**Summary:**
- Findings in scope: 12 (4 warnings, 8 info)
- Fixed: 11, in 11 commits from `ee3e923e6` to `a12f727f9`, one per finding
- No change needed: 1 (B-IN-03, which restates a maintainer ruling)
- Skipped: 0

Four fixes change logic or behaviour that the unit tests cover only in part, so they are marked **requires human verification**: B-WR-01, B-WR-02, B-WR-04 and B-IN-08. B-IN-05's rendering parity rests on a cascade argument checked against the built CSS, not on a measured before/after comparison.

## Fixed Issues

### B-WR-01: The session memo is keyed on one token but verifies whatever token the client holds when `getUser()` runs

**Status:** fixed: requires human verification (security-sensitive; the login journeys are covered by the orchestrator's E2E re-gate)
**Files modified:** `apps/frontend/src/lib/supabase/safeGetSession.ts`, `apps/frontend/src/lib/supabase/safeGetSession.test.ts`, `apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts` (comment only)
**Commit:** `ee3e923e6`

**Verification of the race (done first, as instructed).** I read the installed `@supabase/auth-js` 2.99.3, `node_modules/@supabase/auth-js/src/GoTrueClient.ts`:
- `getUser(jwt)` returns `_getUser(jwt)` straight away. That path sends exactly `jwt` to `GET /user` and never touches storage on success.
- `getUser()` with no argument takes the storage lock, then `_getUser()` → `_useSession()` → `__loadSession()`. That **re-reads storage**. If the stored session is inside `EXPIRY_MARGIN_MS` (3 ticks × 30 s = **90 s**, `lib/constants.ts`), it calls `_callRefreshToken()` and verifies the **new** access token. On success it sets `suppressGetSessionWarning = true`.
- `getSession()` runs the same `__loadSession()`.

So when the stored token crosses into the 90 s margin between the helper's `getSession()` and its `getUser()`, `getUser()` refreshes, verifies token B and returns B's user. The old helper returned `{ session: A, user }` and memoised A as verified. The cookie is attacker-controlled, and `expires_at` in the stored session JSON is set independently of the JWT. An attacker can therefore aim at that window with a forged A paired with a valid refresh token. `readGrants(session.access_token)` in `roles.ts` would then decode an unverified A without checking its signature. **The race is real.** It is narrow, but it can be aimed at.

**Also found:** 165-19 kept the no-argument call for three reasons. One of them, "passing the token would skip the revoked-session cleanup inside `_getUser()`", is not true of 2.99.3. The `try/catch` that calls `_removeSession()` on `AuthSessionMissingError` wraps the `jwt` path too, and `lib/fetch.ts` maps `session_not_found` to that error. The other two reasons (the lock, and the warning suppression) hold.

**Applied fix.** The fix keeps the no-argument `getUser()`, so the lock, the warning suppression and the cleanup all stay. It re-keys on the token that was actually verified:
- After a successful `getUser()`, `verifyStored` calls `getSession()` again. The user is paired only when storage still holds the token the memo was keyed on. A refresh always rotates the access token, so a matching token means `getUser()` verified that token.
- On a mismatch the verification resolves to a private `REPLACED` sentinel, which is evicted from the memo. `safeGetSession` then starts over with the new session. After a refresh the new token has a full lifetime, so a second attempt matches. `MAX_ATTEMPTS = 2`: a second replacement in one call returns nulls.

This costs one extra `getSession()` per verification: a cookie read under the lock, and a network call only if that read itself refreshes. A per-call memo hit adds nothing.

**Tests.** The fake client became storage-backed. Two new cases:
- `pairs the user only with the token getUser() verified when it refreshes the session mid-verification`: `getUser` rotates storage to token-b. The helper must return token-b, and a second call hits the memo on token-b.
- `returns nulls when every verification replaces the token it was asked to verify`.

**RED** against the old helper: 3 failed / 6 passed. The race case received `{ session: token-a, user }`. The rotation case received a paired session. The call-count case expected 3 `getSession` reads and saw 2. **GREEN**: 9/9. The `requireAdminIdentity.test.ts` note that lists what its hand-copied `safeGetSession` omits now also names the re-read.

### B-WR-02: `organizationMatching: 'none'` is now also the silent fallback

**Status:** fixed: requires human verification (a logic change in the voter matching path)
**Files modified:** `apps/frontend/src/lib/utils/organizationMatching.ts` (new), `apps/frontend/src/lib/utils/organizationMatching.test.ts` (new), `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`, `apps/frontend/src/routes/(voters)/about/+page.svelte`
**Commit:** `2b6ee8afb`
**Applied fix:**
- `resolveOrganizationMatching(value)` keeps `'none'`, `'answersOnly'` and `'impute'`. An explicit `'none'` still means no party scores, per D-15.
- A missing, `null` or `''` value falls back to `dynamicSettings.matching.organizationMatching`, the shipped default (`'impute'`), silently.
- Any other value falls back as well, and is logged once per distinct value with `log.warn`.
- `#parentMatchingMethod` in `voterContext.svelte.ts` now derives from the resolver instead of `|| 'none'`.

The About page's organization-matching disclosure read the raw setting. It now reads the same resolved method, so the text describes the method the matcher actually uses. It still hides when the method is explicitly `'none'`, which the `perm-org-matching` spec's `none` mode relies on.

The resolver is in `$lib/utils`, not in app-shared, so no package rebuild is needed. The underlying root-key merge defect (`mergeAppSettings` TODO) is untouched. Tests: 3 cases (the vocabulary kept; the default, not `'none'`, for missing/null/empty with no warning; one warning for a repeated unknown value).

### B-WR-03: The local adapter answers an empty filter array where the Supabase adapter throws

**Files modified:** `apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts`, `…/localServerDataProvider.test.ts`
**Commit:** `ef8f372b7`
**Applied fix:**
- A module-level `assertNonEmpty` rejects an empty `electionId` or `constituencyId` array at the top of `getNominationData` and `getQuestionData`. Its message has the same shape as `convertFilterValue`'s.
- `getQuestionData` became `async`, so the rejection is a rejected promise, as in `getNominationData`.
- The Supabase adapter's helper was not imported, because the adapter-boundary rule keeps the local adapter off `adapters/supabase`.

One test per method. RED: both failed. GREEN: 12/12.

### B-WR-04: The preregister page keeps a second, untyped copy of the provider keyword

**Status:** fixed: requires human verification (the error path is not exercised by any automated test; the happy paths are in `candidate-bank-auth-journey.spec.ts`)
**Files modified:** `apps/frontend/src/routes/candidate/preregister/+page.svelte`
**Commit:** `3976d46a4`
**Applied fix:**
- The keyword is cast to `ProviderType`, as a type-only import from `$lib/api/utils/auth/providers/types`, and handled in a `switch` with `'idura-ftn'` and `'signicat-ftn'` cases. Renaming a union member now fails type checking at the `case`.
- `default` (an unknown keyword), a non-OK authorize response and a thrown error all set `providerError`. The page then renders an inline `ErrorMessage` with `role="alert"` and `data-testid="preregister-errorMessage"`, showing the localised `error.default` text.
- `ErrorMessage` logs the detail through `log.error`, which replaces the bare `console.error`.
- The two duplicated `fetch('/api/oidc/authorize')` blocks became one `fetchAuthorizeUrl` helper.

### B-IN-01: The local nomination round filter treats NULL as round 1; the SQL does not

**Files modified:** `apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts` (comment only)
**Commit:** `7c37dbeb4`
**Applied fix:** I took the fix's second option, documenting the divergence. The first option, `NOT NULL` on the column, is a schema change owned by Part A. The comment claimed that the local adapter's default matched "the column's default". It now states the single row shape where the two differ. I confirmed at the tip:
- `nominations.election_round integer DEFAULT 1` is nullable (`104-nominations.sql`).
- `get_nominations` filters with `n.election_round = p_election_round` (`503-entity-rpcs.sql`).

### B-IN-02: `vite.projectIdEnv.ts` treats a whitespace-only shell value as set

**Files modified:** `apps/frontend/vite.projectIdEnv.ts`, `apps/frontend/vite.projectIdEnv.test.ts`
**Commit:** `de3a76c1c`
**Applied fix:**
- `isBlank(value)`, which is undefined or `trim() === ''`, is now the emptiness test in the write loop and in `loadWithoutEmptyShellValues`.
- A blank shell value is removed around `loadEnv` and restored exactly as it was: `' '` is restored as `' '`, not as `''`.
- The key comment now says that `loadEnv` matches the keys as prefixes, so its return value can carry `PUBLIC_PROJECT_ID_*`, and that only the writes are literal.

Two new cases: a whitespace shell value, and a whitespace target value. RED: 2 failed. GREEN: 10/10. `tsc -p apps/frontend/tsconfig.json` reports nothing for the file, which is type-checked through `vite.config.ts`.

### B-IN-04: A closed Alert stays in the accessibility tree and its buttons stay focusable

**Files modified:** `apps/frontend/src/lib/components/alert/Alert.svelte`
**Commit:** `30a080876`
**Applied fix:** `inert={!isOpen}` on the alert root, placed before the rest-props spread. The closing slide and fade still play, and the closed element leaves the tab order and the accessibility tree. The `@component` doc's `isOpen` line states this. The generated component listing in `apps/docs` is not regenerated; `yarn workspace @openvaa/docs generate:docs` will pick up the new doc line.

### B-IN-05: Expander keeps classes that never have an effect

**Status:** fixed. Rendering parity is argued from the built CSS, not measured with Playwright.
**Files modified:** `apps/frontend/src/lib/components/expander/Expander.svelte`
**Commit:** `0a8e4f2e0`
**Applied fix:** dropped `peer` from the checkbox, and `peer-checked:py-md` and `peer-checked:transition-[padding]` from the content. I also dropped the `category` variant's `pt-lg`, which never took effect.

The decision the finding asked for: keep the rendered result, as 165-33 did for NavItem. In the built CSS (`build/client/_app/immutable/assets/0.*.css`):
- `.peer-checked\:py-md:is(:where(.peer):checked~*)` has specificity (0,2,0) and always applied while the content is mounted. It set `padding-block: var(--spacing-md)`, which beat `.pt-lg` at (0,1,0).
- So every variant rendered `md` padding on all sides, which is what `p-md` alone renders now. daisyUI's checked `padding-bottom: 1rem` rule meets `p-md` in the same layer position as before.
- Without `transition-[padding]`, daisyUI's own `.collapse-content` transition applies. The content is mounted already checked and unmounted on collapse, so its padding never changes while mounted and nothing animates.

No caller passes a `peer-*` class through `titleClass`/`contentClass` (grep).

### B-IN-06: The supabase-types boundary scan covers only `.ts`/`.svelte` under `src/`

**Files modified:** `apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts`
**Commit:** `84ab88974`
**Applied fix:**
- The scan now walks the workspace root (`apps/frontend`), skipping `node_modules`, `build`, `.svelte-kit`, `.turbo` and `.vite`.
- It reads `.js`/`.ts`/`.mjs`/`.mts`/`.cjs`/`.cts`/`.svelte` files and also matches `require()`.
- It asserts that `vite.config.ts` and `svelte.config.js` are in the scanned set, so a mis-rooted walk fails instead of passing vacuously.

Proof: a scratch `tools/zz-scratch-boundary.mjs` importing `@openvaa/supabase-types` failed the test, naming the file. The scratch file was then deleted, and `git status tools` is clean. GREEN: 4/4.

### B-IN-07: `validatePassword` is exported but used only by its test, and the rules run client-side only

**Files modified:** `apps/frontend/src/lib/utils/password-validation/passwordValidation.ts`, `…/passwordValidation.test.ts`, `apps/docs/src/routes/(content)/developers-guide/candidate-user-management/password-validation/+page.md`
**Commit:** `73cbe87ab`
**Applied fix:**
- The unused export was dropped. Its tests now assert `validatePasswordDetails(...).status` through a local `isValidPassword` helper, and all 7 cases are kept.
- The developer guide lists only the remaining exports. It already stated that Supabase Auth's policy is the server-side enforcement.
- `validatePasswordDetails`'s doc now says so too, naming `minimum_password_length`/`password_requirements` in `config.toml` and the hosted project's Auth settings.

Note, not changed: the local `config.toml` has `minimum_password_length = 6` against the frontend's 8. The guide's rule is that the server should be no stricter than the frontend, so this is consistent. A direct `updateUser` call can still set a 6-character password.

### B-IN-08: The memo lives as long as `locals`, not as long as the request

**Status:** fixed: requires human verification (it changes the hook's control flow)
**Files modified:** `apps/frontend/src/lib/supabase/safeGetSession.ts`, `apps/frontend/src/lib/supabase/safeGetSession.test.ts`, `apps/frontend/src/hooks.server.ts`
**Commit:** `a12f727f9`
**Applied fix:** I took the finding's second option, which enforces the lifetime instead of only documenting it.
- `createSafeGetSession` now returns `{ safeGetSession, endRequest }`, typed as the exported `SafeGetSessionHandle`.
- `supabaseHandle` wraps `resolve(event)` in `try { return await … } finally { endRequest(); }`. A redirect or error thrown by `resolve` still propagates.
- `endRequest` clears the memo and stops memoising. Any later call, from an admin job holding `locals` or a streamed load, verifies afresh.

New test: `verifies afresh on every call once the request has ended`. GREEN: 10/10. The "call it once per request" doc sentence now names `endRequest`.

## No Change Needed

### B-IN-03: A disabled NavItem is visually identical to an enabled one

**File:** `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte:41-48`
**Reason:** `no_change_needed`. This restates a maintainer ruling. The orchestrator's brief records that the maintainer kept the disabled-NavItem colour as rendered. That matches 165-33's key decision ("Rendering parity wins over a never-applied declaration"): the scoped `!text-secondary` never won against the layered `!text-neutral`, so disabled items always rendered neutral. The finding's fix is conditional ("If a disabled cue is wanted"), and the maintainer chose not to add one.
**Original issue:** The inlining dropped the never-applied `!text-secondary`, so only `pointer-events-none` distinguishes a disabled item.

## Verification (main checkout)

Each fix was checked when it was committed:
- The changed section was re-read.
- `prettier --check` on the changed files; for the docs page, run from inside `apps/docs`.
- `eslint --flag v10_config_lookup_from_file` from `apps/frontend`, which applies the workspace config and its adapter-boundary rule.
- `yarn workspace @openvaa/frontend check`: 0 errors and 0 warnings after every commit.
- The targeted vitest files.
- `hygiene-changed-files.sh --files <the fix's files>`: VERDICT CLEAN.

One hygiene hit was fixed before its commit: the phrase "no longer" in the first B-IN-04 doc wording, a layer-3 narrative hit.

Final gates at `a12f727f9`, each exit status read directly:

| Command | Result |
|---|---|
| `yarn workspace @openvaa/frontend test:unit` | exit 0, 110 files, 1900 tests passed |
| `yarn lint:check` | exit 0 |
| `yarn workspace @openvaa/frontend check` | exit 0, 2198 files, 0 errors, 0 warnings |
| `yarn build --filter=@openvaa/frontend` | exit 0 |
| `yarn assert:no-session-in-loads` | exit 0 |
| `bash scripts/tip-proofs.sh` | exit 0, all PASS |
| `hygiene-changed-files.sh --files <all 19 Part B files>` | VERDICT: CLEAN, 0 items |
| `prettier --check <all Part B files>` | clean |

Not run: the full E2E suite, which the orchestrator re-gates. No `hygiene-reads/*.tsv` read records were written for the 19 files, so a `--check-reads` gate run will need them recorded. The maintainer's `MainContent.svelte` edit and `.planning/milestone.lock` were never staged, and are still modified or untracked as before.

---

_Fixed: 2026-09-29T06:06:59Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

# Part C

Source: `165-REVIEW-FIX-partC.md`


# Phase 165: Code Review Fix Report (Part C)

**Fixed at:** 2026-09-29T06:52:02Z
**Source review:** `165-REVIEW.md`, Part C (full detail in `165-REVIEW-partC.md`)
**Iteration:** 1
**Branch:** `ship/v2.15-13-review-fixes`, main working tree (`workflow.use_worktrees: false`, so no worktree was created)

**Summary:**
- Findings in scope: 14 (7 warnings, 7 info)
- Fixed: 13
- Skipped: 1. C-IN-07 is `no_change_needed`, because it restates the D-15 and D-16 maintainer rulings.
- Commits: 14, from `563e3836c` to `815ee1757`. That is one per fixed finding, plus one hygiene commit for a file that C-WR-06 brought into the changed set (D-04).

**Status is `partial` only because of C-IN-07.** Every actionable finding is fixed.

**Commit-order note.** C-WR-02 was committed before C-WR-01. The progress check in C-WR-01 is measured against `STAGE_BUDGET`, and it can only fire before the test ceiling once C-WR-02 has shortened that budget.

**Prefix note.** Three commits use the `docs(165):` prefix, not `fix(165):`, because they change comments only: C-IN-02, C-IN-03 and the C-WR-06 hygiene commit. They are unpushed. Reword them if the prefix matters.

## Fixed Issues

### C-WR-01: `walkVoterStages` has no progress check

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `69c79418a`
**Applied fix:** The walk now tracks the stage and pathname it is acting on. It throws when the same stage on the same path is still showing `STAGE_BUDGET` after the walk first acted on it. The message has this shape: `voter walk: stuck on the <stage> page at <url>. Its action did not take effect in N attempt(s) over T ms. The last attempt failed with: <first line of the swallowed timeout>`.

I used a time-based check rather than the review's count of 5 attempts. An attempt can take between about 11 s and a full `STAGE_BUDGET`, so a count would not scale with the environment's ceiling.

It is a failure, not a branch. No optional page is ever judged skipped because of it (D-14).

`advanceClick` and `leaveStage` now swallow only timeouts and rethrow everything else, such as a strict-mode violation. They return the swallowed timeout's first line so the walk can report it.

**Negative proof:** a scratch Playwright config outside the repo ran a stub page on `http://walk.test` (`scratchpad/walkprobe/`).
- A disabled questions-intro Start button now fails in 33 s locally: `stuck on the questions-intro page at http://walk.test/questions ... 3 attempt(s) over 33066 ms ... locator.click: Timeout 3000ms exceeded.` Before this fix the walk re-clicked until the test ceiling.
- A duplicated elections Continue button throws the strict-mode violation after 22 ms.

### C-WR-02: `STAGE_BUDGET = TIMEOUTS.testMax` makes the walk's own message unreachable

**Files modified:** `tests/tests/utils/voterNavigation.ts`
**Commit:** `563e3836c`
**Applied fix:**
- **Budget:** `STAGE_BUDGET = TIMEOUTS.testMax / 3`, so 30 s locally and 60 s on GitHub Actions. It is exported for the fixture.
- **Named step:** each `resolveVoterStage` call runs as `test.step('resolve the voter stage: one of [...]')`.
- **`isTimeout`:** it no longer matches message text. It is true for `errors.TimeoutError` and for a web-first assertion whose `matcherResult.timeout` is set.

I checked the text against Playwright 1.58.2 directly. A timed-out `toHaveAttribute` reads `expect(locator).toHaveAttribute(expected) failed ... Timeout: 300ms`. That matches neither the old pattern nor the review's suggested `Timed out \d+ms waiting`. `waitForURL` and `click` timeouts are `TimeoutError` instances.

### C-WR-03: The category-start href guard accepts the `__first__` placeholder

**Files modified:** `tests/tests/utils/voterNavigation.ts`, `tests/tests/fixtures/voter/voter-journey.fixture.ts`
**Commit:** `a3a96a605`
**Applied fix:** There is now one exported helper, `followCategoryStart(page)`. It uses this pattern, built from the app's `FIRST_QUESTION_ID`:

```
/questions/(?!category/|__first__(?:[/?#]|$))[^/?#]+
```

The fixture's duplicate `followLinkWhenHrefResolved` is deleted, and the answer loop calls the shared helper. A null href after a match now throws instead of silently skipping the navigation.

**Checks:**
- The regex rejects `/en/questions/__first__`, `/questions/__first__?x=1` and `/en/questions/category/abc`. It accepts `/en/questions/qu-1`.
- **Scratch probe:** the helper does not follow a `__first__` href. The URL stays on the category page and the named assertion fails after the budget. It does follow an href that resolves after 1.5 s.

### C-WR-04: The post-slider branch keeps a swallowed fixed window that silently skips a question

**Files modified:** `tests/tests/fixtures/voter/voter-journey.fixture.ts`
**Commit:** `a813891a7`
**Status:** fixed, requires human verification (logic change)
**Applied fix:** After a number question, the loop now uses an `expect.poll` with budget `STAGE_BUDGET` and a message naming the question. It waits until both of these hold:
- the `voter-questions-heading` text differs from the heading captured when the slider was answered;
- the scoped choices or a slider are present.

**Why not the review's `isConnected` check:** the questions layout remounts the input only on `{#key \`${question.type}-${deleteEpoch}\`}`. So two adjacent number questions share one `<input type="range">` element, and that check would never resolve.

**Other changes:**
- The silent Skip fallback is gone. A question with neither choices nor a visible slider throws `voter-journey: question <id> rendered neither choices nor a number slider at <url>`.
- `waitForVisible`, which had no remaining caller, is deleted.
- The other answer-surface waits moved from `testMax` to `STAGE_BUDGET`, so their messages can be reached too.

**Not exercised:** no seed has two adjacent number questions. On `e2e/base` a number question (base-6) is followed by a multi-choice question (base-7), and that path passes.

### C-WR-05: The results landing keeps fixed windows

**Files modified:** `tests/tests/fixtures/voter/voter-journey.fixture.ts`
**Commit:** `c8e7e90fd`
**Applied fix:** These waits now all use `STAGE_BUDGET` (30 s locally, 60 s on CI):
- the picker-option wait, previously 10 s;
- the results-list wait, previously a literal 15 s whose stale `// reason:` is dropped;
- the picker-or-list race, previously `testMax`;
- `requireNavigation`, previously 10 s. It covers the last answer's hop to `/results`.

`requireNavigation` is still loud, and its docstring and message give the new budget.

### C-WR-06: The CI-only 180 s ceiling is lowered back by hard-coded `setTimeout` sites

**Files modified:**
- `tests/tests/setup/shared/auth.setup.ts`
- `tests/tests/setup/admin/admin-auth.setup.ts`
- `tests/tests/setup/perm/perm-answers-locked.setup.ts`
- `tests/tests/setup/perm/perm-question-video.setup.ts`
- `tests/tests/setup/perm/perm-hide-hero.setup.ts`
- `tests/tests/setup/perm/perm-disable-allow-open.setup.ts`
- `tests/tests/specs/perf/performance-budget.spec.ts`
- `tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts`
- `tests/tests/helpers/timeouts.ts`

**Commits:** `b1a03b7ca` (fix), `0ded2ea45` (D-04 hygiene)
**Applied fix:**
- The six setups and the performance spec use `TIMEOUTS.testMax`, not `90000`.
- The five 2e2cg tests use `BOUNCE_TEST_MAX = TIMEOUTS.testMax / 2`, not `45000`.
- The `timeouts.ts` header no longer calls perm-localisation-positive's 180 s a budget above the ceiling. It also states the rule: a `setTimeout` at or below the ceiling is written in terms of `TIMEOUTS.testMax`.
- No `setTimeout(<digits>)` is left under `tests/tests`.

**Hygiene:** `performance-budget.spec.ts` joined the changed set, and the gate flagged one narrative line: "This spec previously asserted ...". The header now states why Navigation Timing is not asserted on, with the same measurements.

### C-WR-07: The closed-project teardown skips the dataset delete and masks the original error

**Files modified:** `tests/tests/setup/perm/perm-closed-project.teardown.ts`
**Commit:** `098a0cf80`
**Applied fix:** A module-level `runEveryStep` runs three named steps independently:
1. unregister the auth user;
2. `runTeardownAsserted`;
3. `ensureProject`.

It then rethrows a single error unchanged. When more than one step fails, it throws an `AggregateError` whose message lists every failed step with its message, because reporters print only the outer message. The header now describes this.

**Proof:** the teardown passed in its smoke run. The failure paths were not provoked.

### C-IN-01: `expectNoOrgMatchScore` is a one-shot negative count

**Files modified:** `tests/tests/fixtures/voter/resultsPage.fixture.ts`
**Commit:** `a840a7ea7`
**Applied fix:** Before counting, the method waits for a member subcard's match score to be visible. The perm seed sets `cardContents.organization: ['children']`, so a scored subcard is present. The docstring states that precondition.

### C-IN-02: `SendEmailResultSchema` documents a 500 branch it never sees

**Files modified:** `packages/app-shared/src/data/schemas/sendEmailResult.schema.ts`
**Commit:** `854ffadae`
**Applied fix:** This is the docs option. The schema docs and the `success` field doc now say that `functions.invoke` turns the 500 branch into an error, so the adapter throws before parsing and the per-recipient list is not read.

The schema still accepts the 500 shape, because it mirrors the function, and its test is unchanged.

I did not take the alternative, having the adapter read `error.context.json()`. It would change adapter behaviour, and the review offered it only as one of two options.

### C-IN-03: Stale descriptions of the old walk and of the 90 s ceiling

**Files modified:**
- `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts`
- `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts`
- `tests/tests/specs/perm/perm-disable-allow-open.spec.ts`
- `tests/tests/utils/voterNavigation.ts`
- `tests/tests/fixtures/voter/voter-journey.fixture.ts`

**Commit:** `7bcb0e095`
**Applied fix:**
- **Rewritten:** the claims about a "race-based passer", a "hard-wait" `answeredVoterPage` that "would time out", and the `isVisible` guard now describe the stage walk as it is. The two "90s" mentions are also reworded.
- **Also corrected:** the `advanceClick` reason comment called its 3 s click "TIGHTER than TIMEOUTS.click", but that bucket is 2 s.
- **Already done elsewhere:**
  - `tests/playwright.config.ts` had already been corrected in Part A.
  - `voter-journey.fixture.ts:53` and `:170` were removed with the C-WR-03 helper.

### C-IN-04: Dead code

**Files modified:** `tests/tests/utils/voterNavigation.ts`, `tests/tests/utils/missingNominations.ts` (deleted), `tests/README.md`
**Commit:** `0d8332e38`
**Applied fix:**
- **Walk stop points:** `StopAt` and `advanceVoterFlow` are deleted, and `navigateToFirstQuestion` calls `walkVoterStages(page, ['question'])`.
- **Helpers file:** `missingNominations.ts` had no caller anywhere in the repo, so it is deleted.
- **README:** the pitfall entry that prescribed the deleted helpers now describes what the specs actually do:
  - `toBeHidden` on the modal testid on fully nominated paths;
  - `perm-missing-nominations.spec.ts` for the modal's contents;
  - the `open`-attribute rule for a rendered DaisyUI dialog.
- **Check:** `e2eDocPreconditionGate` passes 7/7.

### C-IN-05: Unscoped `inputError` wait in the candidate profile step

**Files modified:** `tests/tests/specs/candidate/candidate-journey.spec.ts`
**Commit:** `906a1c313`
**Applied fix:** A `linkFieldError` locator, built from `candidateProfilePage.getQuestion(/\[qu-info-text-link\]/).first().getByTestId(testIds.shared.inputError)`, now scopes both assertions:
- the soft invalid-URL `toContainText`, which the review did not cite but which has the same page-wide scope;
- the `toBeHidden`.

The profile page wraps each `QuestionInput` in `candidate-profile-info-item`, and `Input.svelte` renders `input-error` inside it.

### C-IN-06: `--ci-literal` does not reproduce CI's timeout posture

**Files modified:** `tests/scripts/visual-container.sh`
**Commit:** `815ee1757`
**Applied fix:** Under `--ci-literal` the script now adds `DOCKER_ARGS+=(-e GITHUB_ACTIONS=true)`, and the flag's help text says so. That gives the container the 180 s ceiling and `forbidOnly`. Those are the only two consumers of `GITHUB_ACTIONS` under `tests/`.

`bash -n` passes. The container itself was not run.

## Skipped Issues

### C-IN-07: Two widened budgets now apply locally too

**File:** `tests/tests/specs/voter/voter-journey.spec.ts:24`, `tests/tests/specs/voter/cold-entry-dataroot.spec.ts:40,51,70,86`
**Reason:** `no_change_needed`. It restates maintainer rulings:
- **D-15:** `JOURNEY_TEST_MAX` is 240 s, with its measured cost in the comment.
- **D-16:** the cold-entry checks wait up to the test's budget.

The review itself marks the item "noted, not contested", and its fix is optional. Keying `JOURNEY_TEST_MAX` off `ON_GITHUB_ACTIONS` would reverse the D-15 value locally, which is a maintainer call.
**Original issue:** the CI-motivated widenings also loosen the local regression signal.

## Verification record

**Where it ran:** every gate ran in the **main checkout** (no worktree), against the local Supabase stack. The numbers are reproducible from this tree.

| Check | Result |
|---|---|
| `yarn lint:check` (turbo lint, tests ESLint, `typecheck:tests`, frontend typecheck, all `assert:*` guards) | exit 0 |
| `yarn typecheck:tests` after each commit | exit 0 |
| ESLint and Prettier on every touched file | clean |
| `hygiene-changed-files.sh --files`, per commit, over each commit's files | VERDICT: CLEAN. One narrative hit in `performance-budget.spec.ts` was fixed in `0ded2ea45`. |
| `tip-proofs.sh` | exit 0 |
| `packages/app-shared` vitest | 92 passed |
| `packages/dev-seed` `e2eDocPreconditionGate.test.ts` | 7 passed |
| Scratch walk probe (4 cases, outside the repo; no tracked file touched) | all pass after a probe-config `baseURL` fix |

**E2E smoke.** Each run used `tests/scripts/e2e-run.sh --no-db-reset --project <p>`. Every run had preflight OK 1 and failures 0, and all run dirs are under `tests/e2e-runs/`:

| Project (run dir `165-fixC-*`) | Result |
|---|---|
| voter-journey (after C-WR-05) | 4 passed |
| voter-alliance | 3 passed |
| perm-hide-if-missing-answers | 95 passed |
| perm-org-matching | 122 passed |
| candidate-journey | 5 passed |
| perm-closed-project | 165 passed |
| perm-not-located-2e2cg | 54 passed |
| performance | 3 passed |
| perm-interactive-info | 117 passed |
| a11y-smoke | 18 passed |
| voter-journey-final (at the tip) | 4 passed |

There were no failed, flaky or did-not-run tests. The perm runs pulled their dependency chains. These are project runs, not the full suite. The full re-gate is left to the orchestrator, as instructed.

**What the orchestrator still has to do:**
- **Hygiene reads:** none are recorded. `record-hygiene-read.sh` needs a `165-NN` plan id.
- **Newly changed files:** these joined the branch's changed set through these fixes:
  - `tests/tests/setup/shared/auth.setup.ts`
  - `tests/tests/setup/admin/admin-auth.setup.ts`
  - four `tests/tests/setup/perm/*.setup.ts`
  - `tests/tests/specs/perf/performance-budget.spec.ts`
  - `tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts`
  - `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts`
  - `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts`
  - `tests/tests/specs/perm/perm-disable-allow-open.spec.ts`
  - `tests/tests/fixtures/voter/resultsPage.fixture.ts`
- **Deleted file:** `tests/tests/utils/missingNominations.ts`.
- **Unrelated local changes:** `apps/frontend/src/lib/layouts/main/MainContent.svelte` and `.planning/milestone.lock` were never staged.
- **This report:** it is not committed.

---

_Fixed: 2026-09-29T06:52:02Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
