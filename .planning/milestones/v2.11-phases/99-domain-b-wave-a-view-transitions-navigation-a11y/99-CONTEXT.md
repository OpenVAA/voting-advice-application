# Phase 99: Domain B Wave A — View Transitions + Navigation a11y - Context

**Gathered:** 2026-06-04 (batch discussion — `v2.11-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

Navigation between views renders as element-stable cross-fades (View Transitions API) instead of a perceived full-page redraw, with WCAG 2.1 AA-compliant focus management, route announcement, and reduced-motion handling.

**Depends on:** Nothing in Domain A — additive + fully independent; schedulable concurrently with Wave 1 (DX-1: parallel workstream).
Requirements: **VT-01, VT-02, VT-03, NAVA11Y-01, NAVA11Y-02, NAVA11Y-03**. **UI hint: yes.**

> ⚠️ **Scope was expanded at discussion (99-1).** This phase is larger than the spike baseline — see D-01. REQUIREMENTS.md `VT-02` + ROADMAP Phase 99 success-criterion 1 were updated to match.
</domain>

<decisions>
## Implementation Decisions

### Transition surface scope (VT-02) — EXPANDED per 99-1
- **D-01 (99-1):** Assign `view-transition-name`s beyond the 4 spike-proven elements (Header / MainContent / hero / QuestionActions) to **also cover, where applicable:**
  - results **election-switching**,
  - **entity tabs** in results,
  - **tabs in entity details**,
  - **`QuestionHeading`**,
  - the **candidate-app `/questions` route**.
  - Planner action: **audit which of these surfaces are reachable/animatable** and size the phase accordingly. This applies the same cross-fade to more surfaces — NOT bespoke per-route choreography (that remains out of scope).

### Escape hatch (VT)
- **D-02 (99-2):** **Ship the `?notr=1` escape hatch** (disables the transition) in production — useful for E2E + debugging. Low cost, spike-proven.

### Route announcer string (NAVA11Y-01)
- **D-03 (99-3):** The `aria-live="polite"` announcer derives from `page.params` and announces a **generic param-derived label** (e.g. "Question {n}"). No new localized announcement strings in this phase.

### Transition scope across routes (VT-01)
- **D-04 (99-4):** **Global `onNavigate` cross-fade at the root layout** (all routes), reading `navigation.to?.url` (NOT `page.url`) for destination decisions.

### Locked (spikes 015/016) — carry through
- **D-05:** `prefers-reduced-motion` honored on BOTH layers (`matchMedia` short-circuit in JS + `@media (prefers-reduced-motion: reduce) { :global(...) }` CSS — correct Svelte-parser form).
- **D-06:** Focus reset via `afterNavigate` → `requestAnimationFrame(() => target.focus({ preventScroll: true }))` (`preventScroll` mandatory); question heading carries `data-focus-on-nav` / `tabindex="-1"`.
- **D-07:** WCAG 2.1 AA gate (focus + aria-live + reduced-motion) under the existing `@axe-core/playwright` env-gated smoke.

### Claude's Discretion
- Exact `view-transition-name` strings + which reachable sub-surfaces qualify as "where applicable" for D-01 (document what was covered vs skipped).
</decisions>

<specifics>
## Specific Ideas
- The `?notr=1` escape hatch should be usable by E2E to deterministically disable animation.
- Destination URL MUST come from `navigation.to?.url` during `onNavigate` (spike-015 gotcha: `page.url` is the SOURCE url there).
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- `Skill("spike-findings-voting-advice-application-gsd")` (Domain B section).
- Spikes: `013-nav-mount-forensics`, `015-view-transitions-api`, `016-focus-and-a11y-during-transitions`.
- `.planning/v2.11-DECISIONS.md` (99-x decisions).
- `.planning/REQUIREMENTS.md` → VT-02 (expanded) + out-of-scope reframe.
- Production pattern: `results/[[electionTab]]/+layout.svelte` (entity-tab keying reference).
</canonical_refs>
