---
phase: 190
slug: multi-deployment-bootstrap
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-11-24
---

# Phase 190 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: 190-RESEARCH.md § Validation Architecture; decisions in 190-CONTEXT.md.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (`infra/vitest.config.ts`, `tests/vitest.config.ts`); Terraform 1.16.5 `terraform test` (`*.tftest.hcl`); actionlint 1.7.12 container |
| **Config file** | existing; new `infra/bootstrap/tests/deployments.tftest.hcl` |
| **Quick run command** | `yarn test:unit:infra <file-filter>` plus `terraform fmt -check -recursive infra` |
| **Full suite command** | `terraform fmt -check -recursive infra && infra/scripts/terraform-checks.sh validate && infra/scripts/terraform-checks.sh test-modules && infra/scripts/terraform-checks.sh plan-examples && yarn test:unit:infra && yarn test:unit:tests && yarn lint:workflows && yarn lint:check && yarn format:check` |
| **Move proof** | `infra/scripts/check-bootstrap-moves.sh --base 46554181e` |
| **Estimated runtime** | ~10 s quick; ~5 min full (without E2E) |

---

## Sampling Rate

- **After every task commit:** quick command for the touched files
- **After every plan wave:** full suite command
- **Phase gate:** full suite green, move proof green, the operator's live move plan through the plan guard, then one full E2E run judged against the last full run of this tree
- **Baseline, not a verdict:** `yarn test:unit:infra` has 6 host-only failures in `workflow-errexit.test.ts` (accepted at the Phase 191 close); plans must not add to them
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

Filled in by the planner; task ids follow `190-NN-TT`. Proposed requirement ids INFRA-21..24, PIPE-13/14 (see research).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Terraform 1.16.5 in a temp dir (checksum verified, untracked); record the `workflow-errexit` baseline
- [ ] `infra/bootstrap/tests/deployments.tftest.hcl` — two-entry isolation, staging name pins
- [ ] `infra/scripts/check-bootstrap-plan.sh` + test with fixture plan JSONs (clean move, replace, delete, stray create)
- [ ] `infra/scripts/check-bootstrap-moves.sh` (base archive, scratch copy, harness, guard)
- [ ] `infra/scripts/resolve-deployment.sh` + test
- [ ] `terraform-checks.sh` runs the bootstrap tests, with its test and an `infra-plan.yml` step

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live move plan: 0 add, 0 change, 0 destroy, N moved | INFRA-22 | Needs AWS credentials for account 471112560111 | Operator runs the runbook's plan of `infra/bootstrap`, pipes `terraform show -json` through `check-bootstrap-plan.sh` |
| Downstream OIDC subject form on GitHub Free (no environments) | PIPE-13 | Needs a token minted in the private downstream | Operator runs a probe job in `OpenVAA/deploy-nuortenvaalikone` that prints its token's `sub`; the entry's subjects are edited to match |
| Applies 1 (move) and 2 (policy tightening) | INFRA-22, INFRA-23 | Live account | Operator applies through the guard, in that order |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
