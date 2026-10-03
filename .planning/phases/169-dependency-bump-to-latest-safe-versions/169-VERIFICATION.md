---
phase: 169-dependency-bump-to-latest-safe-versions
verified: 2026-10-03T20:30:00Z
status: gaps_found
score: 19/20 must-haves verified (4/4 roadmap success criteria; 15/16 DEPS requirements, DEPS-09 open)
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
  - package.json
  - packages/README.md
  - packages/app-shared/package.json
  - packages/app-shared/vitest.config.ts
  - packages/argument-condensation/package.json
  - packages/argument-condensation/src/core/condensation/condenser.ts
  - packages/argument-condensation/src/core/types/condensation/condensationResult.ts
  - packages/argument-condensation/src/core/utils/condensation/calculateLLMCallCounts.ts
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
  - packages/llm/package.json
  - packages/llm/src/llm-providers/llmProvider.ts
  - packages/llm/src/llm-providers/provider.types.ts
  - packages/llm/src/types/llmPipelineResult.ts
  - packages/llm/src/utils/costCalculation.ts
  - packages/llm/tests/llmProvider.test.ts
  - packages/llm/vitest.config.ts
  - packages/matching/package.json
  - packages/matching/tests/space.test.ts
  - packages/matching/vitest.config.ts
  - packages/question-info/package.json
  - packages/question-info/src/core/infoGeneration.ts
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
  - tests/tests/specs/visual/visual-regression.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/support/preflight.ts
  - tests/tests/utils/selectElection.ts
  - tests/tests/utils/voterNavigation.ts
  - tests/vitest.config.ts
  - vitest.config.ts
  - yarn.lock
covered_digest: "v2:sha256:b8c571a9fff04d23b5aa9ffc6cb003d70dfe8b87a682e1e1d57f96741af2f205"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "DEPS-09: Deno Edge Function imports pinned exactly, including nodemailer >= 10.0.6"
    status: failed
    reason: "send-email still imports npm:nodemailer@6.9.10, which GitHub lists with 17 advisories (6 high). The 10.x pin is held by the D-03 age rule (10.0.11 clears the 7-day rule at 2026-10-04T07:51Z; 10.0.0 clears the 30-day rule at 07:45Z). The hold is honest and recorded: DEPS-09 is Pending in REQUIREMENTS.md, and a dated todo with resume steps exists. No later milestone phase covers it, so it cannot be deferred."
    artifacts:
      - path: "apps/supabase/supabase/functions/send-email/index.ts"
        issue: "line 2: import nodemailer from 'npm:nodemailer@6.9.10';"
    missing:
      - "On or after 2026-10-04T07:51Z, follow the resume steps in .planning/todos/pending/2026-10-03-nodemailer-10-edge-pin-held-until-2026-10-04.md: re-measure, check advisories, pin npm:nodemailer@<newest 10.0.x that is >= 10.0.6 and >= 7 days old>, run the supabase unit tests, run the boot check, run the full E2E suite"
      - "Then mark DEPS-09 Complete in REQUIREMENTS.md (checkbox and traceability row) and remove the § 3 hold row"
  - truth: "D-14 gate: bank-auth E2E 3x runs on the PG17 stack"
    status: partial
    reason: "WARNING, not a requirement failure (DEPS-08's text does not name bank-auth). CONTEXT D-14 says 'bank-auth E2E 3x and the full E2E suite run on the PG17 stack'. The only bank-auth 3x runs (169-07-bankauth-{1,2,3} 8/8 and 169-07-bankauth-journey-{1,2,3} 131/131) ran at cce9b5b16 on Postgres 15, before the PG17 ruling. After PG17 landed (bfdc1afc3) only the default suite ran (169-rulings, 169-13-final). That suite has no bank-auth project, and neither does CI's e2e-tests job (171 tests). No artifact records a waiver."
    artifacts:
      - path: "tests/e2e-runs/169-07-bankauth-*"
        issue: "head cce9b5b16, on PG15; no bank-auth run exists after bfdc1afc3"
    missing:
      - "Run bank-auth and bank-auth-journey 3x on the PG17 stack at the final HEAD. This fits into the nodemailer quick task, which needs an E2E run anyway. Record the result in 169-EVIDENCE.md § 4, or record an explicit operator waiver."
---

# Phase 169: Dependency Bump to Latest Safe Versions Verification Report

**Phase Goal:** Every dependency in every workspace is on its latest safe version, new majors included, with the code migrated to any breaking changes and every gate green.
**Verified:** 2026-10-03
**Status:** gaps_found. There is one real requirement gap (DEPS-09, time-boxed and honestly recorded) plus one warning (bank-auth 3× not re-run on PG17).
**Re-verification:** No, initial verification
**Worktree:** `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd` at HEAD `5b0f3a498`, branch `fix/888-review-findings`, tree clean before and after.
- Phase base: `5ed82f437`.
- Final code HEAD: `be000f31a`. `git diff be000f31a HEAD -- . ':!.planning'` is empty, so HEAD carries the same code as the gated tree.

## How the claims were checked

This verifier re-ran nothing heavy. The gate set and the full E2E suite were not re-run, as instructed. Instead, the run artifacts were read directly:

| Claim | Artifact read | Result |
| --- | --- | --- |
| 12/12 gates at `be000f31a` | `tests/e2e-runs/169-gates/169-13-final/summary.tsv`, `env.txt` | 12 rows, every exit `0`. `head: be000f31a8664a…`, `node: v24.21.0`, `yarn: 4.18.1`. |
| pgTAP 1335/1335 | `tests/e2e-runs/169-gates/13-final-pgtap.log` | `Files=36, Tests=1335`, `All tests successful`, `Result: PASS`. All 36 files `ok`, including `36-entity-identity.test.sql`. |
| …on PG17.6 | `tests/e2e-runs/169-gates/13/final-server-version.txt` → `17.6`. Live read-only check on `supabase_db_openvaa-local`: `show server_version` → `17.6`, image `postgres:17.6.1.171`. | Verified. |
| `db:lint:sql` 0 | `13/final-db-lint-sql.log` | `Summary: 0 error(s), 3 warning(s)`. The warnings are the pre-existing "foreign keys without indexes" notes. |
| E2E 171/0/0/0/0 | `tests/e2e-runs/169-e2e/169-13-final/{summary.json,head,provenance.txt}` | Counts are total 171, passed 171, failed 0, flaky 0, skipped 0, didNotRun 0. `head` = `be000f31a…`, `project: <full default suite>`, `db-reset: yes`, `playwright-exit: 0`, preflight 1/0, porcelain empty. |
| Observed CI | `tests/e2e-runs/169-gates/02-t3-ci-jobs-run3.json`, `11-t3-ci.json` | 12/12 jobs `success` in each. The 169-11 run covers the tree of `edaa28205`. Between that tree and HEAD, the only code difference is `security/audit-baseline.json`, which was emptied. |
| Six `ci-evidence/**` commits | `git ls-tree -r` on 91e58711a, 3eaa31396, 2cf0e8416, 3a27c98fc, d69c5d62a, 59607e5cd | 0 paths under `.planning/` or `.bg-shell/` in each (PROH-169-06). |

Targeted checks this verifier ran itself, each read from its own exit status:

| Check | Exit / result |
| --- | --- |
| `yarn audit:deps` (live, 2026-10-03 ~20:20Z) | exit 0. `0 new advisory(ies) at high+, 0 accepted`. |
| `yarn config get npmMinimalAgeGate` / `enableScripts` / `npmPreapprovedPackages` | `10080` (7 d) / `false` / `[]`. Yarn `4.18.1`. |
| `yarn why` on the key packages | vitest 5.0.2, vite 8.3.1, kit 2.70.3, vps 7.3.1, eslint 10.11.0, faker 10.6.0, jsdom 30.1.1, isomorphic-dompurify 4.4.0, ssr 0.12.7, supabase-js 2.117.2, supabase CLI 2.118.0, ai 7.0.116, @playwright/test 1.63.0, devalue 5.9.4. TypeScript resolves to 6.0.3 only. |
| `yarn why` on removed packages | `openai`, `jsonrepair`, `@types/cheerio`, `eslint-plugin-import`, `vite-plugin-restart`, `@eslint/eslintrc`, `@vitest/coverage-v8`: all absent. |
| Direct deps across all 16 manifests vs `169-VERSION-TABLE.md` | 67 = 67. `comm -3` is empty, so no package is missing from the table. |
| Catalog entries with zero `catalog:` consumers | none |
| `yarn vitest run src/lib/layouts/main/Layout.svelte.test.ts` (frontend, the one named test for ruling R3) | exit 0, 2/2 passed |
| `git grep v10_config_lookup\|FlatCompat\|@eslint/eslintrc` outside `.planning` | no hit |

## Goal Achievement

### Observable Truths (ROADMAP success criteria, the contract)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| SC1 | Every direct dependency in root, `apps/*` and `packages/*` is at its latest version unless a recorded reason holds it back. "Safe" is defined at planning. | VERIFIED | "Safe" is the D-03 rule, enforced by `npmMinimalAgeGate: 7d`; the binding proof is in EVIDENCE § 5 (`YN0016 … quarantined`). The final table (19:00Z) has 67 packages: 47 current, 13 HOLD-7d, 5 HOLD-30d, 2 major, 0 in-major. Every non-current row is backed by a § 3 hold and a dated pending todo. Kit 3 / adapter-node 6 / adapter-static 4 are held to 2026-10-31. dotenv 18 is held to 10-17 and intl-messageformat 12 to 10-15. TS 7 is blocked by its peers. `@types/node` 26 waits for the runtime major (D-11 R3). The 7-day patch holds are listed in `age-held-majors-recheck`. The Deno pins are covered as follows: supabase-js and jose are exact at 2.117.2 / 6.2.12, matching the npm side; nodemailer is held with a recorded reason (see DEPS-09). |
| SC2 | Majors are migrated, not suppressed. Each major bump lands with its migration, grouped so a failing gate points at one upgrade. | VERIFIED | The 70 non-docs commits (one of them a planning-only `wip`) run one upgrade per commit, with a reformat commit after each formatter or sorter major (`git log 5ed82f437..HEAD`). Example migrations: import-x swap with native flat config (FlatCompat gone); `restartOnRootEnv` replaces `vite-plugin-restart`; `vitest.workspace.ts` → `test.projects`; root `resolutions` deleted (`null`) with dompurify 4; TS 6 `types: ["node"]`; ssr 0.12 cache-header forwarding; AI SDK 7 usage-shape migration. Suppression scan of the phase diff found no added `@ts-ignore` / `@ts-expect-error` / `ignoreDeprecations` / `skipLibCheck`, and no rule turned off or downgraded. There are no added `eslint-disable` lines other than the three ruled ones; the three `import/first` disables were renamed in place to `import-x/first`. No `.skip` / `.todo` / `.only` was added, no test file was deleted, and no `rollupOptions` / `rolldownOptions` / `build.target` override was added. |
| SC3 | `yarn audit:deps` passes. Every row with a published fix is fixed; the baseline keeps only no-fix or recorded-hold rows, each with a current note. The Dependabot todo is updated and stays pending. | VERIFIED | Live `yarn audit:deps` gives exit 0, 0 new and 0 accepted. `security/audit-baseline.json` has `accepted: []` and a current note, with no history and no Strapi text. The note names the Deno blind spot. The liveness check is keyed on the audit's exit status (`scripts/lib/audit-run.mjs` `classifyAuditRun`, imported at `assert-dependency-audit.mjs:73`, used at `:190`). The shape test no longer asserts `accepted.length > 0`. NC-1 (old gate passes silently) through NC-5 are recorded in EVIDENCE § 5. The ROADMAP premise and criterion 3 are amended (D-02). `2026-09-03-dependabot-alert-list-is-stale-against-main.md` is still in `pending/` and has a dated "Post-Phase-169 numbers" section. |
| SC4 | Gates: typecheck, lint, svelte-check, unit, pgTAP, production builds (frontend and docs), then the full E2E suite under the cardinal rule. | VERIFIED | Covered by the artifacts table above. All ran on one HEAD (`be000f31a`): 12/12 gates (install, dedupe, typecheck, lint, format, check-fe, check-docs, unit, build, audit, docs-links, docs-RQ), pgTAP 1335/1335 on 17.6, then E2E 171/171 with 0 flaky and 0 did-not-run after a clean reset. |

**Score (roadmap contract):** 4/4 truths verified (0 present, behavior-unverified)

### Requirements Coverage (DEPS-01..16)

PLAN frontmatter requirements union to DEPS-01..16 across 169-01..13. REQUIREMENTS.md maps no other ID to Phase 169, so none is orphaned.

| Req | Status in REQUIREMENTS.md | Verifier status | Evidence on disk |
| --- | --- | --- | --- |
| DEPS-01 | Complete | SATISFIED | `.yarnrc.yml` `npmMinimalAgeGate: 7d`. `yarn config get` returns 10080. Binding proof recorded (`globals@17.13.0` quarantined, `^17` → 17.12.0). The version table was regenerated at start (§ 1) and at end (`169-VERSION-TABLE.md`, 19:00:38Z). |
| DEPS-02 | Complete | SATISFIED | Group-0 refresh `27a209c99`. No new `resolutions` entry (root `resolutions` is now `null`) and no `packageExtensions`. The `braces` row hand-added in `c97bc9898` was dropped in 169-13 because `braces` left the tree (`yarn why` empty per EVIDENCE § 6). |
| DEPS-03 | Complete | SATISFIED | Yarn: `packageManager yarn@4.18.1`, `engines.yarn "4.18"`, `yarnPath yarn-4.18.1.cjs`, 9 CI `version: 4.18`. Node: 10 CI pins `24.21.0`; the negative control rejects `22.x` and accepts `24.21.0`; `FROM node:24-alpine`; both `engines.node ">=24.15.0"`. `@types/node` is ^24.19.0 via the catalog in 5 workspaces. TS is 6.0.3. Node commit `77d3ce8bf`: 8 files, no lockfile. Its own gate run (`169-02-node24-r2` 12/12), image build plus smoke (200 on `/`), E2E `169-02-node24` 171/171, and CI run 37115289953 at 12/12 are all recorded. |
| DEPS-04 | Complete | SATISFIED | `eslint-plugin-import-x` ^4.17.1 with the four rules under `import-x/` in `packages/shared-config/eslint.config.mjs`. The planted-violation proof fired 4/4 before and after, with negative controls (EVIDENCE § 5). ESLint 10.11.0 and `@eslint/js` 10.0.1. The flag and FlatCompat are gone (grep shows nothing). `eslint-plugin-svelte` ^3.23.0 via the catalog. Prettier and sort plugin majors each have a reformat commit. |
| DEPS-05 | Complete | SATISFIED | Kit 2.70.3, adapter-node 5.5.7, adapter-static 3.0.10. Both apps take `vite` / `vitest` / `@sveltejs/vite-plugin-svelte` / `eslint-plugin-svelte` / `@sveltejs/kit` as `catalog:`. `apps/frontend/vite.restartOnRootEnv.ts` is wired at `vite.config.ts:26`, with unit tests 6/6 and a live restart probe plus negative control on Vite 6 and 8 (EVIDENCE § 5). Visual runs `169-05-visual{,-final}` exist, and the `e2e-visual` CI job is green. |
| DEPS-06 | Complete | SATISFIED | One Vitest 5.0.2 via the catalog, docs included. `vitest.workspace.ts` is deleted, and `vitest.config.ts` has `test.projects` (the same `packages/*` set as before). Per-workspace counts before and after are equal across 11 workspaces (EVIDENCE § 6). jsdom 30.1.1 and isomorphic-dompurify 4.4.0, with root `resolutions` gone. Playwright 1.63.0, and `visual-container.sh` pins the 1.63.0-noble digest. Tailwind 4.3.3 and DaisyUI 5.7.46. |
| DEPS-07 | Complete | SATISFIED | Catalog `supabase: ^2.118.0` and six `setup-cli` `version: 2.118.0`. `database.ts` was regenerated in `cb14c57d2`, and `db:types` showed no diff on PG17. It contains no pgTAP helper names (PROH-169-14), and CI `supabase-types-drift` is green. supabase-js 2.117.2 and ssr 0.12.7. Auth gates and bank-auth 3× are recorded at 169-07 (see the warning). |
| DEPS-08 | Complete | SATISFIED | `config.toml` has `major_version = 17` with the hosted-must-match comment. Clean reset, `show server_version` 17.6 (artifact plus live check), pgTAP 1335 including the census file, `db:types` no diff, and the PG15-validity constraint stated. Hosted upgrade todo `2026-10-03-upgrade-hosted-postgres-to-17.md` is filed, with the in-place `IMMUTABLE` → `STABLE` caveat and the local `stop --no-backup` step. The bank-auth-on-PG17 obligation comes from D-14, not from DEPS-08's text; see the warning. |
| **DEPS-09** | **Pending** | **BLOCKED (honestly recorded)** | supabase-js `npm:@supabase/supabase-js@2.117.2` ×3 and `npm:jose@6.2.12` are exact; no `@2`, `deno.land/x` or `esm.sh` import remains (PROH-169-15). Function vitest suites are green, and bank-auth 3× was green at `cce9b5b16`. The audit-blind-spot todo is filed. **But `send-email/index.ts:2` still imports `npm:nodemailer@6.9.10`** (6 high advisories), held until 2026-10-04T07:51Z. The REQUIREMENTS.md row and the 169-13 SUMMARY both say Pending for this reason only. |
| DEPS-10 | Complete | SATISFIED | faker 10.6.0 as its own commit (`5c338398f`). The seed diff for `default` and `e2e/base` is recorded (EVIDENCE § 6). No PNG snapshot changed in the phase (`git diff --stat 5ed82f437 HEAD -- '*.png'` empty). |
| DEPS-11 | Complete | SATISFIED | `packages/llm`: `ai` ^7.0.116, `@ai-sdk/google` ^4.0.82, `@ai-sdk/openai` ^4.0.78. `openai` and `jsonrepair` are removed (`yarn why` empty). No validation loosening in the diff (PROH-169-18): the usage-shape migration only. |
| DEPS-12 | Complete | SATISFIED (hold branch) | concurrently 10, lint-staged 17, changesets 3 + changelog-github 1, glob 13, js-yaml 5 and globals 17 each landed in their own commit. `@types/cheerio` is removed. No catalog entry is consumer-less. dotenv 18 and intl-messageformat 12 are held by the 30-day rule, with ranges not widened (^17.3.1 / ^11.1.3) and a dated todo. The requirement text admits "held with a reason". |
| DEPS-13 | Complete | SATISFIED | checkout, setup-node and upload-artifact are at v7, paths-filter at v4, setup-cli at v3, changesets/action at v2, configure-pages at v6, upload-pages-artifact and deploy-pages at v5, all on major tags. trufflehog is exact at `v3.97.9` (PROH-169-20). CI run 37144076939 has 12/12 jobs `success`. `release.yml` and `docs.yml` are recorded as unobservable until merge, with a todo. `dependabot.yml` is unchanged (`git diff --exit-code` exit 0). |
| DEPS-14 | Complete | SATISFIED (hold branch) | Kit 3 was not installed (2.70.3). The HOLD-AGE verdict is in EVIDENCE § 1, with todo `2026-10-03-sveltekit-3-held-by-the-age-rule.md` (re-check 2026-10-31T17:24:31Z). |
| DEPS-15 | Complete | SATISFIED | Liveness is keyed on the exit status, with NC-1..NC-5 observed. The baseline has 0 rows with a current note. The roadmap premise is amended. 18 new todos are in `pending/` and the Dependabot and nodemailer todos are updated. |
| DEPS-16 | Complete | SATISFIED | See SC4. Every listed gate is in `169-gates.sh`'s 12, plus pgTAP and full E2E on PG17 after a clean reset, on `be000f31a`. |

**Requirements score:** 15/16 satisfied. DEPS-09 is open and is correctly marked Pending, not Complete. No requirement marked Complete was found unsatisfied.

### Operator rulings of 2026-10-03: applied exactly as scoped?

| Ruling | What was allowed | What the codebase shows | Verdict |
| --- | --- | --- | --- |
| R1: local PG17, `is_valid_choice_id` STABLE (overrules PROH-169-12 for that one fix) | one volatility fix | The phase diff on `migrations/`, `schema/` and seed is exactly two one-word edits, `IMMUTABLE` → `STABLE` on that function, in `011-validation-functions.sql` and `00001_initial_schema.sql`. The only other file in that path set is a formatting-only change to `buildMinimal.test.ts`. Live `pg_proc.provolatile` = `s`. | Exactly as scoped |
| R2: ESLint 10 with three one-line `no-useless-assignment` disables citing eslint-plugin-svelte#1478, plus a removal todo (overrules PROH-169-07 for those lines only) | three lines | Three hits, in `OpinionQuestionInput.svelte:50`, `Video.svelte:132` and `EntityList.svelte:45`. Each is `eslint-disable-next-line` and names the issue URL. No other added disable exists (the `import-x/first` lines are renames). No rule config was turned off. Todo `2026-10-03-remove-bindable-no-useless-assignment-disables.md` is pending with the three sites and a re-check trigger. | Exactly as scoped |
| R3: drawer focus return wired | the fix | `Header.svelte:28` has `drawerOpenElement = $bindable()` and `bind:this` at :92. `Layout.svelte:43` declares `$state`, binds at :85, and calls `drawerOpenElement?.focus()` at :61. `Layout.svelte.test.ts` covers both close paths; this verifier re-ran it at 2/2. | Applied, behaviour test-proven |
| R4: Vite 8 default browser floor | no override | No `build.target` in either vite config, and the phase diff of both configs is only the restart-plugin swap. | Applied |
| Yarn 4.18 `enableScripts: false` plus a `dependenciesMeta.built` allow-list | esbuild, supabase, unrs-resolver | `.yarnrc.yml` `enableScripts: false`. Root `dependenciesMeta` = exactly `esbuild`, `supabase`, `unrs-resolver`. POS/NEG controls recorded (`YN0004` when removed). | Exactly as scoped |
| Legitimacy approvals A/B/C | import-x + unrs-resolver; the supabase CLI platform packages; `sv` | A and B were used. C was not exercised, because Kit 3 is held. | Within scope |

### Prohibitions (PROH-169-01..24)

None of the 24 was violated outside the ruled scope.
- 01: no `resolutions`, `packageExtensions` or peer override.
- 02: the braces row was a 9-line hand edit, not `--update-baseline`.
- 03: `npmPreapprovedPackages` is `[]`, and the table resolves every package at or below its target.
- 04: the Node commit is isolated.
- 05: no TS suppression was added.
- 06: the ci-evidence trees hold 0 `.planning` paths.
- 07: only the three R2 lines.
- 08: the docs-RQ gate is 0.
- 09: no skip, todo or delete; counts are equal.
- 10 and 17: no snapshot change.
- 11: no Rolldown override.
- 12: only R1.
- 13: no `.temp/project-ref`, so the project was never linked.
- 14: `database.ts` is clean.
- 15: no floating Deno import.
- 16: nodemailer was not taken below 10.0.6. The task waits, which is compliant, but it is the cause of the DEPS-09 gap.
- 18: no validation loosening.
- 19: held ranges are not widened.
- 20: Actions are on major tags, and trufflehog is exact.
- 21: `dependabot.yml` is unchanged.
- 22: Kit 3 is absent.
- 23: `accepted: []`.
- 24: every hold maps to a pending todo (see the table below).

### Known open items: are they honestly recorded?

| Item | Recorded where | Dated trigger | Honest? |
| --- | --- | --- | --- |
| nodemailer 10 Edge pin (DEPS-09) | REQUIREMENTS.md DEPS-09 row (Pending, with reason); traceability `Pending`; todo `…-nodemailer-10-edge-pin-held-until-2026-10-04.md` (resume steps); 169-13 SUMMARY | 2026-10-04T07:51Z | Yes |
| Kit 3 / adapter-node 6 / adapter-static 4 | DEPS-14 row; todo `…-sveltekit-3-held-by-the-age-rule.md` | 2026-10-31T17:24:31Z | Yes |
| dotenv 18, intl-messageformat 12 | DEPS-12 row; todo `…-dotenv-18-and-intl-messageformat-12-held.md` | 10-17T21:18Z / 10-15T12:27Z | Yes |
| TypeScript 7 | todo `…-typescript-7-held.md` | peers admitting 7 | Yes |
| 7-day holds (types/node, ai family, typescript-eslint, turbo, vitest, daisyui, supabase CLI, vite, globals, eslint) | todo `…-age-held-majors-recheck.md`; § 3 | 10-04 … 10-09 | Yes |
| Deno imports invisible to `audit:deps` | todo `…-deno-edge-imports-invisible-to-audit-deps.md`; baseline note; Dependabot todo | — | Yes |
| Hosted PG17, Render Node 24, release/docs workflows unobservable | todos filed | operator / post-merge | Yes |

### Key Links

| From | To | Status | Details |
| --- | --- | --- | --- |
| `scripts/assert-dependency-audit.mjs` | `scripts/lib/audit-run.mjs` | WIRED | Imported at :73 and called at :190. The shape test loads the same module. |
| `apps/frontend/vite.config.ts` | `vite.restartOnRootEnv.ts` | WIRED | Imported and registered at :26 with `apply: 'serve'`. |
| `.yarnrc.yml` catalog | both apps and all packages | WIRED | Every shared dependency is `catalog:`, and every catalog entry has at least one consumer. |
| `Layout.svelte` `closeDrawer()` | `Header.svelte` menu button | WIRED | `$bindable` plus `bind:drawerOpenElement`, with the behaviour test green. |
| `config.toml` `major_version` | local DB image | WIRED | `postgres:17.6.1.171` is running; server 17.6. |
| setup-cli pins / catalog `supabase` | one CLI version | WIRED | 2.118.0 at all seven sites. |

### Anti-Patterns Found

No `TBD`, `FIXME`, `XXX`, `TODO` or `HACK` appears on any added line in the 139 changed source files. No stubs.

| File | Pattern | Severity | Impact |
| --- | --- | --- | --- |
| `apps/supabase/supabase/schema/104-nominations.sql:74`, `300-auth-tables.sql:22` (and their copies in `00001_initial_schema.sql`) | Comment "It needs PostgreSQL 15, which `supabase/config.toml` declares" | Info | Stale wording: config.toml now declares 17. The minimum (15) is still correct. A schema-only edit would break schema-migration parity, and the migration is under PROH-169-12. Fold it into the next migration-touching change. |
| `.planning/ROADMAP.md` § Phase 169 | Success criteria still headed "(draft, to be firmed at planning)" | Info | Cosmetic. Criterion 3 itself was amended. |
| `.planning/phases/169-…/.continue-here.md`, `.planning/HANDOFF.json` | Leftover handoff files | Info | Per the known GSD quirk, stale handoff files can block the next `/gsd-progress --next`. Clear them at `phase.complete`. |

### Human Verification Required

None for the verified truths. The two open items are actions, not judgment calls. One is the nodemailer pin after its trigger. The other is a bank-auth 3× run on PG17, or an explicit operator waiver of that D-14 gate.

### Gaps Summary

1. **DEPS-09 (BLOCKER for full completion, time-boxed).** `send-email` still runs `nodemailer` 6.9.10, which has 6 high advisories, on a production path. The hold is legitimate under D-03 and PROH-169-16 ("the task waits"), and it is honestly recorded everywhere it should be. The requirement is still unmet and no later phase owns it. Closing it is a quick task after 2026-10-04T07:51Z, following the todo's resume steps.
2. **D-14 bank-auth 3× on PG17 (WARNING).** The Postgres 17 move was deferred past 169-07 and only landed with the operator rulings. As a result, the bank-auth determinism runs (identity-callback and the full self-registration journey) were only ever executed on PG15. Every PG17 E2E run used the default suite, which contains no bank-auth project, and no waiver is recorded. The PG17 change itself is one volatility label, so the risk is low. The remedy costs little and fits into the nodemailer quick task.

Everything else holds up against the codebase. All four roadmap criteria are verified. 15/16 requirements are satisfied with artifacts on disk, every operator ruling was applied exactly as scoped and no further, and no prohibition was violated outside the rulings.

### Limits of this verification (not gaps)

- The gate set, pgTAP and the full E2E suite were not re-run. They are taken from the run artifacts above. Their `head` / `env.txt` records match `be000f31a`, and HEAD carries the same code.
- The per-commit claims (one upgrade per commit, lockfile confined to its subtree, seed-diff contents, build-output diff) are taken from EVIDENCE § 6 and spot-checked through the commit list. The lockfile subtree confinement was not re-derived per commit.
- PROH-169-13 (no remote push) is supported by the absence of a linked project ref, not proven.
- The version table is a 2026-10-03T19:00Z snapshot. Several 7-day holds clear on 10-04 … 10-09 by design.

---

_Verified: 2026-10-03_
_Verifier: Claude (gsd-verifier)_
