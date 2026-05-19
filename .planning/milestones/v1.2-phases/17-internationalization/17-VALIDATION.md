---
phase: 17
slug: internationalization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via vitest.config.ts in apps/frontend) |
| **Config file** | `apps/frontend/vitest.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:unit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend test:unit`
- **After every plan wave:** Run `yarn test:unit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | I18N-01 | manual-only | N/A (documentation deliverable) | N/A | ⬜ pending |
| TBD | TBD | TBD | I18N-02 | unit | `yarn workspace @openvaa/frontend test:unit` | Partial | ⬜ pending |
| TBD | TBD | TBD | I18N-03 | unit + manual | Manual review of hooks.server.ts | No | ⬜ pending |
| TBD | TBD | TBD | I18N-04 | unit | `yarn workspace @openvaa/frontend test:unit` | No — Wave 0 | ⬜ pending |
| TBD | TBD | TBD | I18N-05 | e2e/manual | `yarn test:e2e` | Partial | ⬜ pending |
| TBD | TBD | TBD | I18N-06 | unit | `yarn workspace @openvaa/frontend test:unit` | Partial | ⬜ pending |
| TBD | TBD | TBD | I18N-07 | e2e/manual | `yarn test:e2e` | Partial | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/frontend/src/lib/i18n/tests/translations.test.ts` — update for svelte-i18n locale registry format and 7 locales (en, fi, sv, da, et, fr, lb)
- [ ] Add ICU format test: verify plural, date, select patterns render correctly with svelte-i18n
- [ ] Add `addMessages()` override behavior test: base translation + override = override wins

*Existing infrastructure covers locale utility tests (matchLocale, parseAcceptedLanguages).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Evaluation document exists and is complete | I18N-01 | Documentation deliverable, not code behavior | Verify `17-RESEARCH.md` contains comparison table with all three libraries |
| Language switch updates all visible text | I18N-05 | Requires visual verification across multiple pages | Switch language in UI, verify all text updates on voter home, candidate profile, settings |
| Hooks.server.ts cleaned of unnecessary middleware | I18N-03 | Code review check, not functional test | Verify `setRoute('')` removed, no sveltekit-i18n imports remain |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
