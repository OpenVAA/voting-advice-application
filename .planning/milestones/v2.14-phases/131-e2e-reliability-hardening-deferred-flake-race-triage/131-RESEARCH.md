# Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage - Research

**Researched:** 2026-07-22
**Domain:** Playwright E2E flake/race triage; test-helper hardening; coverage-parity auditing (no product feature work)
**Confidence:** HIGH (every triage-target claim was verified against the working tree this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (Fresh 3× re-run per surface):** A todo is CLOSED-AS-STALE only after its **current covering spec** is run **3× cold-start** *in this phase* (fresh `:5173`, clean DB) and passes pass/pass/pass — this-phase-dated evidence, NOT merely a citation of Phase 130's aggregate gate. Run per **unique** covering spec (dedupe shared specs), then cite the green result for each todo that spec covers. The cold-deeplink cluster (#2/#3 + upstream half of #4) is proven by running `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` (the Phase 117 COLD-03 regression gate) 3× as shared canonical resolver evidence, in addition to each todo's own covering spec.
- **D-02 (Parity check; fix gaps in-phase):** Before closing a todo because "the spec was rewritten," confirm the current suite **still asserts the old load-bearing contract**. If a genuine gap is found, **ADD the missing assertion within Phase 131** (do not defer). Pre-identified gap risk (todo #4 — feedback): current suite asserts feedback **dismiss-persistence-across-reload**, but the old flaky test's contract was feedback-**text-persists-across-cancel-then-reopen** (the `bind:this` keep-mounted design) — planner MUST confirm and, if absent, add it. Pre-verified parity (todo #5 — not-located): `perm-not-located-2e2cg.spec.ts` already asserts the exact CLEAN-02 contract → clean stale-closure.
- **D-03 (Harden shared helper + 3× prove):** Root-cause the navigation-timing race behind the Phase 127 run-1 failure at the **helper** level — `navigateToFirstQuestion` (`tests/tests/utils/voterNavigation.ts:282`) — not just the one spec. Harden its wait condition (settings-overlay / nav-settle race), prove `perm-hide-election-tags` 3× green, then regression-check all 5 helper consumers (D-10). Prefer a **test-helper / wait-condition** fix. Escalate + note if root cause is a genuine **product** hydration race (D-09).
- **D-04 (Checkbox TRIAGE doc + move todos; targeted 3×):** Per-todo disposition lives in `131-DISCUSSION-POINTS.md` (doubles as the execution triage tracker). Each triaged todo file gets a **disposition stamp** and moves to **`todos/completed/`** (NOT `done/`). Phase 131 runs **targeted 3×** on any spec it changes/hardens; the full-suite 3× green gate is deferred to Phase 132.
- **D-05 (Scope = all 7):** All 7 `resolves_phase: 131` todos are in scope; `perm-hide-election-tags` (2026-07-16, Phase 127) is the 7th.
- **D-06 (No new skips):** This phase introduces **zero** `test.skip`. Every todo → FIXED or CLOSED-AS-STALE. If a flake genuinely reproduces and cannot be fixed within budget → **escalate to the operator**, never skip.
- **D-07 (New-flake handling):** A fresh 3× run surfacing a NEW flake → file a new todo AND treat it as an in-scope fix candidate (cardinal rule) or escalate. A "did not run" cell counts as a failure.
- **D-08 (Anchor bookkeeping moot):** The `diff-playwright-reports.ts` + `SKIPPED_TESTS` const are deleted — no anchor edits needed.
- **D-09 (Product vs test code):** Default to test-only harden. Product-code change permitted only if root cause is a genuine product race; flag it explicitly.
- **D-10 (Helper regression set):** After hardening `navigateToFirstQuestion`, re-run its 5 consumers: `perm-disable-allow-open`, `perm-hide-category-tags`, `perm-hide-election-tags`, `perm-hide-if-missing-answers` specs + the `minimalVoterResultsPage.fixture.ts` consumer path.
- **D-11 (Execution prereqs):** One **fresh** single dev server on `:5173` (no Playwright `webServer`) + **clean DB** (`yarn db:reset`) before each 3× run.

### Claude's Discretion
- The exact wait-condition mechanism used to harden `navigateToFirstQuestion` (D-03 says prefer a test-helper/wait fix; mechanism choice is open — see this doc's Pattern section for candidates).
- Whether the feedback text-persists-across-cancel contract (todo #4) is a load-bearing product invariant worth an E2E assertion, or an implementation detail intentionally dropped in the rebuild (Open Question 7.1 — affects whether 3.2 adds a spec or closes with rationale).
- Ordering of triage work and how evidence artifacts are captured into the phase `post-fix/` dir.

### Deferred Ideas (OUT OF SCOPE)
- **Full-suite 3× green gate + svelte-check 0/0 flip** → Phase 132 (explicitly out of 131).
- **Any product-code refactor surfaced by triage** (e.g. a `data-state="open|closed"` on the Modal wrapper, or a `data-hydrated` attribute on the party drawer) is only pulled in if a parity gap genuinely requires it (D-02/D-09); otherwise file as a follow-up, don't expand scope.
- The ~40 lower-relevance `todo.match-phase` matches (candidate→party generalization, answer-store migration, Paraglide reconciliation, filter OR-mode UI, etc.) are product/infra backlog — NOT folded. Only the 7 `resolves_phase: 131` flake/race todos are in scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HARDN-01 | The deferred "v2.11+ hardening" flake/race todos are each triaged against the current suite and either fixed (passing 3×) or closed-as-stale with documented rationale. | This research verifies all 7 todos still live in `.planning/todos/pending/` (all `resolves_phase: 131`), maps each to its current covering spec(s) (all confirmed present in the tree), confirms the skip mechanism is fully deleted (0 `test.skip`), locates the one live fix candidate + its helper, and pre-identifies the single real parity gap (todo #4). This gives the planner an exact task list: 1 helper-harden + 5-consumer regression, 1 parity-gap decision, 5 confirm-stale-with-fresh-3× surfaces. |
</phase_requirements>

## Summary

Phase 131 is a **triage-and-hardening** phase, not a build phase. The ROADMAP was written assuming the ~6 deferred todos map to *live skipped tests* that must be un-skipped. **That premise is dead** and this research confirms it against the working tree: there are **0 `test.skip` calls** in the suite, the `SKIPPED_TESTS` const and `tests/scripts/diff-playwright-reports.ts` diff mechanism are **gone**, and every legacy spec the older 6 todos reference (`voter-detail`, `voter-popup-hydration`, `voter-question-rendering`, `voter-feedback-persistence`, `voter-not-located-redirect`, `candidate-settings`) was **deleted and folded** into the v2.14 journey/permutation/probe suite during Phases 118–130.

The work therefore splits cleanly into **two workstreams**. (1) **Six confirm-stale surfaces** — 6 of the 7 todos are prima facie STALE (4 of them shared ONE root cause, the voter-app cold-deeplink `Loading…` race, which Phase 117 fixed and `cold-entry-dataroot.spec.ts` now guards). Each requires this-phase-dated fresh 3× cold-start evidence on its *current* covering spec (D-01) plus a coverage-parity check (D-02) before it can be stamped CLOSED-AS-STALE. (2) **One genuine live fix** — todo #7 `perm-hide-election-tags` (Phase 127 run-1 navigation-timing flake), whose fix is to harden the shared `navigateToFirstQuestion` helper (verified at `voterNavigation.ts:282`), prove the spec 3× green, and regression-check the helper's **5 consumers** (verified: 4 perm specs + `minimalVoterResultsPage.fixture.ts`).

Exactly **one real parity gap** was pre-identified and confirmed by inspection: todo #4 (feedback). The current suite asserts feedback-popup **dismiss-persistence-across-reload** (`perm-show-feedback-survey.spec.ts:74,91`) and "click opens feedback-form" (line 65), but does **NOT** assert the old flaky test's specific contract — feedback **text persists across cancel-then-reopen** (the `Feedback.svelte` `bind:this` keep-mounted design). The planner must decide (Open Question 7.1) whether to ADD that assertion in-phase or close-with-rationale that it was an intentionally-dropped implementation detail. Todos #5 and #6 parity are already CONFIRMED by inspection this session.

**Primary recommendation:** Structure the plan as one helper-harden task (with 5-consumer regression), one feedback parity-gap decision task, and five confirm-stale tasks each gated on a fresh in-phase 3× cold-start run of a *deduplicated* covering spec — with `cold-entry-dataroot.spec.ts` run 3× once as the shared resolver for the cold-deeplink cluster. No new packages, no product feature work, zero new skips.

## Architectural Responsibility Map

The "tiers" here are test-infrastructure layers, not application tiers (this phase touches test code + triage docs, not shipped features).

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Navigation-timing flake fix (todo #7) | Test helper (`voterNavigation.ts`) | — (product only if D-09 escalation) | D-03 fixes the *class* (`navigateToFirstQuestion`), not the instance; product change is escalation-gated |
| Coverage-parity assertions (todo #4 gap) | Spec files (`tests/tests/specs/`) | Product component (only if D-02 requires a `data-state` hook) | Parity is asserted in specs; a product testid hook is a last resort deferred idea |
| Stale-closure evidence (todos #1–6) | Test runner + evidence artifacts (`post-fix/`) | — | Fresh 3× cold-start runs are pure verification, no code change |
| Todo lifecycle (stamp + move) | Triage docs (`131-DISCUSSION-POINTS.md`) + `.planning/todos/` | — | D-04 records disposition and moves files to `todos/completed/` |
| Regression safety (helper blast radius) | Test runner (5-consumer re-run) | — | D-10 mandates re-running all 5 `navigateToFirstQuestion` consumers |

## Standard Stack

**No new packages are installed in this phase.** This is a triage/hardening phase operating entirely inside the existing E2E harness. The package-legitimacy gate and version-verification steps are **N/A** (no `npm install`). The relevant existing tooling:

| Tool | Role | Notes |
|------|------|-------|
| `@playwright/test` | E2E runner (existing) | Config: `tests/playwright.config.ts`; run via root `yarn test:e2e` or scoped `--project=<name>` / `--grep` `[VERIFIED: codebase]` |
| `@openvaa/dev-seed` | DB seeding | `yarn db:reset` (migrations + seed) then `yarn db:seed --template e2e/base` for the base dataset `[VERIFIED: CLAUDE.md + voterNavigation.ts:31]` |
| Supabase CLI (local) | Backend for E2E | Started via `yarn dev` / `yarn db:start`; API on `:54321`, frontend on `:5173` |

### Alternatives Considered
None — the framework choice is fixed by the existing suite. This phase does not evaluate alternatives.

## Package Legitimacy Audit

**N/A — this phase installs zero external packages.** No registry verification required.

## Runtime State Inventory

> This phase renames/moves `.planning/todos/` files and stamps dispositions — it is a lifecycle-mutation phase for triage state, so the inventory applies to *planning artifacts*, not app runtime data.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no app database rows, memories, or datastores carry any Phase-131 string. E2E runs use ephemeral `yarn db:reset` seed data. | None |
| Live service config | None — no external service (n8n, Datadog, etc.) is touched. | None |
| OS-registered state | None — no scheduled tasks, pm2 processes, or launchd plists involved. | None |
| Secrets/env vars | None renamed. E2E uses existing `.env` / `FRONTEND_PORT`; no key changes. | None |
| Build artifacts | None — no package renames; no egg-info/binaries affected. | None |
| **Triage/planning state (this phase's actual mutation)** | 7 todo files in `.planning/todos/pending/` (all `resolves_phase: 131` — VERIFIED present this session); `131-DISCUSSION-POINTS.md` §6 per-todo ledger (currently blank `____`); any spec/helper files changed by the harden. | D-04: stamp each triaged todo with disposition + **move to `todos/completed/`** (NOT `done/`); fill the §6 ledger; capture 3× evidence into `post-fix/`. |

**Verified deleted (no residual references to clean up) [VERIFIED: codebase grep this session]:**
- `test.skip` calls: **0** across `tests/tests/`.
- `SKIPPED_TESTS` const: **0** references anywhere under `tests/`.
- `tests/scripts/diff-playwright-reports.ts`: **GONE**.
- Open Question 7.3 (grep CI/scripts for stale `SKIPPED_TESTS`/diff-script references) is therefore **already answered NEGATIVE** at the source-tree level — the planner should still confirm no CI YAML references them, but the suite itself is clean.

## Architecture Patterns

### Triage Workflow (the phase's core loop)

```
For each of the 7 todos:
  1. Read the todo's "current covering spec(s)" from the CONTEXT map (all verified present).
  2. PARITY CHECK (D-02): does the current suite still assert the old load-bearing contract?
        ├─ YES → proceed to evidence.
        └─ NO  → ADD the missing assertion in-phase (do NOT defer). [only todo #4 at risk]
  3. EVIDENCE (D-01): run the todo's UNIQUE covering spec 3× cold-start (fresh :5173, clean DB).
        ├─ pass/pass/pass → disposition = CLOSED-AS-STALE (cite this-phase evidence).
        └─ any fail       → flake resurfaced → flip to FIX candidate (D-06/D-07), never skip.
  4. STAMP the todo + move to todos/completed/; fill the §6 ledger row.

Special-case todo #7 (perm-hide-election-tags):
  - Root-cause the nav-timing race at navigateToFirstQuestion (voterNavigation.ts:282).
  - Harden the wait condition (test-helper fix preferred; escalate if product race — D-09).
  - Prove perm-hide-election-tags 3× green.
  - Regression-check all 5 consumers (D-10).
```

### Deduplication of covering specs (D-01)

Run each **unique** spec 3× once, then cite it for every todo it covers. From the verified current-suite map:

| Unique spec (all VERIFIED present) | Covers todos |
|---|---|
| `voter/cold-entry-dataroot.spec.ts` (Phase 117 gate) | Shared resolver for #2, #3, #4-upstream (run 3× as canonical cold-deeplink proof) |
| `voter/voter-journey.spec.ts` | #1, #2, #4 |
| `voter/voter-alliance.spec.ts` | #1 |
| `voter/voter-journey-mobile.spec.ts` | #1 |
| `_probes/popupNotice.probe.spec.ts` | #3, #4 (NOTE: `@probe` — see Pitfall 4) |
| `perm/perm-show-feedback-survey.spec.ts` | #3, #4 (parity anchor for #4) |
| `perm/perm-not-located-2e2cg.spec.ts` | #5 (parity CONFIRMED) |
| `perm/perm-per-app-notifications.spec.ts` | #6 |
| `perm/perm-access-disable.spec.ts` | #6 |
| `perm/perm-hide-election-tags.spec.ts` | #7 (the live fix) |

### Pattern: Hardening `navigateToFirstQuestion` (todo #7)

The helper is already substantially race-hardened (see Code Examples for the current source). The Phase 127 run-1 failure was a *navigation-helper timing race* where the product behavior was correct (the `/questions` page rendered with no election tag) but the helper raced. The current helper's terminal settle is:

```ts
// voterNavigation.ts:290-294 (current)
await advanceVoterFlow(page, 'first-question');
await page.waitForURL(/\/questions\//, { timeout: TIMEOUTS.slowPage });
```

**What to investigate first (D-03 / point 4.5):** attempt to reproduce the run-1 race against current HEAD to locate the exact racy await before hardening. If unreproducible after a bounded attempt, harden the wait defensively anyway (helper-class robustness) and record the reasoning. The two most likely hardening points, in order of preference:

1. **Terminal answer-option settle.** `advanceVoterFlow(page, 'first-question')` returns as soon as `answerOption.isVisible()` is true (line 167), but the subsequent `waitForURL(/\/questions\//)` can race a `/questions → /questions/__first__` `onMount` redirect (documented at line 292-293). Consider strengthening the terminal guard so the helper returns only when BOTH the URL matches `/questions/<id>` AND an answer option is stably visible (e.g. a short `expect.poll` or an explicit `answerOption.waitFor({state:'visible'})` *after* the `waitForURL`).
2. **Settings-overlay / nav-settle race** (the family named in D-03 and the Phase-86 walkToQuestion cold-start lineage). If reproduction points at a settings-overlay re-mount stealing focus/interaction during the walk, add a settle on overlay-stability before the terminal assertion. This is the same "cold-start `Loading…`" family that Phase 117 resolved for the deeplink path — so a helper-side settle is the residual, not a product re-fix (default to test-only per D-09).

### Anti-Patterns to Avoid
- **Resurrecting deleted specs.** Triage maps old→new; it does NOT re-create `voter-detail.spec.ts` et al. They were intentionally folded.
- **Spec-local band-aid for todo #7.** D-03 forbids patching only `perm-hide-election-tags.spec.ts`; fix the helper class.
- **`test.skip` as an escape hatch.** D-06: zero new skips. A reproducing unfixable flake → escalate, never skip.
- **Leaning on Phase 130's aggregate gate as evidence.** D-01 requires *this-phase-dated* 3× runs per unique surface.
- **Retry-until-green.** Project cardinal rule: an intermittent failure is a real defect; "did not run" counts as a failure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Waiting for the voter walk to reach the first question | A new hand-rolled home→elections→continue walk (the exact anti-pattern that caused the `perm-hide-election-tags` flake per its docstring) | The existing `navigateToFirstQuestion` / `advanceVoterFlow` race-based passer | The hand-roll skipped the intro page and timed out; the shared helper is resilient to disabled intermediate pages + concurrent settings mutation |
| Cold-deeplink race regression proof | A bespoke new cold-entry spec | The existing `cold-entry-dataroot.spec.ts` (Phase 117 COLD-03 negative-control gate) | It already FAILS pre-fix / PASSES post-fix on the exact race; it is the canonical resolver evidence |
| Not-located redirect-chain assertion | A new `?next=` bounce spec | `perm-not-located-2e2cg.spec.ts` (already asserts all 5 CLEAN-02 contracts, verified line 54-99) | Parity already CONFIRMED |
| Dedup/skip diffing across runs | Re-implementing `diff-playwright-reports.ts` / `SKIPPED_TESTS` | Nothing — the mechanism is deleted; the signal is the full-suite 3× cold-start gate (Phase 132) | D-08: resolved-by-deletion |

**Key insight:** Nearly all the machinery this phase needs already exists and is verified present. The phase is mostly *running* existing specs with rigor and *stamping* dispositions — the only net-new code is (a) the helper harden for todo #7 and (b) possibly one parity assertion for todo #4.

## Common Pitfalls

### Pitfall 1: Treating Phase 130's green gate as sufficient evidence
**What goes wrong:** Closing a todo by citing "the suite passed Phase 130's 3× gate" instead of running a fresh in-phase 3×.
**Why it happens:** It's faster and the suite is already green.
**How to avoid:** D-01 is explicit — run each *unique* covering spec 3× cold-start *in this phase*, dated now, captured to `post-fix/`.
**Warning signs:** A disposition stamp that cites a Phase-130 artifact path instead of a Phase-131-dated one.

### Pitfall 2: Silent coverage loss on stale-closure
**What goes wrong:** Closing todo #4 as stale when the specific `bind:this` text-persistence contract is genuinely uncovered — dropping a load-bearing assertion.
**Why it happens:** The current suite DOES assert *a* feedback contract (dismiss-persistence-across-reload), which looks like coverage at a glance.
**How to avoid:** D-02 parity gate. Confirmed this session: `perm-show-feedback-survey.spec.ts` asserts dismiss-persistence (lines 74, 91) + "click opens feedback-form" (line 65) but NOT text-persists-across-cancel-then-reopen. Decide per Open Question 7.1: ADD the assertion or close-with-explicit-rationale.
**Warning signs:** A #4 stale-closure with no note about the `bind:this` contract.

### Pitfall 3: Helper harden regresses the perm cluster
**What goes wrong:** A bad harden of `navigateToFirstQuestion` breaks other consumers.
**Why it happens:** 5 consumers share the helper (VERIFIED: `perm-hide-election-tags`, `perm-hide-if-missing-answers`, `perm-hide-category-tags`, `perm-disable-allow-open` specs + `minimalVoterResultsPage.fixture.ts`).
**How to avoid:** D-10 mandatory 5-consumer regression re-run (ideally a full perm + voter smoke) after the harden.
**Warning signs:** Only `perm-hide-election-tags` re-run after the change.

### Pitfall 4: The popup probe spec is `@probe`-tagged and excluded from the default run
**What goes wrong:** Running `yarn test:e2e` and assuming `_probes/popupNotice.probe.spec.ts` ran — it does not. The default script is `playwright test ... --grep-invert @probe`, and probes run via the separate `test:e2e:probes` / `--project=_probes` path `[VERIFIED: package.json:27-28]`.
**Why it happens:** The CONTEXT map lists the probe as covering todos #3/#4.
**How to avoid:** When the evidence surface for #3/#4 is the probe, run it explicitly with `--project=_probes` (or `test:e2e:probes`). Prefer the non-probe covering specs (`perm-show-feedback-survey`, `voter-journey`) as primary evidence and treat the probe as supplementary.
**Warning signs:** A "did not run" cell for the probe treated as a pass (D-07: did-not-run = failure).

### Pitfall 5: Stale dev server steals `:5173`
**What goes wrong:** A leftover dev server serves stale SSR/HMR modules and poisons the 3× run.
**Why it happens:** There is no Playwright `webServer` for the voter/perm projects (baseURL is a bare `http://localhost:5173`, VERIFIED config line 80; the only `webServer` entries are for the bank-auth mock-OIDC issuer).
**How to avoid:** D-11 — one FRESH single dev server on `:5173` + `yarn db:reset` before each 3× run. Per project memory, Vite HMR can serve stale modules mid-debug — restart to trust results.
**Warning signs:** Intermittent, un-reproducible failures that vanish on dev-server restart.

### Pitfall 6: Moving todos to `done/` instead of `completed/`
**What goes wrong:** D-04 explicitly routes triaged `resolves_phase:`-tagged todos to `todos/completed/`, NOT `done/` (which holds independently-finished todos). This is a flagged deviation from the option-preview wording.
**How to avoid:** Move to `.planning/todos/completed/` and stamp disposition.

## Code Examples

### Current `navigateToFirstQuestion` + terminal settle (the harden target)
```ts
// Source: tests/tests/utils/voterNavigation.ts:282-295 (VERIFIED this session)
export async function navigateToFirstQuestion(page: Page): Promise<void> {
  const voterHomePage = createVoterHomePage(page);
  await voterHomePage.goToPage('en');
  await voterHomePage.clickStart();
  await advanceVoterFlow(page, 'first-question');
  // Ensure the URL has settled on a real question page — the questions intro
  // page can redirect /questions → /questions/__first__ via onMount; this
  // wait prevents the caller's downstream waitForURL from racing the redirect.
  await page.waitForURL(/\/questions\//, { timeout: TIMEOUTS.slowPage });
}
```

### `advanceVoterFlow` terminal short-circuit (where the answer-option race lives)
```ts
// Source: tests/tests/utils/voterNavigation.ts:161-167 (VERIFIED this session)
for (let step = 0; step < maxSteps; step++) {
  await anyCheckpoint.waitFor({ state: 'visible', timeout: perStepTimeout });
  // Probe each checkpoint in priority order: closest-to-terminal first so
  // an already-visible answer option short-circuits the loop.
  if (await answerOption.isVisible()) return;   // <-- returns before URL settle
  ...
}
```
**Candidate harden (test-only, D-09-preferred):** after the existing `waitForURL(/\/questions\//)`, add a stable terminal guard so the helper returns only once an answer option is visible on the settled `/questions/<id>` URL — e.g. `await answerOption.waitFor({ state: 'visible', timeout: TIMEOUTS.element });`. Reproduce the run-1 race first (4.5) to confirm this is the racy await before committing to the mechanism.

### Cold-deeplink resolver gate (canonical stale-closure evidence for the cluster)
```ts
// Source: tests/tests/specs/voter/cold-entry-dataroot.spec.ts:31-42 (VERIFIED this session)
test('cold direct-URL entry to /en/elections renders the populated elections list', async ({ page }) => {
  await page.goto('/en/elections');                       // bare hard nav = the cold entry
  await expect(page.getByTestId(testIds.voter.elections.list))
    .toBeVisible({ timeout: TIMEOUTS.slowPage });
  await expect(page.getByTestId(testIds.voter.elections.option).first())
    .toBeVisible({ timeout: TIMEOUTS.element });
});
```

### Feedback parity — what IS asserted vs. the gap
```ts
// Source: tests/tests/specs/perm/perm-show-feedback-survey.spec.ts (VERIFIED this session)
// line 65: 'header-feedback visible on voter intro; click opens feedback-form'
//          → getByTestId('feedback-form').toBeVisible()          [covers: open]
// line 74: 'feedback popup ... dismiss persists across reload'
//          → popups.dismissAndReload('feedback')                 [covers: dismiss-persist]
// line 91: 'survey popup ... dismiss persists across reload'     [covers: dismiss-persist]
//
// GAP (todo #4): NO assertion that feedback TEXT persists across cancel-then-reopen
//   (the Feedback.svelte bind:this keep-mounted design). Decide per OQ 7.1.
```

### Run commands (D-01 / D-11)
```bash
# Prereq before each 3× run:
yarn db:reset                 # clean DB (DB only; does not touch vite cache)
yarn dev                      # fresh single dev server on :5173 (no Playwright webServer)

# Targeted single-surface run (repeat 3×, capture to post-fix/):
yarn playwright test -c ./tests/playwright.config.ts --project=cold-entry-dataroot
yarn playwright test -c ./tests/playwright.config.ts ./tests --grep "perm-hide-election-tags"
# Probe surface (todos #3/#4) — NOT in the default run:
yarn playwright test -c ./tests/playwright.config.ts --project=_probes
```

## Per-Todo Triage Findings (the verified map)

All 7 todo files confirmed present in `.planning/todos/pending/`, all `resolves_phase: 131` `[VERIFIED: grep this session]`. All listed covering specs confirmed present `[VERIFIED: ls this session]`.

| # | Todo file | Current covering spec(s) — verified present | Prima facie disposition | Parity status (this session) |
|---|-----------|---------------------------------------------|-------------------------|------------------------------|
| 1 | `2026-05-14-party-drawer-boundary-flake-residual.md` | `voter/voter-journey.spec.ts`, `voter/voter-alliance.spec.ts`, `voter/voter-journey-mobile.spec.ts` | STALE (verify tabs parity) | LIKELY OK — `voter-alliance` asserts entity-detail drawer + exact tab set (lines 50-101); `voter-journey` asserts results entity tabs w/ parties/candidates switching (line 936). Planner confirms info/candidates/opinions tab-open contract per point 3.4. |
| 2 | `2026-05-14-qspec-walkToQuestion-cold-start-race.md` | `voter/voter-journey.spec.ts` + `voter/cold-entry-dataroot.spec.ts` | STALE (Phase 117) | Cold-deeplink cluster — resolved by Phase 117; confirm boolean+categorical render paths in `voter-journey` per point 3.5 |
| 3 | `2026-05-16-voter-popup-hydration-layout-03-deeplink.md` | `_probes/popupNotice.probe.spec.ts`, `perm/perm-show-feedback-survey.spec.ts` + `cold-entry-dataroot` | STALE (Phase 117) | Confirm popup-surfaces-through-root-layout-slot on `/results` (point 3.6). NOTE probe is `@probe`-excluded (Pitfall 4) |
| 4 | `2026-05-16-voter-feedback-persistence-second-pass.md` | `voter/voter-journey.spec.ts`, `perm/perm-show-feedback-survey.spec.ts`, `_probes/popupNotice.probe.spec.ts` | STALE **+ parity gap** | **GAP CONFIRMED this session** — dismiss-persistence-across-reload IS asserted (lines 74/91); text-persists-across-cancel-then-reopen (`bind:this`) is NOT. Decide OQ 7.1 |
| 5 | `2026-05-16-voter-not-located-redirect-clean-02.md` | `perm/perm-not-located-2e2cg.spec.ts` | STALE (parity CONFIRMED) | **CONFIRMED this session** — asserts "/results bounces twice → resumes /results" (line 54-75) + 4 more contracts. Clean stale-closure |
| 6 | `2026-05-21-candidate-settings-notifications-voterapp-mount-lifecycle.md` | `perm/perm-per-app-notifications.spec.ts`, `perm/perm-access-disable.spec.ts` | STALE (runes 123/124) | LIKELY OK — `perm-per-app-notifications` asserts "voter route shows voter notification only" + "candidate route shows candidate notification only" (lines 19/31). Confirm `notifications.voterApp` contract per point 3.7 |
| 7 | `2026-07-16-perm-hide-election-tags-navigation-timing-flake.md` | `perm/perm-hide-election-tags.spec.ts` (+ helper) | **FIX (harden helper)** | Live fix — harden `navigateToFirstQuestion`, 3× green, regression-check 5 consumers (D-10) |

**Helper consumers (D-10) — all VERIFIED present this session:**
`perm/perm-hide-election-tags.spec.ts`, `perm/perm-hide-if-missing-answers.spec.ts`, `perm/perm-hide-category-tags.spec.ts`, `perm/perm-disable-allow-open.spec.ts`, `fixtures/voter/minimalVoterResultsPage.fixture.ts`. (Exactly 5 — matches D-10.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `test.skip()` + `SKIPPED_TESTS` const + `diff-playwright-reports.ts` SHA-diff gate | Zero skips; determinism signal = full-suite 3× cold-start gate | v2.14 rebuild (Phases 118–130) | The whole skip-bookkeeping surface is deleted (D-08); triage maps old→new instead of un-skipping |
| Per-behavior voter specs (`voter-detail`, `voter-popup-hydration`, `voter-question-rendering`, `voter-feedback-persistence`, `voter-not-located-redirect`, `candidate-settings`) | Folded into `voter-journey` / `voter-alliance` / `perm-*` / `_probes` | Phases 118–130 | Every legacy spec the older 6 todos reference is deleted; parity check bridges the gap |
| Cold-deeplink `Loading…` race (4 todos' shared root cause) | Fixed by Phase 117 dataRoot `#version`-bridge direct-read codemod; guarded by `cold-entry-dataroot.spec.ts` | Phase 117 (v2.13) | Todos #2/#3/#4-upstream are resolved-by-prior-work; need fresh 3× confirmation only |

**Deprecated/outdated:**
- The ROADMAP's "todos map to live skipped tests" premise — disproved by scout, VERIFIED dead this session (0 skips).
- The ROADMAP's "~6 todos" count — undercounts by one; scope is 7 (D-05).

## Validation Architecture

> `workflow.nyquist_validation` is **absent** from `.planning/config.json` → treated as **enabled**. `[VERIFIED: config.json this session]`

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `@playwright/test` (existing) |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn playwright test -c ./tests/playwright.config.ts ./tests --grep "<surface>"` |
| Full suite command | `yarn test:e2e` (deferred to Phase 132; this phase runs targeted 3× only per D-04) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| HARDN-01 (#7 fix) | `navigateToFirstQuestion` no longer races; election-tag absent on `/questions` | e2e | `yarn playwright test -c ./tests/playwright.config.ts ./tests --grep "perm-hide-election-tags"` ×3 | ✅ |
| HARDN-01 (cluster) | Cold-deeplink dataRoot populate lands on cold entry | e2e | `yarn playwright test -c ./tests/playwright.config.ts --project=cold-entry-dataroot` ×3 | ✅ |
| HARDN-01 (#4 parity) | Feedback text persists across cancel-then-reopen (IF added per OQ 7.1) | e2e | new assertion in `perm-show-feedback-survey.spec.ts` or `voter-journey.spec.ts` | ⚠️ conditional — only if 7.1 decides ADD |
| HARDN-01 (#5) | `/results` cold → bounces twice → resumes `/results` | e2e | `yarn playwright test ... --grep "perm-not-located"` ×3 | ✅ |
| HARDN-01 (#6) | Per-app notification isolation (voter vs candidate route) | e2e | `yarn playwright test ... --grep "perm-per-app-notifications"` ×3 | ✅ |
| HARDN-01 (#1) | Party/entity-detail drawer tabs render | e2e | `yarn playwright test --project=voter-journey` / `voter-alliance` ×3 | ✅ |
| HARDN-01 (#5-consumer regression) | Helper harden doesn't regress consumers | e2e | run all 4 perm specs + `minimalVoterResultsPage` path | ✅ |

### Sampling Rate
- **Per triaged surface:** the surface's unique covering spec run **3×** cold-start (D-01).
- **Per helper change:** 5-consumer regression re-run (D-10), ideally a full perm + voter smoke.
- **Phase gate:** targeted 3× green on every changed/hardened spec; **full-suite 3× → Phase 132** (D-04).

### Wave 0 Gaps
- Conditional: one new parity assertion for todo #4 (feedback text-persists-across-cancel-then-reopen) — **only if** OQ 7.1 decides ADD. If close-with-rationale, no new test file.
- Otherwise: **None** — all covering specs and the helper already exist; this phase runs and hardens existing infrastructure.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Local Supabase stack | All E2E 3× runs | Assumed ✓ (per project E2E prereqs) | local CLI | — (blocking; `yarn db:start`) |
| Fresh dev server on `:5173` | D-11 execution prereq | Must be started fresh per run | — | — (stale server steals port — Pitfall 5) |
| Playwright browsers | Runner | Assumed ✓ | — | `yarn playwright install` |
| `e2e/base` seed template | Voter/perm specs | ✓ (`yarn db:seed --template e2e/base`) | — | — |

**Missing dependencies with no fallback:** None expected — per project memory, this `-gsd` repo runs E2E clean via host Vite + local Supabase (no Docker/LocalStack blocker). Confirm at execution time.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Phase-127 run-1 flake root cause is the `advanceVoterFlow` terminal answer-option-vs-`waitForURL` race (candidate harden point 1), rather than a settings-overlay re-mount race | Architecture Patterns / Code Examples | Medium — if the true racy await is elsewhere (or a genuine product hydration race), the harden targets the wrong line; D-03/4.5 mandates reproduce-first, and D-09 escalation covers the product-race case |
| A2 | Playwright `--project`/`--grep` scoping and `--grep-invert @probe` behave as documented (probe excluded from default `test:e2e`) | Pitfall 4 / Run commands | Low — `--grep-invert @probe` is VERIFIED in `package.json:27`; the exclusion *behavior* is standard Playwright and stable at the Jan-2026 cutoff, but flagged as not re-verified against live docs this session |
| A3 | Todos #1 and #6 parity is adequately covered by the folded specs (drawer tabs / per-app notifications) | Per-Todo Triage Findings | Low-Medium — inspection this session shows the relevant assertions exist, but the planner must confirm the *specific* old contract (info/candidates/opinions tab-open for #1; `notifications.voterApp` for #6) per points 3.4/3.7 |
| A4 | The local Supabase + host-Vite E2E environment is available and green in this `-gsd` repo | Environment Availability | Low — corroborated by project memory (`project_gsd_repo_e2e_runs_clean.md`), but not re-run this session |

## Open Questions

1. **Is the feedback text-persists-across-cancel contract still a load-bearing product invariant?** (OQ 7.1)
   - What we know: the current suite asserts dismiss-persistence-across-reload + open (VERIFIED lines 65/74/91) but NOT the `bind:this` text-persists-across-cancel-then-reopen contract.
   - What's unclear: whether that contract was intentionally dropped in the rebuild or is a real invariant.
   - Recommendation: planner adds a small task to inspect `Feedback.svelte` / `FeedbackModal.svelte` `bind:this` design; if the keep-mounted behavior is still product-intentional, ADD the assertion in-phase (D-02); else close #4 with explicit rationale documenting the intentional drop.

2. **Does any todo's fresh 3× run resurface a live flake?** (OQ 7.2)
   - What we know: 6 of 7 are prima facie stale; the cold-deeplink cluster is Phase-117-resolved.
   - What's unclear: whether a resurfaced flake flips CLOSED-AS-STALE → FIX under D-06.
   - Recommendation: pre-agree the budget/escalation path — a reproducing flake becomes an in-scope fix candidate or an operator escalation, never a skip.

3. **Any residual `SKIPPED_TESTS` / diff-script reference in CI config?** (OQ 7.3)
   - What we know: source tree is clean (0 refs, script deleted — VERIFIED).
   - What's unclear: CI YAML / GitHub Actions were not grepped this session.
   - Recommendation: one-line grep of `.github/` + any CI scripts during planning so Phase 132's gate has nothing stale to trip on.

## Sources

### Primary (HIGH confidence — verified against the working tree this session)
- `tests/tests/utils/voterNavigation.ts` — full read; helper at :282, `advanceVoterFlow` race loop, terminal settle
- `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` — Phase 117 gate, full read
- `tests/tests/specs/perm/perm-hide-election-tags.spec.ts` — the live fix spec, full read
- `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` (lines 60-107) — feedback parity anchor
- `tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts` — CLEAN-02 parity CONFIRMED
- `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` — #6 parity
- `tests/tests/specs/voter/voter-alliance.spec.ts`, `voter-journey.spec.ts` — #1 tabs/drawer parity
- `tests/playwright.config.ts` + `package.json` — projects, `--grep-invert @probe`, no webServer for voter/perm
- Grep audits: 0 `test.skip`, 0 `SKIPPED_TESTS`, `diff-playwright-reports.ts` GONE, 7 `resolves_phase: 131` todos in pending/
- The 7 todo files (full read) + `131-CONTEXT.md` + `131-DISCUSSION-POINTS.md`

### Secondary (MEDIUM confidence)
- `.planning/debug/dataroot-stale-direct-nav.md`, `.planning/spikes/024-derived-alias-stable-ref-skip/README.md` (existence VERIFIED; content is the Phase-117 root-cause record, not re-read in full)
- `CLAUDE.md` §dataRoot `#version`-bridge carve-out; project memory (`project_gsd_repo_e2e_runs_clean.md`, `project_e2e_execution_devserver_prereq.md`)

### Tertiary (LOW confidence)
- Playwright `--grep`/`--project`/probe-exclusion runtime behavior — training knowledge (Jan-2026 cutoff), not re-verified against live docs (A2)

## Metadata

**Confidence breakdown:**
- Triage map + covering-spec existence: HIGH — every file verified present this session
- Skip-mechanism deletion: HIGH — grep-verified (0 skips, const + script gone)
- Feedback parity gap (todo #4): HIGH — confirmed by direct inspection of asserted vs. missing contracts
- Helper harden mechanism (todo #7): MEDIUM — the racy await is a well-reasoned hypothesis (A1); D-03/4.5 reproduce-first de-risks it
- Todo #1/#6 parity adequacy: MEDIUM — assertions exist; specific old-contract confirmation left to planner (A3)

**Research date:** 2026-07-22
**Valid until:** ~2026-08-21 (30 days; the suite is in its final v2.14 shape, but any pre-Phase-132 spec edits could shift covering-spec line numbers)
