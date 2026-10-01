---
phase: "169"
slug: "dependency-bump-to-latest-safe-versions"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-01"
---

# Phase 169 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (catalog `^3.2.4` at start → one major through the catalog in 169-04); Playwright 1.58 → 1.63 (E2E via `tests/scripts/e2e-run.sh`); pgTAP via `supabase test db`; repository guards as Vitest specs in `packages/dev-seed/tests/` |
| **Config file** | `packages/*/vitest.config.ts`, `apps/frontend/vitest.config.ts`, `apps/supabase/vitest.config.ts`, `apps/docs/vite.config.ts`, root `vitest.workspace.ts` (→ root `vitest.config.ts` in 169-04), `tests/playwright.config.ts`, `apps/supabase/supabase/tests/database/*.test.sql` |
| **Quick run command** | the task's own `<automated>` command (narrowest gate for that upgrade); `yarn test:unit` for a repo-wide unit check |
| **Full suite command** | `bash .planning/phases/169-dependency-bump-to-latest-safe-versions/169-gates.sh <label>` (twelve D-26 gates, `TURBO_FORCE=true`, statuses read directly) and `bash .planning/phases/169-dependency-bump-to-latest-safe-versions/169-e2e.sh <label>` (one preflight-confirmed full E2E run) |
| **Estimated runtime** | per-task commands 1–5 min; gate runner ~25 min; full E2E ~12 min; bank-auth 3× ~35 min |

---

## Sampling Rate

- **After every task commit:** the task's `<automated>` command (each followed by its `<fails_when>`).
- **After every plan (= D-25 group):** `169-gates.sh 169-NN-<group>`; plus `169-e2e.sh` after 169-01 (attribution for the Node move), the Node 24 commit (169-02), 169-04, 169-05, both halves of group 5 (169-06 twice, 169-07), 169-08, 169-09 and 169-12 if Kit 3 lands; pgTAP twice in 169-06; bank-auth 3× in 169-07.
- **Before `/gsd-verify-work`:** 169-13 Task 3 — twelve gates, pgTAP + SQL lint on Postgres 17, and the full E2E suite after a clean `db:reset`, all on one HEAD.
- **Max feedback latency:** a per-task command answers within ~5 minutes; no three consecutive tasks lack an automated check.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 169-01-01 | 01 | 1 | DEPS-01 | T-169-01 | A version younger than 7 days is refused at resolution | config + probe + gates | `yarn config get npmMinimalAgeGate` (= 10080); `169-gates.sh 169-01-baseline` (all 0 but `10-audit` = 1) | ❌ W0 (runners and probe created here) | ⬜ pending |
| 169-01-02 | 01 | 1 | DEPS-15 | T-169-02, T-169-03 | A failed audit is exit 2, never a pass, in gate and `--update-baseline` | unit + negative control | `yarn workspace @openvaa/dev-seed vitest run tests/auditBaselineShape.test.ts`; blocked-registry run → exit 2 | ❌ W0 (`scripts/lib/audit-run.mjs` created here) | ⬜ pending |
| 169-01-03 | 01 | 1 | DEPS-02 | T-169-01 | Refresh obeys the age gate; no `resolutions` added | gates + E2E | `169-gates.sh 169-01-group0`; `169-e2e.sh 169-01-group0` | ✅ | ⬜ pending |
| 169-02-01 | 02 | 2 | DEPS-03 | T-169-06 | Yarn release fetched only at ≥ 7 days; sha recorded | install + gate tests + image build | `yarn install --immutable` + three dev-seed gate tests; `docker build … --target production` | ✅ | ⬜ pending |
| 169-02-02 | 02 | 2 | DEPS-03 | T-169-05, T-169-07, T-169-08 | Engine floor rejects Node < 24.15; evidence push leaks no `.planning` | guard + gates + smoke + E2E + CI | `node scripts/assert-node-engine.mjs --self-test`; `169-gates.sh 169-02-node24`; `169-e2e.sh 169-02-node24` | ✅ | ⬜ pending |
| 169-02-03 | 02 | 2 | DEPS-03 | T-169-SC | No `ignoreDeprecations` / `@ts-ignore` added | gates + CI read | `169-gates.sh 169-02-group1`; `gh run view <id> --json jobs` | ✅ | ⬜ pending |
| 169-03-01 | 03 | 3 | DEPS-04 | T-169-09, T-169-10 | Four import rules still fire after the plugin swap | planted negative control | `bash 169-planted-import-rules.sh import-x`; `TURBO_FORCE=true yarn lint:check` | ❌ W0 (`169-planted-import-rules.sh` created here) | ⬜ pending |
| 169-03-02 | 03 | 3 | DEPS-04 | T-169-09, T-169-11 | No rule silently dropped; guard tests still bind | lint + guard tests + planted control | `TURBO_FORCE=true yarn lint:check && yarn workspace @openvaa/frontend vitest run src/lib/_guards/ && bash 169-planted-import-rules.sh import-x` | ✅ | ⬜ pending |
| 169-03-03 | 03 | 3 | DEPS-04 | T-169-SC | ResearchQuote spans unchanged by reformats | gates | `169-gates.sh 169-03-group2` | ✅ | ⬜ pending |
| 169-04-01 | 04 | 4 | DEPS-06 | T-169-13 | No unit test silently stops running | unit + count comparison | `TURBO_FORCE=true yarn test:unit`; per-workspace before/after count script | ✅ | ⬜ pending |
| 169-04-02 | 04 | 4 | DEPS-06 | T-169-12 | Sanitiser output still safe on DOMPurify 4 / jsdom 30 | unit + build | `yarn workspace @openvaa/frontend test:unit && yarn workspace @openvaa/frontend build` | ✅ | ⬜ pending |
| 169-04-03 | 04 | 4 | DEPS-06 | T-169-14 | Visual image pinned by digest from the official registry | visual + gates + E2E | `tests/scripts/visual-container.sh --run-dir …`; `169-gates.sh 169-04-group4`; `169-e2e.sh 169-04-group4` | ✅ | ⬜ pending |
| 169-05-01 | 05 | 5 | DEPS-05 | T-169-16 | Restart plugin is serve-only and never reads `.env` contents | unit + live probe | `yarn workspace @openvaa/frontend vitest run vite.restartOnRootEnv.test.ts && bash 169-restart-probe.sh 169-05-t1-restart` | ❌ W0 (test and probe created here) | ⬜ pending |
| 169-05-02 | 05 | 5 | DEPS-05 | T-169-17 | Kit body-size advisory closed | check + build | `yarn workspace @openvaa/frontend check && yarn workspace @openvaa/docs check && TURBO_FORCE=true yarn build` | ✅ | ⬜ pending |
| 169-05-03 | 05 | 5 | DEPS-05 | T-169-15 | Bundler change measured; no hidden overrides | probe + visual + gates + E2E | `bash 169-restart-probe.sh 169-05-t3-restart`; visual; `169-gates.sh 169-05-group3`; `169-e2e.sh 169-05-group3` | ✅ | ⬜ pending |
| 169-06-01 | 06 | 6 | DEPS-07 | T-169-18, T-169-21 | RLS and the anon-exposure census unchanged on new service images | pgTAP + lint + gate test + E2E | `yarn workspace @openvaa/supabase test:db && yarn db:lint:sql && yarn workspace @openvaa/dev-seed vitest run tests/rpcNullabilityGate.test.ts`; `169-e2e.sh 169-06-cli` | ✅ | ⬜ pending |
| 169-06-02 | 06 | 6 | DEPS-08 | T-169-19, T-169-20 | Server really is 17; migrations untouched (PG15-valid) | db + pgTAP + E2E + gates | `psql … -Atc 'show server_version'` (17.x); `test:db`; `db:lint:sql`; `169-e2e.sh 169-06-pg17`; `169-gates.sh 169-06-group5a` | ✅ | ⬜ pending |
| 169-07-01 | 07 | 7 | DEPS-07 | T-169-22 | Session round trips unchanged | unit + cookie guard + E2E slice | `yarn workspace @openvaa/frontend vitest run src/lib/supabase/ && yarn assert:cookie-names`; `169-e2e.sh 169-07-supabase-js --project auth-setup` | ✅ | ⬜ pending |
| 169-07-02 | 07 | 7 | DEPS-07 | T-169-22, T-169-23 | Auth-cookie responses marked uncacheable | unit (TDD) + cookie guard + check | `yarn workspace @openvaa/frontend vitest run src/lib/supabase/ && yarn assert:cookie-names && yarn workspace @openvaa/frontend check` | ✅ (cases added here) | ⬜ pending |
| 169-07-03 | 07 | 7 | DEPS-09 | T-169-24, T-169-25, T-169-26 | Exact, advisory-clean Deno pins; bank-auth intact | unit + boot + gates + E2E + bank-auth 3× | `yarn workspace @openvaa/supabase test:unit`; `169-gates.sh 169-07-group5`; `169-e2e.sh 169-07-group5`; three bank-auth `summary.json` checks | ✅ | ⬜ pending |
| 169-08-01 | 08 | 8 | DEPS-10 | T-169-28 | Seed shape unchanged; diff recorded before acceptance | unit + seed diff | `yarn workspace @openvaa/dev-seed test:unit && yarn workspace @openvaa/dev-seed typecheck` | ❌ W0 (scratch dump script created here) | ⬜ pending |
| 169-08-02 | 08 | 8 | DEPS-10 | T-169-28 | Re-baselines only with a seed trace | gates + E2E + visual | `169-gates.sh 169-08-group6 && 169-e2e.sh 169-08-group6 && visual-container.sh …` | ✅ | ⬜ pending |
| 169-09-01 | 09 | 9 | DEPS-11 | T-169-31 | Generated objects still schema-validated | unit + typecheck | llm / argument-condensation / question-info `test:unit`, frontend admin tests, `TURBO_FORCE=true yarn typecheck` | ✅ | ⬜ pending |
| 169-09-02 | 09 | 9 | DEPS-11 | T-169-SC | No importer-less dependency left | manifest + unit | dependency count check + `yarn workspace @openvaa/llm test:unit` | ✅ | ⬜ pending |
| 169-09-03 | 09 | 9 | DEPS-11 | T-169-30 | No key/config logged by migrated error paths | gates + E2E | `169-gates.sh 169-09-group7 && 169-e2e.sh 169-09-group7` | ✅ | ⬜ pending |
| 169-10-01 | 10 | 10 | DEPS-12 | T-169-SC | Root tooling runs on new majors | exercise | `yarn concurrently … && yarn lint-staged --debug` | ✅ | ⬜ pending |
| 169-10-02 | 10 | 10 | DEPS-12 | T-169-32 | dotenv prints no env values | exercise + typecheck | `yarn changeset status && yarn typecheck:tests && yarn workspace @openvaa/docs generate:docs` (+ clean status) | ✅ | ⬜ pending |
| 169-10-03 | 10 | 10 | DEPS-12 | T-169-33 | Safe YAML schema kept | gates + catalog orphan check | `169-gates.sh 169-10-group8`; catalog-orphan `node -e` | ✅ | ⬜ pending |
| 169-11-01 | 11 | 11 | DEPS-13 | T-169-35 | Official Actions at aged majors | YAML parse + CI-shape tests | workflow parse `node -e`; five dev-seed CI-shape tests | ✅ | ⬜ pending |
| 169-11-02 | 11 | 11 | DEPS-13 | T-169-34 | Release token passed as the documented input | CI-shape tests | five dev-seed CI-shape tests; `grep -q "github-token:" release.yml` | ✅ | ⬜ pending |
| 169-11-03 | 11 | 11 | DEPS-13 | T-169-36 | Evidence push leaks no `.planning` | CI read | `gh run view <id> --json status,jobs` (all success but todo-backed jobs) | ✅ | ⬜ pending |
| 169-12-01 | 12 | 12 | DEPS-14 | T-169-SC | Kit 3 untouched until it clears the age rule | verdict check | `node -e` over `12-kit3-verdict.json` (+ hold todo when held) | ❌ W0 (verdict created here) | ⬜ pending |
| 169-12-02 | 12 | 12 | DEPS-14 | T-169-37 | Operator approves before any Kit 3 install or migrator | checkpoint:decision | — (blocking human decision) | n/a | ⬜ pending |
| 169-12-03 | 12 | 12 | DEPS-14 | T-169-37, T-169-38 | Single Kit major; gates and E2E green if landed | resolution check + gates + E2E | Kit-major `node -e`; `169-gates.sh 169-12-group10 && 169-e2e.sh 169-12-group10` (when landed) | ✅ | ⬜ pending |
| 169-13-01 | 13 | 13 | DEPS-15 | T-169-39 | No REVIEW REQUIRED row; no NEW advisory accepted | gate + shape test + note form | `yarn audit:deps && … auditBaselineShape.test.ts && node -e` rationale-form check | ✅ | ⬜ pending |
| 169-13-02 | 13 | 13 | DEPS-01, DEPS-08, DEPS-09 | T-169-40 | Every hold and operator item is a pending todo | file checks | todo-existence loop + Dependabot todo `grep -q "Deno"` | ✅ | ⬜ pending |
| 169-13-03 | 13 | 13 | DEPS-16 | T-169-41 | One HEAD; full suite with reset | gates + pgTAP + E2E | `169-gates.sh 169-13-final`; `show server_version`; `test:db`; `db:lint:sql`; `169-e2e.sh 169-13-final` + provenance greps | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Created inside the plans' first tasks rather than a separate wave (the phase runs strictly in sequence):

- [ ] `.planning/phases/169-…/169-gates.sh`, `169-e2e.sh`, `169-version-probe.mjs`, `169-EVIDENCE.md` — 169-01 Task 1
- [ ] `scripts/lib/audit-run.mjs` + the liveness cases in `auditBaselineShape.test.ts` — 169-01 Task 2 (TDD, red first)
- [ ] `169-planted-import-rules.sh` (planted fixtures are scratch, never committed) — 169-03 Task 1
- [ ] `apps/frontend/vite.restartOnRootEnv.test.ts` + `169-restart-probe.sh` — 169-05 Task 1 (TDD, red first)
- [ ] Build-output capture (`05-build-before.txt` / `-after.txt`) — 169-05 Tasks 2–3
- [ ] Seed dump script `tests/e2e-runs/169-08-faker/dump-seed.ts` (gitignored scratch) — 169-08 Task 1
- [ ] Cookie-adapter header cases in `server.test.ts` — 169-07 Task 2 (TDD, red first)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Land or hold SvelteKit 3 | DEPS-14 | D-32 makes it an operator checkpoint | 169-12 Task 2 `checkpoint:decision`; reply `land-with-sv`, `land-by-hand` or `hold` |
| Package legitimacy of new direct names (`eslint-plugin-import-x`, Supabase CLI platform packages, `sv`) | DEPS-04, DEPS-07, DEPS-14 | The legitimacy gate requires a human; collected once in a checkbox doc | Tick boxes A/B/C in `169-LEGITIMACY-APPROVALS.md`; an unticked box halts the install task as a blocking human checkpoint |
| Production Node 24 on Render; hosted Postgres 17; `release.yml` / `docs.yml` first `main` runs | DEPS-03, DEPS-08, DEPS-13 | Outside the repository and unobservable before merge | Pending todos filed by 169-13; operator follow-ups listed in the 169-02, 169-06, 169-11 and 169-13 summaries |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency within the stated per-task bound
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
