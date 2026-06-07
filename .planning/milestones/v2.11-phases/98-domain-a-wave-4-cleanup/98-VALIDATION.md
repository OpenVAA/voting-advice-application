---
phase: 98
slug: domain-a-wave-4-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-05
---

# Phase 98 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `98-RESEARCH.md` → "Validation Architecture". This is a structural
> deletion + lint-config phase — every success criterion is mechanically verifiable
> by grep / path assertion / lint exit code (no new behavior to test).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x (unit) + ESLint flat config (lint gate) |
| **Config file** | `apps/frontend/eslint.config.mjs` (lint guard); `vitest run` (unit) |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:unit` (all packages) + `yarn lint:check` |
| **Estimated runtime** | ~60–120 seconds (lint gate) + unit suite |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend test:unit` + the import-only acceptance grep.
- **After every plan wave:** Run `yarn build` + `yarn workspace @openvaa/frontend typecheck` + `yarn lint:check`.
- **Before `/gsd-verify-work`:** Full `yarn test:unit` + `yarn lint:check` green; acceptance grep returns zero; guard negative-test demonstrated.
- **Max feedback latency:** ~120 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 98-XX-XX | — | 1 | CLEAN-01 | — | N/A | grep | `! grep -rq "from 'svelte/store'" apps/frontend/src/lib/contexts apps/frontend/src/routes` (exit 0 = pass) | ✅ (shell) | ⬜ pending |
| 98-XX-XX | — | 1 | CLEAN-01 | — | N/A | path | `! test -e apps/frontend/src/lib/contexts/utils/StackedState.svelte.ts && ! test -e apps/frontend/src/lib/contexts/utils/dataCollectionStore.ts && ! test -d apps/frontend/src/routes/runes-test` | ✅ (shell) | ⬜ pending |
| 98-XX-XX | — | 1 | CLEAN-01 | T-accidental | behavior-preserving `fromStore`→`.current` swap | build | `yarn build` then `yarn workspace @openvaa/frontend typecheck` | ✅ | ⬜ pending |
| 98-XX-XX | — | 1 | CLEAN-01 | — | N/A | unit | `yarn workspace @openvaa/frontend test:unit` | ✅ (existing `.test.ts` edited) | ⬜ pending |
| 98-XX-XX | — | 2 | CLEAN-02 | — | N/A | lint | `yarn lint:check` (exit 0 on cleaned tree) | ✅ | ⬜ pending |
| 98-XX-XX | — | 2 | CLEAN-02 | — | N/A | lint negative | Reintroduce `import { writable } from 'svelte/store'` into a context file → `yarn workspace @openvaa/frontend lint` exits ≠ 0 → revert | ✅ (scripted) | ⬜ pending |

*Plan/Task IDs are placeholders until plans are generated; the planner maps these criteria onto real task IDs.*
*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No new test FILES needed — deletion regression is covered by editing existing `persistedState.svelte.test.ts` (drop legacy `*Writable` blocks), deleting `StackedState.svelte.test.ts`, and rewriting one `SettingsOverlay.svelte.test.ts` oracle test.
- [ ] The CLEAN-02 negative test (reintroduce → lint fails) is a one-shot scripted verification, not a persisted test file. A tiny CI smoke that greps the eslint config for the rule is optional.
- [ ] No framework install needed (vitest + ESLint already present).

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Guard fails on reintroduction | CLEAN-02 | Negative lint assertion is a one-shot, not a persisted test | Temporarily add `import { writable } from 'svelte/store'` to a `lib/contexts/**` file, run `yarn workspace @openvaa/frontend lint`, confirm non-zero exit + revert |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
