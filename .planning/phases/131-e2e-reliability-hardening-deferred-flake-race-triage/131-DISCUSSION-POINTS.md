# Phase 131 — Discussion Points (all points, checkbox tracker)

**Gathered:** 2026-07-22 · **Scope:** triage 7 deferred flake/race todos against the current suite.

Legend: `[x]` decided · `[ ]` open/for-execution · **D-NN** cross-refs `131-CONTEXT.md`.

---

## 1. Premise & scope

- [x] **1.1** ROADMAP premise (todos map to *live skipped tests*) is **outdated** — scout
  disproved it. The v2.14 rebuild deleted the specs and the skip mechanism. → triage = map
  old→new + confirm-stale + parity, not un-skip. *(LOCKED in CONTEXT domain)*
- [x] **1.2** Scope = **all 7** `resolves_phase: 131` todos (ROADMAP "~6" undercounts). **D-05**
- [x] **1.3** `perm-hide-election-tags` (2026-07-16, Phase 127) is the 7th and the **only** live
  current-suite spec. **D-05 / D-03**
- [x] **1.4** Disposition is binary-terminal: **FIXED** or **CLOSED-AS-STALE** — no new
  "deferred" state (ROADMAP SC #3). **D-06**
- [x] **1.5** This phase introduces **zero new `test.skip`**; a genuinely-reproducing,
  can't-fix-in-budget flake → **escalate to operator**, never skip. **D-06**
- [x] **1.6** A NEW flake surfaced by triage → file todo + fix in-scope (cardinal rule) or
  escalate; "did not run" = failure. **D-07**

## 2. Evidence standard (stale-closure)

- [x] **2.1** **Fresh 3× re-run per surface** — run each todo's current covering spec 3×
  cold-start *in this phase*; don't lean solely on Phase 130's aggregate gate. **D-01**
- [x] **2.2** Run per **unique** covering spec (dedupe), cite for each todo it covers. **D-01**
- [x] **2.3** Cold-deeplink cluster (#2/#3/#4-upstream) shared proof = **`cold-entry-dataroot.spec.ts`**
  (Phase 117 gate) run 3×, in addition to each todo's own covering spec. **D-01**
- [x] **2.4** Execution prereqs per run: fresh single `:5173` dev server (no Playwright
  `webServer`), clean DB via `yarn db:reset`. **D-11**
- [x] **2.5** *(execution)* Capture pass/pass/pass evidence artifacts per surface into the phase
  `post-fix/` dir; reference them in each todo's disposition stamp. *(Plan 01: `131-not-located-3x.txt`, `131-notifications-3x.txt` captured; each cited in its todo stamp.)*

## 3. Coverage-parity gate

- [x] **3.1** Parity check per todo before stale-closure; **fix gaps in-phase** (don't defer). **D-02**
- [x] **3.2** **Pre-identified gap risk — todo #4 (feedback):** current suite asserts
  dismiss-persistence-**across-reload** (`perm-show-feedback-survey.spec.ts:74,91`) but NOT the
  old text-persists-**across-cancel-then-reopen** (`bind:this`) contract. → planner must
  confirm; if absent, **add the assertion**. **D-02**
- [x] **3.3** **Parity CONFIRMED — todo #5 (not-located):** `perm-not-located-2e2cg.spec.ts`
  asserts "/results → bounces twice → resumes /results" (the CLEAN-02 contract) + 4 more. **D-02**
- [x] **3.4** *(execution)* Parity-verify todo #1 party-drawer **info/candidates/opinions tabs**
  are still asserted (voter-journey / voter-alliance) — add if the tab-open contract was dropped.
  → CONFIRMED: `voter-journey.spec.ts:1337` asserts the org/party drawer `expectTabs(['info','children','opinions'])` (info/candidates/opinions) + `voter-alliance.spec.ts:127` asserts the alliance `['info','children']` tab-control. No gap; no assertion added.
- [x] **3.5** *(execution)* Parity-verify todo #2 boolean + categorical question **render** paths
  are asserted in `voter-journey` (were `voter-question-rendering` cells #7/#8).
  → CONFIRMED: `voter-journey.spec.ts` asserts boolean (`baseOpinion5Boolean` heading, :845/:883) + categorical (`baseOpinion4Categorical` render, :807) + the `{#key question.type}` boundary remount (:868). No gap; no assertion added.
- [ ] **3.6** *(execution)* Parity-verify todo #3 **popup-surfaces-through-root-layout-slot** on
  `/results` (popupNotice.probe / perm-show-feedback-survey).
- [x] **3.7** *(execution)* Parity-verify todo #6 **notifications.voterApp** per-app-notification
  contract in `perm-per-app-notifications` / `perm-access-disable`. *(Plan 01: CONFIRMED — voter-route-only + candidate-route-only isolation both asserted with strict cross-route absence; no gap, no assertion added.)*

## 4. perm-hide-election-tags (live candidate)

- [x] **4.1** **Harden shared helper + 3× prove** (not spec-local band-aid). **D-03**
- [x] **4.2** Target = `navigateToFirstQuestion` (`voterNavigation.ts:282`) wait condition
  (settings-overlay / nav-settle race, same family as the Phase-86 walkToQuestion cold-start). **D-03**
- [x] **4.3** Prefer test-helper / wait-condition fix; escalate + note if root cause is a genuine
  **product** hydration race. **D-09**
- [x] **4.4** After harden, **regression-check 5 consumers**: `perm-disable-allow-open`,
  `perm-hide-category-tags`, `perm-hide-election-tags`, `perm-hide-if-missing-answers` +
  `minimalVoterResultsPage.fixture.ts`. **D-10**
- [x] **4.5** *(execution)* Root-cause first: attempt to reproduce the run-1 race against current
  HEAD to locate the exact racy await before hardening; if unreproducible after a bounded attempt,
  harden the wait defensively anyway (helper class robustness) and record the reasoning.
  → REPRO-1 passed 81/0/0 (race did NOT reproduce; 2 further iterations contaminated by an unrelated
  vite dev-server crash). Racy await located by code-read: the `advanceVoterFlow` answer-option
  short-circuit vs. the `/questions → /questions/__first__` onMount redirect. Hardened DEFENSIVELY.
- [x] **4.6** *(execution)* Prove `perm-hide-election-tags` 3× green post-harden.
  → pass/pass/pass, 81 each (`post-fix/131-perm-hide-election-tags-3x.txt`).

## 5. Records, todo lifecycle & this-phase gate

- [x] **5.1** Per-todo disposition captured in **this checkbox doc** (`131-DISCUSSION-POINTS.md`),
  doubling as the execution triage tracker. **D-04**
- [x] **5.2** Each triaged todo gets a **disposition stamp** and moves to **`todos/completed/`**
  (per `resolves_phase:` precedent; NOT `done/` — minor deviation from the option preview). **D-04**
- [x] **5.3** Phase 131 runs **targeted 3×** on any changed spec; **full-suite 3× → Phase 132**. **D-04**
- [x] **5.4** **Anchor bookkeeping moot** — `diff-playwright-reports.ts` + `SKIPPED_TESTS` +
  the Phase-87 cell-#3 anchor binding are all deleted; nothing to update. **D-08**
- [x] **5.5** Product-code change only if a parity gap / root cause genuinely requires it; else
  file follow-up, don't expand scope. **D-09**

## 6. Per-todo disposition ledger *(filled during execution)*

- [x] **#1** party-drawer boundary → disposition: **CLOSED-AS-STALE** · covering spec 3× result: **pass/pass/pass** (`voter-alliance` + `voter-journey-mobile`, 4 each; `post-fix/131-party-drawer-3x.txt`; + shared `voter-journey` carrying the :1337 tab assertion) · parity: CONFIRMED (org drawer info/children/opinions @ voter-journey:1337 + alliance info/children @ voter-alliance:127; no assertion added)
- [x] **#2** qspec cold-start (#7/#8) → disposition: **CLOSED-AS-STALE** · covering spec 3× result: **pass/pass/pass** (`cold-entry-dataroot` resolver + `voter-journey`, 4 each; `post-fix/131-cold-entry-dataroot-3x.txt` + `post-fix/131-voter-journey-3x.txt`) · parity: CONFIRMED (boolean+categorical render asserted in voter-journey; no assertion added)
- [ ] **#3** popup-hydration LAYOUT-03 (#6) → disposition: `____` · covering spec 3× result: `____` · parity: `____`
- [ ] **#4** feedback-persistence (#5) → disposition: `____` · covering spec 3× result: `____` · **parity gap? add assertion?** `____`
- [x] **#5** not-located CLEAN-02 → disposition: **CLOSED-AS-STALE** · covering spec 3× result: **pass/pass/pass** (`perm-not-located-2e2cg.spec.ts`, 38 each; `post-fix/131-not-located-3x.txt`) · parity: CONFIRMED
- [x] **#6** notifications.voterApp (#3) → disposition: **CLOSED-AS-STALE** · covering spec 3× result: **pass/pass/pass** (`perm-per-app-notifications` + `perm-access-disable`, 47 each; `post-fix/131-notifications-3x.txt`) · parity: CONFIRMED (no gap; no assertion added)
- [x] **#7** perm-hide-election-tags → disposition: **FIXED** · helper hardened: **yes** (`navigateToFirstQuestion` terminal answer-option settle, commit a6ba83c5a; test-only) · 3× green: **pass/pass/pass** (81 each; `post-fix/131-perm-hide-election-tags-3x.txt`) · 5-consumer regression: **pass** (89 passed, 0 failed, 0 did-not-run; `post-fix/131-helper-consumer-regression.txt`)

## 7. Open questions carried to research/planning

- [ ] **7.1** Is the feedback text-persists-across-cancel contract (3.2) still a load-bearing
  *product* invariant worth an E2E assertion, or was it an implementation detail dropped
  intentionally in the rebuild? (Affects whether 3.2 adds a spec or closes with rationale.)
- [ ] **7.2** For any todo whose covering spec 3× **fails** (a live flake resurfaces), does it
  flip from CLOSED-AS-STALE to a FIX candidate under the D-06 no-skip rule — confirm budget/escalation.
- [ ] **7.3** Confirm no residual reference to the deleted `SKIPPED_TESTS` / diff script remains
  in CI config or scripts (grep) so Phase 132's gate has nothing stale to trip on.

---

*Phase: 131-e2e-reliability-hardening-deferred-flake-race-triage · 2026-07-22*
