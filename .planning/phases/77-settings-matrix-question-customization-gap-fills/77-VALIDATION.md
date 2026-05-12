---
phase: 77
slug: settings-matrix-question-customization-gap-fills
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 77 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.x (E2E) |
| **Config file** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=list --grep "<spec-title-substring>"` |
| **Full suite command** | `yarn supabase:reset && yarn dev:seed --template e2e && yarn workspace @openvaa/tests test:e2e --workers=1` |
| **Estimated runtime** | ~10-12 min full; ~30-90 sec per spec quick |

---

## Sampling Rate

- **After every task commit:** Run quick command scoped to the spec under modification.
- **After every plan wave:** Run full suite command (post-seed reset + vite-cache wipe).
- **Before `/gsd-verify-work`:** Full suite must be green; 3 consecutive `--workers=1` cold-start runs must produce identical pass/fail set (Phase 73 determinism contract).
- **Max feedback latency:** ~120 seconds for quick run; ~12 minutes for full suite.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 77-01-01 | 01 | 1 | SETTINGS-01 | — | ~12-15 toggle cells assert binary on/off effect via SupabaseAdminClient.updateAppSettings overlay | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "SETTINGS-01"` | ❌ W0 | ⬜ pending |
| 77-02-01 | 02 | 1 | SETTINGS-01 | — | Numeric Question added to e2e fixture; filterable: true added to text + categorical + numeric questions | E2E (template build) | `yarn build --filter=@openvaa/dev-seed && yarn supabase:reset && yarn dev:seed --template e2e` | ❌ W0 | ⬜ pending |
| 77-02-02 | 02 | 1 | SETTINGS-01 | — | Filter-type matrix (NumberFilter + TextFilter + categorical + constituency + FilterGroup AND); MISSING_FILTER_VALUE; OR-mode PASS-WITH-DEFERRAL (UI not exposed) | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "SETTINGS-01.*filter"` | ❌ W0 | ⬜ pending |
| 77-03-01 | 03 | 2 | SETTINGS-02 | — | Display-side allowOpen reframing per RESEARCH LANDMINE-1: voter sees entity comments via QuestionOpenAnswer when entity.answer.info is set; voter authoring is PRODUCT-GAP follow-up todo | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "SETTINGS-02"` | ❌ W0 | ⬜ pending |
| 77-04-01 | 04 | 2 | SETTINGS-03 | — | variant-hidden-required.ts overlay sets customData.hidden + customData.required; voter spec asserts hidden questions absent from DOM; candidate spec asserts unanswered required blocks profile-complete CTA; voter-required is PRODUCT-GAP per LANDMINE-3 | E2E | `yarn workspace @openvaa/tests test:e2e --workers=1 --grep "SETTINGS-03"` | ❌ W0 | ⬜ pending |
| 77-05-01 | 05 | 3 | SETTINGS-01/02/03 | — | Vite-cache wipe + 3-run cold-start identical pass/fail set | shell | `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit && for i in 1 2 3; do yarn supabase:reset && yarn dev:seed --template e2e && yarn workspace @openvaa/tests test:e2e --workers=1 --reporter=json > /tmp/77-run-$i.json; done && diff <(jq '.suites' /tmp/77-run-1.json) <(jq '.suites' /tmp/77-run-2.json) && diff <(jq '.suites' /tmp/77-run-1.json) <(jq '.suites' /tmp/77-run-3.json)` | ❌ W0 | ⬜ pending |
| 77-05-02 | 05 | 3 | SETTINGS-01/02/03 | — | Parity-script regen if PASS_LOCKED count changes (Phase 76 deferred regen; conditional decision per Plan 04 architectural rule) | shell | `node .planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` (conditional — only if PASS_LOCKED delta is healthy AND inherited auth-setup race no longer cascades) | ❌ W0 | ⬜ pending |
| 77-05-03 | 05 | 3 | SETTINGS-01/02/03 | — | 77-VERIFICATION.md authored with status frontmatter + 5-SC assessment | artifact assert | `test -f .planning/phases/77-settings-matrix-question-customization-gap-fills/77-VERIFICATION.md && grep -q "^status:" .planning/phases/77-settings-matrix-question-customization-gap-fills/77-VERIFICATION.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tests/specs/candidate/candidate-settings.spec.ts` extension — Plan 01 wave A toggle matrix
- [ ] `tests/tests/specs/voter/voter-results.spec.ts` extension OR new `voter-results-filters.spec.ts` — Plan 02 wave B
- [ ] `tests/tests/specs/voter/voter-allowopen.spec.ts` (NEW) — Plan 03 SETTINGS-02 (display-side per LANDMINE-1)
- [ ] `tests/tests/specs/voter/voter-visibility-required.spec.ts` (NEW) + `tests/tests/specs/candidate/candidate-required-info.spec.ts` (NEW) — Plan 04 SETTINGS-03 split per role
- [ ] `packages/dev-seed/src/templates/e2e.ts` — extend with numeric Question (Plan 02) + add `customData.filterable: true` to text/categorical/numeric questions (Plan 02 Wave 0)
- [ ] `packages/dev-seed/src/templates/variant-allowopen.ts` (NEW) — Plan 03 (display-side variant; entity carries `answer.info` populated)
- [ ] `packages/dev-seed/src/templates/variant-hidden-required.ts` (NEW) — Plan 04
- [ ] `tests/playwright.config.ts` — register the new variant projects per the existing pattern (`variant-multi-election`, `variant-low-minimum-answers` analogs)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toggle effect spot-check | SETTINGS-01 | A few toggles (e.g., `cardContents`, `sections`) have multi-effect renders that are best validated by eyeballing the result page after manual config flip | After Plan 01/02 land, visit /elections in dev mode with each toggle on vs off; confirm UI changes match assertions |
| FilterGroup OR-mode PRODUCT-GAP confirmation | SETTINGS-01 | Operator confirms whether OR-mode is genuinely missing from voter UI or hidden behind a flag | Inspect `EntityFilters.svelte` source + run voter app manually; if no AND/OR toggle visible, confirm PASS-WITH-DEFERRAL |
| SETTINGS-02 reframing acceptance | SETTINGS-02 | Critical OQ-1 — operator decides whether to accept display-side reframing OR escalate to product team for voter authoring surface | Plan 03 SUMMARY.md captures the decision; operator approves at Plan 05 verification gate |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s (quick) / 12min (full)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
