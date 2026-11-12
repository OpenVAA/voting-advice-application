---
phase: "185"
slug: "aws-frontend-stack-first-apply-by-hand"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-12"
---

# Phase 185 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (frontend `vitest run`; infra `infra/vitest.config.ts`); Terraform `fmt`/`validate`; Node `assert:*` guards; Playwright E2E |
| **Config file** | `apps/frontend/vitest.config.ts`, `infra/vitest.config.ts`, `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit -- src/routes/api/diagnostics src/lib/server/startup` |
| **Full suite command** | `yarn lint:check && yarn test:unit`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/185-final --no-db-reset` |
| **Estimated runtime** | ~30 seconds (quick); full suite several minutes |

---

## Sampling Rate

- **After every task commit:** the quick vitest command for touched files, plus `terraform fmt -check` / `validate` for touched roots
- **After every plan wave:** `yarn lint:check` (includes the IAM guard) and `yarn test:unit` (needs the local stack up)
- **Before `/gsd-verify-work`:** a full green, non-void E2E run after the last code change
- **Max feedback latency:** 60 seconds (quick command)

---

## Per-Task Verification Map

Filled in by the planner/executor against the plans. Seed rows from research:

| Requirement | Behavior | Test Type | Automated Command | File Exists | Status |
|-------------|----------|-----------|-------------------|-------------|--------|
| INFRA-05 / OBS-08 / D-13 | JSON task env ⊇ `REQUIRED_ENV`, ⊆ `.env.example` names, no service-role key | unit | `yarn workspace @openvaa/frontend test:unit -- taskEnvironment` | ❌ W0 | ⬜ pending |
| OBS-04 / D-06 | Allow-list adds `cloudfront-viewer-address`, `x-amz-cf-id`; never echoes the origin secret header or a cookie | unit | `yarn workspace @openvaa/frontend test:unit -- src/routes/api/diagnostics` | ✅ extend | ⬜ pending |
| INFRA-09 / D-16 | SIGTERM and `sveltekit:shutdown` each produce one line at an emitted level, once | unit | `yarn workspace @openvaa/frontend test:unit -- shutdown` | ❌ W0 | ⬜ pending |
| INFRA-02 / INFRA-11 | No inline IAM; no non-local module source | guard | `yarn assert:no-inline-iam-policies` | ✅ | ⬜ pending |
| INFRA-10 / INFRA-19 | `fmt` + `validate` of both aws roots, lock files with linux hashes | static | `terraform fmt -check -recursive infra` + per root `init -backend=false -lockfile=readonly` + `validate` | ✅ | ⬜ pending |
| Regression | App unchanged for users | E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/185-final --no-db-reset` | ✅ | ⬜ pending |

Plan-to-check map (planner, 2026-11-12):

| Plan / Task | Requirement | Automated check |
|-------------|-------------|-----------------|
| 185-01 T2–T3 | INFRA-11, INFRA-05 | bootstrap + module `init -backend=false -lockfile=readonly` + `validate`; `node scripts/assert-no-inline-iam-policies.mjs` and `--self-test` |
| 185-02 T1–T2 | INFRA-05, OBS-08 | `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/taskEnvironment.test.ts`; red runs with `TASK_ENVIRONMENT_SPEC` |
| 185-03 T1–T3 | INFRA-09, OBS-04 | `yarn workspace @openvaa/frontend test:unit src/lib/server/shutdown/shutdownLog.test.ts`, `... src/routes/api/diagnostics`; built-server record; `e2e-run.sh --project voter-journey` + `e2e-spec-verdict.mjs --no-flaky` |
| 185-04, 185-06 | INFRA-02..14 (code) | `terraform -chdir=infra/modules/frontend-service test` (mock providers) + root `validate` |
| 185-05 T1–T2 | INFRA-01, INFRA-09 | `node_modules/.bin/vitest run --config infra/vitest.config.ts build-push-image` / `request-loop` |
| 185-07 T2 | INFRA-10 | CI-equivalent loop: `fmt -check -recursive`, every root `validate`, every module `test` |
| 185-08 T3 | OBS-08 | the guard over the runbook table and both AWS roots' tfvars |
| 185-10, 185-21 | all code | `yarn lint:check`, `yarn format:check`, `yarn test:unit`; 185-21 adds the full E2E run |
| 185-11..185-20, 185-22 | hosted behaviours | record-line greps over `evidence/185-NN-*.md` (manual-only by design, each with its exit status) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts` — the D-13 guard
- [ ] `apps/frontend/src/lib/server/<shutdown module>.test.ts` — the D-16 lines
- [ ] Extend `apps/frontend/src/routes/api/diagnostics/server.test.ts` for the two new names and the secret header's absence
- [ ] `infra/envs/staging/aws/README.md` runbook with "Not yet observed" / "Observations" (D-24)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hosted behaviours of the applied stack (HTTPS, redirect, cert, rollback, SIGTERM, autoscaling, CDN caching, logs, destroy/reapply, cost tags/estimate) | INFRA-01, 03, 04, 06–09, 12–14, SUPA-12, OBS-10 | Observed on the applied AWS stack, by design | Runbook steps in `infra/envs/staging/aws/README.md`, each with exit status and evidence file |
| Invitation mail via real SMTP arrives with staging origin and signs in | OBS-06 | Requires reading a real mailbox | Runbook step; record observation with date |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
