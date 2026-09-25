# Phase 165: Results Navigation Redraw - Context

**Gathered:** 2026-09-23
**Status:** Ready for planning

**Source of decisions:** `165-DISCUSSION-POINTS.md` — a 24-decision checkbox document the
operator filled in one pass. Its rule: an unticked decision accepts the `★ RECOMMENDED`
option; a tick overrules; free text beats every box. Three boxes were ticked (`C-2`, `C-3`,
`D-1`). `D-1`'s tick was on the ★ itself and so is an explicit confirmation. `C-2` and `C-3`
each ticked a non-★ box **and** carried a `NOTE` contradicting that box; both were resolved
with the operator before this file was written — see D-08 and D-09, which are operator
rulings and supersede the ticks.

<domain>
## Phase Boundary

Navigating within the voter results — switching entity tabs, opening an entity, switching
tabs inside it, closing it — never remounts or repaints what did not change, never moves the
scroll position, and never paints the page above an open overlay. The phase converts spikes
031–034's lab-gated prototype into production code and deletes the lab.

Six success criteria are fixed by `.planning/ROADMAP.md` § *Phase 165*. Two of them (4 and 5)
were measured by the spikes as **not required to fix any of the four reported symptoms** —
their value is organisational. The operator has ruled both IN (D-07, D-11), so they are
delivered as scoped, not retired.

**Not in this phase:** shorter/slug IDs, multi-election or multi-constituency selection,
a second routed overlay of any kind, the disabled-Results-button affordance bug, and the
SSR cookie crash on cold `/results` entry (recorded as a hazard below, not as work).

</domain>

<decisions>
## Implementation Decisions

Decision IDs map one-to-one onto `165-DISCUSSION-POINTS.md`'s section IDs, given in
parentheses. Every decision below is locked; the planner does not re-open them.

### A — Branch and integration

- **D-01 (A-1):** Branch `feat/165-results-navigation-redraw` off `integration/ship-12-squash`.
  Re-apply the spike's production-file changes **by hand**, reading each one against its spike
  README as it lands. Never merge `lib/spike/` or `results-layered/` into the new branch.
  Re-measured on 2026-09-23: merge-base `e1f1944cf`, spike is **18 commits behind** and **4
  ahead** of ship-12 (the discussion doc recorded 20 behind on 2026-09-22 — ship-12 moved;
  the planner re-derives this at run time rather than trusting either figure).
  — **Reversibility:** costly — once work lands on the new branch, switching to a merge or
  rebase base means redoing the `Tabs.svelte` conflict resolution and re-deleting the 15 lab
  files that a merge would drag in.
- **D-02 (A-2):** Leave `spike/results-redraw` in place, unmerged, as the reproduction rig —
  the lab panel is the only way to flip back to the broken behaviour side by side, and
  `forensics.mjs` targets it. Its purpose is recorded in the phase's evidence doc so nobody
  merges it later.

### B — The four validated fixes (criteria 1–3)

- **D-03 (B-1):** Ship the loader untrack fix **alone**; delete the `keepReady`
  stale-while-revalidate path. One mechanism, one place, kept honest by the guard in
  `layout.tracking.test.ts`. **Named residue:** a future load rerun from some other cause (a
  locale change, an `invalidate()`) still collapses the `(located)` subtree to `<Loading/>`.
  This is accepted, not overlooked, and must appear in the phase's residue record.
- **D-04 (B-2):** The regression guard keeps a negative control **without** the lab. The test
  constructs a small local load-shaped function that reads `url.pathname` *tracked*, runs it
  through the same `recordingUrl` Proxy, and asserts `pathname` **is** recorded. This proves
  the instrument against a known-bad reader with no production code needing to be bad.
  **Named limit:** it proves the Proxy works, not that the real load was ever wrong — spike
  031's README is the record of the latter, and must be cited from the test.
  Rejected: deleting the control (violates the standing acceptance rule head-on) and keeping
  a checked-in "legacy" copy of the load function as the control's subject.
- **D-05 (B-3):** Keep `isOverlayNavigation` keyed on the `entity` + `id` params. Add a unit
  test pinning the contract — both params present on either end ⇒ true, either absent ⇒ false
  — and a comment naming the assumption that the results drawer is the only routed overlay.
  Rejected: self-declaring overlay routes (SvelteKit does not expose the destination's load
  data in `onNavigate`, so it degrades to a route-id allowlist) and keying on "a modal is
  open" (wrong on open — the dialog does not exist in the frame the header flash happens in).
- **D-06 (B-4):** The `html.vt-no-names *` rule stays in `routes/+layout.svelte`'s `<style>`
  block, beside the reduced-motion rule it pairs with. The landmine comment about
  `@media`-wrapping-`:global` stays readable next to both. The `:global` rule in a component
  stylesheet is deliberate here.

### C — Route restructure (criterion 4)

- **D-07 (C-1):** **Do the restructure.** One ~400-line layout owning list + drawer + tabs +
  picker becomes a nested tree of small files. Recorded plainly: spike 033 found the new tree
  *behaviour-equivalent* to the fixed `/results` and spike 031 marked the route-shape
  assumption **invalidated** — so this fixes nothing the B-decisions do not. It is delivered
  because criterion 4 is the phase's contract and the organisational win is permanent.
  — **Reversibility:** costly — undoing it means rebuilding the single layout from its split
  parts.
  — **CORRECTED 2026-09-23 by research measurement.** This rating originally also named
  `ROUTE.ResultEntity`, `routeConsistency.test.ts`, `buildListRoute` and both `+page.ts` guards
  as things an undo must revert. That was written against spike 033's **required**-param tree.
  Under D-08 the leaf page keeps exactly the route id it occupies today, so **no route id
  changes** and all four are structurally untouched — the restructure is one layout file added
  and one layout file split. The original rating overstated the blast radius by roughly a plan's
  worth of work; plan against the corrected one.
- **D-08 (C-2) — OPERATOR RULING, supersedes the ticked box.** The restructure splits the
  **files** but keeps **all four params optional**. The innermost page renders the list, so
  it matches every URL shape and stays a single component instance; a layout whose param is
  missing and cannot be implied renders the **picker** instead of `{@render children()}`.
  **No redirect is introduced anywhere.**

  ```
  results/
    [[electionTab]]/+layout.svelte           election tabs; picker when unimplied
      [[entityTab=etPl]]/+layout.svelte      entity-type tabs
        [[entity=etSg]]/[[id]]/+page.svelte  LIST + drawer
  ```

  **Why this and not the ★:** the ★ (render the list at the `[electionTab]` level) also gives
  one instance, but leaves `[entityTab]` thin and trims the very organisational win D-07 is
  bought for. **Why this and not the tick:** the ticked option redirects
  `/results/{election}` → `/results/{election}/{defaultPlural}`, which reintroduces exactly
  the force-fill the Post-88-02 loop fix removed; it is safe only if every emitter
  (`buildListRoute`, the close path, every `ROUTE.ResultEntity` consumer) is changed in the
  same commit, and one missed emitter is a navigation loop in production.
  **Verified before ruling:** today's tree already proves the mechanism — a *single* leaf page
  under four optional params
  (`results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte`) is why
  one list instance survives every shape today. The spike's `results-layered/` tree used
  **required** params with a `+page.svelte` at three levels, and *that file split* — not the
  nesting — is what produced the measured implied-tab remount.
  — **Reversibility:** costly — the param optionality is load-bearing for D-10; making the
  params required later re-opens both the remount and the force-fill question together.
- **D-09 (C-3) — OPERATOR RULING, supersedes the ticked box.** Backward compatibility is a
  **non-goal**: no results URL is published anywhere. The route test enumerates only the
  shapes the application itself emits (picker, `{election}`, `{election}/{plural}`, and the
  full entity URL). The cross-type `organizations/candidate/{id}` edge is kept only if a
  current emitter produces it, and otherwise dropped with the drop recorded. **No aggressive
  canonicalisation and no redirects** — the ticked option's mechanism is excluded by D-08.
- **D-10 (C-4) — AMENDS the discussion document's ★.** That ★ ("let the two guards go;
  SvelteKit's 404 is the answer") rested on required params making those URLs unroutable.
  D-08 keeps the params optional, so the URLs **stay routable** and both guards keep their
  reason to exist: `+page.ts`'s matcher-fallthrough 404 and its entity-without-id /
  id-without-entity 307 redirect are **carried into the new tree**, with their doc-comments,
  rather than deleted. The graceful 307 on `/results/{e}/candidates/candidate` survives.

### D — One app-wide drawer host (criterion 5)

- **D-11 (D-1):** **Payload + context bridge**, as spike 034 built and measured it —
  `drawerHost.open({ key, title, content: Snippet, contexts: getAllContexts(), onDismiss })`,
  with the host wrapping content in `ContextBridge`. Measured by the spike: entity→entity swap
  with no second `showModal` and no backdrop flash, an animated close the per-route `Drawer`
  cannot do, and backdrop covering the header from frame 1. The operator ticked this option
  explicitly rather than leaving it to default.
  Rejected: the global shell + portal variant — **unproven** (spike 034 named it worth
  comparing and did not build it), and Svelte 5 has no portal primitive, so it means manually
  relocating a DOM subtree, which breaks `transition:` directives, focus order and the a11y
  contract `ModalContainer` holds.
  — **Reversibility:** costly — every hosted component acquires a silent dependency on the
  bridge; withdrawing the host means re-homing each opener's content in its own route tree.
  **Standing obligation carried by this decision:** the verdict on spike 034 was `PARTIAL`
  precisely because the question-info path was never exercised — D-13 is what discharges it.
- **D-12 (D-2):** **Both halves** of teardown safety: the opener-side last-defined pattern
  (`$state.raw` last-defined entity kept current by `$effect.pre`) as the documented
  convention, **plus** a `<svelte:boundary>` around the hosted content inside the host. The
  convention prevents the throw; the boundary means a future opener that forgets it closes the
  drawer badly instead of hanging the whole app. This is the phase's sharpest landmine: the
  host keeps rendering the payload through its out-animation *after the opener is destroyed*;
  in the spike the snippet read the opener's `entity` prop, got `undefined`, `EntityDetails`
  threw mid-flush, the host's effect never ran and **the dialog stayed open**.
- **D-13 (D-3) — AMENDED 2026-09-23 after research measured the original landing site red.**
  The extended-question-info drawer **moves to the host in this phase, and is made
  exercisable**: a seed template with a question carrying extended info and
  `questions.interactiveInfo.enabled`, plus an E2E spec that opens and closes it through the
  host. An unexercised path is exactly what spike 034 flagged, and criterion 5 names this
  drawer in terms.
  **The template is `packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts`, not
  `e2e/base`** (operator ruling, 2026-09-23). `perm-interactive-info` already ships
  `interactiveInfo.enabled: true` over purpose-built info questions, already has its own
  Playwright projects, and `tests/tests/specs/perm/perm-interactive-info.spec.ts` already opens
  the popup modal and asserts its body — so D-13's words are satisfied by a template that
  exists. The work is to migrate `QuestionExtendedInfoButton` to the host and add explicit
  open-and-close-**through-the-host** assertions to that spec.
  **Why the original reading was dropped:** `e2e/base` ships the flag `false` and already
  carries one opinion question with `info`; the questions layout picks popup-vs-inline on
  exactly that pair, and `voter-journey.spec.ts:662-666` **hard-asserts the inline expander**
  (`voter-questions-info-button`) on that question. Flipping the base flag makes that button
  not render — a cardinal failure under the E2E hard rule, measured, not predicted.
  **Consequence — the "widest blast radius" warning is withdrawn.** D-13 now makes no change to
  the E2E base dataset and cannot move a visual baseline. Its remaining hazard is narrower and
  sharper: **the testid moves from the drawer body to the host dialog.** On the spike branch the
  host puts `voter-questions-popup-info-modal` on the `<dialog>`, while today's
  `QuestionExtendedInfoDrawer` puts it on the body — which is what `questionInfo.fixture.ts`
  reads, and that fixture feeds `perm-interactive-info.spec.ts`. Either keep the testid on the
  body inside the host payload or update the fixture; getting it wrong is a red suite. The
  fixture also asserts that same locator is *hidden* in expander mode, and those semantics change
  once the testid sits on a persistent host dialog.
- **D-14 (D-4):** Close motion reuses the existing `DELAY` constants and the `fly` shape
  `Drawer.svelte` already uses. Under `prefers-reduced-motion: reduce` the out-animation delay
  is skipped entirely (close immediately), consistent with the gate already in `shouldAnimate`.
  The spike's hard-coded 250 ms does not ship.

### E — Scroll and tab behaviour (criterion 2)

- **D-15 (E-1):** The three navigations criterion 2 names — entity open, entity close,
  entity-tab switch — keep scroll. **Election change keeps the default scroll-to-top**, because
  switching election replaces the entire list with different content and landing mid-list in a
  list the voter has not seen is disorienting. Accepted cost: this reads as inconsistent with
  the tab behaviour beside it.

### F — Verification and evidence

- **D-16 (F-1):** Criteria 2 and 3 are proven by a **committed Playwright spec in the default
  E2E suite**, not by the spike's one-off `forensics.mjs`. It asserts: scroll position survives
  open / close / tab-switch **from a scrolled start**; no document VT runs for overlay
  navigations; and any VT running with a `dialog[open]` present carries no named groups. Both
  VT facts are observable from the page — `document.startViewTransition` can be wrapped in an
  init script, and the `vt-no-names` class sits on `<html>`. The spec must **skip** rather than
  fail under reduced-motion or an unsupported browser.
  Rejected: leaning on the visual-regression project (its screenshots are taken at rest, and a
  layering defect exists for ~300 ms) and keeping `forensics.mjs` as the instrument (nothing in
  CI would guard the fix).
- **D-17 (F-2):** One measured negative-control pair **per fix** — loader untrack, overlay-VT
  skip, name-strip, `noScroll` — recorded in `165-NEGATIVE-CONTROL.md` with command, exit code
  and counts, in the format every v2.15 phase used. Four revert-measure-restore cycles, each
  needing a dev server and a clean DB. The spike's legacy-vs-hardened run does **not** substitute:
  it was measured on a different tree.
- **D-18 (F-3):** "Did not remount" is asserted by **node identity** — tag a list DOM node
  before the navigation, assert the same node is still there after. That is literally what the
  claim means and it needs zero production instrumentation. Rejected: a dev-only mount ledger
  (reintroduces the lab under a new name, and the E2E suite runs the dev server, so "dev-only"
  does not keep it out of the tested build) and asserting only visible consequences (scroll
  kept, no `<Loading/>` flash — which is exactly the state `keepReady` produces and 031 rejected).
- **D-19 (F-4):** Run the visual project **first**; re-capture a baseline only when the diff is
  explained by an intended change. An unexplained diff is a defect to investigate, not a
  baseline to bless. Baselines are captured **only** in
  `mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64`, never on a developer
  Mac. **Precondition:** this machine's known ENOSPC constraint (Docker.raw sparse bloat) must
  be reclaimed before the phase's final gate, or the run is void rather than red.

### G — Removing the scaffolding (criterion 6)

- **D-20 (G-1):** Delete all of it, and add **one cheap standing assertion** — a unit test
  grepping `apps/frontend/src` for `lib/spike` imports and for a `results-layered` route
  directory, expecting zero. The repo's habit is a guard per closed hole. Without it nothing
  stops a future spike branch being merged with its lab intact, which is the shape criterion 6
  exists to close. Keeping `results-layered/` behind a dev-only route guard is excluded —
  criterion 6 forbids it in terms, and a second results implementation rots within one phase.
- **D-21 (G-2):** `forensics.mjs`, `probe-global.mjs` and `probe-qinfo.mjs` stay under
  `.planning/spikes/` — they are spike records, not app code, and criterion 6 scopes to
  `apps/frontend/src`. One line is added to their READMEs noting they target the lab panel and
  will not run against the shipped tree.

### H — Requirements and documentation

- **D-22 (H-1):** Register a new `### Results Navigation` section in the existing
  `.planning/REQUIREMENTS.md` with **RNAV-01 … RNAV-06** mapped one-to-one onto the six success
  criteria, and add the matching rows to § *Traceability*. 165 is an addendum to v2.15, which is
  how `.planning/ROADMAP.md`'s progress table already files it.
  **Hard coupling:** this reopens a milestone `STATE.md` records as complete. STATE.md's
  `29/29`, `270/270` and `100 %` must be corrected **in the same commit** as the REQUIREMENTS.md
  edit, or the two documents disagree. Both traceability counters are **recounted from the table
  rows, never incremented** — the file's own § Traceability note records why.
  — **Reversibility:** costly — the traceability table and the rollup are counted, not derived,
  so a half-applied edit is the exact failure mode that file already documents twice.
- **D-23 (H-2):** Add a `results-redraw` domain to the existing
  `./.claude/skills/spike-findings-voting-advice-application-gsd/` skill during this phase,
  carrying the two invariants that outlive the code: **a document VT must never run with names
  while a modal is open**, and **the `(located)` load must not read the URL tracked**. This also
  silences the "unpackaged spikes" warning that fires on every discuss/plan run while 031–034 sit
  in `MANIFEST.md` but not in the skill.
- **D-24 (H-3):** One short subsection under `CLAUDE.md` § *Frontend (SvelteKit)* stating the same
  two invariants and pointing at `apps/frontend/src/lib/utils/viewTransition.ts` and
  `apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts`. CLAUDE.md is the file
  agents always read; a doc-comment is only found by someone already editing the right file, which
  is not the person about to add a `view-transition-name` somewhere else.

### I — Added after research (2026-09-23)

- **D-25 — `results/[[electionTab]]/statistics/` moves out from under the results tree.**
  Operator ruling, 2026-09-23, taken because D-08's split forces a disposition that cannot be
  deferred. Research measured that `/results/{election}/statistics` **currently renders the
  results page, not the statistics page**: `ROUTE.Statistics` resolves into the results layout
  chain, and that layout renames its `children` prop to `_children` and never renders it, so the
  statistics page is swallowed. Nothing links to it and no test covers it, which is why the
  defect survived. D-08 necessarily introduces `{@render children()}` at the `[[electionTab]]`
  level, which would un-swallow the page **nested inside the results hero, ingress and election
  picker** — two `<h1>`s and a probable heading-order violation on a route nothing watches.
  **The ruling:** move `statistics/` to `results/statistics/` and update `ROUTE.Statistics` in
  the same commit, and record the pre-existing swallow as a finding of this phase rather than
  letting it vanish into the split. Rejected: a `+layout@.svelte` reset (the repo has no
  precedent for one, so it would need its own explanatory comment), accepting the nesting (ships
  the heading defect), and preserving the swallow deliberately (keeps a route that silently
  renders the wrong page).
  — **Reversibility:** reversible — a file move plus one constant.
  **Scope note:** statistics is named in none of the six success criteria. It is in scope only
  because the split forces the question, and the work is bounded to the move plus the constant.

### Claude's Discretion

The operator ruled on all 24 decisions. Left to the planner and executor:

- Exact file names and internal split of the new route tree, provided it satisfies D-08's shape.
- Placement and naming of the new test files (D-05, D-16, D-18, D-20).
- The order plans are sequenced in, and which plans carry which negative-control pair (D-17).
- Whether the RNAV requirement text is worded per-criterion or per-mechanism, provided the
  mapping stays one-to-one (D-22).

### Folded Todos

- **Fix view transition flicker in Results section** —
  `.planning/todos/pending/2026-06-15-fix-view-transition-flicker-in-results-section.md`
  (created 2026-06-15, area `ui`, scope "next-milestone (post-v2.14)"). Its two symptoms are this
  phase: *"scroll position lost after drawer close"* is criterion 2 verbatim, and *"drawer flicker
  when changing details tabs"* is the in-drawer tab switch. The phase **closes the first outright**
  (D-15, D-16). The second lands on this phase's already-parked deferred idea — element-scoped VT
  for the in-drawer tab panel instead of today's whole-viewport root cross-fade — so the todo must
  be resolved as **closed with a named residue**, not silently marked done. The todo's own
  cross-reference to spikes 013–016 remains accurate and is superseded in detail by 031–034.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/ROADMAP.md` § *Phase 165: Results Navigation Redraw* — the six success criteria;
  the phase boundary; the "must be merged onto `integration/ship-12-squash` after the session
  debugging that branch is done" constraint.
- `.planning/phases/165-results-navigation-redraw/165-DISCUSSION-POINTS.md` — the 24 decisions in
  full, each with its rejected options and their costs. This CONTEXT.md states the outcomes; the
  discussion doc states the reasoning and the alternatives, and is the reference when a plan wants
  to reopen one.
- `.planning/REQUIREMENTS.md` § *Standing acceptance rule* — **prove the guard fails before
  claiming it guards**; every new or repaired check is run as a negative control twice. Its visual
  corollary (pinned container, never a developer Mac) governs D-19. This rule is why D-04 exists
  at all.

### Grounding spikes (read before touching the mechanism they cover)
- `.planning/spikes/031-results-nav-flicker-forensics/` — the root cause: the `(located)` load's
  tracked `url.pathname` / `url.search` read. Also the finding that the route-shape assumption is
  **invalidated**, and the rejection of `keepReady` as "a fallback, not the fix" (170–260 nodes of
  list churn per navigation).
- `.planning/spikes/032-results-redraw-hardened-fixes/` — the four fixes in final form, and the
  open nit behind D-05.
- `.planning/spikes/033-layout-shaped-results-routes/` — the layered tree, its behaviour
  equivalence, and the measured implied-tab remount that D-08 designs around.
- `.planning/spikes/034-global-drawer-host/` — the drawer host, its `PARTIAL` verdict, the
  teardown hang behind D-12, and the unexercised question-info path behind D-13.
- `.planning/spikes/MANIFEST.md` — carries all four rows; the findings skill does not yet (D-23).

### Standing project rules that bind this phase
- `CLAUDE.md` § *Context Destructuring Rule (Svelte 5)* — never destructure a reactive accessor;
  never bind `dataRoot` to an intermediate read alias. The results tree reads `ctx.dataRoot` and
  the voter context throughout, and D-07's file split is exactly the operation that tempts an alias.
- `CLAUDE.md` § *Svelte Warning-Accepted Format* — `// svelte-warning: accepted — <rationale>`.
- `CLAUDE.md` § *E2E Hard Rule (cardinal failure)* — no task completes while any E2E test fails;
  no "known-flaky" exemptions; a "did not run" test counts as a failure.
- `.agents/code-review-checklist.md` — checked before any plan is called done.
- `.claude/skills/components/context-reactivity.md` — the full mechanism behind the destructure
  trap and the `dataRoot` `#version` carve-out; `Skill("components")` is the route to it.
- `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` — spikes 013–016 (View
  Transitions + a11y: `onNavigate` → `startViewTransition`, per-element `view-transition-name`,
  `afterNavigate(focus({preventScroll: true}))`, reduced-motion belt-and-braces). D-23 extends it.

### Production files the decisions name
- `apps/frontend/src/routes/(voters)/(located)/+layout.ts` — the `fixLoader` branch (D-03).
- `apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts` — the guard and the control
  being rebuilt (D-04).
- `apps/frontend/src/lib/utils/viewTransition.ts` — `isOverlayNavigation`, `VT_NO_NAMES_CLASS` (D-05).
- `apps/frontend/src/routes/+layout.svelte` — `onNavigate` and the `html.vt-no-names *` rule (D-06).
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` — the
  401-line layout D-07 splits.
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts`
  — the matcher-fallthrough 404 and the entity/id coupling 307 that D-10 **keeps**, and the
  "Post-88-02 loop fix" comment that forbids the ticked C-2 option.
- `apps/frontend/src/lib/routes/route.ts` (`ROUTE.ResultEntity`) and
  `apps/frontend/src/lib/routes/routeConsistency.test.ts` — pinned to the optional-param path.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetailsDrawer.svelte` and
  `apps/frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte` — the two drawers
  criterion 5 collapses into one host (D-11, D-13).
- `tests/tests/fixtures/voter/resultsPage.fixture.ts` — reaches the page by
  `buildRoute({ route: 'Results' })` + testids, never hand-built deep URLs. D-09's non-goal does
  not license breaking this fixture.
- `tests/README.md` § Run — the E2E preflight and how to read its failure message.

</canonical_refs>

<code_context>
## Existing Code Insights

All figures below were measured on this worktree (`spike/results-redraw`, HEAD `e65857f04`) on
2026-09-23 with the command given. Per the project's content-anchor rule, **the planner re-derives
every population at run time** — these are a snapshot to plan against, not a target to bend code to.

### Reusable Assets
- **The four fixes already exist as production code on this branch**, gated by lab toggles that
  only restore the old behaviour. The phase's B-decisions are largely a de-labbing, not a rewrite:
  `(located)/+layout.ts` (`fixLoader`), `lib/utils/viewTransition.ts`, `routes/+layout.svelte`,
  and the results layout's `handleEntityTabChange` … `{ noScroll: true }`.
- **`lib/spike/ContextBridge.svelte`, `DrawerHost.svelte`, `drawerHostState.svelte.ts`,
  `GlobalEntityDrawer.svelte`** — spike 034's host, built and measured. D-11 productionises these
  four; `redrawLab.svelte.ts` and `RedrawLabPanel.svelte` are deleted outright.
- **`DELAY` constants and `Drawer.svelte`'s `fly` shape** — reused by D-14 instead of a magic 250 ms.
- **`shouldAnimate`** — already carries the reduced-motion gate D-14 branches on.
- **`recordingUrl` Proxy in `layout.tracking.test.ts`** — D-04 keeps the instrument and replaces
  only its control subject.

### Established Patterns
- **Today's results tree is a single leaf page under four optional params.** `+page.svelte` lives
  only at `[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/`, which is why one list
  instance survives `/results`, `/results/{e}` and `/results/{e}/{plural}` alike. **This is the
  mechanism D-08 preserves** — verified by inspection, and the reason the operator's ruling is
  sound rather than optimistic.
- **The loader deliberately refuses to force-fill `entityTab`.** The doc-comment on
  `results/[[electionTab]]/+layout.ts` says force-filling "bounces navigation, because downstream
  consumers … emit same-shape URLs", and `+page.ts` carries a "Post-88-02 loop fix" note. D-08 and
  D-09 exist to keep that closed.
- **`buildRoute` / `buildListRoute`, not hand-built URLs**, is how both the app and the E2E
  fixtures reach results. Any new route shape must be reachable through the builder.
- **Negative-control register per phase** (`165-NEGATIVE-CONTROL.md`, D-17) — the format every
  v2.15 phase used: command, exit code, counts, injection text recorded verbatim.

### Integration Points
- **Scaffolding to delete (criterion 6, D-20).** Measured 2026-09-23 from
  `apps/frontend/src`: **6** files under `lib/spike/`; **9** files under
  `routes/(voters)/(located)/results-layered/`; **14** files outside `lib/spike/` import from it
  (`grep -rl 'lib/spike' --include='*.svelte' --include='*.ts'` returns 15, one of which is
  `redrawLab.svelte.ts` itself). `SPIKE` markers: **30** repo-wide, **14** once `results-layered/`
  and `lib/spike/` are excluded. `labMount(` sites: **9** repo-wide, **5** outside
  `results-layered/`. The discussion doc recorded 24 markers and 8 `labMount` sites on 2026-09-22
  under a third scoping — **the divergence is scoping, not drift, and is exactly why the guard in
  D-20 greps rather than counts.**
- **The five non-route importers of `lib/spike/`** are where de-labbing meets real components:
  `lib/components/questions/QuestionExtendedInfoButton.svelte`,
  `lib/dynamic-components/entityDetails/EntityDetailsDrawer.svelte`,
  `lib/dynamic-components/entityList/EntityListWithControls.svelte`,
  `lib/layouts/main/MainContent.svelte`, `lib/utils/viewTransition.ts`.
- **`packages/dev-seed` — the `e2e/perm/perm-interactive-info` template, NOT `e2e/base`**
  (amended 2026-09-23 with D-13; the original `e2e/base` reading was measured to break
  `voter-journey.spec.ts`). This is the phase's only non-frontend surface, and the template
  already carries what D-13 needs — the change is to the spec's assertions and to
  `questionInfo.fixture.ts`, not to the dataset's shape.
- **Visual baselines** `voter-results-desktop.png` / `voter-results-mobile.png` — movable by
  **D-07** (D-13 no longer touches the base dataset, so it cannot move them); governed by D-19.

### Known hazard — not folded, not work for this phase
- **`.planning/todos/pending/2026-08-24-cold-results-navigation-crashes-dev-server.md`** (priority
  high). Direct cold navigation to `/results` with no session has killed the Vite dev server
  outright — `Error: Cannot use cookies.set(...) after the response has been generated`, an
  uncaught rejection that exits the process rather than logging. The cause is
  `apps/frontend/src/lib/supabase/server.ts` / `hooks.server.ts` — the SSR auth surface, **not**
  navigation redraw — so folding it would widen this phase into auth/SSR. It is recorded here
  because **this phase drives cold direct entry to `/results` constantly** (D-16, D-17, D-18 all
  do), and an executor who hits it must recognise it as this known defect rather than as
  something the phase broke. Last measured 2026-08-24 at HEAD `e74ae377e`; **currently unverified
  on this tree** — do not assume it is either live or fixed without re-measuring.

</code_context>

<specifics>
## Specific Ideas

**The operator's C-2 note, verbatim** — the origin of D-08, recorded as written:

> "Instead of redirect, can't we just keep the routeParams optional, rendering both their layouts
> with implied defaults and the list in the innermost layout/page? And when a param is missing and
> cannot be implied, make that layout show the picker instead of children?"

**The operator's C-3 note, verbatim** — the origin of D-09:

> "See above + no urls are published anywhere."

Both notes overrode boxes the operator had ticked; the document's own rule ("free text beats every
box") is what resolved them, confirmed with the operator before this file was written.

**Two invariants the operator wants to outlive the code** (D-23, D-24), to be stated in exactly
these terms:
1. A document View Transition must never run with names while a modal is open.
2. The `(located)` load must not read the URL tracked.

</specifics>

<deferred>
## Deferred Ideas

- **Element-scoped VT (or a plain CSS fade) on the drawer's tab panel**, instead of today's
  whole-viewport root cross-fade for the in-drawer tab switch. Spike 032's open nit; cosmetic.
  **This is the residue half of the folded todo** — when that todo is closed, this is what it is
  closed *with*.
- **A second routed overlay of any kind.** Would force D-05's predicate to generalise; the unit
  test names the assumption but cannot detect a new overlay.
- **Shorter / slug IDs, multi-election and multi-constituency selection** — separate capabilities
  (see the reviewed todo below).

### Reviewed Todos (not folded)

- **Results URL refactor follow-ups (shorter IDs, multi-election/constituency, upstream voter
  routes)** — `.planning/todos/pending/results-url-refactor-followups.md`, carried from Phase 62,
  which created the very URL shape D-07 now restructures. All three items are separate capabilities
  and folding any of them would be scope creep by this phase's own guardrail. **Recorded so it does
  not rot:** the restructure changes the tree this todo is written against, so the todo needs
  re-reading against the new shape after the phase lands — its code snippet of the Phase-62 route
  shape will be stale.
- **Disable hover and pointer on disabled Results header button** —
  `.planning/todos/pending/2026-06-06-disable-hover-and-pointer-on-disabled-results-header-button.md`.
  Results-adjacent by name only; it is a disabled-anchor affordance bug in `Button.svelte` /
  `Banner.svelte` with nothing to do with navigation, remounting or overlays. Left pending,
  untouched by this phase.
- The remaining **149** todos that `todo.match-phase 165` returned matched on generic keywords
  (`frontend`, `routes`, `svelte`, `lib`) or the bare area tag, not on this phase's subject. Not
  individually reviewed, and deliberately so.

</deferred>

---

*Phase: 165-Results Navigation Redraw*
*Context gathered: 2026-09-23*
