---
phase: 139
slug: single-source-sweep-findings-confirm-or-withdraw
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-14
---

# Phase 139 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Phase shape note:** Phase 139 ships **no product code**. It produces an evidence
> artifact (`139-VERDICTS.md`) plus record edits. So validation here is scoped to
> *the phase's own output being verifiable* and to *the tree being left exactly as
> found* — not to new behaviour under test. Sourced from
> `139-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest **3.2.4** (`catalog: vitest: ^3.2.4` in `.yarnrc.yml`) |
| **Config file** | per-workspace `vitest.config.ts` (5 relevant); root `vitest.workspace.ts` = `['packages/**/vitest.config.ts']` |
| **Quick run command** | the per-vehicle `npx vitest run <files>` from RESEARCH § Run Vehicles (~400–650 ms each) |
| **Full suite command** | the 7 baseline vehicle commands (**not** `yarn test:unit` — turbo does not reach `question-info` / `argument-condensation`, per D-05) |
| **Estimated runtime** | ~3.2 s total across all 7 invocations (113 tests) |

**Critical:** `yarn test:unit` is **not** the phase gate. It cannot reach two of the
packages under verdict (D-05). The gate is the 7-vehicle baseline set below.

---

## Sampling Rate

- **Per injection iteration:** the single vehicle command + the three hygiene gates
  (`git checkout -- <path>` → `git status --porcelain -- apps tests packages` empty →
  `grep -rn "INJECTED (139)" apps packages tests` empty).
- **Per vehicle batch:** the vehicle's full baseline command, confirming its
  pre-injection test count is restored.
- **Phase gate (before verify):** all 7 baseline commands green (**113 tests**), plus
  `git status --porcelain -- apps tests packages` empty, plus the injection-marker grep clean.
- **Max feedback latency:** ~650 ms (slowest single vehicle); ~3.2 s for the full gate.

---

## Per-Task Verification Map

Task IDs are assigned by the planner; the verification *vehicle* per site is fixed by
research and reproduced here. Every injection task's automated verify is
`<vehicle command>` + the three hygiene gates.

| Site | Vehicle | Automated Command | Baseline Tests | File Exists |
|------|---------|-------------------|----------------|-------------|
| F15-A | question-info | `cd packages/question-info && npx vitest run tests/questionTypes.test.ts` | 7 | ✅ |
| F16, F20-6 | argument-condensation | `cd packages/argument-condensation && npx vitest run tests/unit/handleQuestion.test.ts tests/unit/planValidation.test.ts` | 11 | ✅ |
| F15-B | argument-condensation | `cd packages/argument-condensation && npx vitest run tests/condensation/condenserStandalone.test.ts` | 3 | ✅ |
| F15-C | argument-condensation | `cd packages/argument-condensation && npx vitest run tests/condensation/condenseQuestions.test.ts` | 5 | ✅ |
| F18, F20-4 | dev-seed | `cd packages/dev-seed && npx vitest run tests/templates/default.test.ts tests/supabaseAdminClient.test.ts` | 34 | ✅ |
| F20-5 | data | `cd packages/data && npx vitest run src/objects/nominations/variants/variants.test.ts` | 1 | ✅ |
| F17, F19a/b/c, F20-1, F20-2, F20-3 | frontend | `cd apps/frontend && npx vitest run <6 files>` | 52 | ✅ |
| **Total** | | | **113** | |

**No `yarn build` prerequisite** for any of the 14 sites — every test file imports its
code-under-test through a *source* specifier (relative `../src/…` or the `$lib` alias),
never a package `dist/`. Verified by reading all 14 import lines.

**No external dependency** — no Supabase, no dev server, no network, no env vars, no API
keys. Every external surface is `vi.mock`ed.

---

## Wave 0 Requirements

- [ ] `139-VERDICTS.md` — the evidence artifact itself. This is the phase's product, not
      test scaffolding; it is "missing" only in the sense that producing it is the work.

*Test infrastructure has no gaps — all 7 commands were executed and observed green this
session.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Each verdict's **confirmed/withdrawn** judgement | ASSERT-01 | A verdict is an act of reasoning over an observation, not a computable predicate. The *observation* (PASS/FAIL under injection) is automated; the *verdict* is human/agent judgement applied to it under D-02's rule. | For each row of `139-VERDICTS.md` § verdict table: confirm the recorded observation supports the stated verdict, and that any vacuous-but-red site is `confirmed` with mitigation noted (D-02), not withdrawn. |
| Criterion-4 propagation completeness | ASSERT-01 (criterion 4) | Requires cross-document semantic diff across 3 files. | `grep -n 'ASSERT-07' .planning/REQUIREMENTS.md .planning/ROADMAP.md` and diff the finding enumerations against `139-VERDICTS.md`'s withdrawn set. **Three targets, not two** — see below. |

---

## Criterion-4 Edit Targets (confirmed at plan time — closes RESEARCH assumption A4)

RESEARCH flagged A4 at MEDIUM risk: *"`.planning/ROADMAP.md`'s Phase 142 block enumerates
ASSERT-07's findings the way `REQUIREMENTS.md:60` does"* — unverified. **Verified at plan
time: it does.** Any withdrawal has **three** propagation targets:

1. `.planning/audits/2026-08-11-fake-guard-sweep.md` — strike the finding with reasoning.
2. `.planning/REQUIREMENTS.md:60` — ASSERT-07 enumerates `F15, F16, F17, F18, F20`.
3. `.planning/ROADMAP.md` § Phase 142 — **criterion 2** names F15 (with its three
   sub-sites) explicitly; **criterion 3** names F16, F17, F18 and "each of the six F20
   sites". A withdrawal that edits only REQUIREMENTS.md leaves Phase 142's success
   criteria demanding remediation of a struck finding.

A4's risk is therefore **realized, not hypothetical** — the enumeration exists in both
places and both must move together.

---

## Validation Sign-Off

- [ ] All 14 (+F17 = 15-row) sites have an observed injection outcome recorded
- [ ] Sampling continuity: every injection task carries its vehicle command + 3 hygiene gates
- [ ] Wave 0 covers the deliverable artifact
- [ ] No watch-mode flags (`vitest run`, never bare `vitest`)
- [ ] Feedback latency < 1s per vehicle
- [ ] Phase-close: 113 tests green across 7 vehicles; `git status --porcelain -- apps tests packages` empty; marker grep clean
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
