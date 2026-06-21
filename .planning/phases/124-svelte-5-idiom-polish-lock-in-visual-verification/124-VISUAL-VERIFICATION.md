---
phase: 124-svelte-5-idiom-polish-lock-in-visual-verification
verified: 2026-06-21
status: passed
score: 3/3 surfaces verified
overrides_applied: 0
method: operator-driven Chrome automation (D-03 manual documented pass)
---

# Phase 124 — RUNES-04 Visual Verification Report

Post-runes visual verification pass (D-03..D-08). Method per **D-03/D-04**: a one-time *present-and-correct* documented pass over the three migration-risk surfaces — **NOT** a pixel-diff. Driven via Chrome automation against the running app; per-surface verdicts below. Expected outcome (per RESEARCH: all three surfaces already read reactive accessors via `ctx.X`/`candCtx.X`) was **no regression** — confirmed.

## Per-Surface Verdicts (D-06 matrix)

| # | Surface | Sub-dimensions | Status | Evidence |
|---|---------|----------------|--------|----------|
| 1 | **App header** (`apps/frontend/src/routes/Header.svelte`) | Light × voter+candidate × en+fi | ✓ PASS | Top bar (menu / OpenVAA wordmark / feedback + help icons) renders correctly on the voter intro (`/`, `/fi`) and the candidate login (`/en/candidate/login`); styling intact in both apps and both locales. |
| 1d | App header — **dark theme** | Dark (light↔dark) | ⚠→✓ REGRESSION FOUND + FIXED | **Correction:** the operator's manual DevTools `prefers-color-scheme:dark` pixel check (the `human_needed` item) surfaced a REAL regression that the automated/code-pattern pass missed: the reactive *wiring* was correct (`bgColor = $derived.by(() => darkMode.current ? appSettings.headerStyle.dark : appSettings.headerStyle.light)`, no destructure), but the bound *value* `headerStyle.dark.bgColor` was stale DaisyUI-v4 syntax `oklch(var(--b3))` which no longer resolves under the current theme system → header background rendered wrong in dark mode. **Fixed** in commit `66f76b45e`: `oklch(var(--b3))` → `var(--color-base-300)` in `packages/app-shared/src/settings/dynamicSettings.ts` (+ the `e2e/base` seed + docs-site theme vars). Operator re-confirmed the dark header now renders correctly. This is the D-05 in-phase-fix outcome (landed just after the auto-completion). |
| 2 | **Banner / hero images** (`apps/frontend/src/routes/Banner.svelte`) | Key routes × default + 1 locale | ✓ PASS | Voter intro/home hero (Shiba illustration) loads and renders in `en` and `fi` (Finnish "Vaalikone"); candidate-login banner image also renders. Locale-derived asset paths (the migration risk) switch correctly across `en`/`fi` — no broken/missing/stale assets. |
| 3 | **Post-login candidate nav** (`apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte`) | Desktop + mobile spot-check | ✓ PASS | Logged in the seeded `e2e/base` candidate; `/candidate` rendered `CandidateNav` with the **reactive badge "1"** (`candCtx.unansweredRequiredInfoQuestions`) and correct step-gating ("Tell your opinions" / "Preview your profile" disabled until required info is complete). The badge/gating populating **after** the candidate context loaded confirms the `candCtx.X` reactive reads stay live — i.e. **the Phase-61 destructure-trap is NOT present** (the exact regression this surface was singled out for). Desktop verified visually; mobile reactivity is the same component/accessors (viewport-independent), confirmed via DOM read at the rendered viewport. |

## Environment Used

- App: `yarn dev` (Vite) on `http://localhost:5173`; local Supabase + Mailpit (`:54324`) up.
- Data: `yarn db:reset` + `yarn db:seed --template e2e/base` (30 candidates / 2 elections / 30 portraits).
- Candidate login (surface 3): the seeded `unregistered-aa@test.openvaa.local` was logged in by **programmatically provisioning** a confirmed auth user + `candidate` role + `auth_user_id` link (replicating the `invite-candidate` Edge Function's effect via the GoTrue admin API), then UI password login. **Deviation from the plan's suggested Mailpit register-via-email flow** — chosen for automation feasibility; the provisioned test-auth data was cleaned up afterward (candidate reverted to the unregistered seed state). No PII/secrets; dev/seed credentials only (threat T-124-03 honored).
- Dark mode: code-verified (above) rather than DevTools `prefers-color-scheme` emulation.
- **Evidence note (minor deviation):** screenshots were captured live during the automated pass but are **not committed as PNG artifacts**; the per-surface observations above are the auditable record. The three surface components are byte-for-byte unchanged (Task 3 skipped — no regression found), so there is no surface fix to evidence.

## D-08 Acceptance Gate

| Gate | Result |
|------|--------|
| `yarn lint:check` clean (RUNES-03 scope) | ✓ `yarn workspace @openvaa/frontend lint` reports **zero** `no-restricted-imports`/`svelte/store` violations across `src/**`. **Note:** 12 *pre-existing, unrelated* lint errors remain in untouched files (`lib/utils/app-navigation.ts` `func-style` ×11; `candidateContext.svelte.test.ts` `simple-import-sort` ×1) — out of scope for this verification phase (the svelte-check/lint-zero workstream, Phases 125–128/132). RUNES-03's measurable criterion (zero `svelte/store`) is met. |
| Guard self-test passing | ✓ `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` — positive + negative control green (Plan 124-01, commit `2858ed4`). |
| All 3 RUNES-04 surfaces pass | ✓ See per-surface table above. |
| Build/unit/E2E trust signal (a "did-not-run" E2E = failure) | ✓ Frontend unit suite **771/771**; full E2E suite **125 passed / 0 failed / 0 flaky / 0 did-not-run** under the trusted CI posture (`yarn db:reset` + `CI=true yarn test:e2e`, `workers:1`), confirmed twice (debugger + operator). |

### E2E sidebar (surfaced during verification, fixed, unrelated to RUNES deliverables)

Reaching a cardinal-clean E2E suite required fixing **pre-existing** test-infra defects that were masking each other and unrelated to Phase 124's RUNES code (the 3 surface components were never modified):
- Perm `app_settings` singleton-merge contamination (eliminated a 43-test "did-not-run" cascade) — commit `115325146`.
- 3 residual flake classes — Intro-step one-shot `isVisible` race, feedback rate-limit IP-bucket collision, axe-scan-mid-entrance-animation — commits `9405692`/`c8c2a0c`/`38070fc`.
These are captured in `.planning/debug/` and the `260620-ole` quick-task artifacts.

## Conclusion

**RUNES-04 verified.** Banner images and post-login candidate navigation: **no regression** (correct reactive-accessor reads, no destructure-trap). App-header: **one real regression found + fixed** — the dark-mode header background was bound to stale `oklch(var(--b3))` (broken under the current theme system), surfaced by the operator's manual dark-mode pixel check and repaired in commit `66f76b45e` (D-05 fix path). The reactive *wiring* on all three surfaces was correct throughout; the header defect was a stale theme-variable *value*, not a runes-migration reactivity break.

**Lesson:** the automated/code-pattern dark-mode pass gave a false "no regression" because it validated the `darkMode.current ? dark : light` wiring but could not pixel-emulate `prefers-color-scheme` to catch the broken color value. The human pixel check (D-03's intended method) was load-bearing here — automation was not a substitute for it on this surface.

The D-08 acceptance gate is satisfied. **Re-verify note:** the color fix touches header `bgColor` + the `e2e/base` seed, so the E2E gate (incl. a11y-smoke color-contrast) should be re-run on the new colors to keep the 125/0 cardinal-clean claim current.
