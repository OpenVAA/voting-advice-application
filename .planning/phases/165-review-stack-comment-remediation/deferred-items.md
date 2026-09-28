# Phase 165 deferred items

Out-of-scope discoveries logged by executors. Each item names the plan that found it and the plan or gate expected to own it.

## From 165-04

- **Four SQL files fail `prettier --check` at the phase base.** `yarn prettier --check apps/supabase/supabase/tests/database/ apps/supabase/supabase/schema/` reports `07-rpc-security.test.sql`, `21-entity-organization.test.sql`, `24-legacy-removal.test.sql` and `schema/300-auth-tables.sql`. The base blob of `07-rpc-security.test.sql` (`ship/v2.15-12-planning`) fails the same check, so the finding predates this phase. The differences are in SQL code layout: prettier-plugin-sql wants the multi-argument `ARRAY[...]` in section 8 and the `string_agg(p.proname, ',' ORDER BY p.proname)` calls in section 8c split across lines. 165-04 was restricted to comments and description literals (`code-identity.mjs --blank-sql-literals` must exit 0), so it did not reformat code. `yarn format:check` is a D-06 gate over `.`, so whichever plan runs the phase-wide gate (165-24 / 165-36) has to apply `prettier --write` to these four files in a formatting-only commit and re-run pgTAP.

## From 165-05

- **Reflow-merged JSDoc headings in `packages/core/src/pipelines/metrics.type.ts`.** Two blocks read `Base interface for all pipeline metrics Provides common timing …` and `Cost breakdown for an operation Used across modules …`: the base had each sentence on its own line. The file is outside 165-05's two packages and no review thread names it, so it was not edited. The mechanical gate passes it (no `//` + code, no rule-2 break), so only a read finds it. Owner: whichever plan touches `packages/core`, or the phase-wide residue read in 165-24 / 165-36.
- **`packages/question-info/src/core/infoGeneration.ts`'s boundary-guard comment breaks the hygiene rules.** The block above the `for (const question of questions)` guard cites line anchors (`promptRegistry.ts:352`, `setPromptVars.ts:60`, `setPromptVars.ts:54`) and carries "Measured, not assumed" narrative and several sentences of excess prose. 165-05 changed `promptRegistry.ts` comments, so the `:352` anchor is now further off. The file is not in 165-05's scope (the plan changed only `question-info`'s test). Owner: the phase-wide residue read (165-24 / 165-36), or any plan that edits `infoGeneration.ts`; rewrite with content anchors (`the required-param check in loadPrompt`, `setPromptVars`).

## From 165-06

- **One pre-existing ESLint warning in `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts`.** `yarn workspace @openvaa/frontend lint` exits 0 but reports `19:9 warning 'question' is assigned a value but never used` (`unused-imports/no-unused-vars`). The file's last change is 41bee4002, before this phase, and 165-06 does not touch it. The lint scripts carry no `--max-warnings`, so no gate fails on it; whichever plan runs the phase-wide lint read (165-24 / 165-36) can rename it to `_question` or drop it.

## From 165-07

- **`scripts/assert-project-scoped-queries.mjs` fails `prettier --check` at the phase base.** Prettier wants the `user_can:` entry of `PROJECT_SCOPED_RPCS` split so its disposition string sits on its own line; nothing else in the file differs. The base blob (`git show ship/v2.15-12-planning:scripts/assert-project-scoped-queries.mjs`) fails the same check, so the finding predates this phase. 165-07 was restricted to comments (`code-identity.mjs` must exit 0), so it did not reformat code. Owner: 165-26, which edits that same map (the `upsert_answers` disposition) and can apply `prettier --write` to the file in the same change; otherwise the phase-wide `yarn format:check` gate (165-24 / 165-36).

## From 165-19

- **Two admin specs still transcribe the old inline `safeGetSession`.** `apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts` and `apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts` copy the function body that `hooks.server.ts` used to define inline, and their docstrings justify the copy with "`hooks.server.ts` builds it inside a `Handle` that cannot be invoked from a unit test". Since 165-19 it is `createSafeGetSession` in `apps/frontend/src/lib/supabase/safeGetSession.ts`, which both specs can import over their fake client, so the copies no longer track the real function and the rationale is false. Both files also carry planning labels (`D10 criterion 9`, `OB-5 deliverable 1`, `158-SWALLOWED-ERROR-MEASUREMENT.md`). Neither is in 165-19's file list. Owner: the phase-wide residue read (165-24 / 165-36), or any plan that edits either spec.
- **`apps/frontend/src/hooks.client.ts` carries the logger-block residue 165-19 removed from `hooks.server.ts`.** It cites `decision C3's NOTE, pitfall P3`, `decision C2`, `ruling D9` and a `logger.ts:67` line anchor, with several sentences of excess prose. `hooks.server.ts` now has the two-sentence form; the client file can take the same wording. Owner: the phase-wide residue read (165-24 / 165-36).
- **Two comments about the project-id bridge are now inaccurate.** `apps/frontend/vite.config.ts` (the comment above `resolveProjectIdEnv(...)`) says SvelteKit's `loadEnv` runs "over `apps/frontend`"; `kit.env.dir` is the repo root. `apps/frontend/svelte.config.js` (the `env: { dir: repoRoot }` comment block) says the bridge exists "so a one-off shell override keeps winning", which SvelteKit's own `loadEnv` overlay already gives; the bridge's remaining job is to stop an empty shell value shadowing the file, as `vite.projectIdEnv.ts`'s docstring now says. Owner: 165-30 edits `svelte.config.js` and can correct both; otherwise the phase-wide residue read.

## From 165-21

- **Two app-shared schema comments cite `106-app-settings.sql` by line number.** `packages/app-shared/src/data/schemas/storedCustomization.schema.ts` cites `106-app-settings.sql:19` for the `customization` default, which was already wrong at the phase base (the column was on line 12) and is on line 13 now. `storedSettings.schema.ts` cites `106-app-settings.sql:9`, which is correct only by coincidence after 165-21 added column comments. Both are line anchors, which the content-anchor rule forbids; name the column (`app_settings.customization`, `app_settings.settings`) instead. Neither file is in 165-21's scope. `storedSettings.schema.ts` also cites planning artifacts (`157.1-03`, `157.1-OVER-DISCLOSURE-AUDIT.md`, decision `C5(b)`), so whichever plan next edits it must run the hygiene gate on it.

## From 165-24

- **RESOLVED: every `prettier --check` failure at the tip.** `yarn format:check` failed on ten files, all failing at the phase base too: the four SQL files from 165-04, `scripts/assert-project-scoped-queries.mjs` from 165-07, and five more not logged before (`filterRelevance.test.ts`, `requireAdminIdentity.test.ts`, both `entityGrant.test.ts` copies, `invite-candidate/index.ts`). `ba2631e3a` formats all ten and regenerates `00001_initial_schema.sql`; pgTAP re-ran green after it (`165-24-GATE.md`).
- **RESOLVED for `requireAdminIdentity.test.ts`: the false transcription rationale.** Formatting the file brought it into the branch's changed set, so 165-24 rewrote its comments. The spec cannot import `createSafeGetSession`: the frontend's adapter-boundary rule forbids `$lib/supabase/*` imports outside the adapter (`7f4b95895` tried it and the forced `lint:check` failed). The transcription stays, and its docstring now names that rule and the one difference, the per-token memo (`1513025a8`). `apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts` still carries the old rationale and planning labels; it is not changed on the branch. Owner: 165-36's residue read, or any plan that edits it.
- **Still open, not gate failures:** the 165-05 reflow in `metrics.type.ts`, the 165-05 `infoGeneration.ts` boundary comment, the 165-19 `hooks.client.ts` logger block and the 165-21 app-shared line anchors are in files the branch does not change, so neither the lint, format nor hygiene gate reads them. Owner: 165-36.

## From 165-34

### Open entries, dispositioned against the branch's changed set

The changed set is `git diff --name-only --diff-filter=d ship/v2.15-12-planning...HEAD` minus the exempt trees: 230 files.

- **RESOLVED: the 165-19 `svelte.config.js` comment.** It said the project-id bridge exists "so a one-off shell override keeps winning". The file is in the changed set, so `3c7799d2f` now states the bridge's real job: SvelteKit's `loadEnv` lets an empty shell value shadow the file.
- **Stays deferred, outside the changed set:**
  - 165-05 `metrics.type.ts` reflow
  - 165-05 `infoGeneration.ts` boundary comment
  - 165-06 `candidateContext.svelte.test.ts` unused-variable warning
  - 165-19 `adminJobsAuthorization.test.ts` transcription rationale
  - 165-19 `hooks.client.ts` logger block
  - 165-19 `vite.config.ts` "over `apps/frontend`" comment
  - 165-21 `storedCustomization.schema.ts` / `storedSettings.schema.ts` line anchors

  None of these files is in the changed set, which is checked by exact path (see `165-34-HYGIENE-SWEEP.md`, the changed-set table). No gate reads them, and D-04 covers changed files only. Owner: 165-36's residue read, or any plan that edits one of them.

### New out-of-scope discoveries (the second read)

- **`apps/frontend/svelte.config.js` fails `simple-import-sort/imports` (1:1).** It is in the changed set, but the finding is outside the lint gate's scope: the frontend `lint` script is `eslint … src/`, and `yarn lint:check` exits 0. The import order is identical at `ship/v2.15-12-planning`, so it predates the phase. Fixing it would put a code change into a comment-only plan. Owner: any plan that edits the file's imports.
- **Seven ternary class interpolations in four changed components predate the branch.** `Input.svelte` has 2, `ImagePart.svelte` 1, `Video.svelte` 3 and `InfoItem.svelte` 1, all on unchanged lines. The maintainer asked for `cn` rather than interpolation on `QuestionChoices.svelte` (#880). The branch added no interpolation. Owner: a follow-up sweep, if the `cn` preference is to hold repo-wide.
- **`identity-callback/entityGrant.{ts,test.ts}` and `invite-candidate/entityGrant.{ts,test.ts}` are duplicate copies, and the two tests are byte-identical.** Both copies existed at the phase base. Each Edge Function is its own bundle and there is no `functions/_shared/`, so sharing them is a structural change. Owner: the deferred adapter/Edge follow-up.
- **Planning residue in files outside the changed set, found while tracing the second read's references:**
  - `apps/supabase/supabase/tests/database/00-helpers.test.sql` cites `162-15`, `162-06`, `162-05` and `162-CONTEXT.md D-23`. One of these is inside the `RAISE EXCEPTION` text of `set_test_user`, so it is runtime text, not only a comment.
  - `packages/dev-seed/src/supabaseAdminClient.ts` (the `bulkImport` block) cites `162-08`, `162-12`, `162-16` and `D-11c`, with historical narrative ("were declared inline here; they now live in …", "JOINED THIS SET IN 162-12").
  - `EFLOW-*` labels appear in 15 unchanged files under `tests/tests/` and in `tests/playwright.config.ts`, four of them inside `test.step` titles.
  - `scripts/assert-env-pair-registry.mjs` and `scripts/assert-env-pairs-agree.mjs` print "phase 153, plan 10" in their summary lines.

  None is in the changed set. Owner: 165-36's residue read, or a repo-wide hygiene follow-up.

## From 165-36

### CI evidence run 36429830379: five red jobs, none caused by a phase-165 change (maintainer decision needed)

The run is on `ci-evidence/165-review-fixes-tree` (commit `7588b8483`), whose tree is byte-identical to PR #889's head `1570012ec`. `main.yaml` does not run for a PR into `ship/v2.15-12-planning`. Six jobs are green. The five red ones:

1. **`secret-scan`: #887 content, not this PR's.** There are 12 unverified findings, all in `.planning/` files present at `ship/v2.15-12-planning` and not changed by phase 165.
   - 11 are JWTs inside `.planning/milestones/v2.10-phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/rca-traces/trace-run-{1,2}.zip`. Their claims are `iss http://127.0.0.1:54321/auth/v1`, `role authenticated`, one-hour lifetime: expired local-stack session tokens.
   - 1 is the `OPENVAA_CI_EVIDENCE` example at `163-RESEARCH.md:320`, marked `NOT A REAL CREDENTIAL`.
   - The same scanner and config over this PR's commits finds 0 of either kind.
   - Options: delete the two trace zips at the tip, and/or list the three paths in `.github/trufflehog-exclude-paths.txt` with the measured evidence, as that file's convention requires. Either one changes a security gate or the planning record, so the maintainer decides. The findings stay visible on any `main`-targeting run of the stack until then.
2. **`dependency-audit`: a new upstream advisory.** It reports `[NEW]` GHSA-2883-xcg3-v3hh (`js-yaml`, high, audit ids 1193726/1193727), published after the 2026-09-03 baseline. No dependency changed in phase 165.
   - Options: upgrade `js-yaml` (a package operation, so not an executor auto-fix), or accept the advisory through a reviewed `--update-baseline` run with a rationale.
3. **`dev-seed-integration`: the test depends on generated output.** `packages/dev-seed/tests/projectScopingGate.test.ts` › "measures the one extension exclusion the boundary walk still carries" asserts that some `.js/.mjs` exists under `apps/frontend/src`. Only generated Paraglide output qualifies, and the job builds only `--filter=@openvaa/dev-seed`, so a fresh checkout has none. The test came in slice 03/12 and is unchanged since. The `ci-evidence/163-gates` runs predate it.
   - Options: compile Paraglide (or build the frontend) in that job before the tests, or make the instrument conditional. The second weakens a deliberate instrument.
4. **`e2e-tests` and `e2e-visual`: the dev server runs the wrong project.** The HTTP 500 that failed every earlier CI run is gone: 165-14's key step passed and the preflight printed `E2E PREFLIGHT OK` for the served checkout. The project preflight then aborts with `observed 00000000-0000-0000-0000-000000000001`, `expected 00000000-0000-0000-0000-0000000000e2`, because both jobs run `yarn workspace @openvaa/frontend dev &` (main.yaml, steps "Start frontend") without `PUBLIC_PROJECT_ID`, which `tests/scripts/e2e-run.sh` sets to `…00e2`.
   - Candidate fix: `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2` on both "Start frontend" steps, or drive both jobs through `e2e-run.sh`.
   - This lets the CI suite run for the first time ever, so further failures are possible. The todo `2026-09-03-ci-e2e-ssr-500.md` tracks the history.

Everything in the planning record that predates the phase, and every file outside the changed set, keeps the owner named in the From 165-34 section. D-04 covers changed files only, and plan 165-36 changes no source file.
