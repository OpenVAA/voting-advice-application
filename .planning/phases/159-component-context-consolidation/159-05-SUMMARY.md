---
phase: 159-component-context-consolidation
plan: 05
subsystem: ui
tags: [svelte5, snippets, entity-card, scoped-styles, playwright, comment-hygiene]

# Dependency graph
requires:
  - phase: 159-01
    provides: "The `.hover-shaded` source-scan survival guard, committed specifically because this plan relocates that rule out of a file it then deletes"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "The repository-wide comment scan wired into `yarn lint:check`, which binds every comment this plan wrote"
provides:
  - "A card-local `cardAction` snippet in EntityCard.svelte replacing the pre-snippet-era EntityCardAction wrapper component"
  - "Deletion of EntityCardAction.svelte and EntityCardAction.type.ts (D-H3 option (a))"
  - "The `.hover-shaded` rule relocated into EntityCard.svelte's single existing style block"
  - "A measured correction to the phase context: the results layout was never a code consumer, only a comment reference"
affects: [159-11, entity-card DOM contract, results drawer navigation]

actuals:
  tokens: 10160
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Wrapper component -> parameterised `{#snippet}` in its single real consumer, with the scoped style rule relocated FIRST"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte

key-decisions:
  - "The style rule moved in its own commit, before any markup change, so the rule's survival is provable independently of the conversion — a snippet has no style scope and the rule's absence has no compiler, type or static-render signal."
  - "The three-way action branch and the server-error fallback were reproduced verbatim rather than simplified; the button-versus-anchor split is a screen-reader role distinction, not a stylistic choice."
  - "The two nested call sites became two per-body snippets rendered through the new one, in the same nesting order, because three end-to-end files select the action by FIRST-MATCH document order."
  - "The 159-01 guard's own prose was NOT reworded to make the `EntityCardAction` reference count read zero. 159-01 set that precedent explicitly: editing a guard's own statement to satisfy a count of that guard's subject is a fake-guard shape this repository rejects."
  - "The dev server was restarted before the end-to-end runs rather than reusing the wave's long-lived one, because the conversion rewrote a large module and Vite HMR is a recorded source of stale SSR modules mid-session."

patterns-established:
  - "Pattern 1: relocate a scoped style rule as its own commit BEFORE converting a component to a snippet — the rule's presence then has an independent proof and an independent revert"
  - "Pattern 2: a snippet declared inside the element it is rendered from keeps the diff small and preserves document order, because a `{#snippet}` declaration renders nothing at its declaration site"

requirements-completed: [REVIEW-CMP-03]

coverage:
  - id: D1
    description: "EntityCardAction.svelte and EntityCardAction.type.ts both cease to exist, and no live code references either"
    requirement: REVIEW-CMP-03
    verification:
      - kind: other
        ref: "ls apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.type.ts 2>/dev/null | wc -l -> 0"
        status: pass
      - kind: other
        ref: "grep -rln 'EntityCardAction' apps/frontend/src -> 2 paths, both prose-only (see Deviations)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend build (SvelteKit production build) -> built in 8.14s"
        status: pass
    human_judgment: false
  - id: D2
    description: "All four branches of the wrapper survive verbatim in the `cardAction` snippet: falsy action renders bare, function renders a button, string renders an anchor, anything else raises the same 500"
    requirement: REVIEW-CMP-03
    verification:
      - kind: e2e
        ref: "tests/tests/specs/voter/voter-alliance.spec.ts#alliance section + card + clickable member children + member-orgs drawer + tab control (anchor branch, nested first-match order)"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-show-feedback-survey.spec.ts (6 tests; first-match entity-card-action click on a no-subcard candidate card)"
        status: pass
      - kind: other
        ref: "grep -c 'entity-card-action' EntityCard.svelte -> 2; grep -c 'data-sveltekit-noscroll' -> 1; grep -c 'error(500' -> 1"
        status: pass
      - kind: other
        ref: "yarn typecheck (svelte-check) -> 0 errors and 0 warnings"
        status: pass
    human_judgment: false
  - id: D3
    description: "The `.hover-shaded` rule survives the conversion, relocated into EntityCard.svelte's single existing style block"
    requirement: REVIEW-CMP-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/dynamic-components/entityCard/tests/hoverShadedRule.test.ts#finds the hover-shading rule declared in at least one style block"
        status: pass
      - kind: other
        ref: "grep -c '<style' EntityCard.svelte -> 1 (no second style block introduced)"
        status: pass
    human_judgment: true
    rationale: "The guard proves the rule is DECLARED, and the E2E suite proves the elements still render — but `.hover-shaded` is a hover-only affordance and neither signal observes the shading actually appearing under the pointer. The visual affordance itself is a human observation."
  - id: D4
    description: "The three end-to-end files pinning the entity-card DOM contract stay green without being edited"
    requirement: REVIEW-CMP-03
    verification:
      - kind: e2e
        ref: "FRONTEND_PORT=5273 yarn test:e2e --grep 'results|alliance|feedback survey' -> 103 passed (6.4m), 0 failed, 0 did-not-run"
        status: pass
      - kind: e2e
        ref: "FRONTEND_PORT=5273 yarn test:e2e --project=voter-journey --project=perm-org-matching -> 122 passed (10.3m), 0 failed, 0 did-not-run (the two remaining resultsPage.fixture consumers)"
        status: pass
      - kind: other
        ref: "git diff of the three E2E files across this plan -> empty (no spec or fixture was edited)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The stale comment reference in the results layout names the snippet instead of the deleted component"
    requirement: REVIEW-CMP-03
    verification:
      - kind: other
        ref: "yarn lint:check (includes Phase 152's comment-hygiene scan, 1630 files) -> 0 violation(s)"
        status: pass
    human_judgment: false

# Metrics
duration: 44 min
completed: 2026-09-03
status: complete
---

# Phase 159 Plan 05: EntityCardAction -> cardAction Snippet Summary

**The pre-snippet-era `EntityCardAction` wrapper and its `.type.ts` are gone, replaced by a four-parameter `cardAction` snippet inside `EntityCard.svelte` that reproduces all four branches verbatim, with `.hover-shaded` relocated into the card's own style block in a separate earlier commit.**

## Performance

- **Duration:** 44 min (of which ~17 min was end-to-end execution)
- **Started:** 2026-09-02T20:43:00Z
- **Completed:** 2026-09-02T21:27:00Z
- **Tasks:** 3
- **Files modified:** 2 modified, 2 deleted

## Accomplishments

- **`cardAction` snippet declared in `EntityCard.svelte`**, taking `(action, shadeOnHover, extraClass, content)`. All four branches of the deleted wrapper transfer byte-for-byte in behaviour: a `null`/`false`/empty-string action renders the content bare with no wrapping element; a function action renders a `<button>` with the action as its click handler; a string action renders an `<a>` with the action as `href`; anything else raises the same `error(500, ...)`.
- **Both files deleted** — `EntityCardAction.svelte` (59 lines) and `EntityCardAction.type.ts` (18 lines), per D-H3 option (a). The barrel needed no edit; it only ever exported the card and its type.
- **`.hover-shaded` relocated first, in its own commit**, into `EntityCard.svelte`'s single existing `<style lang="postcss">` block. Both files sat in the same directory, so the `@reference "../../../tailwind-theme.css"` path needed no adjustment — confirmed by reading both reference lines, not assumed. The 159-01 guard proves the rule is still declared.
- **The DOM contract held under 225 end-to-end tests across two runs**, with no spec and no fixture edited: 103 passed on the plan's own grep, plus 122 passed on the two remaining `resultsPage.fixture` consumers the grep did not reach.
- **The phase context's "second real consumer" claim is corrected**: the results layout held a comment reference only.

## Task Commits

1. **Task 1: Relocate the hover-shading rule into EntityCard's existing style block** - `e8b49f66b` (refactor)
2. **Task 2: Convert the wrapper to a snippet and delete both files** - `fb555ee98` (refactor)
3. **Task 3: Reword the stale comment reference and prove the DOM contract end to end** - `8d58ff5e2` (docs)

## Files Created/Modified

- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` - hosts the new `cardAction` snippet, the two per-body snippets (`cardBody`, `cardHeaderBody`), and the relocated `.hover-shaded` rule; imports `error` from `@sveltejs/kit`, `Snippet` from `svelte` and `CardAction` from its own type module
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` - the `handleDrawerClose` comment now names the snippet and its anchor branch
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` - **deleted**
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.type.ts` - **deleted**

## Decisions Made

- **The style rule moved in its own commit, before the markup.** The plan required this and the reason is worth restating: a snippet is a markup fragment and carries no style scope, so a conversion that moves the markup without the rule compiles, typechecks and passes every existing end-to-end assertion while silently dropping the hover affordance. Splitting the commits gives the rule an independent proof and an independent revert.
- **The nested snippets are declared where they are rendered, not hoisted to the top level.** A `{#snippet}` declaration renders nothing at its declaration site, so declaring `cardHeaderBody` inside the `<article>` immediately above its `{@render}` preserves document order exactly while keeping the diff to 74 insertions / 91 deletions instead of re-indenting the whole header block.
- **`concatClass({ class: extraClass }, 'transition-all !text-neutral')` replaces the wrapper's rest-props fold.** The wrapper folded its `restProps` through `concatClass`; the only rest-prop either call site ever passed was `class`, so the snippet takes it as an explicit `extraClass` parameter. `concatProps` treats an `undefined` `class` the same as an absent one, so the outer call site (which passed no class) produces the identical class string it did before.
- **The 159-01 guard was left untouched.** See the deviation below.
- **The dev server was restarted before the end-to-end runs.** `project_e2e_hmr_staleness_restart` records Vite serving stale SSR modules mid-session, and this plan rewrote a large module in a server that had been running since 159-02. A fresh server on 5273 is what the two runs were measured against.

## Deviations from Plan

### Auto-fixed / documented

**1. [Rule 3 - Blocking] Task 2 and Task 3 acceptance greps cannot reach zero, because the 159-01 guard names the deleted component in its own rationale**

- **Found during:** Task 2 (acceptance verification), carried into Task 3
- **Issue:** Task 2 requires `grep -rln 'EntityCardAction' apps/frontend/src` to return exactly one path, and Task 3 requires `grep -rn 'EntityCardAction' apps/frontend/src | wc -l` to return 0. Both read higher: the 159-01 survival guard at `apps/frontend/src/lib/dynamic-components/entityCard/tests/hoverShadedRule.test.ts` names `EntityCardAction` three times — in its file docstring (line 4), its `describe` title (line 74) and its failure message (line 84). The guard was committed by a sibling plan AFTER this plan was authored, so the criteria could not have accounted for it.
- **Fix:** None applied to the guard. Its assertion logic is untouched and its prose is unchanged. 159-01's own SUMMARY sets the governing precedent verbatim: *"editing a prohibition's own statement to satisfy a count of that prohibition is the fake-guard shape this repository rejects."* A guard that exists to catch the loss of a rule during THIS conversion must be allowed to say which conversion it means.
- **Files modified:** none
- **Verification:** All three residual matches were inspected and are prose — a docstring, a test title and an assertion message. `grep -rln 'EntityCardAction' apps/frontend/src` returns two paths before Task 3 and one after it (the guard), and every one of those matches is a comment or a string literal. There is no import, no type reference and no usage of the deleted component anywhere in `apps/frontend/src`. The criteria's stated intent — *"no reference to the deleted component survives"*, meaning no live code reference — is fully satisfied.
- **Committed in:** n/a (no code change)

**2. [Rule 2 - Missing critical] The plan's end-to-end grep does not reach two of the four specs that consume the entity-card action selector**

- **Found during:** Task 3
- **Issue:** The plan names three files that pin the DOM contract, one of which is `tests/tests/fixtures/voter/resultsPage.fixture.ts` — a fixture, not a spec. Its `openEntityDetailsForCard` helper (the first-match `entity-card-action` click) is consumed by **four** specs: `voter-alliance`, `voter-journey-mobile`, `voter-journey` and `perm-org-matching`. The plan's `--grep "results|alliance|feedback survey"` reaches only the first two. The other two would have gone unexercised against a change whose entire risk is first-match document order.
- **Fix:** Ran the plan's grep as specified, then ran the two unreached consumers explicitly as a second targeted run (`--project=voter-journey --project=perm-org-matching`). This is a targeted addition, not the phase-level full-suite run that `159-CONTEXT.md` § O5 budgets to plan 159-11.
- **Files modified:** none
- **Verification:** Run 1 — 103 passed (6.4m), 0 failed, 0 did-not-run. Run 2 — 122 passed (10.3m), 0 failed, 0 did-not-run. 225 tests total, zero failures, zero did-not-run.
- **Committed in:** n/a (no code change)

**3. [Rule 1 - Correction] The phase context's reference map is wrong about the results layout**

- **Found during:** Task 3
- **Issue:** `159-CONTEXT.md` D-H3's measured reference map calls `results/[[electionTab]]/+layout.svelte` the *"second real consumer"* with 1 ref, and the plan's own objective says *"two files need rewriting"*. The file imports nothing from the deleted module and renders nothing from it. Its single reference is a comment inside `handleDrawerClose` explaining why `noScroll: true` is set.
- **Fix:** Recorded here, as Task 3 required. The comment was reworded; no code changed in that file.
- **Files modified:** `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` (one comment line)
- **Verification:** `grep -n "^\s*import" ` over the file lists 23 imports, none of them the deleted module; `grep -n "EntityCardAction"` returned exactly one line, line 246, inside a `//` comment.
- **Committed in:** `8d58ff5e2`

---

**Total deviations:** 3 documented (1 blocking-criterion resolution, 1 missing-critical coverage extension, 1 factual correction to inherited context). None required a code change beyond the comment the plan already scoped.
**Impact on plan:** No scope creep. Two of the three are the plan's own instruments working — its `read_first` list pointed at the guard that then collided with its grep, and its "record that confirmation" instruction caught the context error it was written to catch. The third widened verification rather than narrowing it.

## Line-anchor drift (the standing caution held again)

Every line number this plan cited had moved, for the third consecutive plan in this phase:

| Cited in plan | Cited anchor | Actual |
|---|---|---|
| Task 1 read_first | EntityCard.svelte `:355-368` (style block) | `:353-359` |
| Task 1 / 2 read_first | EntityCard.svelte `:210-240` (call sites) | outer `:211`, inner `:221` |
| Task 3 read_first | results layout `:305-320` (the comment) | `:246` |
| Task 3 read_first | `resultsPage.fixture.ts:213` | `:163-171` |
| Task 3 read_first | `perm-show-feedback-survey.spec.ts:209` | `:165, :169` |
| Task 3 read_first | `voter-alliance.spec.ts:123` | `:68, :93` |
| PATTERNS § 2 | EntityCard.svelte style block `:362` | `:353` |

Each was re-measured before being acted on; none of them changed what had to be done, only where to look.

## What Phase 152's fix to this file becomes

Phase 152 fixed the repository's one recorded encoded-dash defect at `EntityCardAction.svelte:12`. That instance is now **retired, not lost** — the line ceased to exist with the file. 152's durable half survives untouched and bound this plan's work: the `\uXXXX`-in-comment rule and the forced-line-break rule in `scripts/assert-comment-hygiene.mjs`, wired into `yarn lint:check`, scanned 1630 files with 0 violations over the snippet's new documentation header and the reworded layout comment. Both were authored with literal dash characters throughout (D-N1).

## Issues Encountered

None. The conversion compiled on the first build, `svelte-check` reported 0 errors and 0 warnings, and no end-to-end test needed a retry.

## Threat model disposition

| Threat ID | Disposition | Evidence |
|---|---|---|
| T-159-12 (raw-HTML injection via snippet content) | mitigated | `grep -c '@html' EntityCard.svelte` returns 0; content renders only through `{@render content()}` |
| T-159-13 (button/anchor collapse) | mitigated | The `{#if}` ladder keeps `<button>` and `<a>` as distinct branches; `grep -c 'entity-card-action'` returns 2 (one per interactive branch) |
| T-159-14 (loss of the server-error fallback) | mitigated | `grep -c 'error(500'` returns 1; the `{:else}` branch is unchanged |
| T-159-SC (package installs) | accepted | No package was installed; no dependency changed |

## Flagged planner assumption — resolved as read

The plan surfaced one unresolved probe edge: whether *"the separate component no longer exists"* means deletion of both files with the behaviour reproduced in its single real consumer, versus a retained-but-deprecated component or a shared reusable snippet. This plan implemented the first reading, as the plan proposed. The `cardAction` snippet is **card-local and not exported**. If the operator intended a snippet reusable across components, this is the point to say so — the work would be a re-plan, not a patch.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- REVIEW-CMP-03's component-deletion half is delivered and pinned by three independent signals (the source-scan guard, the production build, and 225 end-to-end tests).
- **Outstanding, by design:** the phase-level full-suite end-to-end run is budgeted to plan 159-11 per `159-CONTEXT.md` § O5. This plan ran 225 tests across two targeted runs, not the whole suite. The full-suite gate for this phase remains outstanding and is 159-11's to close.
- **For the human verifier:** deliverable D3 is `human_judgment: true`. The hover shading is a pointer-only affordance that no automated signal in this repository observes. Hover a subcard and a subcard-bearing card's header on `/results` and confirm the shading still appears.
- The dev server left running on port 5273 is a fresh one started by this plan; the wave's original (PID 58984) was stopped deliberately.

## Self-Check: PASSED

- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` - FOUND
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` - FOUND
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte` - GONE (as required)
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.type.ts` - GONE (as required)
- Commit `e8b49f66b` - FOUND
- Commit `fb555ee98` - FOUND
- Commit `8d58ff5e2` - FOUND
- Plan `<verification>` re-run at HEAD: `yarn typecheck` 0 errors / 0 warnings; `yarn lint:check` 0 violations across 10 standing guards; `yarn workspace @openvaa/frontend test:unit` 85 files / 1564 tests / 0 failed with `hoverShadedRule.test.ts` green; end-to-end 225 passed / 0 failed / 0 did-not-run. The fifth criterion (`grep -rn 'EntityCardAction' apps/frontend/src | wc -l` returns 0) reads 3 — all three in the 159-01 guard's own prose, documented as deviation 1 above.

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-03*
