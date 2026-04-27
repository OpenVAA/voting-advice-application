# Phase 64: Voter Results Reactivity Completion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 64-voter-results-reactivity-completion
**Areas discussed:** Scope expansion permissions, PASS criterion definition, Skip-vs-extend filter tests, Plan split + investigation order

---

## Scope Expansion Permissions

### Q1 — Filter package mutation allowance

| Option | Description | Selected |
|--------|-------------|----------|
| No — keep D-07 (consumer-side only) | Phase 62 D-07 stands; document upstream issue + ship consumer-side workaround | |
| Yes — if a sufficient consumer-side workaround doesn't exist | Allow targeted @openvaa/filters changes when consumer-side fix would be ugly; preserve published API | |
| Yes — unrestricted within v2.6 cleanup spirit | Treat @openvaa/filters as in-scope for any closing fix | ✓ |

**User's choice:** Option 3 with conditional constraint
**Notes:** "3 but changes to filters must keep the package ui-framework agnostic, i.e. Svelte". Hard rule: no `$state`, `$derived`, `svelte/store`, or `svelte/reactivity` imports inside the package. Captured as D-01.

### Q2 — `initFilterContext` `$effect` lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Audit + fix in this phase if root cause | In-scope; fix via `$effect.root()` or component-side relocation if reproduction confirms misfire | ✓ |
| Audit but only fix if it's the ROOT cause | Investigate; mutate only with direct evidence | |
| Out of scope — file a follow-up todo | Don't touch lifecycle; close 5 tests via consumer bridges only | |

**User's choice:** Option 1 with research prerequisite
**Notes:** "Before proceeding, evaluate what is the best practice for handling external subscriptions in Svelte. If it turns out that the onChange paradigm is ultimately poorly suited for Svelte, the earlier point about filters package agnosticity may be re-evaluated such that the scope of the package is restricted to abstract filtering logic." This is a research-gated branch — Captured as D-02 + D-03. The narrowing-of-`@openvaa/filters` is a planner-eligible decision conditional on the research outcome.

### Q3 — Dev-seed e2e template extension

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — in scope if needed for the contract | Phase 63 E2E-02 precedent applies; add filter-target seed if necessary | ✓ |
| Read-only — fix consumer code only | Don't touch dev-seed; accept skip paths as honest signals | |
| Decide after reproduction | Defer; let data shape the decision | |

**User's choice:** Option 1
**Notes:** Captured as D-04. Preferred minimum: fix consumer-side wiring first (D-12); only extend template if a real seed gap surfaces.

### Q4 — Out-of-scope guardrail

| Option | Description | Selected |
|--------|-------------|----------|
| imgproxy infrastructure flake | ROADMAP-declared OoS confirmation | ✓ |
| Other EntityList consumers' migration to EntityListWithControls | Phase 62 deferred sweep stays deferred | ✓ |
| Deeper voter-app reactivity refactor (beyond filters/results) | Don't open broader Svelte 5 cleanup mandate | ✓ |
| Parity-script constants regeneration | Phase 63 D-13 had marked it as `/gsd-complete-milestone`'s job | |

**User's choice:** First 3 selected; parity-script constants regeneration explicitly NOT marked OoS.
**Notes:** Implicit instruction that constants regeneration IS in Phase 64 scope — confirmed in next area's Q1 (PASS criterion = 5 tests + new v2.6 baseline re-anchored). Captured as D-08.

---

## PASS Criterion Definition

### Q1 — Binding success criterion

| Option | Description | Selected |
|--------|-------------|----------|
| 5 named tests pass deterministically | Phase 64 closes when 5 tests pass; script verdict can stay FAIL | |
| Script verdict literal PASS | Phase 64 closes only when `PARITY GATE: PASS` prints; addresses imgproxy too | |
| 5 named tests + new v2.6 baseline re-anchored | Phase 64 absorbs constants regeneration from `/gsd-complete-milestone` | ✓ |

**User's choice:** Option 3
**Notes:** Captured as D-07 + D-08. Phase 64 owns full v2.6 anchor — folds in what Phase 63 D-13 had marked for milestone-close.

### Q2 — Imgproxy classification in regenerated constants

| Option | Description | Selected |
|--------|-------------|----------|
| Move to DATA_RACE_TESTS pool | Reclassify as intermittent-allowed; matches actual failure mode | ✓ |
| Keep in CASCADE_TESTS pool | Treat as expected-failure | |
| Capture run on a known-good docker state | Restart docker before capture; pragmatic but unprincipled | |

**User's choice:** Option 1
**Notes:** Captured as D-09. Upload test + 13 cascades both classify into DATA_RACE_TESTS.

### Q3 — Evidence threshold

| Option | Description | Selected |
|--------|-------------|----------|
| 1 clean run on `--workers=1` | Single Playwright run sufficient | |
| 3 clean runs on `--workers=1` | 3x focused runs catch intermittence | |
| Full v2.6 parity capture (post-fix) + 5/5 in capture | Canonical full-suite capture — most realistic | ✓ |

**User's choice:** Option 3
**Notes:** Captured as D-07. Single canonical run serves both verification AND constants regeneration (D-08).

### Q4 — Phase 62 manual smoke checklist

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — fold into Phase 64 verification | User runs 9 steps once; both phases close | ✓ |
| Partial — only items not covered by E2E | Manual smoke superseded by Phase 64 deterministic E2E; track residuals | |
| No — leave Phase 62 checklist deferred | Strict separation | |

**User's choice:** Option 1
**Notes:** Captured as D-10. Phase 64 verification clears Phase 62's deferred 9-step checklist.

---

## Skip-vs-Extend Filter Tests

### Q1 — Skip path treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Remove skip paths — hard-fail on missing prerequisites | Replace with hard assertions; seed regressions surface as failures | ✓ |
| Keep skip paths — defense-in-depth | Graceful degradation under partial seeds | |
| Keep but log a warning | Middle path with `console.warn` + skip | |

**User's choice:** Option 1
**Notes:** Captured as D-11. Once seed prerequisites are guaranteed, skip paths become noise.

### Q2 — Filter source for deterministic contract

| Option | Description | Selected |
|--------|-------------|----------|
| Party filter (already implicit) | Existing `nominate_for` data; fix consumer-side wiring if not rendering | ✓ |
| Categorical question filter | Add 1-2 categorical questions to e2e template | |
| Whichever the consumer-side test naturally exposes | Don't pre-decide; reproduce first | |

**User's choice:** Option 1 with two follow-up todo captures
**Notes:** "but mark as todos extending the e2e tests to cover all supported filter types; also mark a todo to search the e2e test for all skip if modifiers and remove them to make the whole suite deterministic". Captured as D-12 + two deferred todos in CONTEXT.md.

---

## Plan Split + Investigation Order

### Q1 — Plan split orientation

| Option | Description | Selected |
|--------|-------------|----------|
| 3 plans, root-cause grouped | Reactivity bridge / deeplink load chain / verification | ✓ |
| 5 plans, one per failing test | Maximum granularity; redundant where root cause overlaps | |
| 2 plans — fix + verify | Lower ceremony; harder to bisect | |

**User's choice:** Option 1
**Notes:** Captured as D-13. Plans run sequentially: 64-01 → 64-02 → 64-03.

### Q2 — Deeplink fixture-timeout root-cause prior

| Option | Description | Selected |
|--------|-------------|----------|
| Component-side — `getEntityAndTitle` / `voterCtx.matches` not populated | Most likely; investigate first | |
| Load-function-side — redirect cycle in `+layout.ts` / `+page.ts` | Less likely; investigate after | |
| Fixture-side — `answeredVoterPage` doesn't reach answered state | Least likely; verify last | |
| Reproduce first — don't pre-rank | Skip prior; let observation rank | ✓ |

**User's choice:** Option 4
**Notes:** Captured as D-05 + D-06. Researcher reproduces locally; whichever direction the evidence points to becomes the fix path.

### Q3 — Svelte 5 best-practice research approach

| Option | Description | Selected |
|--------|-------------|----------|
| Web research + Svelte 5 docs/issues survey | Focused investigation; output as RESEARCH.md section | ✓ |
| Quick best-effort — author's judgment | Skip formal research | |
| Research only if `$effect.root()` doesn't fix it | Try minimum fix first | |

**User's choice:** Option 1
**Notes:** Captured as D-03. Researcher uses WebSearch + WebFetch + `mcp__context7__*` to survey Svelte 5 external-subscription patterns; output ranks 2-3 viable approaches with code sketches; planner picks the architecture and decides whether the package narrowing branch lands.

---

## Claude's Discretion

- Exact Svelte 5 best-practice pattern selection for the external-subscription bridge — researcher surveys; planner picks per D-03
- Whether `initFilterContext` is fixed in-place vs replaced by component-side bridge — both eligible per D-02
- Specific shape of `@openvaa/filters` API additions if any (e.g., `getSnapshot()` vs `subscribe()` vs immutable rule snapshots) — D-01 sets agnosticism constraint; planner picks
- Whether D-08 shape 4 rides the same fix as shape 3 or needs a separate fix — reproduction will tell
- Test sequencing within 64-01 — planner's call

---

## Deferred Ideas

- Sweep all EntityList consumers across candidate-app + other voter surfaces to migrate to EntityListWithControls
- Extend e2e tests to cover ALL supported filter types systematically (NumberFilter, TextFilter beyond search, additional EnumeratedFilter sources, nested FilterGroup)
- Sweep entire E2E suite for `test.skip(true, ...)` modifiers — make the whole suite deterministic
- Deeper voter-app reactivity refactor (voterContext shape, election persistence in URL, `fromStore`/`toStore` bridge retirement)
- Wider audit of `$effect` lifecycle in non-component contexts across the app
- `@openvaa/filters` API redesign post-narrowing (conditional on D-03 outcome)
- Imgproxy resilience improvements (`dev:reset` includes `supabase stop && supabase start`)
- Centralized overlay architecture (Phase 60 carry-forward)
- Snippet-based controls customization for EntityListWithControls

