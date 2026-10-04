---
phase: 169-dependency-bump-to-latest-safe-versions
verified: 2026-10-04T09:10:24Z
status: passed
score: 20/20 must-haves verified (4/4 roadmap success criteria; 16/16 DEPS requirements)
covered_files:
  - .changeset/config.json
  - .github/trufflehog-exclude-paths.txt
  - .github/workflows/claude-code-review.yml
  - .github/workflows/claude-solve-issue.yml
  - .github/workflows/claude.yml
  - .github/workflows/docs.yml
  - .github/workflows/main.yaml
  - .github/workflows/release.yml
  - .lintstagedrc.json
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-01-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-01-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-02-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-02-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-03-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-03-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-04-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-04-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-05-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-05-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-06-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-06-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-07-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-07-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-08-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-08-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-09-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-09-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-10-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-10-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-11-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-11-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-12-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-12-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-13-PLAN.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-13-SUMMARY.md
  - .planning/phases/169-dependency-bump-to-latest-safe-versions/169-RULINGS-SUMMARY.md
  - .yarnrc.yml
  - apps/docs/package.json
  - apps/docs/src/lib/components/Header.svelte
  - apps/frontend/Dockerfile
  - apps/frontend/README.md
  - apps/frontend/eslint.config.mjs
  - apps/frontend/package.json
  - apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts
  - apps/frontend/src/lib/_guards/eslint-adapter-singleton-guard.test.ts
  - apps/frontend/src/lib/_guards/eslint-parse-posture-guard.test.ts
  - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
  - apps/frontend/src/lib/api/base/universalAdapter.test.ts
  - apps/frontend/src/lib/api/utils/auth/fetchJwksLeakSafe.test.ts
  - apps/frontend/src/lib/candidate/utils/loginError.ts
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
  - apps/frontend/src/lib/components/questions/QuestionChoices.type.ts
  - apps/frontend/src/lib/components/select/Select.svelte
  - apps/frontend/src/lib/components/video/Video.svelte
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/tests/noDataRootDerivedAlias.test.ts
  - apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/NavItem.type.ts
  - apps/frontend/src/lib/layouts/main/Header.svelte
  - apps/frontend/src/lib/layouts/main/Layout.svelte
  - apps/frontend/src/lib/layouts/main/Layout.svelte.test.ts
  - apps/frontend/src/lib/layouts/tests/noRelativeLayoutImports.test.ts
  - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
  - apps/frontend/src/lib/server/admin/requireAdminIdentity.ts
  - apps/frontend/src/lib/supabase/server.test.ts
  - apps/frontend/src/lib/supabase/server.ts
  - apps/frontend/src/lib/utils/color/PreviewColorContrast.svelte
  - apps/frontend/src/lib/utils/motion.test.ts
  - apps/frontend/src/lib/utils/sanitize.test.ts
  - apps/frontend/src/lib/utils/settings.ts
  - apps/frontend/src/routes/candidate/help/+page.svelte
  - apps/frontend/tsconfig.json
  - apps/frontend/vite.config.ts
  - apps/frontend/vite.restartOnRootEnv.test.ts
  - apps/frontend/vite.restartOnRootEnv.ts
  - apps/frontend/vitest.config.ts
  - apps/supabase/package.json
  - apps/supabase/supabase/config.toml
  - apps/supabase/supabase/functions/identity-callback/envReadSites.test.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/identity-callback/verifyConfig.test.ts
  - apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts
  - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
  - apps/supabase/supabase/functions/invite-candidate/index.ts
  - apps/supabase/supabase/functions/send-email/callerAuthority.ts
  - apps/supabase/supabase/functions/send-email/flowConformance.test.ts
  - apps/supabase/supabase/functions/send-email/index.ts
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - apps/supabase/supabase/schema/104-nominations.sql
  - apps/supabase/supabase/schema/300-auth-tables.sql
  - package.json
  - packages/README.md
  - packages/app-shared/package.json
  - packages/app-shared/vitest.config.ts
  - packages/argument-condensation/package.json
  - packages/argument-condensation/src/core/condensation/condenser.ts
  - packages/argument-condensation/src/core/types/condensation/condensationResult.ts
  - packages/argument-condensation/src/core/utils/condensation/calculateLLMCallCounts.ts
  - packages/argument-condensation/tests/condensation/condenserIntegration.test.ts
  - packages/argument-condensation/vitest.config.ts
  - packages/core/package.json
  - packages/core/src/entity/entity.type.ts
  - packages/core/vitest.config.ts
  - packages/data/package.json
  - packages/data/src/core/collection.type.ts
  - packages/data/src/core/dataAccessor.type.ts
  - packages/data/src/root/dataRoot.ts
  - packages/data/src/root/dataRoot.type.ts
  - packages/data/vitest.config.ts
  - packages/dev-seed/README.md
  - packages/dev-seed/package.json
  - packages/dev-seed/src/cli/resolve-template.ts
  - packages/dev-seed/src/ctx.ts
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/template/linkSentinels.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts
  - packages/dev-seed/src/writer.ts
  - packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts
  - packages/dev-seed/tests/auditBaselineShape.test.ts
  - packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
  - packages/dev-seed/tests/ciSecretScanFlags.test.ts
  - packages/dev-seed/tests/cli/localityGuard.test.ts
  - packages/dev-seed/tests/cli/teardown.test.ts
  - packages/dev-seed/tests/ensureProject.test.ts
  - packages/dev-seed/tests/localSupabaseUrl.test.ts
  - packages/dev-seed/tests/projectScopedContaminationIsolation.test.ts
  - packages/dev-seed/tests/rpcNullabilityGate.test.ts
  - packages/dev-seed/tests/templates/base-app-settings.test.ts
  - packages/dev-seed/tests/templates/base.test.ts
  - packages/dev-seed/tests/writer.test.ts
  - packages/dev-seed/vitest.config.ts
  - packages/dev-tools/package.json
  - packages/filters/package.json
  - packages/filters/src/filter/base/filter.type.ts
  - packages/filters/vitest.config.ts
  - packages/llm/README.md
  - packages/llm/package.json
  - packages/llm/src/llm-providers/llmProvider.ts
  - packages/llm/src/llm-providers/provider.types.ts
  - packages/llm/src/types/llmPipelineResult.ts
  - packages/llm/src/utils/costCalculation.ts
  - packages/llm/src/utils/costCalculation.type.ts
  - packages/llm/tests/llmProvider.test.ts
  - packages/llm/vitest.config.ts
  - packages/matching/package.json
  - packages/matching/tests/space.test.ts
  - packages/matching/vitest.config.ts
  - packages/question-info/package.json
  - packages/question-info/src/core/infoGeneration.ts
  - packages/question-info/tests/api.test.ts
  - packages/question-info/vitest.config.ts
  - packages/shared-config/eslint.config.mjs
  - packages/shared-config/package.json
  - packages/shared-config/tsconfig.base.json
  - packages/supabase-types/src/database.ts
  - scripts/assert-dependency-audit.mjs
  - scripts/assert-unit-test-coverage.mjs
  - scripts/lib/audit-run.mjs
  - security/audit-baseline.json
  - tests/README.md
  - tests/playwright.config.ts
  - tests/scripts/tcp-forward.mjs
  - tests/scripts/visual-container.sh
  - tests/tests/fixtures/shared/forensicCapture.fixture.ts
  - tests/tests/specs/perf/performance-budget.spec.ts
  - tests/tests/specs/visual/visual-regression.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/support/preflight.ts
  - tests/tests/utils/selectElection.ts
  - tests/tests/utils/voterNavigation.ts
  - tests/vitest.config.ts
  - vitest.config.ts
  - yarn.lock
covered_digest: "v2:sha256:fb684078f270e7f98de8a6efd33b1894416fec23a3a82326ceeecae516d26684"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 19/20
  gaps_closed:
    - "DEPS-09: Deno Edge Function imports pinned exactly, including nodemailer >= 10.0.6 (637955cc1: send-email imports npm:nodemailer@10.0.11)"
    - "D-14 gate (warning): bank-auth E2E 3x on the PG17 stack (fd1288351: bank-auth 8/8 x3 and bank-auth-journey 131/131 x3 on 17.6)"
  gaps_remaining: []
  regressions: []
  notes:
    - "a7d5c4c59 (2026-10-04, after d5885bae3): comment-only. The NULLS NOT DISTINCT comments in 00001_initial_schema.sql, 104-nominations.sql and 300-auth-tables.sql now say 'PostgreSQL 15 or later (config.toml declares 17)'; SQL with comments stripped is byte-identical; DEPS-08 wording records the superseded PG15 constraint. Supabase unit re-run 206/206. Fingerprint refreshed."
---

# Phase 169: Dependency Bump to Latest Safe Versions Verification Report

**Phase Goal:** Every dependency in every workspace is on its latest safe version, new majors included, with the code migrated to any breaking changes and every gate green.
**Verified:** 2026-10-04T09:10:24Z (initial verification 2026-10-03T20:30Z)
**Status:** passed. Both items from the initial verification are closed: the DEPS-09 requirement gap and the D-14 bank-auth-on-PG17 warning. The 2026-10-04 commits introduce no regression.
**Re-verification:** Yes, after gap closure.
**Worktree:** `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd` at HEAD `a7d5c4c59` (fingerprint refresh; the re-verification itself ran at `69f2fa662`), branch `fix/888-review-findings`. The tree was clean before and after.
- Phase base: `5ed82f437`.
- 12-gate head: `be000f31a`.
- Final code head: `637955cc1`. `git diff 637955cc1 a7d5c4c59 -- . ':!.planning'` touches only SQL comments, so HEAD carries the executable code the final full E2E run tested.

## Re-verification: what changed since the initial verification (HEAD `5b0f3a498`)

| Commit | Kind | Effect on must-haves |
| --- | --- | --- |
| `fd1288351` | docs + run artifacts | Closes the D-14 warning: bank-auth 3x on PG17 |
| `5e1d4394a`, `d2c988d74`, `8c433571f` | code (code-review WR-01..03 in `@openvaa/llm`, `argument-condensation`, `question-info`) | Code-review fixes, test-first. Spot-checked below; no regression |
| `7c3f3ca42` | test config (operator ruling) | CI trace `on-first-retry`, local `retain-on-failure`. Results performance budget 5000 → 8000 ms. The operator explicitly overruled the spec's "never raise" guidance. Not a gap |
| `637955cc1` | code | Closes DEPS-09: `npm:nodemailer@6.9.10` → `npm:nodemailer@10.0.11` |
| `35d85889a` | docs | EVIDENCE § 2 / § 3 / § 4 "Post-phase"; REQUIREMENTS DEPS-09 Complete; todo moved to `done/`; SMTP_PORT deferred item |
| `a7d5c4c59` | comment-only (after this report's `d5885bae3`) | The `NULLS NOT DISTINCT` comments in `00001_initial_schema.sql`, `104-nominations.sql` and `300-auth-tables.sql` now say "PostgreSQL 15 or later (config.toml declares 17)". With `--` comments stripped, all three files are identical before and after. The DEPS-08 wording now records the superseded PG15 constraint. Supabase unit re-run: 206/206. This closes two former Info items; the fingerprint was refreshed |
| `69f2fa662` | docs (operator ruling) | Nothing is deployed, so three todos move to `done/`: the hosted PG 15 → 17 upgrade, the Render Node 24 deploy watch and the trace-cost item. The "migrations stay PG15-valid" constraint is dropped. Not a gap |

### DEPS-09: full three-level re-check

| Level | Check | Result |
| --- | --- | --- |
| Exists | `apps/supabase/supabase/functions/send-email/index.ts:2` | `import nodemailer from 'npm:nodemailer@10.0.11';` The diff of `637955cc1` is exactly this one line. |
| Substantive | Is the pin ≥ 10.0.6 and allowed by D-03? | Registry times in `tests/e2e-runs/169-gates/nodemailer-pin/nodemailer-time.json`: 10.0.0 `2026-09-04T07:45:32Z`, 10.0.11 `2026-09-27T07:50:47Z`, 10.0.12 `2026-09-28T09:50:50Z`. At the 08:47Z measurement, 10.0.11 was 7.04 d old and 10.0.0 was 30.04 d old. The commit is dated 08:52Z, after the measurement. 10.0.12 was still inside the 7-day window, so 10.0.11 is the newest eligible 10.0.x. |
| Substantive | Advisories | This verifier's live query `gh api "/advisories?ecosystem=npm&affects=nodemailer@10.0.11"` returned `0` (exit 0). `npm view nodemailer@10.0.11` showed version `10.0.11` with no `deprecated` field. Artifact `adv-6.9.10.tsv` lists the 17 advisories (6 high) of the replaced pin. |
| Wired | Is it used at runtime? | `index.ts:260` calls `nodemailer.createTransport(transportConfig)`. `boot-codes.txt`: `OPTIONS send-email` 200 three times, and the anon probe gave `401 Invalid or expired authentication token`, meaning the module evaluated and reached `auth.getUser()`. `edge-runtime.log` shows `serving the request with supabase/functions/send-email` and no `boot error` line. `sendmail-probe.txt`: under the same edge-runtime, `NM_PROBE_OK`, `accepted: ["nodemailer-10-probe@example.com"]` and `250 2.0.0 Ok`, and Mailpit matched 1 message. |
| Gates | Unit | This verifier re-ran `apps/supabase` `yarn test:unit`: exit 0, 15 files, 206/206. |
| Gates | Full E2E | Run dir `tests/e2e-runs/169-e2e/169-nodemailer-pin` records `head` = `637955cc1…`, `project: <full default suite>`, `db-reset: yes`, `playwright-exit: 0`, `exit` = `0`, preflight 1/0. `summary.json`: total 171, passed 171, failed 0, flaky 0, skipped 0, didNotRun 0. The porcelain at run start shows only three `.planning/todos` moves, which do not touch code. |
| PROH-169-15 / -16 | Floating or below-floor Deno import | Every remote specifier under `functions/` is exact: `npm:@supabase/supabase-js@2.117.2` ×3, `npm:jose@6.2.12`, `npm:nodemailer@10.0.11`. No `@2`, `deno.land/x` or `esm.sh` import remains. The pin is above 10.0.6. |
| Bookkeeping | REQUIREMENTS / EVIDENCE / todo | The DEPS-09 checkbox is `[x]` and the traceability row says `Complete`. The § 3 nodemailer hold row is removed. Todo `2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md` is in `todos/done/` with a Resolved section and is absent from `pending/`. |

**DEPS-09: VERIFIED.** The requirement's "email and invite flows in the full E2E suite" clause is met by runtime probes, not by a spec. No E2E spec calls `send-email` or `invite-candidate`. This has been known since 169-07, it is stated openly in the REQUIREMENTS row, and todo `2026-10-03-edge-email-functions-have-no-e2e-coverage.md` tracks it. The initial verification accepted the same reading, and this re-verification does too.

### D-14 warning: re-check

Six run dirs, `tests/e2e-runs/169-pg17-bankauth-{1,2,3}` and `169-pg17-bankauth-journey-{1,2,3}`, all record `head` `5b0f3a498` and `exit` 0. The `bank-auth` runs are 8/8/0/0/0/0 each and the `bank-auth-journey` runs are 131/131/0/0/0/0 each. `5b0f3a498` carries the same code as `be000f31a` on PG17.6. These runs predate the nodemailer pin and the WR fixes. Neither touches the identity-callback or auth path, and the full default suite re-ran green at `637955cc1`. **Closed.**

### Regression spot-check of the 2026-10-04 code changes

| Check (this verifier, exit status read directly) | Result |
| --- | --- |
| `prettier --check` on all 14 code files changed since `be000f31a` | exit 0 |
| `yarn typecheck:tests` (covers `playwright.config.ts`'s new `trace` ternary and the perf spec) | exit 0 |
| `@openvaa/llm` / `argument-condensation` / `question-info` `yarn test:unit` | exit 0 each: 49/49, 31/31, 22/22 |
| `turbo run build` for those three packages | exit 0, 7/7 tasks |
| `eslint` on `performance-budget.spec.ts` and `forensicCapture.fixture.ts` | no findings (`playwright.config.ts` is lint-ignored by config) |
| `yarn audit:deps` (live, 2026-10-04 ~09:05Z) | exit 0. `0 new advisory(ies) at high+, 0 accepted` |
| `trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure'` vs `retries: process.env.CI ? 3 : 0` | Both are keyed on the same switch, so a CI retry exists to record the trace. Locally (`e2e-run.sh` unsets `CI`) behaviour is unchanged. |
| Performance project in the final run | Passed, `timeToMatches` 1383 ms against the 8000 ms budget. The `resultsFetches` guard (≤ 13) is unchanged. |

No regression found. One limit applies: the full 12-gate set was last run as a set at `be000f31a`. The later code changes are the three WR fixes in the LLM-family packages, the one-line nodemailer pin and the test-config change. They are covered by the targeted checks above, by the review disposition's forced `lint:check` (typecheck included, exit 0), and by the full E2E run at the final code head. None of them touches `apps/frontend` or `apps/docs` source.

## Goal Achievement

### Observable Truths (ROADMAP success criteria, the contract)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| SC1 | Every direct dependency in root, `apps/*` and `packages/*` is at its latest version unless a recorded reason holds it back. "Safe" is defined at planning. | VERIFIED | "Safe" is the D-03 rule, enforced by `npmMinimalAgeGate: 7d`; the binding proof is in EVIDENCE § 5 (`YN0016 … quarantined`). The final table (2026-10-03T19:00Z) has 67 packages: 47 current, 13 HOLD-7d, 5 HOLD-30d, 2 major, 0 in-major. Every non-current row is backed by a § 3 hold and a dated pending todo. The Deno pins are all exact and current under D-03: supabase-js 2.117.2 and jose 6.2.12 match the npm side, and nodemailer is 10.0.11, the newest 10.0.x past the 7-day rule (re-verified above). |
| SC2 | Majors are migrated, not suppressed. Each major bump lands with its migration, grouped so a failing gate points at one upgrade. | VERIFIED | Unchanged from the initial verification: one upgrade per commit with a reformat after each formatter or sorter major, and named migrations (import-x flat config, `restartOnRootEnv`, `test.projects`, `resolutions` deleted, TS 6 `types`, ssr 0.12, AI SDK 7). No suppression was added. The 2026-10-04 commits add no `@ts-ignore`, `eslint-disable`, `.skip` or `.only`, and the nodemailer major needed no call-site change (`createTransport` + `sendMail` only). |
| SC3 | `yarn audit:deps` passes. Every row with a published fix is fixed; the baseline keeps only no-fix or recorded-hold rows, each with a current note. The Dependabot todo is updated and stays pending. | VERIFIED | Live `yarn audit:deps` gives exit 0 again (2026-10-04). `accepted: []`. The Deno blind spot that `audit:deps` cannot see is now also clean: nodemailer 10.0.11 has 0 advisories. The liveness keying and NC-1..NC-5 are as before. |
| SC4 | Gates: typecheck, lint, svelte-check, unit, pgTAP, production builds (frontend and docs), then the full E2E suite under the cardinal rule. | VERIFIED | 12/12 gates, pgTAP 1335/1335 on 17.6 and E2E 171/171 at `be000f31a`. At the final code head `637955cc1`: full E2E 171/171/0/0/0/0 after a clean reset, plus the targeted re-checks above. |

**Score (roadmap contract):** 4/4 truths verified (0 present, behavior-unverified)

### Requirements Coverage (DEPS-01..16)

PLAN frontmatter requirements union to DEPS-01..16 across 169-01..13. REQUIREMENTS.md maps no other ID to Phase 169, so none is orphaned.

| Req | Status in REQUIREMENTS.md | Verifier status | Evidence on disk |
| --- | --- | --- | --- |
| DEPS-01 | Complete | SATISFIED | `.yarnrc.yml` `npmMinimalAgeGate: 7d`. `yarn config get` returns 10080. Binding proof recorded. The version table was regenerated at start (§ 1) and at end (`169-VERSION-TABLE.md`). |
| DEPS-02 | Complete | SATISFIED | Group-0 refresh `27a209c99`. Root `resolutions` is `null` and there is no `packageExtensions`. The `braces` row was dropped because `braces` left the tree. |
| DEPS-03 | Complete | SATISFIED | Yarn 4.18.1 everywhere. Node 24.21.0 in CI, `FROM node:24-alpine`, `engines.node ">=24.15.0"`. `@types/node` ^24.19.0 via the catalog. TS 6.0.3. The isolated Node commit `77d3ce8bf` has its own gate, image, E2E and CI evidence. |
| DEPS-04 | Complete | SATISFIED | `eslint-plugin-import-x` with four rules and planted-violation proof (4/4, with negative controls). ESLint 10.11.0. FlatCompat is gone. The Prettier and sort-plugin majors each have a reformat commit. |
| DEPS-05 | Complete | SATISFIED | Kit 2.70.3 (Kit 3 is held). The catalog is shared by both apps. `restartOnRootEnv` is wired at `vite.config.ts:26` with a live restart probe. The visual runs exist and the `e2e-visual` CI job is green. |
| DEPS-06 | Complete | SATISFIED | One Vitest 5.0.2. `test.projects` replaces the workspace file. Per-workspace counts are equal across 11 workspaces. jsdom 30.1.1, isomorphic-dompurify 4.4.0, Playwright 1.63.0 with a pinned digest. |
| DEPS-07 | Complete | SATISFIED | Supabase CLI 2.118.0 at all seven sites. `database.ts` is regenerated with no drift on PG17. supabase-js 2.117.2, ssr 0.12.7. Bank-auth 3× runs exist on PG15 (169-07) and on PG17 (`169-pg17-*`). |
| DEPS-08 | Complete | SATISFIED | `config.toml` `major_version = 17`. Clean reset, server 17.6, pgTAP 1335 including the census, `db:types` no diff. The requirement's "PG15-validity standing constraint" and "hosted upgrade todo" parts are superseded by the 2026-10-04 operator ruling (`69f2fa662`: nothing is deployed, migrations target 17, todo closed). Per the ruling this is not a gap. `a7d5c4c59` amended the DEPS-08 wording to record that both parts are superseded. |
| **DEPS-09** | **Complete** | **SATISFIED (re-verified)** | `send-email/index.ts:2` `npm:nodemailer@10.0.11` (≥ 10.0.6, 7.04 d old, 0 advisories, live re-check). supabase-js and jose are exact. Function unit tests 206/206 (re-run). Boot check, anon probe and a real `sendMail` are in the artifacts. Full E2E `169-nodemailer-pin` 171/171. Bank-auth 3× is green on PG15 and PG17. The audit-blind-spot todo is filed. |
| DEPS-10 | Complete | SATISFIED | faker 10.6.0 in its own commit, with the seed diff recorded. No PNG snapshot changed. |
| DEPS-11 | Complete | SATISFIED | `ai` ^7, `@ai-sdk/*` ^4. `openai` and `jsonrepair` are removed. The WR-01..03 review fixes (test-first) tighten the migration and loosen no validation. The three package suites are re-run green. |
| DEPS-12 | Complete | SATISFIED (hold branch) | Small majors landed one commit each. dotenv 18 and intl-messageformat 12 are held by the 30-day rule with a dated todo, and their ranges are not widened. |
| DEPS-13 | Complete | SATISFIED | Actions are on current major tags. trufflehog is exact. CI is 12/12 `success`. `dependabot.yml` is unchanged. |
| DEPS-14 | Complete | SATISFIED (hold branch) | Kit 3 is not installed. The HOLD-AGE verdict and todo re-check on 2026-10-31. |
| DEPS-15 | Complete | SATISFIED | Liveness is keyed on the exit status. The baseline has 0 rows. Todos are filed and updated. |
| DEPS-16 | Complete | SATISFIED | See SC4. |

**Requirements score:** 16/16 satisfied.

### Operator rulings: applied exactly as scoped?

| Ruling | What was allowed | What the codebase shows | Verdict |
| --- | --- | --- | --- |
| R1 (2026-10-03): local PG17, `is_valid_choice_id` STABLE | one volatility fix | Two one-word `IMMUTABLE` → `STABLE` edits. Live `provolatile` = `s`. | Exactly as scoped |
| R2 (2026-10-03): three `no-useless-assignment` disables citing eslint-plugin-svelte#1478 | three lines | Three hits, each `eslint-disable-next-line` with the URL. Removal todo pending. | Exactly as scoped |
| R3 (2026-10-03): drawer focus return | the fix | Wired, and `Layout.svelte.test.ts` passes 2/2 | Applied, test-proven |
| R4 (2026-10-03): Vite 8 default browser floor | no override | No `build.target` | Applied |
| Yarn `enableScripts: false` + `dependenciesMeta.built` | esbuild, supabase, unrs-resolver | Exactly those three | Exactly as scoped |
| 2026-10-04: CI trace `on-first-retry`; results budget 8000 ms | `playwright.config.ts` `use.trace`; `TIME_TO_MATCHES_BUDGET_MS` | `7c3f3ca42` touches exactly those two values, the calibration docblock (CI measurements added) and two doc comments. `RESULTS_FETCH_BUDGET` stays 13 and the `performance` project keeps `trace: 'off'`. Recorded in the done todo's Resolved section. | Exactly as scoped |
| 2026-10-04: nothing deployed | close the hosted-PG17 and Render-watch todos; drop the PG15-validity constraint | `69f2fa662` is a docs-only move of three todos to `done/` with a Resolved section each. No code changed. | Exactly as scoped |

### Prohibitions (PROH-169-01..24)

None of the 24 was violated outside the ruled scope. The re-verification touches two of them. For PROH-169-15, every Deno import is exact. For PROH-169-16, nodemailer is 10.0.11, which is ≥ 10.0.6. The earlier "the task waits" state is resolved. PROH-169-12 (no migration or schema edit to accommodate PG17) is not touched by `a7d5c4c59`, whose edits are comments only and add no PG17-only construct. The other 21 are unchanged from the initial verification, and the 2026-10-04 commits introduce no `resolutions`, suppression, skip, snapshot change, widened range or remote push.

### Known open items: are they honestly recorded?

| Item | Recorded where | Dated trigger | Honest? |
| --- | --- | --- | --- |
| Kit 3 / adapter-node 6 / adapter-static 4 | DEPS-14 row; todo `…-sveltekit-3-held-by-the-age-rule.md` | 2026-10-31T17:24:31Z | Yes |
| dotenv 18, intl-messageformat 12 | DEPS-12 row; todo `…-dotenv-18-and-intl-messageformat-12-held.md` | 10-17T21:18Z / 10-15T12:27Z | Yes |
| TypeScript 7 | todo `…-typescript-7-held.md` | peers admitting 7 | Yes |
| 7-day holds (types/node, ai family, typescript-eslint, turbo, vitest, daisyui, supabase CLI, vite, globals, eslint) | todo `…-age-held-majors-recheck.md`; § 3 | 10-04 … 10-09 | Yes |
| nodemailer 10.0.12+ (newer patches inside the 7-day window at pin time) | EVIDENCE § 2 "Post-phase" table | 10.0.12 clears 2026-10-05T09:50Z | Yes (ordinary patch drift; not a gap) |
| Deno imports invisible to `audit:deps` | todo `…-deno-edge-imports-invisible-to-audit-deps.md`; baseline note | — | Yes |
| `send-email` / `invite-candidate` have no E2E caller | todo `…-edge-email-functions-have-no-e2e-coverage.md` | — | Yes |
| Local `send-email` SMTP_PORT 2500 vs Mailpit 1025 | `deferred-items.md` (status open) | — | Yes (see the observation below) |
| release/docs workflows unobservable until merge | todo filed | post-merge | Yes |
| Hosted PG17, Render Node 24 | closed by operator ruling (`69f2fa662`) | — | Closed; not a gap |

### Key Links

| From | To | Status | Details |
| --- | --- | --- | --- |
| `send-email/index.ts` import | `npm:nodemailer@10.0.11` → `createTransport` | WIRED | Import at :2, used at :260. Runtime evaluation is proven by the boot check, the 401 probe and the edge-runtime `sendMail` probe. |
| `scripts/assert-dependency-audit.mjs` | `scripts/lib/audit-run.mjs` | WIRED | Imported at :73 and called at :190 |
| `apps/frontend/vite.config.ts` | `vite.restartOnRootEnv.ts` | WIRED | Registered at :26 |
| `.yarnrc.yml` catalog | both apps and all packages | WIRED | Every catalog entry has a consumer |
| `Layout.svelte` `closeDrawer()` | `Header.svelte` menu button | WIRED | Behaviour test green |
| `config.toml` `major_version` | local DB image | WIRED | 17.6 |
| `playwright.config.ts` `use.trace` | `retries` | WIRED | Both keyed on `process.env.CI` |

### Anti-Patterns Found

No `TBD`, `FIXME`, `XXX`, `TODO` or `HACK` appears on any added line of the 2026-10-04 code commits. No stubs.

| File | Pattern | Severity | Impact |
| --- | --- | --- | --- |
| `apps/supabase/supabase/functions/send-email/index.ts` | A direct `eslint` run reports 4 errors (`simple-import-sort`, three `array-type`) | Info | Pre-existing: the pre-pin file gives the same findings. The supabase workspace has no ESLint lint step for `functions/` (`lint:all` is SQL + schema only), so no gate covers it. Not caused by the pin. |
| `tests/tests/specs/perf/performance-budget.spec.ts` docblock | Still contains "never raise a budget to make a red test green" next to the raised 8000 ms | Info | Consistent with the ruling: the budget was raised for CI margin (CI max 4603 ms, not red), by explicit operator decision. |
| `.planning/phases/169-…/.continue-here.md`, `.planning/HANDOFF.json` | Leftover handoff files | Info | Clear them at `phase.complete` (known GSD quirk). |

### Non-blocking observation (new deferred item)

**Local `send-email` cannot deliver mail: `SMTP_PORT=2500` vs Mailpit's 1025.** `apps/supabase/supabase/functions/.env.example:99` and the root `.env.example:237` both set `SMTP_PORT=2500`, the old Inbucket SMTP port. The local `inbucket` service is now Mailpit, which listens on 1025. The probe artifact records `ECONNREFUSED …:2500` and success on 1025. The failure is a TCP refusal before any SMTP exchange, so it would happen on any nodemailer version. It is pre-existing and not caused by the pin. It is logged in `deferred-items.md` with a suggested fix (set 1025 in both `.env.example` files and confirm a local `send-email` reaches Mailpit), which pairs naturally with the E2E-coverage todo. It does not affect any Phase 169 must-have. No spec calls `send-email`, and a hosted deployment sets its own SMTP env.

### Human Verification Required

None.

### Gaps Summary

There are no gaps. The DEPS-09 blocker from the initial verification is closed in the codebase. `send-email` now imports `npm:nodemailer@10.0.11`, which is ≥ 10.0.6, the newest 10.0.x past the 7-day rule, and has 0 advisories on a live re-query. Its runtime path is proven by the boot check, the auth-gate probe and a real `sendMail` under the edge-runtime, and the full E2E suite is 171/171 at the final code head. The D-14 warning is also closed, by the six PG17 bank-auth runs. The 2026-10-04 test-config and docs commits apply the operator rulings exactly as scoped, and the targeted re-checks found no regression.

### Limits of this verification (not gaps)

- The full 12-gate set, pgTAP and the full E2E suite were not re-run by this verifier. They are taken from their run artifacts, whose `head` files were checked: `be000f31a` for the gate set and `637955cc1` for the final E2E.
- The edge-runtime `sendMail` probe and the boot check are taken from their artifacts (`tests/e2e-runs/169-gates/nodemailer-pin/`). They were not re-run, because that would mutate the shared local stack.
- The per-commit claims of the initial verification (lockfile confinement, seed diffs) were not re-derived.

---

_Verified: 2026-10-04T09:10:24Z (re-verification; initial 2026-10-03)_
_Verifier: Claude (gsd-verifier)_
