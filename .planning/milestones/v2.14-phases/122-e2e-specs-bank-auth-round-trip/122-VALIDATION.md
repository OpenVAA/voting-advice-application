---
phase: 122
slug: e2e-specs-bank-auth-round-trip
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 122 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.2 (E2E) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `PLAYWRIGHT_BANK_AUTH=1 yarn workspace @openvaa/tests test --project=bank-auth` (single spec) |
| **Full suite command** | `yarn test:e2e` (cardinal-rule gate — full suite must pass) |
| **Estimated runtime** | ~bank-auth project: seconds; full suite: a few minutes |

---

## Sampling Rate

- **After every task commit:** Run the targeted bank-auth project spec(s) for the spec touched.
- **After every plan wave:** Run both bank-auth projects (`bank-auth` + `bank-auth-journey`) with `PLAYWRIGHT_BANK_AUTH=1`.
- **Before phase completion:** Full `yarn test:e2e` suite must be green, AND the two bank-auth specs must pass **3× consecutively** (fresh server, clean DB) — the cardinal-rule determinism gate (Success Criterion 2). A "did not run" / env-skipped spec counts as a FAILURE.
- **Max feedback latency:** targeted project run (seconds).

---

## Per-Task Verification Map

> Filled by executor as tasks land. Every EFLOW-10 / EFLOW-10b behavior maps to a Playwright assertion; the determinism gate maps to a 3× repeat run.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 122-XX-XX | XX | X | EFLOW-10 | — | OIDC exchange/decrypt run server-side; no test-only branch in prod auth | e2e | `PLAYWRIGHT_BANK_AUTH=1 ... --project=bank-auth` | ❌ W0 | ⬜ pending |
| 122-XX-XX | XX | X | EFLOW-10 | — | Full browser journey reaches authenticated logged-in state | e2e | `PLAYWRIGHT_BANK_AUTH=1 ... --project=bank-auth-journey` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Shared `buildTestIdToken` util extracted (D-03) — consumed by both the Edge-Function spec and the mock issuer token endpoint.
- [ ] Mock OIDC issuer harness (authorize / token / JWKS) reachable at the env-pointed seam (D-01, Option B).
- [ ] Deterministic-green JWKS gate wired into `beforeAll` for EFLOW-10 (D-02).

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| — | — | — | — |

*All phase behaviors have automated verification — this is an E2E correctness phase; the deliverable IS the automated test.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Determinism gate: both bank-auth specs pass 3× (fresh server, clean DB)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
