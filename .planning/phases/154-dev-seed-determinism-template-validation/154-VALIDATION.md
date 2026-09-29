---
phase: 154
slug: dev-seed-determinism-template-validation
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-28
---

# Phase 154 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `154-RESEARCH.md` § Validation Architecture (all values MEASURED this session).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 (root catalog `^3.2.4`) |
| **Config file** | `packages/dev-seed/vitest.config.ts` (`export default {};` — workspace marker; root `vitest.workspace.ts` aggregates) |
| **Quick run command** | `yarn workspace @openvaa/dev-seed vitest run tests/determinism.test.ts` |
| **Package suite command** | `yarn workspace @openvaa/dev-seed test:unit` |
| **Full suite command** | `yarn test:unit` |
| **Typecheck (separately load-bearing)** | `yarn workspace @openvaa/dev-seed typecheck` |
| **Estimated runtime** | ~10.4 seconds (package suite); measured baseline **49 files / 569 tests / 569 passing / 10.37 s** |

**Why typecheck is listed as a first-class sampler here:** `packages/dev-seed/tests/utils.ts:18-43`
(`makeCtx`) returns a complete `Ctx` object literal. Adding a required `refDate` field to `Ctx`
breaks **typecheck**, not vitest — the failure surfaces in `yarn lint:check`, never in
`yarn test:unit`. A task commit validated by vitest alone can be silently red.

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/dev-seed test:unit` **AND**
  `yarn workspace @openvaa/dev-seed typecheck`
- **After every plan wave:** `yarn test:unit` (root) + `yarn lint:check`
- **Before `/gsd-verify-work`:** full unit suite green, typecheck green, and the full E2E suite
  green per CLAUDE.md's cardinal rule (expected E2E delta: **zero** — no built-in template reaches
  either changed line — but the rule is unconditional)
- **Max feedback latency:** ~15 seconds (package suite + typecheck)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 154-01-* | 01 | 1 | REVIEW-SEED-02 (negative) | — | N/A | unit (run-and-record) | `yarn workspace @openvaa/dev-seed vitest run tests/determinism.test.ts` | ❌ W0 — control template + recorded pre-fix run | ⬜ pending |
| 154-01-* | 01 | 1 | REVIEW-SEED-02 (anti-vacuity) | — | N/A | unit | same | ❌ W0 — assert both faker sites actually fired | ⬜ pending |
| 154-02-* | 02 | 2 | REVIEW-SEED-01 | — | N/A | unit | `yarn workspace @openvaa/dev-seed test:unit` | ✅ existing | ⬜ pending |
| 154-02-* | 02 | 2 | REVIEW-SEED-01 (signature) | — | N/A | typecheck | `yarn workspace @openvaa/dev-seed typecheck` | ✅ existing script | ⬜ pending |
| 154-02-* | 02 | 2 | REVIEW-SEED-01 (no built-in drift) | — | N/A | unit | `yarn workspace @openvaa/dev-seed test:unit` (30-built-in assertions already present) | ✅ existing | ⬜ pending |
| 154-03-* | 03 | 3 | REVIEW-SEED-02 (positive/guard) | — | N/A | unit | `yarn workspace @openvaa/dev-seed vitest run tests/determinism.test.ts` | ❌ W0 — committed cross-time guard | ⬜ pending |
| 154-03-* | 03 | 3 | REVIEW-SEED-03 | — | N/A | unit | `yarn workspace @openvaa/dev-seed vitest run tests/cli/resolve-template.test.ts` | ✅ file exists, case does not | ⬜ pending |
| 154-03-* | 03 | 3 | REVIEW-SEED-04 (negative + positive) | — | N/A | unit | `yarn workspace @openvaa/dev-seed vitest run tests/template.test.ts` | ✅ file exists, cases do not | ⬜ pending |
| 154-03-* | 03 | 3 | REVIEW-HYG-02 slice (D-C3) | — | N/A | grep assertion | `grep -n -- "- — latent" packages/dev-seed/src/template/types.ts` → no match; `grep -n "trace-confirmed; see" packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts` → no match | ✅ greppable | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `makeDateReachingTemplate()` factory in `packages/dev-seed/tests/determinism.test.ts` — the
      purpose-built control template (`elections: { count: 1 }` + a `fixed[]` `type: 'date'`
      question with no hardcoded answer + `candidates: { count: 1 }`) that actually reaches BOTH
      `ElectionsGenerator.ts:58` and `answers.ts:91`. Covers REVIEW-SEED-02.
- [ ] **Anti-vacuity assertions** on that template — assert the emitted `election_date` is a
      non-empty `YYYY-MM-DD` and that a date-question answer key exists. Without these the guard can
      rot into a false pass the day the template stops reaching a site.
- [ ] The **recorded pre-fix two-clock run** (the negative-control artifact). Must be run against
      unfixed code, before the fix task.
- [ ] `packages/dev-seed/tests/utils.ts` `makeCtx` updated for the new required `Ctx` field — blocks
      typecheck for every other task in Wave 2 onward.
- [ ] Criterion-3 case added to `packages/dev-seed/tests/cli/resolve-template.test.ts`.
- [ ] Criterion-4 negative-control pair added to `packages/dev-seed/tests/template.test.ts`.
- [ ] No framework install needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The two D-C3 comment edits read cleanly to a human | REVIEW-HYG-02 slice | Prose quality is not machine-checkable; the *absence* of the dangling text IS (see grep row above) | Read `packages/dev-seed/src/template/types.ts` §"Further reading" and `packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts:44-52`; confirm no dangling "see", no phase numbers, no decision ids, no planning-artifact paths (Phase 152 scan compliance, D-N1) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (`vitest run`, never `vitest`)
- [ ] Feedback latency < 15s
- [ ] **Ordering invariant honoured: the negative control is RUN AND RECORDED before the fix lands.**
      A wave that ships the `refDate` edit and the guard together destroys the ability to observe
      the drift and makes criterion 2 unprovable.
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
