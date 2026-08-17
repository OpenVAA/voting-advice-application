---
phase: 118
slug: e2e-coverage-audit-coverage-plan
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase 118 — Validation Strategy

> Per-phase validation contract. Phase 118 is a **documentation/audit deliverable** — it writes NO test code.
> Validation here is therefore document-correctness (the coverage map's factual claims) + operator approval,
> not automated test execution. The verifiable "tests" are the audit's own claims being grounded against the
> live catalog.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (the suite being audited) + the coverage-map document itself |
| **Config file** | `playwright.config.ts` (repo root) — read-only reference during audit |
| **Quick run command** | `grep`/file inspection of cited specs (audit grounding, not execution) |
| **Full suite command** | `yarn test:e2e` — used only to CONFIRM a spec's current behaviour when static read is ambiguous |
| **Estimated runtime** | n/a (no new code; selective spec reads + optional confirm-runs) |

---

## Sampling Rate

- **During audit:** Every covered/partial/missing verdict is grounded against the actual spec file path
  (read or, where ambiguous, a targeted `yarn test:e2e` run of that spec).
- **Before approval gate:** All four phase success criteria satisfied in the written deliverable.
- **Max feedback latency:** n/a (documentation phase).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|--------|
| 118-XX-XX | TBD | 1 | (structural) | N/A | manual (doc review) | static spec inspection per cited path | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase needs — no test framework install. The audit consumes the existing
Playwright catalog read-only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Coverage map classifies every EPERM/EFLOW/EQTYP requirement | Success Criterion 1 | Documentation deliverable | Read the map; confirm every EPERM-01..11, EFLOW-01..11, EQTYP-01..03 has a covered/partial/missing verdict grounded in a real spec path |
| Build list names every new spec + extension + seed change + fixtures at semantic-step depth | Success Criterion 2 | Documentation deliverable | Read the build list; confirm each entry has path + seed delta + semantic steps |
| Deferred-build items marked → end cluster (129-130) | Success Criterion 3 | Documentation deliverable | Confirm EQTYP-01/02/03, EFLOW-02, nominations-route, EPERM-03 alliance slice are flagged deferred-build |
| Plan reviewed + approved before any code | Success Criterion 4 | Operator gate | Operator re-checks the deliverable before Phase 119 begins (per A9 note) |

---

## Validation Architecture (from RESEARCH.md)

The audit's factual backbone is the E2E catalog inventory in `118-RESEARCH.md` — the per-requirement
best-guess maps there are starting hypotheses; the audit's job (per A5) is to CONFIRM each against the real
spec path before locking a verdict. "Confirmed covered" requirements close with no new code; refuted ones
become net-new work surfaced in the build list.
