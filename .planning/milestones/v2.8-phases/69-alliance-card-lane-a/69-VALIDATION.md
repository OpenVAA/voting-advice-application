---
phase: 69
slug: alliance-card-lane-a
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-09
---

# Phase 69 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Anchors to RESEARCH.md §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frontend unit framework** | Vitest 2.x (`apps/frontend/package.json` `test:unit`) |
| **Dev-seed unit framework** | Vitest 2.x (`packages/dev-seed/package.json`) |
| **E2E framework** | Playwright (`tests/playwright.config.ts`) |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit && yarn workspace @openvaa/dev-seed test:unit` |
| **Per-package quick** | `yarn workspace @openvaa/frontend test:unit -- <pattern>` |
| **Full suite command** | `yarn build && yarn test:unit && yarn lint:check` |
| **E2E command** | `yarn dev` (separate terminal) → `yarn test:e2e` |
| **Parity diff script** | `node .planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline.json> <post.json>` |
| **Parity baseline** | `67p / 1f / 34c` (v2.7-close, held through Phase 68) |
| **Manual smoke** | 5-step flow on `yarn dev:reset-with-data` (ROADMAP SC-4) |
| **Pre-capture protocol for parity** | `yarn supabase:reset` (NOT `yarn dev:reset-with-data`) — Phase 67 false-positive trap |
| **Estimated quick runtime** | ~30–60 seconds (frontend + dev-seed unit tests) |
| **Estimated full runtime** | ~3–5 minutes (build + test:unit + lint:check) |

---

## Sampling Rate

- **After every task commit:** Run quick command (frontend + dev-seed unit tests when relevant)
- **After every plan wave:** `yarn build` + full `yarn test:unit`; svelte-check baseline must not regress beyond 160 err / 12 warn
- **Before `/gsd-verify-work`:** Full suite green + 5-step manual UI smoke + Playwright parity capture using the `yarn supabase:reset` pre-capture protocol; `diff-parity.mjs` must exit 0 with `PARITY GATE: PASS`
- **Max feedback latency:** ~60 seconds for unit-test feedback; manual smoke is the alliance-render gate per Phase 67 D-03

---

## Per-Task Verification Map

> Filled at plan-time by gsd-planner once Plan 01 / Plan 02 task IDs are minted. Below is the per-requirement test map from RESEARCH.md §"Validation Architecture / Phase Requirements → Test Map", to be expanded into per-task rows by the planner.

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| ALLIANCE-01 / SC-1 | EntityCard subentities branch handles `AllianceNomination → OrganizationNomination`; cardContents.alliance widened | unit (component, OPTIONAL) | `yarn workspace @openvaa/frontend test:unit -- entityCard` | ❌ Wave 0 | ⬜ pending |
| ALLIANCE-01 / SC-1 | `'candidates'` → `'children'` rename consistent across type surface + defaults + dev-seed + E2E fixtures | unit (defaults) + spec-fixture pins | `yarn workspace @openvaa/dev-seed test:unit` | ✅ existing | ⬜ pending |
| ALLIANCE-01 / SC-2 | Alliance tab renders populated cards on `yarn dev:reset-with-data` | manual smoke (per Phase 67 D-03) | manual: 5-step flow | manual-only | ⬜ pending |
| ALLIANCE-01 / SC-3 | Click alliance card opens drawer; tabs = info + children; member orgs render in drawer body | manual smoke + route-matcher unit positive case | `yarn workspace @openvaa/frontend test:unit -- entityTypePlural.test entityTypeSingular.test` + manual click-through | ✅ existing test files | ⬜ pending |
| ALLIANCE-01 / SC-4 | 5-step manual smoke + parity baseline `67p / 1f / 34c` continues | manual smoke + Playwright parity gate | manual + `yarn test:e2e` + `node diff-parity.mjs` | ✅ existing parity script | ⬜ pending |
| ALLIANCE-01 / impute regression | `imputeParentAnswers` org-pass output unchanged when `childProxies` omitted | unit (library, RECOMMENDED) | `yarn workspace @openvaa/frontend test:unit -- imputeParentAnswers` | ❌ Wave 0 | ⬜ pending |
| ALLIANCE-01 / impute cascade | Alliance pass produces meaningful match scores when org proxies cascade | manual smoke (per D-03) | exercise via voter-flow with answers ≥ minimumAnswers | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

### REQUIRED (must land before Plan 02 verification)

- [ ] **Update fixture pins** in `packages/dev-seed/tests/templates/variant-app-settings.test.ts:119` + `e2e-app-settings.test.ts:107` (literal `'candidates'` → `'children'`).
- [ ] **Update fixture pins** in `tests/tests/specs/variants/{results-sections,constituency,startfromcg}.spec.ts` (5 line-occurrences).
- [ ] **Add positive-case** `['alliances', true]` to `apps/frontend/src/params/entityTypePlural.test.ts` and `['alliance', true]` to `entityTypeSingular.test.ts`.
- [ ] **Regenerate** `apps/frontend/src/lib/types/generated/translationKey.ts` after i18n JSON edits (`tsx apps/frontend/tools/translationKey/generateTranslationKeyType.ts`).

### RECOMMENDED (planner discretion; aligns with D-03 spirit)

- [ ] `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts` — regression guard for Risk #7 (org-pass output unchanged when `childProxies` omitted). Frontend-side test, NOT in `@openvaa/matching`, so consistent with Phase 67 D-03's "no new package-level tests".
- [ ] Component-level test for `EntityCard.svelte` rendering an alliance card (asserts: name + sub-list + summary line). Only if `@testing-library/svelte` is already in scope; otherwise skip per CONTEXT validation surface.

### Existing infrastructure covers

- E2E parity baseline + `diff-parity.mjs` script (no new test infrastructure).
- Manual UI smoke procedure documented in ROADMAP SC-4.
- Frontend + dev-seed Vitest harness (37 + 41 test files passing at v2.7-close).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Alliance tab renders populated cards on default seed | ALLIANCE-01 / SC-2 | Per Phase 67 D-03 — coupling package tests to seed shape is rejected; manual UI smoke + parity gate is the project-level pattern for seeded-data render surface | 1. `yarn dev:reset-with-data` 2. `yarn dev` 3. Open voter app → results page 4. Click "Alliances" tab 5. Confirm 2 cards visible (Alliance L + Alliance R), each with name, member-orgs sub-list, and "X candidates across N parties" summary. |
| Click-to-drawer opens alliance drawer with info + children tabs | ALLIANCE-01 / SC-3 | SvelteKit route handling + drawer rendering chain — visual verification needed | From SC-2 state, click an alliance card. Drawer should open; tab strip shows "Info" + "Children" (or equivalent label); no "Opinions" tab. Children tab body shows member-org cards. |
| Member-org rendering in drawer reuses org-nomination surface | ALLIANCE-01 / SC-3 | Visual confirmation of "no new bespoke components" rule | In drawer Children tab: each member-org renders as the same card surface used elsewhere for OrganizationNomination (avatar, name, election symbol if present). |
| Alliance pass produces meaningful match scores | ALLIANCE-01 / impute cascade | Per D-03 + Phase 67 D-03 — no package-level test couples to seed answers | Exercise voter-flow until answers ≥ minimumAnswers. Verify alliance card displays a match-score number that reflects the cascade (org → alliance) rather than zero or missing. |
| 5-step manual smoke pass on clean `yarn dev:reset-with-data` start | ALLIANCE-01 / SC-4 | Phase verification gate per ROADMAP SC-4 | 5 steps: tab visible → cards populated → click-to-drawer → member orgs render in drawer → return to list. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (planner fills at PLAN.md write time)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (planner enforces)
- [ ] Wave 0 covers all REQUIRED references (4 fixture/test-file pins above)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60 seconds for unit tests
- [ ] `nyquist_compliant: true` set in frontmatter once planner has filled the per-task map

**Approval:** pending
