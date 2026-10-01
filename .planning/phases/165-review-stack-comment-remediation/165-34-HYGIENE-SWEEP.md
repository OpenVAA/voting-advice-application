# Phase 165 Plan 34: Branch-wide hygiene sweep

The closing D-04 sweep over every file `ship/v2.15-13-review-fixes` changes. Three independent checks:

1. the deterministic five-layer gate with read coverage (`hygiene-changed-files.sh --check-reads`);
2. a review of every allowlist row plus a second, independent read of the comment text of the whole set;
3. the `.agents/code-review-checklist.md` items that apply to the branch's diff.

Every exit status below was read directly, never through a pipe.

## 1. The deterministic gate

### The changed set

Derived at run time from the committed changes only:

```bash
git diff --name-only --diff-filter=d ship/v2.15-12-planning...HEAD
```

At plan start (HEAD `6c20b132a`), this returned 373 paths.

| Group | Paths | In scope |
|---|---:|---|
| `.planning/` | 138 | no (exempt tree) |
| `.claude/` | 4 | no (exempt tree) |
| `packages/supabase-types/src/database.ts` | 1 | no (generated) |
| everything else | **230** | yes |

The 230 in-scope paths by top-level directory:

| Directory | Paths |
|---|---:|
| `apps/frontend` | 91 |
| `apps/supabase` | 51 |
| `packages/dev-seed` | 41 |
| `packages/argument-condensation` | 13 |
| `apps/docs` | 9 |
| `tests/` | 7 |
| `packages/app-shared` | 6 |
| `packages/llm` | 5 |
| `scripts/` | 2 |
| `packages/supabase-types`, `packages/question-info`, `packages/dev-tools`, `.github/workflows`, `.env.example` | 1 each |

### Working-tree scope

In base mode, `hygiene-changed-files.sh` also scans uncommitted and untracked files. In the main checkout, the maintainer's uncommitted `apps/frontend/src/lib/layouts/main/MainContent.svelte` joins the set there. It is not a phase change, so the gate reports it as the only failing item: `unread: 1`, `VERDICT: RESIDUE FOUND`, exit 1. The untracked `.planning/milestone.lock` is exempt.

To run the plan's literal verify command over the committed state, the gate ran in a temporary detached worktree at HEAD (`git worktree add --detach <scratchpad>/wt-head HEAD`). That checkout has no uncommitted files, so the derived set there equals the committed set. No read was recorded for `MainContent.svelte`, and it was not staged or edited.

### Gate result

`bash .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads`, in the HEAD worktree: **exit 0**.

```text
skipped: 143 path(s) under the exempt trees or generated
== changed since ship/v2.15-12-planning: 230 file(s) in scope
  layer 1 codemod-detector: 0
  layer 2 strip-patterns: 0
    allowed: .github/workflows/main.yaml:482: [narrative] echo "::error::yarn db:types produced a different ... an override widens a column that no longer exists."
    allowed: scripts/assert-edge-function-env.mjs:207: [narrative] 'were renamed, removed, or moved out of the scanned root — and the check is now blind. ' +
  layer 3 narrative: 0
  layer 4 reflow-detectors: 0
  layer 5 repo-lint-rule: 0
  read-log unread: 0
== total failing items: 0 (layer1=0 layer2=0 layer3=0 layer4=0 layer5=0 unread=0)
VERDICT: CLEAN
```

Layer 1 printed `note:` lines only, none of which fail:

- 20 `todo-class` notes: existing `TODO` comments in `supabaseAdminWriter.ts`, `Input.svelte`, `Video.svelte`, `EntityCard.svelte`, `Banner.svelte`, `localServerDataProvider.ts`, the root `+layout.svelte` (2), `condenser.ts` and `llmProvider.ts` (10);
- one version string in code, `jose@v5.9.6` in `identity-callback/index.ts`;
- four files outside the codemod's `apps/ packages/ tests/` scope (`.env.example`, `.github/workflows/main.yaml`, the two `scripts/*.mjs`), which layers 2-5 still cover;
- one warning that the codemod does not classify `apps/supabase/supabase/functions/.env.example`, which layers 2-5 still cover.

The same run with `--files` over the 230 committed paths, in the main checkout, also exits 0 with the same counts.

No file failed the gate, so Task 1 needed no residue fix and recorded no read.

### Repo-wide report (information only)

`bash .claude/skills/ship-review-stack/sources/hygiene-grep-report.sh` in report mode, over `apps/ packages/ tests/`. Both runs exit 0. The report is red repo-wide by design, and the phase gate is the per-changed-file check above. The script is byte-identical at both revisions.

At `ship/v2.15-12-planning` (temporary detached worktree):

```text
  pattern               occ   files    bare  expect     verdict
  phase-ref              77      46      66  bare = 0   FAIL
  spike-ref              41      15      41  bare = 0   FAIL
  decision-id-long        0       0       -  occ = 0    OK
  decision-id-bare      363      61       -  occ = 0    FAIL
  section-anchor         58      25       -  occ = 0    FAIL
  planning-path          21      21       -  occ = 0    FAIL
  plan-number             2       2       -  occ = 0    FAIL
  milestone-ver          16      13       -  -          REPORT
  task-id               119      64       -  occ = 0    FAIL

  planning-reference total (8 rows, comparable to the research loop) : 578
  task-id supplementary (no counterpart in that loop)                : 119
  union files touched by any row                                     : 184
```

At HEAD `6c20b132a` (temporary detached worktree):

```text
  pattern               occ   files    bare  expect     verdict
  phase-ref              64      36      55  bare = 0   FAIL
  spike-ref              16      10      16  bare = 0   FAIL
  decision-id-long        0       0       -  occ = 0    OK
  decision-id-bare      156      38       -  occ = 0    FAIL
  section-anchor         45      20       -  occ = 0    FAIL
  planning-path          13      13       -  occ = 0    FAIL
  plan-number             1       1       -  occ = 0    FAIL
  milestone-ver          14      11       -  -          REPORT
  task-id               105      56       -  occ = 0    FAIL

  planning-reference total (8 rows, comparable to the research loop) : 309
  task-id supplementary (no counterpart in that loop)                : 105
  union files touched by any row                                     : 143
```

Over the phase, the planning-reference total fell from 578 to 309, and the number of files touched by any row fell from 184 to 143. Running the report's nine patterns over the 226 changed paths under `apps/ packages/ tests/` at HEAD (`git --literal-pathspecs grep -I -n -P <pattern> -- <paths>`) finds exactly one hit: the `milestone-ver` row on `https://deno.land/x/jose@v5.9.6/index.ts` in `identity-callback/index.ts`, a package version. Every other remaining occurrence is in a file the branch does not change.

## 2. Allowlist review and the independent second read

### Allowlist rows

`scripts/hygiene-allow/` holds one row file, `165-14.tsv`, with two rows. Each allowed line was read in its file.

| File | Allowed line (abridged) | Verdict | Reason |
|---|---|---|---|
| `scripts/assert-edge-function-env.mjs` | `'were renamed, removed, or moved out of the scanned root — and the check is now blind. ' +` | **kept** | Part of the runtime error raised when the derivation finds zero required variables. It lists the possible causes of an empty derivation (a rename, removal or move of the enforcement primitives), so it describes a hypothetical future change, not the history of the code. |
| `.github/workflows/main.yaml` | `echo "::error::yarn db:types produced a different … an override widens a column that no longer exists."` | **kept** | CI error message telling the reader what to do when a regenerated RPC return column is renamed or dropped. It describes the failing change, not code history. |

No row was removed. Task 2 needed no new allowlist row, so `hygiene-allow/165-34.tsv` was not created.

### Method

- **Extractor.** A throwaway script (`<scratchpad>/165-34/extract-comments.mjs`, not committed) imports the shared classifier: `familyFor` from `scripts/lib/comment-spans.mjs` and `commentMapOf` from `scripts/assert-env-pair-registry.mjs`.
  - For each of the 230 in-scope files it prints every line that carries comment text, grouped by file, with consecutive comment lines kept together.
  - Markdown files and the two `.env.example` files are printed whole.
  - The report was 17,312 lines.
- **Main read.** The report was read end to end, except `00001_initial_schema.sql`, whose 1,948 lines were handled separately (see below). The rules applied were the maintainer's: no historical narrative, no excess prose, no link to the adjacent line, no planning reference, no reflow damage, and comments that state current facts correctly.
- **Vocabulary cross-check.** Alongside the read, the flattened report was grepped for narrative vocabulary that layer 3 does not cover, such as "retired", "reintroduce", "the old", "back to", "the incident" and "the session that". Every hit was dispositioned.
- **`00001_initial_schema.sql`.** This file is the generated concatenation of `schema/*.sql`. Of its 868 distinct comment lines:
  - 827 appear verbatim in a changed schema file, so the main read covered them.
  - 34 are reformatted headings, for example `-- - bulk_delete(data jsonb) - …`, and were read directly. All are clean.
  - 7 come from the one unchanged schema file, `200-indexes.sql` (for example `-- project_id indexes (every content table)`), and were read directly. All are clean.

### Findings and fixes

Each fix commit is comment-only and carries `Hygiene: D-04`. Each was proven with `code-identity.mjs HEAD WORKTREE <files>` (exit 0). After each fix the files were read again and recorded under `165-34` with `record-hygiene-read.sh`, which runs the gate on them first.

| # | File(s) | Finding | Fix | Commit | code-identity |
|---|---|---|---|---|---|
| 1 | `apps/frontend/.../supabaseDataWriter.ts` (`_setPassword`) | Debugging narrative ("does not reproduce under 20× repeat-each", "If the 406 appears … re-verify") and excess prose | States the stale-JWT failure, the remedy and why it is not added | `3c7799d2f` | 8 compared, 0 changed |
| 2 | `decryptAndVerifyIdToken.test.ts` | "pins the regression rather than merely the new behaviour" | States what the `ERR_INVALID_URL` absence distinguishes | `3c7799d2f` | ″ |
| 3 | `decryptAndVerifyIdToken.ts` (`customFetch` note) | "a log line that says nothing again; see … for the session that cost" | "Without it, a wrong JWKS URI produces a log line that names nothing" | `3c7799d2f` | ″ |
| 4 | `providers/signicat.ts` | "See `requireConfigured` for the incident this guards" | "See `requireConfigured`." | `3c7799d2f` | ″ |
| 5 | `oidcFailure.test.ts` | "the failure mode the false closed-set comment had" | States the rot-guard's property in the present tense | `3c7799d2f` | ″ |
| 6 | `providers/signicat.test.ts` | "a regression back to birthdate keying" | "a switch to birthdate keying" | `3c7799d2f` | ″ |
| 7 | `__tests__/token-endpoint.test.ts` | "Do not 'fix' this back to…", and the Signicat block's "DELIBERATELY OUT OF SCOPE", "no coverage work of its own yet", "converted Idura blocks" and "when Signicat coverage is next touched" | Rewritten as a present-tense statement of the weaker assertion and the convention to follow | `3c7799d2f` | ″ |
| 8 | `apps/frontend/svelte.config.js` (`env.dir` block) | "and stays … so a one-off shell override still wins": narrative, and inaccurate (open deferred item from 165-19) | Says why the project-id bridge exists: `loadEnv` lets an empty shell value shadow the file | `3c7799d2f` | ″ |
| 9 | `identity-callback/claimConfig.test.ts` | "a regression back to birthdate keying" | "a switch to birthdate keying" | `b33890dc5` | 4 compared, 0 changed |
| 10 | `identity-callback/claimConfig.ts` | "would reintroduce the identity-key collision" | "would expose the identity-key collision" | `b33890dc5` | ″ |
| 11 | `identity-callback/index.ts` (4 comments) | "now fails loudly here instead of", "keep their existing meaning", "so the HTTP contract is unchanged", and "out of scope here; only the grant write is generalised" | Present-tense statements | `b33890dc5` | ″ |
| 12 | `invite-candidate/flowConformance.test.ts` | "the second transcription this file exists to end" | "a second transcription of the vocabulary" | `b33890dc5` | ″ |
| 13 | `tests/database/05-organization-admin.test.sql` header | Describes the removed role-table model (`role=organization, scope_type=organization, scope_id=org_id`) | Names the grant the fixture holds, `(entity, organization, org_a, editor)` | `cb97d1b62` | 4 compared, 0 changed (with and without `--blank-sql-literals`) |
| 14 | `tests/database/12-user-can.test.sql` | "every session below carries an empty user_roles array": stale, since the claims carry only `grants` | Describes the empty grant array and the file's own grant rows | `cb97d1b62` | ″ |
| 15 | `tests/database/17-project-structure-authority.test.sql` | "until the backfill runs … a non-empty role array": stale, since no backfill exists and `set_test_user` takes a grant array | Describes the grant-array parameter | `cb97d1b62` | ″ |
| 16 | `tests/database/22-content-policies.test.sql` | "fires the grant backfill … EMPTY role array … a tripwire for a non-empty role array": stale | Describes the write, the fixture-agreement check and why the editor passes an empty array | `cb97d1b62` | ″ |
| 17 | `.env.example` (`PUBLIC_LOG_LEVEL`) | "reintroduce production log silence … the defect this variable exists to close" | "silence production logging with no signal at all" | `8ed327729` | prose file, read whole |
| 18 | `packages/app-shared/README.md` | "The historic dual ESM+CommonJS build was added to support the Strapi backend … which has been retired", plus "restore" | States the current consumers and what a CommonJS consumer would need | `8ed327729` | prose file, read whole |
| 19 | `tests/IDURA-TEST-RUNBOOK.md` and the two bank-auth spec comments | The scratch-file names `/tmp/eflow10.env`, `/tmp/eflow10-jwks` and `/tmp/eflow10b.env` carry a planning id (`EFLOW-10`) that layer 2's upper-case pattern does not match | Renamed to `/tmp/bank-auth-edge.env`, `/tmp/bank-auth-jwks` and `/tmp/bank-auth-journey.env`, with the trailing comment columns realigned. These paths are documentation only; nothing reads them. | `8ed327729` | 2 specs compared, 0 changed; runbook read whole |
| 20 | 16 dev-seed files | 48 line-number anchors (`file.ts:NNN`, `migration line NNNN`). Every one sampled pointed at unrelated code: `pipeline.ts:177` is a docblock, `writer.ts:148-149` is Pass 5, `ctx.ts:89` is an empty array. The phase conventions require content anchors. | Each anchor names the symbol or block instead | `ce7a18490` | 18 compared, 0 changed |
| 21 | `generators/ConstituenciesGenerator.ts` | Said `parent` is "a stripped-before-RPC sentinel shape". `bulkImport` passes it through unchanged and the RPC's `WHEN 'constituencies'` arm resolves it. | Corrected while replacing the anchors | `ce7a18490` | ″ |
| 22 | `tests/fixtures/negctl-elections-sentinel.ts` | Named `constResolve`, which no longer exists | The reads are now attributed to `LINK_SENTINELS` | `ce7a18490` | ″ |
| 23 | `perm-localisation-positive.ts`, `tests/tests/utils/testIds.ts` | Referred to a `perm-localisation-negative` variant that does not exist, and quoted `LanguageSelection`'s gate as `locales.length > 1` (it is `locales.current.length > 1`) | Reference removed and gate corrected | `ce7a18490` | ″ |
| 24 | `cli/summary.ts` | "Deferred (note): `--output json` mode" is planning language | "There is no `--output json` mode" | `ce7a18490` | ″ |
| 25 | `template/permittedKeys.ts` | "the sanctioned resolution; narrowing the survey is not" is planning language | "the fix; excluding those fixtures from what the guard reads is not" | `ce7a18490` | ″ |

Verification after the fixes:

- `yarn workspace @openvaa/supabase test:unit`: 182 passed.
- `yarn workspace @openvaa/dev-seed test:unit`: 797 passed.
- `bash .planning/.../scripts/tip-proofs.sh`: exit 0.
- Env guards, all exit 0: `node scripts/assert-env-pair-registry.mjs`, `node scripts/assert-edge-function-env.mjs`, and `node scripts/assert-env-pairs-agree.mjs .env.example --deno-file apps/supabase/supabase/functions/.env.example`.
- `prettier --check` on every touched file: clean.
- Read log: `281ff81e4` commits the 39 rows of `hygiene-reads/165-34.tsv`.

After the fixes, a second vocabulary pass over a freshly generated report finds only present-tense technical uses: trigger `OLD` rows, "terms of use accepted in the past", "the OLD prefix's strings" (a hypothetical), and "the sanctioned route to a table" (a design statement). The retired-object vocabulary in `24-legacy-removal.test.sql` and `10-schema-migrations.test.sql` remains; those files exist to assert that the removed role-table objects are absent.

### Final gate

`hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads`, run in the HEAD worktree moved to `281ff81e4`: **exit 0**.

```text
skipped: 145 path(s) under the exempt trees or generated
== changed since ship/v2.15-12-planning: 230 file(s) in scope
  layer 1 codemod-detector: 0
  layer 2 strip-patterns: 0
    allowed: .github/workflows/main.yaml:482: [narrative] …
    allowed: scripts/assert-edge-function-env.mjs:207: [narrative] …
  layer 3 narrative: 0
  layer 4 reflow-detectors: 0
  layer 5 repo-lint-rule: 0
  read-log unread: 0
== total failing items: 0 (layer1=0 layer2=0 layer3=0 layer4=0 layer5=0 unread=0)
VERDICT: CLEAN
```

The in-scope set is still 230 files: every fix landed in a file that was already in it. The exempt count rose from 143 to 145 because of this record and the read log.

## 3. The code-review checklist over the branch's diff

`.agents/code-review-checklist.md`, applied to `git diff ship/v2.15-12-planning...HEAD`. Outside `.planning/` the branch changes 236 files in 248 commits.

Gate evidence was taken at `281ff81e4` after the second-read fixes, each exit status read directly:

| Command | Exit |
|---|---|
| `yarn lint:check` | 0 |
| `yarn format:check` | 0 |
| `yarn test:unit` | 0 (25 turbo tasks; app-shared 9, argument-condensation 6, core 3, data 47, dev-seed 61, filters 1, frontend 108, llm 2, matching 5, question-info 2 and supabase 15 test files) |

**E2E evidence.** The last full run is `tests/e2e-runs/165-33`: `head` = `7fc1a849d`, `exit` = 0, `VERDICT: GREEN 165/0/0/0`, with the a11y axe projects included. Since `7fc1a849d`, 39 non-planning files have changed:

- `code-identity.mjs 7fc1a849d HEAD <36 code files>` reports 36 compared, 0 changed.
- The other 3 are prose files: `.env.example`, `packages/app-shared/README.md` and `tests/IDURA-TEST-RUNBOOK.md`.

So that verdict applies to the code at HEAD. The phase gate plans (165-35/36) run the full suite again.

### General items

| Item | Verdict | Evidence |
|---|---|---|
| Changes solve the issues | met | Per-comment dispositions and commits are in `165-LEDGER.md` (`ledger-check.sh` exit 0 at each plan). This plan's own scope, D-04 over every changed file, is met by sections 1 and 2. |
| OWASP top 10 | met | No `{@html`, `innerHTML`, `eval(` or `new Function(` is added anywhere in the diff (grep over added lines: 0). The security-relevant changes fail closed, and a unit case covers each: the `-ftn` provider keywords, `resolveProviderConfig`'s `Object.hasOwn` lookup, verification-once-per-token in `createSafeGetSession`, and the project-scoped query guard. |
| Code style guide | met | `yarn lint:check` 0 and `yarn format:check` 0. |
| No `any` | met | Added `.ts`/`.svelte` lines matching `: any`, `as any`, `<any>` or `any[]`: 0. |
| No repeated code | met for the branch's own additions; one pre-existing item logged | `identity-callback/` and `invite-candidate/` each carry an `entityGrant.ts`/`entityGrant.test.ts` pair, and the two tests are byte-identical. Both copies existed at `ship/v2.15-12-planning`: each Edge Function is deployed as its own bundle and there is no `functions/_shared/`. The branch only reformatted them (165-24). Logged in `deferred-items.md`. |
| New entities documented | met | The new modules are `bySortOrderThenId.ts`, `parseFailureMessages.ts`, `parseStoredCustomization.ts`, `sameRefs.ts`, `safeGetSession.ts` and the Edge Function `resolveProviderConfig`. Each exported symbol has a docblock, and the second read covered all of them. |
| Repo docs updated | met | `apps/docs` password-validation, routing and generated component pages follow the password-validation move and the route builder. The runbook and `.env.example` follow the `-ftn` rename (165-30). `packages/app-shared/README.md` follows the ESM-only build. |
| Tracking events for new user functions | not applicable | The branch adds no user-facing function. It fixes review comments, inlines styles and moves helpers. |
| New Svelte components follow the guidelines | not applicable | No `.svelte` file is added (`git diff --diff-filter=A` lists none). The changed components keep `$props` from `.type.ts`, snippets and `concatClass`/`cn`. |
| Errors handled and logged | met | Parse failures report once at `error` with issue paths and refused key names only (`parseOutcome.ts`, `parseFailureMessages.ts`). OIDC failures carry an open-set code, mapped by `describeOidcFailure`. The Edge Functions log the real error and return fixed opaque strings. |
| Failing checks | met | Lint, format and unit are green (above). E2E is GREEN 165/0/0/0 and carries to HEAD by code identity (above). |
| Shared dependencies unaffected | met | The full `yarn test:unit` over all 11 workspaces and the full E2E suite cover every consumer. |
| WCAG 2.1 AA | met | The `a11y-smoke` and `candidate-a11y-scan` axe projects are part of the GREEN 165-33 run. The style-inlining plans compared computed styles and bounding boxes before and after (165-22, 165-31..33). |
| Keyboard and screen reader | met | The same axe scans, and the E2E keyboard walks in the voter and candidate journeys, pass. The route announcer and focus reset (`focusNavigationTarget`) are covered by `focusNavigationTarget.test.ts`. |
| Developers' and Publishers' Guides | met | Developers' Guide: the password-validation page (`validatePassword` now lives in the frontend) and the routing page are updated. The Publishers' Guide is not affected by the branch. |
| Commit history clean and linear | met | `git rev-list --merges --count ship/v2.15-12-planning..HEAD` = 0. Commits follow `type(scope): subject`, and comment-only commits carry `Hygiene: D-04`. |

### Supabase backend

| Item | Verdict | Evidence |
|---|---|---|
| Common columns on new content tables; no per-row publication column | not applicable | No `CREATE TABLE` is added in `schema/`. The only added `REFERENCES` line is `auth_user_id … REFERENCES auth.users` in the reordered `102-entities.sql`, and its index is in the unchanged `200-indexes.sql` ("auth_user_id indexes"). |
| RLS enabled, 5-policy pattern | not applicable | No new table. |
| `(SELECT auth.uid())` / `(SELECT auth.jwt())` scalar subqueries | met | A scan of every `CREATE POLICY` in `schema/*.sql` with comments stripped found 102 policies and 0 bare `auth.uid()`/`auth.jwt()` calls. |
| `TO anon` / `TO authenticated` always named | met | The same scan: 0 of 102 policies lack a `TO` role. |
| SECURITY DEFINER sets `search_path = ''`, schema-qualified | met | All 24 SECURITY DEFINER functions in `schema/*.sql` set `search_path = ''`, including the four whose headers the branch changed (`private.entity_project_id`, `private.is_child_nominee`, `public.get_entity_basic_data` and `public.user_can`). `18-entity-policies.test.sql` section 11 asserts it over the whole schema from `pg_proc.proconfig`. |
| B-tree indexes on `project_id` and FKs | met / not applicable | No new table and no new FK column. `200-indexes.sql` is unchanged, and `yarn db:lint:sql`'s unindexed-FK advisor is a gate-plan check (165-35/36). |
| Trigger naming (`set_updated_at`, `validate_{thing}`, `enforce_{constraint}`) | met | The one trigger the branch adds is `enforce_feedback_project` (`107-feedback.sql`), which follows `enforce_{constraint}`. The existing names are unchanged. |
| pgTAP BEGIN/ROLLBACK, `create_test_data()` | met | All 17 changed or new test files carry `BEGIN;` and `ROLLBACK;`. Every one except `29-authenticated-disjunct-order.test.sql`, which reads only `pg_policies` by design, uses `create_test_data`. |
| pgTAP assertion patterns | met | The changed files use `lives_ok`/`throws_ok`/`is`, and the affected-row helpers (`t17_affected`, `t22_affected`, `tracer_affected_rows`) for silent RLS denials. The pgTAP run is a gate-plan check. |

### Supabase adapter

| Item | Verdict | Evidence |
|---|---|---|
| supabaseAdapterMixin with `init({ fetch })` | met | The adapters extend the mixin, and each constructor takes the per-request `SupabaseAdapterConfig` (client, `fetch`, locales) from `resolveAdapterConfig`. `supabaseAdapter.concurrency.test.ts` covers the per-request instance. |
| COLUMN_MAP / PROPERTY_MAP for row mapping | met | `utils/mapRow.ts` imports both from `@openvaa/supabase-types`. |
| `safeGetSession()` for route guards | met | No route or hook calls `.getSession(` directly (grep over `apps/frontend/src/routes` and `hooks.server.ts`: 0). Six route files use `safeGetSession`. The one adapter `getSession()` in `supabaseDataWriter._getBasicUserData` runs after the verifying `getUser()`. |

### Edge Functions

| Item | Verdict | Evidence |
|---|---|---|
| Authority through `user_can` via `callerMayOnProject`, before any service-role client | met | `invite-candidate/flowConformance.test.ts` asserts the gate, that its answer is the sole input to a returned refusal, and that the refusal precedes the service-role client. `identity-callback` has no caller-authority decision: it serves `--no-verify-jwt` self-registration and resolves its project from configuration. |
| `createClient()` with `service_role` for privileged operations | met | Both functions build their admin client from the platform-injected `SUPABASE_SERVICE_ROLE_KEY`. |
| Appropriate status codes and error messages | met | Refusals return 400/401/403/405/500 with fixed messages. Internal errors are logged and never echoed, deliberately, because the endpoint is unauthenticated. |

### Frontend items named in the plan

| Item | Verdict | Evidence |
|---|---|---|
| Context destructuring rule | met | Every context destructure in the 32 changed `.svelte` files was listed. The names destructured are `t`, `getRoute`, `logout`, `startEvent`, `appType`, `darkMode`, `userData`, `translate`, `popupQueue`, `setDataRoot`, `openFeedbackModal`, `sendTrackingEvent`, `startPageview`, `submitAllEvents`, component-context `locales`, and layout-context members. None is on the reactive-accessor list in `.claude/skills/components/context-reactivity.md`. No `$derived(ctx.dataRoot)` alias exists. |
| `cn()` for classes | met for branch-introduced code; pre-existing items logged | Added lines in changed `.svelte` files with a ternary class interpolation: 0. Seven pre-existing interpolations remain on unchanged lines: `Input.svelte` 2, `ImagePart.svelte` 1, `Video.svelte` 3, `InfoItem.svelte` 1. Logged in `deferred-items.md`. |
| Localization of user-facing strings | met | Added `.svelte` lines carrying a literal text node: two, `Previous` and `Next` in `apps/docs/.../PeerNavigation.svelte`. They are in the English-only docs site and predate the branch; only their classes changed. The app's raw-i18n-key gate (`collectRawI18nKeyFindings`, run by every axe scan) is green in 165-33. |

No applicable item is left open, and no real violation introduced by the branch was found, so Task 3 made no code commit.
