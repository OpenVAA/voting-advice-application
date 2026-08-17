# Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage - Context

**Gathered:** 2026-07-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Triage the **7 deferred flake/race todos** carrying `resolves_phase: 131` against the
**current** E2E suite. Each todo resolves to exactly one of two terminal dispositions:

- **FIXED** — passing 3× deterministically (fresh `:5173` server, clean DB), or
- **CLOSED-AS-STALE** — the flake is no longer reproducible / was resolved by prior
  work (the v2.14 suite rebuild + Phase 117 dataRoot cold-entry fix), with documented
  rationale **and** a coverage-parity check proving no assertion was silently dropped.

No todo may be left in an undocumented "deferred" state (ROADMAP SC #3), and this phase
**introduces zero new `test.skip`** — FIXED or CLOSED-AS-STALE only.

**Scope-shift discovered during scout (LOCKED):** the ROADMAP wrote Phase 131 assuming
these todos map to *live skipped tests*. They do not anymore. The v2.14 rebuild
(Phases 118–130) **deleted every spec the older 6 todos reference** and **removed the
entire skip mechanism** (`tests/scripts/diff-playwright-reports.ts` + its `SKIPPED_TESTS`
const are gone; **zero `test.skip` calls remain** in the suite). 4 of the 7 shared ONE
root cause — the voter-app cold-deeplink `Loading…` race — which **Phase 117** fixed and
which the new `cold-entry-dataroot.spec.ts` now guards as a regression gate. The current
suite already passed **Phase 130's D-05 3× determinism gate**. So this phase is mostly a
**rigorous confirm-stale-with-fresh-evidence + coverage-parity** exercise, plus **one**
genuine live-triage candidate (`perm-hide-election-tags`).

**Out of scope:** the milestone-close full-suite 3× green gate and the svelte-check 0/0
flip — those are Phase 132. Building/rewriting feature specs — that was Phases 118–130.
</domain>

<decisions>
## Implementation Decisions

### Evidence standard for stale-closure
- **D-01 (Fresh 3× re-run per surface):** A todo is CLOSED-AS-STALE only after its
  **current covering spec** is run **3× cold-start** in *this* phase (fresh `:5173`,
  clean DB) and passes pass/pass/pass — this-phase-dated evidence, NOT merely a citation
  of Phase 130's aggregate gate. Run per **unique** covering spec (dedupe shared specs),
  then cite the green result for each todo that spec covers.
  - The cold-deeplink cluster (todos #2/#3 + the upstream half of #4) is proven by running
    **`tests/tests/specs/voter/cold-entry-dataroot.spec.ts`** (the Phase 117 COLD-03
    regression gate) 3× as the shared canonical resolver evidence, in addition to each
    todo's own covering spec.

### Coverage-parity gate before stale-closure
- **D-02 (Parity check; fix gaps in-phase):** Before closing a todo because "the spec was
  rewritten," confirm the current suite **still asserts the old load-bearing contract**.
  If a genuine gap is found, **ADD the missing assertion within Phase 131** (do not defer).
  - **Pre-identified gap risk (todo #4 — feedback-persistence):** the current suite asserts
    feedback **dismiss-persistence-across-reload** (`perm-show-feedback-survey.spec.ts:74,91`),
    but the old flaky test's specific contract was feedback-**text-persists-across-cancel-
    then-reopen** (the `Feedback.svelte` `bind:this` keep-mounted design). That specific
    contract does **not** appear covered — the planner MUST confirm and, if absent, add it.
  - **Pre-verified parity (todo #5 — not-located):** `perm-not-located-2e2cg.spec.ts`
    already asserts 5 redirect contracts incl. *"/results → bounces twice → resumes
    /results"* — the exact CLEAN-02 contract. Parity CONFIRMED → clean stale-closure.

### perm-hide-election-tags (the only live current-suite spec)
- **D-03 (Harden shared helper + 3× prove):** Root-cause the navigation-timing race behind
  the Phase 127 run-1 failure at the **helper** level — `navigateToFirstQuestion`
  (`tests/tests/utils/voterNavigation.ts:282`) — not just the one spec. Harden its wait
  condition (settings-overlay / nav-settle race), prove `perm-hide-election-tags` 3× green,
  then **regression-check all 5 helper consumers** (D-10). Fixing the class, not the instance.
  - Prefer a **test-helper / wait-condition** fix. Escalate + note if root cause turns out
    to be a genuine **product** hydration race (D-09).

### Records, todo lifecycle, and this-phase gate
- **D-04 (Checkbox TRIAGE doc + move todos; targeted 3×):**
  - Per-todo disposition lives in a **checkbox markdown doc** —
    `131-DISCUSSION-POINTS.md` (this phase) — which doubles as the execution triage tracker.
  - Each triaged todo file gets a **disposition stamp** and moves to **`todos/completed/`**
    (matches the `resolves_phase:`-tagged precedent, e.g. qspec-02 → `completed/`; NOT
    `done/`, which holds independently-finished todos — flagged as a minor deviation from
    the option preview which said `done/`).
  - Phase 131 runs **targeted 3×** on any spec it changes/hardens; the **full-suite 3×
    green gate is deferred to Phase 132**.

### Minor / secondary decisions
- **D-05 (Scope = all 7):** The ROADMAP's "~6" undercounts. All **7** `resolves_phase: 131`
  todos are in scope; `perm-hide-election-tags` (2026-07-16, Phase 127) is the 7th.
- **D-06 (No new skips):** This phase introduces **zero** `test.skip`. Every todo → FIXED
  or CLOSED-AS-STALE. If a flake genuinely reproduces and cannot be fixed within budget →
  **escalate to the operator**, never skip (project cardinal rule — no known-flaky exemptions).
- **D-07 (New-flake handling):** If a fresh 3× run surfaces a NEW flake not among the 7 →
  file a new todo AND treat it as an in-scope fix candidate (cardinal rule) or escalate if
  out of budget. A "did not run" cell counts as a failure.
- **D-08 (Anchor bookkeeping moot):** The Phase 87 v2.10 SKIPPED_TESTS anchor binding
  (cell #3) and the `diff-playwright-reports.ts` diff mechanism are **deleted** — the anchor
  concern is resolved-by-deletion; no anchor edits are needed in this phase.
- **D-09 (Product vs test code):** Default to test-only harden. Product-code change is
  permitted only if a root cause is a genuine product race; flag it explicitly if so.
- **D-10 (Helper regression set):** After hardening `navigateToFirstQuestion`, re-run its
  **5 consumers**: `perm-disable-allow-open`, `perm-hide-category-tags`,
  `perm-hide-election-tags`, `perm-hide-if-missing-answers` specs + the
  `minimalVoterResultsPage.fixture.ts` consumer path (ideally a full perm + voter smoke).
- **D-11 (Execution prereqs):** One **fresh** single dev server on `:5173` (no Playwright
  `webServer`; a stale server steals the port) + **clean DB** (`yarn db:reset`) before each
  3× run — per the project E2E execution prereqs.

### Folded Todos
All 7 flake/race todos are folded into scope (they ARE the phase). Current covering-spec map:

| # | Todo file (`.planning/todos/pending/`) | Old (deleted) spec | Current covering spec(s) | Prima facie disposition |
|---|---|---|---|---|
| 1 | `2026-05-14-party-drawer-boundary-flake-residual.md` | voter-detail | `voter/voter-journey.spec.ts`, `voter/voter-alliance.spec.ts`, `voter/voter-journey-mobile.spec.ts` | STALE (verify tabs parity) |
| 2 | `2026-05-14-qspec-walkToQuestion-cold-start-race.md` | voter-question-rendering | `voter/voter-journey.spec.ts` + `voter/cold-entry-dataroot.spec.ts` | STALE (Phase 117) |
| 3 | `2026-05-16-voter-popup-hydration-layout-03-deeplink.md` | voter-popup-hydration | `_probes/popupNotice.probe.spec.ts`, `perm/perm-show-feedback-survey.spec.ts` + `cold-entry-dataroot` | STALE (Phase 117) |
| 4 | `2026-05-16-voter-feedback-persistence-second-pass.md` | voter-feedback-persistence | `voter/voter-journey.spec.ts`, `perm/perm-show-feedback-survey.spec.ts`, `_probes/popupNotice.probe.spec.ts` | STALE **+ parity gap risk** |
| 5 | `2026-05-16-voter-not-located-redirect-clean-02.md` | voter-not-located-redirect | `perm/perm-not-located-2e2cg.spec.ts` | STALE (parity CONFIRMED) |
| 6 | `2026-05-21-candidate-settings-notifications-voterapp-mount-lifecycle.md` | candidate-settings | `perm/perm-per-app-notifications.spec.ts`, `perm/perm-access-disable.spec.ts` | STALE (runes 123/124) |
| 7 | `2026-07-16-perm-hide-election-tags-navigation-timing-flake.md` | — (still live) | `perm/perm-hide-election-tags.spec.ts` (+ helper) | **FIX (harden helper)** |

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The 7 flake/race todos (the scope)
- `.planning/todos/pending/2026-05-14-party-drawer-boundary-flake-residual.md`
- `.planning/todos/pending/2026-05-14-qspec-walkToQuestion-cold-start-race.md` — the fullest RCA; documents the shared cold-deeplink root cause across cells #5/#6/#7/#8
- `.planning/todos/pending/2026-05-16-voter-popup-hydration-layout-03-deeplink.md`
- `.planning/todos/pending/2026-05-16-voter-feedback-persistence-second-pass.md` — the close-signal / `bind:this` persistence contract detail
- `.planning/todos/pending/2026-05-16-voter-not-located-redirect-clean-02.md`
- `.planning/todos/pending/2026-05-21-candidate-settings-notifications-voterapp-mount-lifecycle.md`
- `.planning/todos/pending/2026-07-16-perm-hide-election-tags-navigation-timing-flake.md`

### Current-suite anchors (the triage targets)
- `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` — **Phase 117 COLD-03 regression gate**; canonical "resolved by prior work" evidence for the cold-deeplink cluster
- `tests/tests/utils/voterNavigation.ts` §`navigateToFirstQuestion` (line 282) — the shared nav helper to harden (D-03)
- `tests/tests/specs/perm/perm-hide-election-tags.spec.ts` — the only live flake candidate
- `tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts` — parity-confirmed not-located contracts
- `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` — feedback dismiss-persistence coverage (parity anchor for todo #4)
- `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts` + `perm/perm-disable-allow-open.spec.ts`, `perm/perm-hide-category-tags.spec.ts`, `perm/perm-hide-if-missing-answers.spec.ts` — the helper regression-check set (D-10)

### Prior-work resolution evidence
- `.planning/debug/dataroot-stale-direct-nav.md` — Phase 117 root cause + 14-site consumer map (why the cold-deeplink race is resolved)
- `.planning/spikes/024-derived-alias-stable-ref-skip/README.md` — the `#version`-bridge alias-skip mechanism
- `CLAUDE.md` §"Carve-out — the `dataRoot` `#version`-bridge alias-indirection hole" — the in-tree explanation of the cold-entry symptom

### Phase governance
- `.planning/ROADMAP.md` §"Phase 131" (SC #1–#3) and §"Phase 132" (the downstream close gate this phase feeds)
- `.planning/phases/130-e2e-specs-new-feature-coverage/130-06-*` — the D-05 full-suite 3× determinism gate this phase re-proves per-surface

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`cold-entry-dataroot.spec.ts`** (Phase 117 gate): a negative-control spec that FAILS
  pre-fix and PASSES post-fix on the exact cold-deeplink `Loading…` race — directly reusable
  as the resolver evidence for the 4 cold-deeplink-family todos.
- **`navigateToFirstQuestion`** (`voterNavigation.ts:282`): the robust race-based passer the
  voter-journey fixture uses; `perm-hide-election-tags` already switched to it (per its
  docstring). Hardening this one helper fixes the whole `navigateToFirstQuestion` consumer class.
- **`perm-not-located-2e2cg.spec.ts`**: already encodes the CLEAN-02 bounce contract — reuse
  as parity proof, no new assertion needed for todo #5.

### Established Patterns
- **Deleted-then-consolidated suite:** old per-behavior specs (voter-detail, voter-popup-
  hydration, etc.) were folded into journey specs (`voter-journey`, `candidate-journey`) +
  permutation specs (`perm-*`) + probes. Triage maps old → new, it does not resurrect old specs.
- **No skip mechanism:** there is no `SKIPPED_TESTS` const or diff script anymore; the
  determinism signal is the full-suite 3× cold-start gate (targeted here, full in Phase 132).
- **E2E Hard Rule / cardinal failure:** intermittent = real defect; no known-flaky exemption;
  "did not run" counts as failure.

### Integration Points
- **Phase 132 hand-off:** any spec Phase 131 changes must leave the suite green so Phase 132's
  full-suite 3× gate + svelte-check 0/0 flip can pass. Do not introduce skips.
- **Helper harden blast radius:** `navigateToFirstQuestion` touches 5 consumers — a bad harden
  regresses the perm cluster; regression-check is mandatory (D-10).

</code_context>

<specifics>
## Specific Ideas

- The user wants **all discussion points, even minor ones, captured in a markdown doc with
  checkboxes** → produced as `131-DISCUSSION-POINTS.md`, which doubles as the per-todo triage
  disposition tracker consumed during execution.
- Disposition vocabulary is binary-terminal: **FIXED** (3× green) or **CLOSED-AS-STALE**
  (not reproducible / resolved by prior work + parity-checked). No third "still deferred" state.

</specifics>

<deferred>
## Deferred Ideas

- **Full-suite 3× green gate + svelte-check 0/0 flip** → Phase 132 (explicitly out of 131).
- **Any product-code refactor surfaced by triage** (e.g. a `data-state="open|closed"` on the
  Modal wrapper for cleaner close-signal assertions, or a `data-hydrated` attribute on the
  party drawer) is only pulled in if a parity gap genuinely requires it (D-02/D-09);
  otherwise file as a follow-up, don't expand scope.

### Reviewed Todos (not folded)
The `todo.match-phase` scan surfaced ~40 lower-relevance matches (candidate→party app
generalization, answer-store migration, Paraglide locale reconciliation, filter OR-mode UI,
etc.). None are flake/race triage items — they are product/infra backlog and were **not**
folded. Only the 7 `resolves_phase: 131` flake/race todos are in scope.

</deferred>

---

*Phase: 131-e2e-reliability-hardening-deferred-flake-race-triage*
*Context gathered: 2026-07-22*
