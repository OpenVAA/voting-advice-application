# Phase 132: Milestone-Close Green Gate + svelte-check Zero Flip - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the **v2.14 milestone-close gate** (HARDN-02 + TYPE-10):

1. **HARDN-02 — full-suite 3× green:** the full E2E suite — including every net-new v2.14
   spec (52 spec files, ~129 tests post-Phase-131) — passes to the 3× determinism standard
   (fresh `:5173` server, clean DB, no flakes, zero "did not run").
2. **TYPE-10 — svelte-check zero flip:** `apps/frontend` svelte-check passes 0 errors /
   0 warnings (already achieved by Phases 125–128; re-verify live), and the CI gate is
   flipped from the process-level "≤ 151 baseline" to an **encoded "0 absolute"** check.
   **Scout finding (load-bearing):** there is NO svelte-check step in CI today
   (`.github/workflows/main.yaml` runs format/lint/unit/build only) — the "151 baseline"
   only ever existed as phase-acceptance bookkeeping. The "flip" therefore means **adding**
   a blocking CI step, not editing an existing threshold.
3. **SC #3 — close bookkeeping:** unit tests + lint green, and the milestone-close anchor
   recorded matching the v2.10/v2.11/v2.13 close pattern (per-phase anchor doc, e.g.
   `116-MILESTONE-CLOSE-ANCHOR.md`).

**In-scope prerequisite:** terminally dispose the escalated `candidate-journey.spec.ts:661`
cold-start load-contention flake (`resolves_phase: 132` todo from Phase 131) — FIXED, before
the gate count starts. No skips, ever (cardinal rule).

**Out of scope:** archiving/closing the milestone itself (`/gsd-complete-milestone` runs
after this phase); new feature or spec work (Phases 118–130 done); re-triaging the Phase 131
todos (all 7 terminally disposed); gating the docs app in CI (currently 0/0 but TYPE-10
scopes `apps/frontend`).
</domain>

<decisions>
## Implementation Decisions

### Escalated flake (candidate-journey:661) — fix-first
- **D-01 (Fix before the gate):** Harden step 13.5's `candidate-home-status` wait per the
  todo's Solution section (wait for profile-submit settle / home-route interactivity before
  asserting, or a load-profile-appropriate timeout for this post-submit status message) —
  **before** starting the 3× gate count. A mid-gate failure restarts the count anyway, and
  the todo already carries a characterized root cause (cold-start load contention under the
  full perm-DAG; 2/2 green in isolation — NOT a product regression).
- **D-02 (Prove at both load profiles):** After hardening, prove `candidate-journey`
  isolated (`--project=candidate-journey`) AND under the full concurrent DAG (a full-suite
  run — which can double as gate run 1 if green). Terminal disposition: **FIXED**; stamp the
  todo and move it to `.planning/todos/completed/` (Phase 131 D-04 lifecycle precedent).
- **D-03 (Test-only default):** Default to a test-side harden (wait condition / timeout
  profile). Product-code change only if a genuine product race is proven; flag explicitly
  if so (Phase 131 D-09 carried forward).

### 3× full-suite gate protocol (HARDN-02)
- **D-04 (Run mechanics):** 3 **consecutive** full-suite `yarn test:e2e` runs, **each** with
  a **fresh** Vite dev server on `:5173` (no Playwright `webServer`; kill stale servers first)
  and a **clean DB** (`yarn db:reset` — no `default`-template pollution) before every run.
  Fresh-server-per-run is mandatory, not optional: the v2.13 anchor recorded run-3 flaking
  purely from accumulated dev-server load. Each run must be 0 failed / 0 did-not-run.
- **D-05 (Failure = restart the count):** ANY failure in any run → root-cause it, fix it
  (never skip, never retry-until-green, "did not run" counts as failure), then **restart the
  3× count at 0** (Phase 130 D-05 precedent — its count restarted after the fixture-race fix).
- **D-06 (New-flake handling):** A NEW flake surfacing mid-gate is in-scope fix work: file a
  todo for the record, fix it in-phase, restart the count. Escalate to the operator only if
  genuinely out of budget — with the gate left honestly RED, never annotated around.
- **D-07 (Environment wedge ≠ test failure):** A run invalidated by the known local-infra
  wedges (repeated-`db:reset` storage-502 → recover via `yarn db:stop && yarn db:start &&
  yarn db:reset`, then assert the `public-assets` bucket exists; imgproxy 502 → restart
  Supabase) is **discarded and re-run**, not counted as a suite failure — but must be logged
  in the anchor doc. NEVER run bare `npx supabase start` from the repo root (boots a foreign
  project off root `supabase/config.toml` and steals :54322).

### svelte-check CI gate flip (TYPE-10)
- **D-08 (Encode the gate in CI):** Add a **blocking** svelte-check step to the
  `frontend-and-shared-module-validation` job in `.github/workflows/main.yaml` (after build,
  alongside lint) running the frontend check with **`--fail-on-warnings`** so BOTH errors and
  warnings break the build — that is what "0 absolute" means per TYPE-10's "0 errors /
  0 warnings". — **Reversibility:** costly — once merged, every future PR is held to 0/0;
  relaxing it later is a visible standards regression.
- **D-09 (Single source of truth preferred):** Prefer making the existing
  `apps/frontend` `check` script strict (`--fail-on-warnings` in `package.json:12`) so local
  `yarn check` and CI enforce the same standard; a separate `check:ci` variant is acceptable
  only if research finds a concrete DX reason (e.g. watch-mode friction — note
  `check:watch` is a separate script already). Planner decides the exact wiring; the locked
  part is: blocking CI step + fails on warnings + frontend-scoped.
- **D-10 (Live re-verify, don't trust bookkeeping):** Run svelte-check live at phase start
  and at close — Phase 128 recorded 0/0, but drift since 2026-07-17 (Phases 129–131 touched
  frontend + tests) must be caught here, not discovered by the new CI gate on some future PR.
  Any drift found → fix to 0/0 in-phase (small expected volume).

### Milestone-close anchor + bookkeeping (SC #3)
- **D-11 (Anchor artifact):** Record `132-MILESTONE-CLOSE-ANCHOR.md` in the phase dir,
  matching the v2.13 shape (`.planning/milestones/v2.13-phases/116-milestone-close-green-gate/
  116-MILESTONE-CLOSE-ANCHOR.md`): static-gates table (build / unit / svelte-check **0/0** /
  lint), the 3× E2E run table with per-run server+DB provenance and durations, environmental
  preconditions + any discarded-run log (D-07), and the anchor commit SHA.
- **D-12 (Static gates included):** `yarn build`, full unit suite (`yarn test:unit`), and
  `yarn lint:check` run green and are recorded in the anchor alongside svelte-check and E2E.
- **D-13 (Todo terminal dispositions):** Both `resolves_phase: 132` todos are terminally
  disposed in-phase: the flake todo → FIXED (D-01/D-02); the svelte-check-zero todo
  (`2026-06-12-resolve-all-svelte-check-errors.md`) → COMPLETE once the CI gate is flipped
  (its substance was delivered by Phases 125–128; the flip is its last open clause). Stamp +
  move to `todos/completed/`.

### Claude's Discretion
- Exact CI step naming/placement within the frontend job; whether svelte-check runs before
  or after the unit-test step (fail-fast ordering).
- Exact wait-condition mechanics for the step-13.5 harden (network-settle vs. element-state
  vs. timeout-profile), provided it follows the todo's Solution direction and D-03.
- Whether gate runs are executed via one orchestrated plan or split (e.g. flake-fix plan →
  flip plan → gate plan) — subject to the single-`:5173` serialization constraint (only one
  dev server; gate plans cannot parallelize).

### Folded Todos
- **`2026-07-22-candidate-journey-link-url-status-load-flake.md`** (`resolves_phase: 132`) —
  step-13.5 `candidate-home-status` assertion exceeds `TIMEOUTS.slowPage` only under full
  perm-DAG concurrent load; 2/2 green isolated. This phase fixes it (D-01..D-03) as the
  gate prerequisite.
- **`2026-06-12-resolve-all-svelte-check-errors.md`** (`resolves_phase: 132`) — the original
  "clear the 151 baseline" todo. Substance already delivered (Phases 125–128 → 0/0); this
  phase closes it by flipping the CI gate to 0-absolute (D-08) and re-verifying live (D-10).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase governance
- `.planning/ROADMAP.md` §"Phase 132" (lines ~609+) — goal, deps, the 3 success criteria
- `.planning/REQUIREMENTS.md` — **HARDN-02** (line 86) + **TYPE-10** (line 107) exact wording

### The two folded todos (the in-phase work items)
- `.planning/todos/pending/2026-07-22-candidate-journey-link-url-status-load-flake.md` —
  full characterization + attribution + the Solution section the harden must follow
- `.planning/todos/pending/2026-06-12-resolve-all-svelte-check-errors.md` — the 151-baseline
  todo this phase terminally closes

### Gate targets (code)
- `.github/workflows/main.yaml` — the CI workflow to modify (frontend job at lines 36–76;
  **no svelte-check step exists today** — that is the flip)
- `apps/frontend/package.json` — `check` script (line 12) to make strict per D-09
- `tests/tests/specs/candidate/candidate-journey.spec.ts` — step 13.5 (~line 661), the
  `candidate-home-status` assertion to harden
- `tests/playwright.config.ts` — perm-DAG `dependencies` (line ~415, why the full DAG pulls
  journeys), `workers: CI ? 1 : 6` (line 62), `TIMEOUTS` usage

### Close-pattern precedent (the anchor template)
- `.planning/milestones/v2.13-phases/116-milestone-close-green-gate/116-MILESTONE-CLOSE-ANCHOR.md` —
  the anchor doc to replicate; ALSO documents the two environmental preconditions (clean DB /
  default-template pollution; fresh server per run) that D-04 locks
- `.planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/131-CONTEXT.md` —
  the D-01..D-11 triage decisions carried forward here (no-skip, todo lifecycle, prereqs)

### Prior evidence (hand-off state)
- `.planning/phases/131-e2e-reliability-hardening-deferred-flake-race-triage/` — Phase 131
  evidence artifacts (targeted 3× GATE-GREEN 15/15; suite left green for this phase)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **v2.13 anchor doc** (`116-MILESTONE-CLOSE-ANCHOR.md`): direct structural template for
  `132-MILESTONE-CLOSE-ANCHOR.md` — static-gates table + 3× run table + preconditions.
- **`TIMEOUTS` profile** (tests utils): the step-13.5 harden should use the established
  timeout vocabulary (`TIMEOUTS.page` vs `TIMEOUTS.slowPage`) rather than magic numbers —
  Phase 131's WR-01 advisory noted `TIMEOUTS.page` is the semantically correct budget for a
  redirect re-mount boundary.
- **Phase 131's hardened `navigateToFirstQuestion`** pattern (terminal-state settle after
  `waitForURL`): the proven shape for load-tolerant waits; step 13.5 needs the candidate-app
  analog.

### Established Patterns
- **3× determinism gate:** fresh `:5173` + clean DB per run; count restarts after any fix
  (Phase 130 D-05); "did not run" = failure; no skips (cardinal rule, CLAUDE.md).
- **CI runs the suite at `workers: 1, retries: 3`** — the local gate at `workers: 6` is the
  STRICTER contention profile (it is what surfaced the :661 flake); local 3× remains the
  authoritative close standard, matching v2.10–v2.13 precedent.
- **svelte-check exits non-zero on errors only by default** — `--fail-on-warnings` is
  required for the 0-warnings half of TYPE-10.

### Integration Points
- **`/gsd-complete-milestone` downstream:** this phase's anchor + flipped checkboxes
  (HARDN-02, TYPE-10 in REQUIREMENTS.md; Phase 132 in ROADMAP.md) are what the milestone
  close consumes next.
- **Every future PR** hits the new CI svelte-check step — the flip is the lasting deliverable.
- **Single `:5173` constraint:** gate runs serialize; no parallel E2E plan waves
  (Phase 131 executed 5 serialized plans for the same reason).

</code_context>

<specifics>
## Specific Ideas

- The escalated flake todo already prescribes its fix direction ("harden the step-13.5 wait…
  wait for the profile-submit network settle / the home route to be interactive before
  asserting `toBeVisible`") — follow it; don't re-derive from scratch.
- Supabase wedge recovery runbook (from Phase 131 harness learnings, verbatim): repeated
  `db:reset` storage-502 → `yarn db:stop && yarn db:start && yarn db:reset`, then assert the
  `public-assets` bucket exists; NEVER bare `npx supabase start` from the repo root.

</specifics>

<deferred>
## Deferred Ideas

- **Milestone archive/close ceremony** (`/gsd-complete-milestone`: MILESTONES.md entry,
  phase-dir archival, next-milestone kickoff) — after this phase, not in it.
- **Docs-app svelte-check CI gating** — currently 0/0 (Phase 128) but TYPE-10 scopes
  `apps/frontend`; add later if wanted, not here.
- **RETURNS TABLE RPC nullability audit** (`2026-07-16-rpc-returns-table-nullability-audit.md`)
  — Phase 126 follow-up, backend scope; untouched by this phase.

### Reviewed Todos (not folded)
The `todo.match-phase` scan surfaced 41 matches; 39 are keyword-noise product/infra backlog
(candidate→party generalization, answer-store migration, nominating-org display, view-transition
flicker, Paraglide reconciliation, auth-code migration to adapters, UI polish items, etc.) —
none are gate/close work; NOT folded (same disposition as Phase 131's review). Note: the
auto-mode "fold ≥ 0.4" rule was deliberately overridden by the scope guardrail here — only the
two `resolves_phase: 132` todos are genuinely in-scope; folding 39 unrelated backlog items into
a close-gate phase would be scope creep. They remain in `.planning/todos/pending/` for
next-milestone triage via `/gsd-review-backlog`.

</deferred>

---

*Phase: 132-milestone-close-green-gate-svelte-check-zero-flip*
*Context gathered: 2026-07-23*
