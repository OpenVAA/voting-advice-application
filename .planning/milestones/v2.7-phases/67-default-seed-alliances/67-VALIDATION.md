---
phase: 67
slug: default-seed-alliances
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-30
---

# Phase 67 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing — `default-template.integration.test.ts` lives in `packages/dev-seed/test/`) |
| **Config file** | `packages/dev-seed/vitest.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/dev-seed test:unit -- default-template` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~25-40 seconds (default-template integration test runs full pipeline against local Supabase) |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/dev-seed test:unit -- default-template`
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd-verify-work`:** Full suite green + manual UI smoke completed
- **Max feedback latency:** ~40 seconds

---

## Per-Task Verification Map

> Filled in during planning. Each plan task ID maps to its automated verification command. Manual surfaces (UI smoke) belong in the "Manual-Only Verifications" table below.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 67-01-* | 01 | 1 | SEED-01 | — | N/A (data-only) | integration | `yarn workspace @openvaa/dev-seed test:unit -- default-template` | ✅ existing | ⬜ pending |
| 67-02-* | 02 | 2 | SEED-01 | — | N/A | manual | UI smoke checklist (see below) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.* Vitest is already configured in `packages/dev-seed/`; the default-template integration test already asserts row counts and will be extended (or a sibling sanity test added) by Plan 01 to cover alliances + alliance_nominations + parent_nomination wiring on org-noms.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Alliances tab populated on voter results page | SEED-01 SC-2 | Visual UI smoke — D-03 explicitly chooses manual smoke over new unit tests in `@openvaa/matching` / `@openvaa/filters` | `yarn dev:reset-with-data && yarn dev` → navigate voter app → answer baseline opinion questions → reach results page → assert alliances tab visible + populated with the 2 seeded alliances per constituency |
| Alliance filtering / grouping works on real data | SEED-01 SC-2 | Visual UI smoke — interactive UI behavior not unit-testable cheaply | On results page → toggle alliance filter / grouping → confirm filtered list updates correctly + no runtime errors in console |
| `organizationNominationIds` non-empty on Alliance parents (reverse-fill) | SEED-01 SC-3 | Adapter sanity — log/inspect data flow during dev seed run | EITHER (a) extend `default-template.integration.test.ts` to assert each seeded alliance nom resolves to N≥3 child org noms after adapter reverse-fill, OR (b) add a one-shot script in `packages/dev-seed/scripts/sanity-check-alliances.ts` that runs against the freshly-seeded DB |
| `@openvaa/matching` + `@openvaa/filters` handle alliances without runtime errors | SEED-01 SC-4 | Manual UI smoke per D-03 — existing abstract unit tests cover Alliance entity-type handling | After UI smoke, confirm browser console is clean during results page render + filter interactions; no `[matching]` or `[filters]` errors |
| v2.6 parity gate not regressed | (cross-cutting) | Existing parity tooling at `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` | Run Playwright e2e suite, compare against the v2.6 baseline at HEAD `2c7ad2dea`. Phase 67 must not regenerate constants — only re-run and confirm pass |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none — existing vitest setup covers seed authoring)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
