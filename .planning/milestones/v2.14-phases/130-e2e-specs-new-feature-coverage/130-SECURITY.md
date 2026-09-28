---
phase: 130
slug: e2e-specs-new-feature-coverage
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-19
---

# Phase 130 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| none new | Test-only phase: probe/fixture/spec code drives the same public voter UI and existing authenticated candidate UI a browser user drives; 130-06 is run-discipline only (environment orchestration, no code). No new product attack surface, no package installs, no secrets. | Synthetic seed identities and marker strings only — no real PII, credentials, or tokens |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-130-01 | Tampering | test fixtures/specs | low | accept | Specs-only phase; all changed files live under `tests/` (fixtures, specs, utils, playwright config — verified via git file list); fixtures use synthetic seed identities only, no real PII/tokens introduced | closed |
| T-130-02 | Information Disclosure | test constants | low | accept | `MULTIPLE_TEXT_ANSWERS` values are synthetic bracket-token marker strings (`[MULTITEXT-1] First list value.` etc. in `tests/tests/utils/candidateJourneyConstants.ts:101`); no real PII/emails/tokens | closed |
| T-130-03 | Tampering | voter-journey.spec.ts | low | accept | Specs-only; no-re-baseline prohibition upheld — 130-06 SUMMARY "Prohibitions — Verified" confirms no skip/flaky annotations, no retries-until-green, no re-baselining across the gate window | closed |
| T-130-04 | Denial of Service | serial project DAG | low | accept | Two added leaf projects extend suite wall-clock by ~2 walks, mirroring the accepted voter-dark-mode/mobile precedent; absorbed by the D-05 gate (3× full-suite runs completed at ~10.9m each) | closed |
| T-130-05 | Tampering | candidate-journey.spec.ts | low | accept | Specs-only; no-product-patch prohibition upheld — 130-05 SUMMARY confirms the D-07 gating assertion was not "fixed" in product code (Task 2 diff is a single +45-line spec hunk; pre-existing product bugs deferred to `deferred-items.md`, not patched) | closed |
| T-130-06 | Repudiation | gate evidence | low | mitigate | Mitigation present in 130-06 SUMMARY: per-run table with UTC start/end timestamps, 128 passed / 0 failed / 0 skipped counts, exit codes, and fresh-server + clean-DB confirmation per run, plus executed-project greps for all 4 new-coverage entries — /gsd-verify-work can audit the claim instead of trusting a bare "3× green" assertion | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-130-01 | T-130-01 | Test-only phase; no product mitigation added or removed. Synthetic seed identities (`test-e2e-base-*` prefix scheme) only — asserted by review and RESEARCH Security Domain | plan-time disposition (130-01-PLAN.md), confirmed at execution | 2026-07-19 |
| AR-130-02 | T-130-02 | Test constant values are synthetic marker strings; verbatim-equality bracket tokens by design, no real data | plan-time disposition (130-02-PLAN.md), confirmed at execution | 2026-07-19 |
| AR-130-03 | T-130-03 | No-re-baseline prohibition guards against masking product regressions with test edits; upheld per 130-06 SUMMARY prohibition verification | plan-time disposition (130-03-PLAN.md), confirmed at execution | 2026-07-19 |
| AR-130-04 | T-130-04 | Suite wall-clock growth (~2 walks) mirrors accepted voter-dark-mode/mobile precedent; D-05 determinism gate absorbs it | plan-time disposition (130-04-PLAN.md), confirmed at execution | 2026-07-19 |
| AR-130-05 | T-130-05 | No-product-patch prohibition guards the D-07 gating assertion; product bugs found during spec work were deferred, not silently patched | plan-time disposition (130-05-PLAN.md), confirmed at execution | 2026-07-19 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-19 | 6 | 6 | 0 | /gsd-secure-phase (orchestrator, L1 short-circuit — register authored at plan time, all threats low, ASVS L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-19
