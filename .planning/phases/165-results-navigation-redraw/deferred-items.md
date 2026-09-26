# Phase 165 — deferred items

Out-of-scope discoveries made while executing this phase's plans. Logged rather than fixed, per the
executor's scope boundary: only issues DIRECTLY caused by the current task's changes are auto-fixed.

---

## D-165-03-01 — At maximum document scroll, opening the entity drawer CLAMPS `window.scrollY`

**Found during:** 165-03 task 2, second E2E run (`tests/e2e-runs/165-03-spec-2`).

**Measured, verbatim:**

```
Error: the page scrolled when the entity drawer opened
expect(received).toBe(expected) // Object.is equality
Expected: 1464
Received: 1187
```

The scrolled start was established by `scrollIntoViewIfNeeded()` on the **last** card of the
13-candidate base list, which puts the document at (or within a card of) its maximum scroll offset.
Opening the drawer then moved `scrollY` from 1464 to 1187 — a 277 px reduction, not a scroll-to-top.

**Most probable mechanism, not yet isolated.** The results list container carries
`content-visibility: auto` (`results/[[electionTab]]/+layout.svelte`, the LIST CONTAINER block).
`showModal()` makes the rest of the document inert, and a browser is entitled to skip the contents
of a `content-visibility: auto` subtree once it is not relevant to the user. A skipped subtree
collapses to its intrinsic size, the document shrinks, and at maximum scroll the browser clamps
`scrollY` to the new maximum. That is a property of the browser's layout under a modal rather than
of the application's `noScroll` handling — but it has **not** been isolated: no run has yet compared
`document.documentElement.scrollHeight` across the open with the `content-visibility` declaration
removed. Treat the mechanism as a hypothesis.

**Why it is not asserted in 165-03.** RNAV-02 is about the application not throwing the voter back
to the top of the list on open / close / tab switch. The spec therefore measures from a **mid-list**
start, where a shrink of this size does not clamp, and its failure messages now carry the
`scrollHeight` delta so a future failure says on its own whether the offset moved or was clamped.
Asserting the maximum-scroll case would be asserting a browser layout behaviour the phase did not
set out to change and does not control.

**What a follow-up would look like:** measure `scrollHeight` before and after `showModal()` with and
without `content-visibility: auto` on the list container; if the declaration is the cause, decide
whether a voter who has scrolled to the very bottom of the list seeing the page shift by ~277 px on
drawer close is acceptable, or whether the container needs `contain-intrinsic-size` so the skipped
size matches the rendered one.

---

## `/results` entity links omit the election segment, and the plural then masquerades as an election id

**Found during `165-04` (wave 4), Task 3. Pre-existing — reproduced at the pre-plan baseline `260a3ffe4`. Out of scope, recorded rather than fixed.**

**What happens.** Reaching `/results` with NO `?electionId=…` search params — which is exactly what
`resultsPage.goToPage()` does, and what a hand-typed URL does — leaves `page.params.electionTab`
unset. The election-tab loader's GUARD 2 does not canonicalize, because it fires only when the
AVAILABLE array has exactly one member and that array is read from the search side, which is empty.
The list still renders, because the layout's single-election fallback implies the election from
`voterContext.selectedElections`.

Then an entity card's link is built by `getRoute.current({ route: 'ResultEntity', entityTab, entity, id })`.
`buildRoute` carries the CURRENT route params forward, and `electionTab` is genuinely absent, so the
emitted path is `/results/{plural}/{singular}/{id}` — three segments. SvelteKit matches it against
`[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`: `[[electionTab]]` is FREEFORM, so it
takes `candidates`; `[[entityTab=etPl]]` rejects `candidate` via its matcher and is treated as
missing; `[[entity=etSg]]` takes `candidate`; `[[id]]` takes the id. The voter now has
`electionTab = 'candidates'` — a plural sitting in the election slot — and no election resolves from
it, so `voterContext.currentResultsEntityType` goes `undefined` and the list area shows the
no-nominations warning under the open drawer.

**Why it was invisible before this phase.** The pre-split layout rendered the drawer opener ABOVE
the type gate, so the drawer opened over the broken list and the only symptom was an empty list
behind a modal — which nothing asserted. `165-04`'s split nests the opener under that gate, which
turned the latent defect into a blank page; the split therefore carries an explicit overlay
carve-out at the entity-tab layout (`activeEntityType || drawerVisible`) so the drawer still mounts.
That carve-out treats the symptom. The defect itself is untouched.

**Evidence.** `perm-localisation-positive` is the exercising spec (`resultsPage.goToPage('en')` then
a card click). Measured green at `260a3ffe4` (70 passed) and red at the mid-plan tree without the
carve-out, with the failure snapshot showing the no-nominations text and no dialog.

**Why it is not fixed here.** Three reasons, all binding. D-09 forbids aggressive canonicalisation
and redirects outright, which rules out the obvious fix of redirecting the malformed shape. The
emitter (`EntityCard.svelte`) and the route table are outside `165-04`'s declared files. And the
phase's scope boundary forbids fixing pre-existing defects unrelated to the task.

**What a follow-up would look like.** The honest options, in rough order of preference: give
`[[electionTab]]` a matcher so a plural can never occupy the election slot (it is the only one of
the four params with no matcher, and that asymmetry is what makes the mis-slot possible); or have
`buildRoute` refuse to emit a `ResultEntity` URL with no election segment; or have the results
loader put the implied election into the path the same way it already canonicalizes the
single-AVAILABLE case. The first is the smallest and closes the class rather than the instance,
and it would also strengthen the V5 input-validation control the phase's threat register tracks as
T-165-02 — today `electionTab` accepts any attacker-supplied string.

---

## Pre-existing lint warning in `candidateContext.svelte.test.ts`

`yarn lint:check` reports one frontend warning throughout `165-04` — `'question' is assigned a value
but never used` at `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:19`.
Unrelated to this plan's files, present before and after, and non-blocking (`lint:check` exits 0).
Recorded so a later reader does not attribute it to the route split. Fifteen further warnings sit in
`@openvaa/dev-seed`, likewise pre-existing.

---

## `resultsPage.openEntityDetailsForCard` only works on cards that HAVE subcards

The fixture's docstring claims its `entity-card-action` descendant lookup resolves "the whole-article
wrap for no-subcard cards". Measured otherwise, twice: for a card with NO subcards the
`entity-card-action` anchor is the card's **ancestor**, so a descendant lookup off the card finds
nothing and the click times out. `voter-results-redraw.spec.ts` already worked around this at its
entity-open step before this plan, and `165-04` hit it again on the candidates tab and used the same
card-title technique. The fixture happens to work wherever it is currently called because those call
sites are on the organizations tab, whose cards do carry subcards.

Not fixed here: the fixture is shared by several specs and correcting the lookup (or the docstring)
is a test-infrastructure change outside this plan's files. A follow-up should either make the lookup
resolve the ancestor anchor, or correct the docstring so the next caller is not misled.

---

## ✅ RESOLVED — was ⚠ BLOCKING (phase-level): `voter-journey` EQTYP-02 fails intermittently on the results election picker

> **RESOLVED by `165-05.1` on 2026-09-23.** Closed in place rather than by addendum, so the `BLOCKING` state below
> cannot be read as current. The original record is kept verbatim underneath, with two factual corrections marked
> **CORRECTION**, because a stale premise left readable is how a false premise propagates into the next phase.
>
> | | Red / counted | Rate |
> |---|---|---|
> | Before — phase tip `404948d78` (`165-BASE-FLAKE-MEASUREMENT.md`) | 6 / 16 | 37.5 % |
> | Before — pre-fix body re-measured contemporaneously (NC-2 arm C) | 4 / 16 | 25.0 % |
> | Base `integration/ship-12-squash` | 0 / 22 | 0 % |
> | **After — fix HEAD (NC-2 arm A)** | **0 / 16** | **0 %** |
>
> Fix vs pooled pre-fix evidence (10/32): Fisher's exact two-tailed **p = 0.0196**. The fix is in
> `apps/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte`: `expanded` now reconciles against a
> resolved `activeIndex`, the `DELAY.lg` collapse is cancellable so the most recent intent wins, and a correction
> collapses without the slide outro that otherwise keeps a de-selected option in the DOM for 225 ms.
>
> **Attributed, not merely asserted green:** reverting only the reconciliation reproduced the symptom (arm B, red on
> run 13 of 16), and reverting the whole fix to the byte-identical pre-fix body reproduced it at its documented rate
> (arm C, 4/16). The first negative control came back 0/8 GREEN and was **not** allowed to stand — see
> `165-NEGATIVE-CONTROL.md` § 8d. What that measurement does NOT license is also written down, in § 8e: it cannot
> apportion credit between the fix's three parts, and 0/16 bounds the residual rate at ≤ 19.4 %, not at zero.
>
> **Full default E2E suite at the fix HEAD: 171 passed, 0 unexpected, 0 flaky, 0 skipped, no retries**
> (`tests/e2e-runs/165-05.1-full-suite`).

**Measured in `165-05`, on seven executions of the `voter-journey` project during this plan: 4 green, 3 red.** The
failing test is always the same one — `tests/tests/specs/voter/voter-journey.spec.ts:1415` *"all-min ranks POLAR_MIN
above POLAR_MAX; a mid number answer shifts both scores monotonically without flipping the ordering"* — and it always
fails inside `expectElectionOptionAndSelect` (`voter-journey.spec.ts:376-385`), which drives the results election
`AccordionSelect`. Under this project's E2E hard rule this is a CARDINAL failure and it is recorded as blocking.

**The runs, all through the preflight-confirmed wrapper, `--no-db-reset`, every exit status read directly:**

| Run dir | Project selector | Verdict |
|---|---|---|
| `tests/e2e-runs/165-05-qinfo` | `perm-interactive-info` (chain, 117 tests) | green |
| `tests/e2e-runs/165-05-qinfo-assert` | `perm-interactive-info` (chain) | **red** — symptom (a) |
| `tests/e2e-runs/165-05-vj-probe-1` | `voter-journey` (4 tests) | green |
| `tests/e2e-runs/165-05-vj-probe-2` | `voter-journey` | **red** — symptom (b) |
| `tests/e2e-runs/165-05-vj-probe-3` | `voter-journey` | green |
| `tests/e2e-runs/165-05-qinfo-assert-2` | `perm-interactive-info` (chain, 118 tests) | green |
| `tests/e2e-runs/165-05-qinfo-post-delete` | `perm-interactive-info` (chain) | **red** — symptom (a) |
| `tests/e2e-runs/165-05-qinfo-post-delete-2` | `perm-interactive-info` (chain, 118 tests) | green |

**Two symptoms, one suspected cause.**

- **(a)** `expect(visibleOptions).toHaveCount(1)` gets **2** for the full 2 s window: after the election is selected the
  accordion never collapses. The error-context snapshot (`165-05-qinfo-assert/html/data/2720286f79…md`) shows the
  selection DID take — Regional is `[active] [selected]`, the list under it is the Regional constituency's 13 cards —
  and Municipal is still listed beside it, i.e. `AccordionSelect`'s local `expanded` is stuck `true`.
- **(b)** `locator.click` times out with `<html lang="en">…</html> intercepts pointer events`. That is the document
  View-Transition signature: while a VT is live the captured content is painted through pseudo-elements and the
  hit-test lands on the root element.

**Suspected cause — UNCONFIRMED, stated as a hypothesis so the next reader re-tests it rather than inherits it.**
`AccordionSelect.svelte:48` initialises `let expanded = $state(activeIndex == null || activeIndex < 0)` ONCE and never
reconciles it. The results layout computes `activeIndex` as `elections.findIndex((e) => e.id === activeElectionId)`
(`results/[[electionTab]]/+layout.svelte`), so a mount that happens while that lookup is momentarily unresolved
(`-1`) leaves the accordion permanently expanded — matching symptom (a) exactly. Symptom (b) points at the same
navigation being wrapped in a document VT whose update callback `await`s `navigation.complete`
(`routes/+layout.svelte:160-165`, the documented SvelteKit recipe), which holds the page non-interactive for the whole
load.

> **CORRECTION 1 (`165-05.1`) — the attribution above is wrong, and the correct one matters.** The sentence this
> replaces read: *"Both mechanisms were introduced or newly reachable in this phase (`165-02`/`165-03`/`165-04`), not
> in `165-05`."* Neither mechanism was introduced here. `165-BASE-FLAKE-MEASUREMENT.md` § *Where the defect is not*
> establishes by direct comparison that both pre-exist on base **verbatim**: the accordion initialiser is
> byte-unchanged (`git diff af695421e 404948d78 -- .../accordionSelect/` is empty), and `routes/+layout.svelte`
> already carries `onNavigate` + `startViewTransition` on base — the phase's only change to that hook *adds* a guard
> that makes document VTs run **less** often. What Phase 165 changed is that the results subtree now **persists**
> across a results navigation (criterion 1 / decision D-03), where base tore it down and rebuilt it every time. That
> teardown was accidentally resetting the un-reconciled `expanded`. So the defect is **pre-existing but previously
> unreachable**, made reachable by this phase — which is why Phase 165 owns the regression even though it wrote
> neither mechanism. "Introduced" and "made reachable" are different claims and the difference decides where a fix
> belongs.
>
> **The mechanism is now CONFIRMED, and it is narrower than the hypothesis above.** From the trace of
> `tests/e2e-runs/accordion-probe-01` and the error-context snapshots of the reds: an unresolved mount does leave the
> widget expanded, but what fails the test is the *window after the selection takes*. The only thing that collapsed a
> persisted instance was `activate`'s fire-and-forget `setTimeout(…, DELAY.lg)`, so for ~450 ms the widget is expanded
> while a selection is already active; the spec's helper snapshots the option count inside that window, skips its
> "expand first" branch, and its follow-up click — delayed a further ~250 ms by the document VT's pointer
> interception — lands *after* the collapse, on the already-active option, which `activate`'s toggle branch re-opens
> permanently with nothing left to close it. That is symptom (a) exactly: the end-state ARIA snapshot shows Regional
> `[active] [selected]` with Municipal still listed beside it. Symptom (b) is the same VT interception when it exceeds
> the 2 s click budget instead of merely eating into it.

**Why `165-05` did not fix it.** `165-05`'s diff is provably inert on this path: the failing run uses the `e2e/base`
dataset, which ships `questions.interactiveInfo.enabled: false` (`packages/dev-seed/src/templates/e2e/base.ts:169-171`,
re-derived at run time), so `QuestionExtendedInfoButton` — the only production component this plan changed — never
mounts in `voter-journey`. A fix would land in `AccordionSelect.svelte` or in the root
layout's VT coupling (whose behaviour `voter-results-redraw.spec.ts` asserts) — both outside this plan's
`files_modified`, and both a behaviour change to a shared surface rather than a bug local to a task. That is deviation
Rule 4 territory, which is escalate-not-fix.

> **CORRECTION 2 (`165-05.1`) — `AccordionSelect` is not shared with the candidate app.** The parenthetical above read
> *"(shared with the candidate app)"*. Measured: `grep -rl AccordionSelect apps/frontend/src` returns the component's
> own three files and exactly one consumer,
> `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte`. The candidate app does not use
> it. The escalation was still right — it is a shared-library component and the change is a behaviour change — but the
> blast radius was one route, not two apps, and the full-suite gate rather than inspection is what proves it.

**What the follow-up did**, against what this entry asked for: reproduced with the trace and the error-context ARIA
snapshots rather than with instrumentation (the hypothesis above is now confirmed and narrowed — see CORRECTION 1);
reconciled `expanded` when a valid `activeIndex` first appears, and additionally made the `DELAY.lg` collapse
cancellable and the correction non-animated, both of which the measurement forced; and re-ran `voter-journey`
project-scoped **16** times rather than ten, because ten is the number that felt sufficient and sixteen is the number
the base measurement's own bar requires for the after-rate to be comparable with the before-rate.

---

## The document View-Transition still swallows clicks on `<html>`, and `165-05.1` did not fix it

**Found during `165-05.1`, tasks 1–2. Pre-existing on base; recorded rather than fixed, and recorded because the
suite now being green could otherwise be read as this having gone away.** WINDOWS row filed.

**Measured, not inferred.** In the Playwright trace of `tests/e2e-runs/accordion-probe-01`, two separate clicks on the
results election picker were each blocked for roughly a quarter of a second before they landed:

| Click | Blocked from | Landed | Blocked for |
|---|---|---|---|
| the fixture's election selection | 56.049 s | 56.305 s | ~256 ms |
| the spec's target selection | 56.504 s | 56.739 s | ~235 ms |

with `<html lang="en">…</html> intercepts pointer events` logged on each retry between those points. That is the
document View-Transition signature: while a VT is live the captured content is painted through pseudo-elements and the
hit-test lands on the root element. It is also symptom **(b)** of `165-BASE-FLAKE-MEASUREMENT.md` — 2 of the 6
original EQTYP-02 reds — where the same interception exceeded the 2 s click budget instead of merely eating into it.

**Why `165-05.1` closed the blocker without closing this.** The two are different failures with a shared victim. The
accordion fix removes the *state* the interception was racing: once a selection collapses the widget at once, there is
no ~450 ms window in which a late click can toggle it back open, so a click delayed 250 ms is harmless. The
interception itself is untouched, and a slower host could still push it past 2 s. Arm A's 0/16 bounds the combined
residual rate at ≤ 19.4 % (Wilson upper bound), not at zero — `165-NEGATIVE-CONTROL.md` § 8e.

**Why it was not fixed here.** `routes/+layout.svelte` is outside this plan's `files_modified`; the hook's behaviour is
asserted by `voter-results-redraw.spec.ts`; and the phase's own criterion is that these navigations DO produce a
genuine morph rather than degrading to a root crossfade, so anything touching the VT must be measured against that
criterion, not slipped in beside an unrelated fix.

**What a follow-up would look like.** The standard remedy is `pointer-events: none` on the `::view-transition`
pseudo-element tree, which lets the hit-test reach the live DOM underneath while the snapshot is still painted. It
needs to be measured the same way this plan measured its own fix — against the criterion-1 morph assertions in
`voter-results-redraw.spec.ts`, and over a run count large enough to see a ~12 % symptom, which 16 runs is not.

---

## D-165-06-01 — The drawer host's `<svelte:boundary>` does not wrap the payload's `title()` read

**Found during:** 165-06 task 3, the NC-7 negative control (`tests/e2e-runs/165-06-nc7-boundary`).
Recorded in full at `165-NEGATIVE-CONTROL.md` § 13c.

**What was measured.** With D-12's opener-side convention deliberately reverted (the injection that
proves the boundary fires), the run's console transcript carries **two distinct errors**, not one:

```
pageerror: Cannot read properties of undefined (reading 'name')
error: DrawerHost payload failed to render: Cannot destructure 'type' of 'unwrapped.entity' as it is undefined.
```

The second is the boundary's own `onerror` handler logging what it caught — the payload render, inside
`{@render shown.content()}`. The first is **uncaught**: it is the payload's `title()` getter
(`unwrapEntity(entity).entity.name`), and it is read in `DrawerHost.svelte`'s dialog element binding
`aria-label={shown?.title()}` — which sits **outside** the `<svelte:boundary>`, wrapping only the panel
contents.

**Why it is deferred rather than fixed.** Reaching it requires an opener that has already violated D-12's
documented convention, which is the state NC-7 had to manufacture on purpose; on the shipped tree the
convention holds and neither error occurs (0 matching lines in three control runs). It is a **gap in the
net**, not a live defect. And the row it was found in is a negative control whose entire contract is to
leave the tree byte-identical — fixing product code inside it would have invalidated the row.

**What a follow-up would look like.** Either move the `aria-label` read inside the boundary (it cannot be:
the attribute belongs to the `<dialog>` that the boundary lives inside), or make the payload contract
tolerate an undefined subject in `title()` — e.g. the host calling `shown.title()` through a guarded
helper that returns an empty string on a throw, which keeps the dialog labelled-or-unlabelled rather than
crashing. The second is the smaller change and keeps the boundary's scope unchanged.

---

## D-165-07-01 — No visual baseline captures an open drawer, so the phase's headline change is visually unmeasured

**Found during:** 165-07 task 3, the phase-gate visual run (`tests/e2e-runs/165-07-visual`, exit 0,
4 of 4 baselines matched).

**What the gap is.** `tests/tests/specs/visual/visual-regression.spec.ts` declares four baselines:
`voter-results-desktop`, `voter-results-mobile`, `candidate-preview-desktop`, `candidate-preview-mobile`.
All four screenshot a page with **no overlay showing** — the two voter entries capture the results list
after `selectElectionByName(page, /Regional/i)` and never open an entity card.

This phase replaced the per-route drawer with the app-wide `DrawerHost`. That replacement is the phase's
most visible change and **no baseline images it**. G-9's zero-diff green is therefore correct and also
silent about it: the visual gate could not have caught a rendering regression in the host, because it
never renders the host.

**What does cover it, and how far.** G-8's axe scans (`voter-detail-drawer` and `voter-detail-drawer
(dark)`) open the drawer and scan it in both themes, at zero violations. That is a **conformance**
measurement — focus entry, the modal role, the accessible name, colour contrast. It is not an appearance
measurement: a drawer that renders at the wrong width, with a broken corner radius, or with its content
mis-spaced would pass every one of those scans.

**Why it was not fixed here.** Adding a fifth baseline is new visual coverage, not a gate run. 165-07's
scope is to run the instruments the repository has and report what they say; inventing a new instrument
inside the gate plan would mean the gate blessed a baseline it had just authored. D-19's whole discipline
points the other way.

**What a follow-up would look like:** add `voter-results-drawer-desktop` (and its mobile twin) to
`AXE_ROUTES`' visual sibling — open the first entity card, await the `transition:fly` settle the a11y spec
already solves with `awaitAnimationsSettled`, then `toHaveScreenshot`. Capture it in the pinned container
per D-19 and the REQUIREMENTS visual corollary, never on a developer Mac. Note that the existing
`voter-detail-drawer` a11y entry already owns the open-and-settle sequence, so the new baseline should
reuse that settle rather than re-inventing it — mid-fly capture is exactly the failure mode its comment
records.

---

## D-165-07-02 — A stale comment in the a11y spec still describes the pre-165 drawer mechanism

**Found during:** 165-07 task 2, reading `tests/tests/specs/a11y/a11y-smoke.spec.ts` to establish what
the accessibility scan actually covers.

Line ~120, in the `voter-detail-drawer` route entry:

> `// Open the drawer — click first entity card. The drawer renders as role=dialog overlay intercepted by results/+layout.svelte beforeNavigate.`

The first sentence is still true. The second names the mechanism this phase replaced: the overlay is now
rendered by the app-wide `DrawerHost` mounted at the root layout, and the navigation interception moved to
`isOverlayNavigation` in `apps/frontend/src/lib/utils/viewTransition.ts`. A reader following the comment
would look in the wrong file.

**Out of scope, recorded rather than fixed.** 165-07 modifies no product or test source by design — its
`<verify>` blocks assert an empty `git status --porcelain apps packages tests`, so editing a comment in a
spec file would have reddened the gate it was running. Comment-only, no behavioural effect, and the spec
itself is green.
