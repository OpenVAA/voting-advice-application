---
phase: "186"
slug: "deployed-smoke-entry"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-15"
---

# Phase 186 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: `186-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 5.0.2 (harness unit tests); Playwright 1.63.0 (deployed smoke and local E2E) |
| **Config file** | `tests/vitest.config.ts` (include `tests/utils/**/*.test.ts`); `tests/playwright.deployed.config.ts` (new) |
| **Quick run command** | `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"; node_modules/.bin/vitest run --config tests/vitest.config.ts deployed` |
| **Full suite command** | `yarn lint:check && yarn format:check && yarn test:unit`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/186-close-<ts> --no-db-reset` |
| **Estimated runtime** | ~10 seconds (quick); full local E2E ~18 minutes |

---

## Sampling Rate

- **After every task commit:** quick run command, plus `node_modules/.bin/eslint tests/deployed-global-setup.ts tests/tests/deployed tests/tests/utils/deployedTarget.ts` and `yarn typecheck:tests`
- **After every plan wave:** `yarn test:unit` (stack up) and, once the specs exist, the hosted voter run
- **Before `/gsd-verify-work`:** lint, format and unit all exit 0; the SC4 diff is empty and the local `--list` count unchanged (`Total: 548 tests in 127 files`); one full `e2e-run.sh` run is green (a void run is repeated); after the operator checkpoint, the full deployed smoke run is green
- **Max feedback latency:** 30 seconds (unit); E2E per its own runtime

---

## Per-Task Verification Map

Filled by the planner per task. The requirement → test map:

| Req / SC | Behavior | Test Type | Automated Command | File Exists |
|----------|----------|-----------|-------------------|-------------|
| SUPA-09 | ref check refuses every ref but the tfvars one; no input widens it; missing or unparsable env block fails closed | unit | `node_modules/.bin/vitest run --config tests/vitest.config.ts deployedTarget` | ❌ W0 |
| SUPA-09 | project-id check: absent attribute, placeholder, other id all fail | unit | same | ❌ W0 |
| SUPA-09 / PIPE-07 | SHA check: unset, short, upper-case, mismatched, non-200 health all fail; an exact match passes | unit | same | ❌ W0 |
| SUPA-09 | gate refuses a set `SUPABASE_SERVICE_ROLE_KEY`; all checks are evaluated and printed even when the first fails | unit | same | ❌ W0 |
| PIPE-07 (SC3) | no `DEV_SEED_ALLOW_REMOTE` / `allow-remote` / `allowRemote` in workflows or the smoke entry; one project, no dependencies, no setup/teardown; the value-import closure reaches no admin client | unit | `node_modules/.bin/vitest run --config tests/vitest.config.ts deployedSmokeGuards` | ❌ W0 |
| SC3 | the ESLint rule fires on a planted value import, not on a type import | lint (seen failing) | `node_modules/.bin/eslint tests/tests/deployed; echo "eslint_exit=$?"` | procedure |
| SC1 voter | gate PASS ×4 against staging; voter walk to results | e2e (hosted) | `yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts; echo "smoke_exit=$?"`, then `e2e-spec-verdict.mjs <run> --passed voter.smoke.ts --no-flaky` | ❌ W0 |
| SC1 contestant | sign-in, home tasks complete, sign-out | e2e (hosted) | full `yarn test:e2e:deployed`, then `e2e-spec-verdict.mjs <run> --passed voter.smoke.ts --passed contestant.smoke.ts --no-flaky` | after the checkpoint |
| SC2 | wrong SHA, wrong project id, not the dedicated project → non-zero, each with its FAIL line | e2e (controls) | three runs, `echo "smoke_exit=$?"` each | procedure |
| SC4 | local gate files byte-identical; `--list` unchanged; full local suite green | git + list + e2e | `git diff --exit-code a7a4222a8 -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts`; `--list` total; `tests/scripts/e2e-run.sh` exit 0 | existing |
| grant SQL | exit 0 on the first and second run with `grants=1 terms=1`; exit 3 on an unknown address, an unset variable, or a candidate with another editor | integration (isolated instance) | driver script, statuses read directly | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/utils/deployedTarget.ts` + `deployedTarget.test.ts`
- [ ] `tests/tests/utils/deployedSmokeGuards.test.ts`
- [ ] `tests/playwright.deployed.config.ts`, `tests/deployed-global-setup.ts`, root script `test:e2e:deployed`
- [ ] `tests/tests/deployed/voter.smoke.ts`, `contestant.smoke.ts`
- [ ] `infra/scripts/grant-smoke-contestant.sql` + isolated-instance driver

No framework install: vitest and Playwright are present.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| One-time hosted contestant creation (user, grant, terms, readback, keychain) | SUPA-09 / SC1 | A write to the persistent hosted project with the operator's keychain credentials; operator-approved checkpoint (CONTEXT D-02) | The `autonomous: false` final plan's runbook steps |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
