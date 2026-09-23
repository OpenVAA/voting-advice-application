---
phase: 159
slug: component-context-consolidation
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-28
---

# Phase 159 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded by `/gsd-plan-phase 159` from `159-RESEARCH.md` § Validation Architecture.
> The Per-Task Verification Map is filled by the planner/executor once PLAN task IDs exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (jsdom, `globals: true`) for unit; @playwright/test for E2E |
| **Config file** | `apps/frontend/vitest.config.ts` (unit) · `tests/playwright.config.ts` (E2E) |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:unit && yarn lint:check && yarn test:e2e` |
| **Estimated runtime** | unit ~60s · `lint:check` ~2–4 min · full E2E ~20–30 min |

Frontend unit test files: **52**. E2E spec files: **40** under `tests/tests/specs/`.

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/frontend test:unit` + `yarn typecheck`
- **After every plan wave:** `yarn test:unit && yarn lint:check`
  - For the `$layouts` wave additionally `yarn workspace @openvaa/frontend build` (proves SSR/Vite
    resolution of the new alias) and `yarn dev:clean` (vite cache reset).
- **Before `/gsd-verify-work`:** full `yarn test:e2e` green — CLAUDE.md's cardinal rule; a "did not
  run" test counts as a failure.
- **Max feedback latency:** ~90 seconds for the per-task loop.

### E2E gate mechanics (all four are prerequisites, not options)

1. `yarn db:reset` **before** the server starts — never mid-run (it wipes the suite).
2. **One** fresh dev server on the agreed port (`strictPort`; `FRONTEND_PORT` is the only escape hatch,
   and the suite must use the same port).
3. The served-application **preflight has no bypass** — it asserts the app came from this checkout.
4. ⚠ **Disk headroom.** `tests/e2e-runs/` holds ~6.8 GiB and the volume is ~98% full. `ENOSPC` has
   voided full-suite runs before. `tests/e2e-runs/` is cited by registers and **must not be deleted**;
   free space elsewhere. Check headroom *before* the phase gate, not at it.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-T1 disk/env assert | 159-01 | 1 | CMP-01 | T-159-38 | N/A | script assert | inline node free-space threshold (15 GiB) | n/a | ⬜ pending |
| 01-T2 tracer conversion | 159-01 | 1 | CMP-01 | T-159-01, T-159-02 | password not logged | unit + typecheck + e2e | `yarn workspace @openvaa/frontend test:unit && yarn typecheck && yarn test:e2e --grep "cold-entry"` | ❌ new test | ⬜ pending |
| 01-T3 source guards + cold-entry extension | 159-01 | 1 | CMP-03, CMP-05 | T-159-20 | N/A | source scan + e2e | `yarn workspace @openvaa/frontend test:unit && yarn test:e2e --grep "cold-entry"` | ❌ new tests | ⬜ pending |
| 02-T1 PasswordSetter contract test | 159-02 | 2 | CMP-01 | T-159-04, T-159-05 | equality check preserved | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ new test | ⬜ pending |
| 02-T2 bindable-prop decision | 159-02 | 2 | CMP-01 | T-159-06 | N/A | checkpoint | n/a (decision) | n/a | ⬜ pending |
| 02-T3 implement disposition | 159-02 | 2 | CMP-01 | T-159-04 | equality check preserved | unit + typecheck + lint | `yarn workspace @openvaa/frontend test:unit && yarn typecheck && yarn lint:check` | ✅ 02-T1 | ⬜ pending |
| 03-T1 classifier script | 159-03 | 3 | CMP-01 | T-159-07 | N/A | script self-check | `node .planning/phases/159-*/classify-effects.mjs --assert-total 92` | ❌ new script | ⬜ pending |
| 03-T2 census artifact | 159-03 | 3 | CMP-01 | T-159-08 | N/A | script + source scan | classifier assert + `grep -cE '^\| [0-9]+ \|'` returns 92 | ❌ new artifact | ⬜ pending |
| 04-T1 alert offset decision | 159-04 | 2 | CMP-06 | T-159-10 | N/A | checkpoint | n/a (decision) | n/a | ⬜ pending |
| 04-T2 apply spacing | 159-04 | 2 | CMP-06 | T-159-10 | N/A | lint + build (+ visual if changed) | `yarn lint:check && yarn workspace @openvaa/frontend build` | ✅ visual project | ⬜ pending |
| 05-T1 relocate hover rule | 159-05 | 2 | CMP-03 | T-159-12 | N/A | source scan + unit | `yarn workspace @openvaa/frontend test:unit && yarn lint:check` | ✅ 01-T3 guard | ⬜ pending |
| 05-T2 snippet conversion + deletion | 159-05 | 2 | CMP-03 | T-159-12, T-159-13, T-159-14 | no raw-HTML directive; role split kept | unit + typecheck + lint | `yarn workspace @openvaa/frontend test:unit && yarn typecheck && yarn lint:check` | ✅ 3 e2e files | ⬜ pending |
| 05-T3 comment reword + DOM contract | 159-05 | 2 | CMP-03 | T-159-13 | N/A | e2e | `yarn lint:check && yarn test:e2e --grep "results\|alliance\|feedback survey"` | ✅ existing | ⬜ pending |
| 06-T1 handle-type relocation | 159-06 | 2 | CMP-05 | — | N/A | typecheck + unit | `yarn typecheck && yarn workspace @openvaa/frontend test:unit` | ✅ existing | ⬜ pending |
| 06-T2 tracking collapse + selective forward | 159-06 | 2 | CMP-04 | T-159-15, T-159-16, T-159-17 | analytics id off the public surface; storage key intact | unit + typecheck | `yarn typecheck && yarn workspace @openvaa/frontend test:unit` | ✅ producer + spread tests | ⬜ pending |
| 06-T3 drop re-declarations + spread test | 159-06 | 2 | CMP-04, CMP-05 | T-159-16 | spread locks not weakened | unit + typecheck + lint | `yarn workspace @openvaa/frontend test:unit && yarn typecheck && yarn lint:check` | ✅ update `:178-179` | ⬜ pending |
| 07-T1 rollup contract test | 159-07 | 3 | CMP-05 | T-159-19, T-159-21, T-159-22 | matchability guard raises | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ new test | ⬜ pending |
| 07-T2 shared rollup extraction | 159-07 | 3 | CMP-05 | T-159-19, T-159-20 | no alias over data root | unit + typecheck + e2e | `yarn workspace @openvaa/frontend test:unit && yarn typecheck && yarn test:e2e --grep "cold-entry"` | ✅ 01-T3 guard + control | ⬜ pending |
| 07-T3 equality-helper relocation | 159-07 | 3 | CMP-05 | — | N/A | unit + typecheck + lint | `yarn workspace @openvaa/frontend test:unit && yarn typecheck && yarn lint:check` | ✅ existing | ⬜ pending |
| 08-T1 cross-phase collision decision | 159-08 | 4 | CMP-06 | T-159-23 | N/A | checkpoint (blocking-human) | n/a (decision) | n/a | ⬜ pending |
| 08-T2 alias in both resolvers | 159-08 | 4 | CMP-06 | T-159-23 | N/A | typecheck + unit | `yarn typecheck && yarn workspace @openvaa/frontend test:unit` | ✅ existing | ⬜ pending |
| 08-T3 move + codemod + guard + re-anchor | 159-08 | 4 | CMP-06 | T-159-24, T-159-25, T-159-26 | N/A | typecheck + unit + build + lint | `yarn typecheck && yarn workspace @openvaa/frontend test:unit && yarn workspace @openvaa/frontend build && yarn lint:check` | ❌ new guard | ⬜ pending |
| 09-T1 input value-semantics test | 159-09 | 5 | CMP-02 | T-159-27 | emission contract locked | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ new test | ⬜ pending |
| 09-T2 extract four parts | 159-09 | 5 | CMP-02 | T-159-27, T-159-30 | no normalization added | typecheck + unit + lint | `yarn typecheck && yarn workspace @openvaa/frontend test:unit && yarn lint:check` | ✅ 09-T1 | ⬜ pending |
| 09-T3 multilingual + delete workaround | 159-09 | 5 | CMP-02 | T-159-28, T-159-29 | strict typing on new union members | typecheck + unit + lint | `yarn typecheck && yarn workspace @openvaa/frontend test:unit && yarn lint:check` | ✅ 09-T1 | ⬜ pending |
| 10-T1 explicit-zero guard + fix | 159-10 | 6 | CMP-02 | T-159-31, T-159-33 | single validity path | unit + typecheck | `yarn workspace @openvaa/frontend test:unit && yarn typecheck` | ✅ extend existing | ⬜ pending |
| 10-T2 UAT scope decision | 159-10 | 6 | CMP-02 | — | N/A | checkpoint | n/a (decision) | n/a | ⬜ pending |
| 10-T3 UAT path + register entry | 159-10 | 6 | CMP-02 | — | N/A | lint + manual UAT | `yarn lint:check` (+ operator UAT) | ❌ new artifact | ⬜ pending |
| 11-T1 collapse provider default | 159-11 | 7 | CMP-06 | T-159-34, T-159-35, T-159-36 | one authoritative default | unit + typecheck | `yarn workspace @openvaa/frontend test:unit && yarn typecheck` | ✅ provider tests | ⬜ pending |
| 11-T2 file deferred comments | 159-11 | 7 | CMP-01..06 | — | N/A | lint | `yarn lint:check` | n/a | ⬜ pending |
| 11-T3 cardinal E2E gate | 159-11 | 7 | CMP-01..06 | T-159-37, T-159-38 | gate evidence recorded | full suite | `yarn test:unit && yarn lint:check && yarn test:e2e` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

### Requirement → behaviour → command (from RESEARCH § Phase Requirements → Test Map)

| Req | Behaviour | Test type | Automated command | Exists? |
|-----|-----------|-----------|-------------------|---------|
| CMP-01 | Census covers all 92 sites; bucket totals sum to 92 | script self-check | census classifier `--assert-total 92` | ❌ W0 |
| CMP-01 | The 4 converted sites still produce the same value | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 |
| CMP-01 | Converted sites do not go stale on **cold / direct-URL** entry | e2e | `yarn test:e2e --grep "cold-entry"` | ✅ extend `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` |
| CMP-02 | `multipleText` renders through `Input`; the `Exclude<>` cast is gone | typecheck | `yarn typecheck` | ✅ |
| CMP-02 | A multilingual multi-text row behaves like a multilingual text item | unit + e2e | new component test + candidate-journey spec | ❌ W0 |
| CMP-03 | Card/header stay clickable with the right element + `data-testid` | e2e | existing 3 files (`resultsPage.fixture.ts:213`, `perm-show-feedback-survey.spec.ts:209`, `voter-alliance.spec.ts:123`) | ✅ must stay green unchanged |
| CMP-03 | `.hover-shaded` still applies | source scan | `grep -rn 'hover-shaded' apps/frontend/src` ≥ 1 | ❌ W0 |
| CMP-04 | `sessionId`/`shouldTrack` absent from the appContext public surface | unit | `appContext.spread.svelte.test.ts` (**update** `:178-179`) | ✅ update |
| CMP-04 | Producer surface unchanged | unit | `trackingService.svelte.test.ts:192` | ✅ must stay green |
| CMP-05 | Both contexts produce identical rollups pre/post extraction | unit | `candidateContext.svelte.test.ts` (extend) | ✅ extend |
| CMP-05 | No `$derived` alias over `dataRoot` introduced | source scan | `grep -rnE '\$derived(\.by)?\(\s*(this\.#\|ctx\.)dataRoot\s*\)'` → 0 | ❌ W0 |
| CMP-06a | `Alert` renders identically | visual | `PLAYWRIGHT_VISUAL=1 yarn test:e2e --project=visual-regression` | ✅ |
| CMP-06b | `$layouts` resolves in **all three** configs | typecheck + unit + build | `yarn typecheck && yarn test:unit && yarn workspace @openvaa/frontend build` | ✅ only if all three run |
| CMP-06b | No relative imports of the moved route-root components survive | source scan | `grep -rnE "from '(\.\./)+\.?/?(MainContent\|Layout\|Header\|Banner\|MaintenancePage\|SingleCardContent)"` → 0 | ❌ W0 |
| D-N2 | Explicit `minSelections: 0` is not saveable | unit | `yarn workspace @openvaa/frontend test:unit multiChoiceValidity` | ❌ **W0 — named gap** |
| D-N2 | BooleanInput + multi-select UAT path | manual | operator UAT, seeded via `yarn db:seed --template e2e/base` | manual by design |

---

## Wave 0 Requirements

- [ ] `apps/frontend/src/lib/utils/multiChoiceValidity.test.ts` — add `explicit minSelections=0 → count 0 is false`; **demonstrate it failing before the fix**
- [ ] `apps/frontend/src/lib/components/input/Input.svelte` — no unit test exists; add a `multipleText` / multilingual render+emit case
- [ ] `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte` — no unit test; add a validity/errorMessage case before touching its two effects
- [ ] `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` — extend with cold-entry cases for the routes whose contexts criterion 5 changes
- [ ] Source-scan guard: no `$derived` alias over `dataRoot` — commit as a vitest source test, demonstrating both failure modes first (D-G2/D-G4 precedent)
- [ ] Source-scan guard: no surviving relative imports of the moved route-root components
- [ ] Source-scan guard: `.hover-shaded` still defined
- [ ] Census self-check: bucket totals sum to 92
- [ ] `EntityCard.svelte` / `Alert.svelte` — **do not** add unit tests unless visual-regression proves insufficient (scope the criteria do not ask for)

*No framework install needed — vitest and Playwright are both configured and running.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BooleanInput + multi-select choices UAT | D-N2 (operator NOTE) | The reviewer explicitly asked for a **UAT** path, not an automated assertion | `yarn db:reset-with-data` or `yarn db:seed --template e2e/base`, open the documented question route, exercise a boolean question and a multi-select question; the plan must name the seed template, the route, and the expected behaviours |
| `Alert` / `$layouts` semantic-class choice | D-H6 / D-H5 | One-way visual decision — `top-sm` would change rendering 4× (2px → 8px) | `checkpoint:decision` in the plan; if a visual change is accepted, apply to all four `top-2 right-2` sites and update visual baselines |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s for the per-task loop
- [ ] Full `yarn test:e2e` green before verify (cardinal rule)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
