---
phase: 165-results-navigation-redraw
plan: 02
subsystem: ui
tags: [sveltekit, svelte5-runes, view-transitions, dialog, top-layer, modal-a11y, load-tracking, negative-control, vitest, playwright]

# Dependency graph
requires:
  - phase: 165-01
    provides: "The work branch `feat/165-results-navigation-redraw` cut clean off `integration/ship-12-squash` with a green forced build, the eight phase plans and the four spike record directories transported across, and `165-NEGATIVE-CONTROL.md` opened with the six-step discipline this plan's NC-1 row obeys"
  - phase: spikes 031-034 (branch spike/results-redraw, never merged)
    provides: "The four validated fixes and the drawer host in prototype form, read via `git show` per file and re-applied by hand in their de-labbed form (D-01, D-02)"
provides:
  - "RNAV-01's entire production change: the `(located)` universal load reads no URL property tracked"
  - "RNAV-03's two halves: the `isOverlayNavigation` skip in the root `onNavigate`, and the `html.vt-no-names *` name-strip rule with its load-bearing `!important`"
  - "RNAV-02's tab-change half: `{ noScroll: true }` on all three `handleEntityTabChange` branches, with D-15's deliberate asymmetry on election change commented"
  - "The drawer-host subsystem at `lib/components/modal/drawerHost/` — payload singleton with an ENFORCED SSR guard, context bridge, and the application's only `<dialog>`"
  - "`EntityDrawerOpener.svelte` — the render-nothing opener, teardown-safe on the convention half"
  - "Two unit guards: the load-tracking contract with a rebuilt local negative control, and the overlay predicate's five-row contract"
  - "NC-1, the phase's first negative-control pair, observed RED with verbatim output and a three-way revert proof"
affects: [165-03, 165-04, 165-05, 165-06, 165-07, 165-08]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 10590          # chars/4 over the ADDED lines of the realized diff (42,362 chars). Estimate was 45,000.
  tokens_new_files: 6408 # chars/4 over the full content of the nine files this plan CREATED (25,633 chars)
  tokens_full_diff: 14482 # chars/4 over the entire realized diff including context lines (57,931 chars)
  tasks: 3
  commits: 3             # MEASURED: git rev-list --count b136645e6..HEAD at SUMMARY-write time.
                         # 3 task commits (5e110fef4, 8eb954b25, e716be96c). The SUMMARY commit and
                         # the STATE/ROADMAP commit land after this line is written, so a later
                         # re-measure returns 5; that increment is the fixed point, not drift.
plan_head_before: b136645e66ca80acd989e8807ac4e9464c5037ee

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "App-wide overlay host: one `<dialog>` in the root layout, opened by payload (`{key, title, content, contexts, onDismiss, testId}`); openers render nothing in place. Dissolves DOM source order as a paint-race variable, because `showModal()` puts the dialog in the top layer regardless of where the opener lives"
    - "Context bridge: `getAllContexts()` captured at the opener and re-provided by `setContext` around the hosted content, so a payload authored deep in a route subtree can render in the root layout without losing `getVoterContext()`"
    - "`<svelte:boundary>` — FIRST use in `apps/frontend/src`. The only mechanism that can intercept a throw raised inside Svelte's render flush; a `try/catch` in a component script cannot"
    - "One duration, two consumers: a `DELAY` constant reaches the stylesheet as a custom property (`style:--drawer-ms`) so a JS timer and a CSS transition cannot drift apart, with NO hard-coded CSS fallback — a second copy of the number is the drift the property exists to prevent"
    - "Negative control held LOCALLY: a guard's control reproduces the known-bad shape in a function defined inside the test file, never by importing production code or keeping a checked-in legacy copy"

key-files:
  created:
    - apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
    - apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
    - apps/frontend/src/lib/components/modal/drawerHost/ContextBridge.svelte
    - apps/frontend/src/lib/components/modal/drawerHost/ContextBridge.type.ts
    - apps/frontend/src/lib/components/modal/drawerHost/index.ts
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.type.ts
    - apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts
    - apps/frontend/src/lib/utils/viewTransition.test.ts
  modified:
    - apps/frontend/src/routes/(voters)/(located)/+layout.ts
    - apps/frontend/src/lib/utils/viewTransition.ts
    - apps/frontend/src/routes/+layout.svelte
    - apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/index.ts
    - .planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md

key-decisions:
  - "The SSR invariant on `drawerHostState`'s module singleton is ENFORCED, not documented: `open()` early-returns on `!browser` (T-165-04). The spike's call-site convention is carried verbatim alongside it as the rationale, not as the mechanism."
  - "Modal a11y parity with `ModalContainer` was taken rather than the spike's divergence: Escape through a document-level `onkeydown` (the native `cancel` is suppressed with `preventDefault` so the two cannot both fire), focus entry through `focusFirstDescendant` after `DELAY.sm`, and a labelled `<button>` backdrop with `tabindex=\"-1\"` instead of a bare `e.target === dialog` click on the dialog."
  - "The host's CSS duration is driven from `DELAY.xs` through `--drawer-ms` with NO hard-coded fallback. On an engine that does not inherit custom properties into `::backdrop` the backdrop simply does not fade — degraded motion, never a duration disagreeing with the JS timer."
  - "Co-located `.type.ts` prop files were added for the two new prop-taking components, against the spike's inline `$props()` types, because the `components` skill measures the convention at 103 components / 103 co-located type files and zero inline."
  - "NC-1 is numbered § 7, not the § 4 the plan asks for: `165-01` already took §§ 4-6 and its committed SUMMARY cites them by number. Renumbering would silently falsify a committed document; the drift is recorded in § 2b instead."
  - "Task 1's acceptance criterion 'no change to the regex LINE' is unsatisfiable by the change the same task prescribes. Byte-identity is proven where T-165-01 needs it: the regex LITERAL extracted from both revisions hashes identically."

patterns-established:
  - "Stage before you trust a tracked-file guard: `scripts/assert-comment-hygiene.mjs` intersects its glob with `git ls-files`, so `yarn lint:check` is silently vacuous for untracked new files"
  - "A negative control that stays GREEN under the mutation is diagnostic: NC-1's control passed while the four production-driven cases failed, which is what attributes the red to the mutation rather than to a broken instrument"
  - "`git ls-tree <ref> -- <path>` absence claims carry a positive control — the same invocation against a path that DOES exist on that ref — so an empty output reads as 'observed absent' rather than 'pointed at nothing'"

requirements-completed: [RNAV-01, RNAV-02, RNAV-03, RNAV-05]

coverage:
  - id: D1
    description: "The `(located)` universal load reads no URL property tracked, so a results navigation does not rerun it, does not re-stream the question and nomination data, and does not blank the subtree (RNAV-01, D-03)"
    requirement: RNAV-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts#reads no URL property tracked (4 cases)"
        status: pass
      - kind: other
        ref: "165-NEGATIVE-CONTROL.md § 7 — guard observed RED (exit 1, 4 failed / 1 passed) against the restored pre-fix read, green (exit 0, 5 passed) on both sides of it"
        status: pass
    human_judgment: false
  - id: D2
    description: "The load guard's own instrument is proven against a locally-defined bad reader, and its named limit is written down and cited (D-04)"
    requirement: RNAV-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts#the recording Proxy catches a tracked url.pathname read (negative control)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Opening or closing the routed entity overlay runs no document View Transition, and any View Transition that runs while a modal dialog is open runs with every name stripped (RNAV-03, D-05, D-06)"
    requirement: RNAV-03
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/utils/viewTransition.test.ts#isOverlayNavigation (5 rows)"
        status: pass
      - kind: other
        ref: "grep gates: isOverlayNavigation called inside onNavigate in routes/+layout.svelte; `view-transition-name: none !important` present in its <style>; `dialog[open]` query present in viewTransition.ts"
        status: pass
    human_judgment: true
    rationale: "The PREDICATE's contract and the presence of both halves are machine-checked, but 'no document VT actually ran for this navigation' and 'the transition that did run carried no named groups' are runtime observations no test in this plan makes. D-16's committed Playwright spec (165-03) is what observes them, and NC-2 / NC-3 are what prove those observations can fail. Until then this is construction plus a spike measurement, not evidence on this branch."
  - id: D4
    description: "An entity-tab change navigates without scrolling the page to the top, and the deliberate absence of `noScroll` on election change is commented so it does not read as an oversight (RNAV-02, D-15)"
    requirement: RNAV-02
    verification:
      - kind: other
        ref: "grep gate: 4 uncommented `noScroll: true` occurrences in the results layout (3 in handleEntityTabChange + the pre-existing one in handleDrawerClose), 0 in handleElectionChange"
        status: pass
    human_judgment: true
    rationale: "Scroll survival FROM A SCROLLED START is a runtime property of the browser, not of the source. The grep proves the option is passed; only D-16's spec (165-03), asserting scroll position across a tab switch, proves the page did not move — and NC-4 is what proves that assertion can fail."
  - id: D5
    description: "One entity opens from the results list and closes again, end to end, served by a single app-wide dialog that lives in the root layout (RNAV-05, criterion 5, the one path only)"
    requirement: RNAV-05
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-02-tracer --no-db-reset --project voter-alliance — exit 0, preflight successes 1 / failures 0, 3 expected / 0 unexpected / 0 skipped"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-02-full --no-db-reset (whole gate suite) at HEAD e716be96c on a clean tree — exit 0, preflight successes 1 / failures 0, 165 expected / 0 unexpected / 0 skipped / 0 flaky"
        status: pass
    human_judgment: false
  - id: D6
    description: "The module-level payload singleton cannot leak a payload across SSR requests: the client-only invariant is an enforced guard rather than a call-site convention (T-165-04)"
    verification:
      - kind: other
        ref: "grep gate: `import { browser } from '$app/environment'` and `if (!browser) return;` as the first statement of `open()` in drawerHostState.svelte.ts"
        status: pass
    human_judgment: true
    rationale: "The guard's PRESENCE is machine-checked; its EFFECT is not. No test in this plan drives `open()` on the server and asserts `current` stayed null, and no negative control in the phase's four pairs covers it. A reviewer should confirm the guard is the first statement and that no second write path to `current` exists outside the class."
  - id: D7
    description: "A hosted payload whose opener is destroyed mid-close cannot hang the dialog: the opener renders from a last-defined value and the host wraps the payload in a boundary (D-12)"
    verification:
      - kind: other
        ref: "grep gate: `$effect.pre` present in EntityDrawerOpener.svelte; `svelte:boundary` present in DrawerHost.svelte with a non-throwing onerror and failed snippet"
        status: pass
      - kind: e2e
        ref: "the drawer opens and closes in voter-alliance and across the full suite without hanging — necessary but not sufficient, since nothing in the suite makes the payload throw"
        status: pass
    human_judgment: true
    rationale: "Both halves are present and the happy path is exercised, but the FAILURE path is not: nothing drives a throw during the close flush, so the boundary has never been observed firing on this branch. Research assumption A1 says so in terms and names D-12's negative control (revert the opener to a bare prop read, drive an entity close) as the falsification. That control is not in this plan's scope and remains owed."

# Metrics
duration: 38 min
completed: 2026-09-23
status: complete
---

# Phase 165 Plan 02: The Tracer — One Entity Through Every Layer Summary

**One voter path — open an entity from the results list, close it again — wired end to end through the untracked loader, the overlay-aware View-Transition utility, a brand-new app-wide `<dialog>` host in the root layout, a render-nothing opener and the results layout, with the whole 165-test E2E suite green at the committed HEAD and the loader guard observed RED against the pre-fix read it replaces.**

## Performance

- **Duration:** 38 min
- **Started:** 2026-09-23T08:16:00Z
- **Completed:** 2026-09-23T08:54:00Z
- **Tasks:** 3
- **Files created/modified:** 15 (729 insertions, 15 deletions)

## Accomplishments

- **RNAV-01's entire production change landed, and it is the smallest edit in the plan.** The `(located)` load's `pathname` / `search` reads moved inside `untrack` as a single destructuring, with `isVoterRoute` and `nextKv` reading the locals. The doc-comment above it now names `layout.tracking.test.ts` as the guard and says explicitly that `layout.load.test.ts` is the *other*, empty-selection guard — the wrong-file reference research flagged never existed on this base, so the correction is written forward rather than applied to a line that was not there.
- **T-165-01 is mitigated and proven at the level the threat needs.** The allowlist regex literal extracted from `integration/ship-12-squash` and from HEAD hashes to the same SHA-256; the `nextKv` construction differs only by the two identifier substitutions the plan prescribes. Nothing about *what is tested* moved — only *where the values come from*.
- **The drawer-host subsystem exists and serves the entity path.** Four files under `lib/components/modal/drawerHost/` (plus a co-located prop type): the payload singleton, the context bridge, the application's only `<dialog>`, and the barrel. The host swaps content in place on an A→B payload change without a second `showModal()`, animates its close, and holds `ModalContainer`'s a11y contract rather than the `<dialog>` defaults.
- **The SSR invariant is enforced rather than documented.** `open()` early-returns on `!browser`. The spike's doc-comment — *"Client-only by construction: `open` is only ever called from `$effect`s / event handlers, so this module-level singleton is never written during SSR (where it would leak across requests)"* — is carried over verbatim as the rationale, with a sentence added saying the guard below is what turns it from a convention into an invariant (T-165-04).
- **`<svelte:boundary>` enters this codebase for the first time**, wrapping the bridged payload with an `onerror` that logs and force-closes and that cannot itself throw (every statement in it is individually guarded), plus a deliberately empty, deliberately non-throwing `failed` snippet. Its doc-comment says what it nets and why a `try/catch` cannot do the job.
- **The hard-coded 250 ms did not ship.** `DELAY.xs` drives the JS close timer and reaches the stylesheet as `--drawer-ms`, so one edit moves both; and the close timeout branches on `shouldAnimate(undefined)`, so under reduced motion the dialog closes immediately instead of lingering for a delay with nothing moving (D-14).
- **RNAV-02's tab-change half landed with D-15's asymmetry made legible.** All three `handleEntityTabChange` branches pass `{ noScroll: true }`; `handleElectionChange` deliberately does not, and now carries a one-line comment saying so, so the next reader does not "fix" it.
- **Two unit guards exist where neither did before**, both non-vacuous: the load-tracking contract over four realistic entry shapes with a rebuilt LOCAL negative control citing spike 031 for its named limit, and the overlay predicate pinned across all five rows with the single-routed-overlay assumption written down.
- **NC-1 is recorded RED, with the mutation proven to be the pre-fix production body** rather than an invention (the two inserted lines byte-compared against `integration/ship-12-squash`, `diff` → no output, exit 0). Exit 1, 4 failed / 1 passed, verbatim output, three-way revert proof, and the honest pairing: no instrument existed on the base branch, shown by `git ls-tree` with a positive control.
- **The whole E2E gate suite is green at the committed HEAD.** 165 expected / 0 unexpected / 0 skipped / 0 flaky, exit 0, preflight confirmed, taken on a clean tree at `e716be96c` — not just the `voter-alliance` project the plan asked for. The root layout now mounts a `<dialog>` on every page and installs a document-level `keydown` handler, which is precisely the class of change a single-project run cannot clear.

## Task Commits

Each task was committed atomically:

1. **Task 1 (tracer): One entity opens and closes end-to-end through an app-wide drawer host** — `5e110fef4` (`feat`)
2. **Task 2: The two unit guards** — `8eb954b25` (`test`)
3. **Task 3: NC-1 — the loader guard observed red against the pre-fix read** — `e716be96c` (`docs`)

**Plan metadata:** see the `docs(165-02): complete …` commit that carries this SUMMARY.

## Files Created/Modified

- `apps/frontend/src/routes/(voters)/(located)/+layout.ts` — the untrack fix and its doc-comment. The `keepReady` stale-while-revalidate alternative is deleted outright by D-03, so `(located)/+layout.svelte` was **not** edited and its `ready` reset stands exactly as it was.
- `apps/frontend/src/lib/utils/viewTransition.ts` — gains `VT_NO_NAMES_CLASS`, the exported `NavigationEnd` shape, `isOverlayNavigation` + its private single-end helper, the module-doc ⚠ paragraph, and the `dialog[open]` name-strip around the browser call. The signature stays one-argument: no `label`, no `toUrl`.
- `apps/frontend/src/routes/+layout.svelte` — the overlay skip in `onNavigate` (below the existing LANDMINE comment, which is untouched), the `:global(html.vt-no-names *)` rule beside the reduced-motion rule with both landmine comments readable together, and `<DrawerHost />` under `{:else}`.
- `apps/frontend/src/lib/components/modal/drawerHost/**` — five files: state, host, bridge, bridge prop type, barrel.
- `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDrawerOpener.svelte` + `.type.ts` — the opener; D-12's ⚠ comment survives verbatim.
- `apps/frontend/src/lib/dynamic-components/entityDetails/index.ts` — barrel entry for the opener. `EntityDetailsDrawer`'s entries are **left in place**: deleting them is 165-05's work, and the component is simply no longer rendered by the results layout.
- `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` — opener in place of the per-route drawer, the three `noScroll`, and three comment corrections (see *Deviations*).
- `apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts`, `apps/frontend/src/lib/utils/viewTransition.test.ts` — the two guards.
- `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` — § 7 (NC-1) appended, plus two rows in § 2b's anchor-drift table.

## D-03's named residue, recorded as the plan requires

**A `(located)` load rerun from some other cause still collapses the subtree.** The untrack fix removes the *URL* as a rerun trigger. It does not make the subtree resilient to a rerun as such: a locale change, an explicit `invalidate()`, or any future dependency the load acquires will still re-stream the question and nomination data, and `(located)/+layout.svelte` will still flip its `ready` flag to false and replace the whole subtree with `<Loading/>` for a frame — remount, scroll clamped to 0, intro redraw. D-03 deleted the `keepReady` stale-while-revalidate path that would have masked this, on the ground that it is "a fallback, not the fix" (spike 031 item 4). **This is accepted, not overlooked**, and it is the reason `(located)/+layout.svelte` appears in no task of this plan.

## The deleted drawer-first source-order comment, and why

The results layout carried two paired comments asserting that the drawer block is rendered **before** `MainContent` so that on a cold deeplink the drawer paints before the list container (which carries `content-visibility: auto`), and a matching note on the list container saying it renders *after* the drawer "so the drawer wins the paint race on cold deeplinks".

**Both claims became false the moment the host landed**, and that is RESEARCH Pitfall 2 resolving in the direction it predicted: once the `<dialog>` lives in the root layout and is opened with `showModal()`, it sits in the **top layer**, which is painted above the entire document regardless of where anything appears in source order. The results tree's source order cannot lose that race because it is no longer in it. Carrying the comments forward would have left two confident, load-bearing-looking assertions that a reader could only discover were wrong by testing them.

Both were rewritten rather than silently dropped: the component doc now says the drawer is **not** rendered in that file at all and explains what the opener does instead, and the list-container comment states in terms that the former clause is gone *and why*, so the `content-visibility: auto` that remains is justified on its own merits rather than by a paint-race argument that no longer applies. Pitfall 2's recommended sequencing — host first, split second — is what made this a one-line correction instead of a two-move migration for 165-04.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `yarn lint:check` was silently vacuous for the seven new files, and went red the moment they were staged**

- **Found during:** Task 2 (after Task 1 had already been committed)
- **Issue:** Task 1's acceptance criterion requires `yarn lint:check` green. It **was** green, exit 0, read directly from the command — and the green meant nothing. `scripts/assert-comment-hygiene.mjs` intersects its glob with `execFileSync('git', ['ls-files', …])`, so it only ever inspects **tracked** files. At the time of that run the seven new files were untracked, and the guard's own census line said so if you read it: *files scanned: 1710*. After the commit the same command reported *1717* and **5 violations**, all in `drawerHostState.svelte.ts` — rule 2 (D-A4), a comment line ending without terminal punctuation while the line under it continues the same comment at the same indent. The spike file's doc-comment is hard-wrapped, and this repo's comment style is one line per paragraph.
- **Fix:** Reflowed the doc-comment to one line per paragraph. The **words** are carried over unchanged (D-01/PATTERNS B1 require the SSR note verbatim); the **line breaks** could not be. One sentence was added pointing at the `browser` guard below. Task 1's commit was then amended so the branch carries no knowingly-red commit, with the finding recorded in its message.
- **Files modified:** `apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts`
- **Verification:** `yarn lint:check` exit 0 with all nine new files **staged**, guard census *files scanned: 1719*, *0 violation(s)* — non-vacuous this time because the index contained them.
- **Committed in:** `5e110fef4` (amended Task 1 commit)
- **Standing consequence:** any GSD plan in this repo that adds files and then reads `yarn lint:check` as a gate must `git add` them first. This is recorded in `patterns-established` because it will recur in 165-03 through 165-06, each of which adds files.

**2. [Rule 2 - Missing critical] Co-located `.type.ts` prop files for the two new prop-taking components**

- **Found during:** Task 1
- **Issue:** `165-PATTERNS.md` B2/B4 give the spike's inline `$props()` types verbatim, but the `components` skill — which `CLAUDE.md` § *Skill Routing* routes component work to — states the convention as "the prop type lives beside the component, not inline" and measures it at 103 `$props()` components against 103 co-located `*.type.ts` files, i.e. zero inline. The spike files were lab code and never had to answer to it.
- **Fix:** Added `ContextBridge.type.ts` and `EntityDrawerOpener.type.ts`, each with JSDoc per property, and exported the bridge's type from the barrel in the sibling barrels' shape. `DrawerHost.svelte` takes no props, so it has none.
- **Files modified:** two files created; `drawerHost/index.ts` exports the bridge type.
- **Verification:** `yarn workspace @openvaa/frontend check` exit 0; the barrel matches `lib/components/modal/index.ts`'s `default as X` + `export * from './X.type'` shape.
- **Committed in:** `5e110fef4`

**3. [Rule 2 - Missing critical] Three comment corrections in the results layout beyond the two surgical edits the plan names**

- **Found during:** Task 1
- **Issue:** The plan names one comment for deletion (the drawer-first block above the `{#if}`). Two further comments asserted the same now-false claim — the component docstring's "Drawer-first paint" bullet at the head of the file, and the list-container comment inside the `fullWidth` snippet. Deleting one of three would have left two confident statements of a falsehood in the same file.
- **Fix:** All three rewritten; see § *The deleted drawer-first source-order comment*.
- **Files modified:** `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte`
- **Verification:** `grep -c 'drawer paints before'` → 0; `yarn lint:check` exit 0 (comment-hygiene guard clean on the file).
- **Committed in:** `5e110fef4`

### Recorded, not reconciled (anchor drift)

**4. [Anchor drift] NC-1 could not be written as `## 4. NC-1`, because `165-01` already owns §§ 4-6**

Task 3's action and its acceptance criterion both specify `## 4. NC-1`, verified by `grep -qE '^## 4\. NC-1'`. On disk, § 4 is `## 4. Finding A — the measured populations…`, § 5 is Finding B and § 6 is Finding C, all written by `165-01`, and **`165-01-SUMMARY.md` cites all three by number**. Renumbering them to free § 4 would have silently falsified an already-committed document — the one handling this repo's content-anchor rule forbids. NC-1 is therefore § 7, the verify regex was run as `^## [0-9]+\. NC-1` (exit 0), and the drift is recorded in § 2b of the evidence document with the reasoning. The section itself opens with a blockquote stating why it is numbered 7. **165-04 and 165-06 append NC-2/3/4 and should expect to continue from § 8.**

**5. [Anchor drift] Task 1's "no change to the regex line" criterion is unsatisfiable by the change the same task prescribes**

The criterion reads: *"The `isVoterRoute` regex literal is byte-identical to the base branch's, provable with `git diff …` showing no change to the regex line."* But the same task's action requires `isVoterRoute` to read the new `pathname` local rather than `url.pathname` — so its **line** necessarily changes. What is byte-identical, and what T-165-01 actually needs, is the regex **literal**. Proven rather than asserted: the literal extracted from `integration/ship-12-squash` and from HEAD hashes to the same SHA-256, and the `nextKv` construction differs only by the two prescribed identifier substitutions. Recorded in § 2b rather than worked around; no code and no document was bent to make the literal wording true.

### Scope expanded deliberately

**6. The E2E gate was run as the WHOLE suite, not only `--project voter-alliance`**

The plan's verification names the `voter-alliance` project, and that run was taken and is recorded (exit 0, 3/0/0). It was then **followed by the full gate suite** at the committed HEAD on a clean tree: **165 expected / 0 unexpected / 0 skipped / 0 flaky, exit 0**, preflight successes 1 / failures 0. The reason is specific rather than belt-and-braces: this plan mounts a `<dialog>` in the **root layout**, so it renders on every route in the application, and installs a **document-level `keydown` handler** that sees every Escape press anywhere. `voter-alliance` drives one results path. A regression in the questions popup's Escape dismissal, in the feedback modal, or a new axe finding on the always-present dialog would have passed a single-project run untouched. `a11y-smoke` and `perm-interactive-info` both ran green in the full suite, which is what actually clears those risks.

---

**Total deviations:** 3 auto-fixed (1 bug, 2 missing-critical), 2 anchor drifts recorded, 1 deliberate scope expansion.
**Impact on plan:** No scope creep into later plans. The question-info opener (165-05), the route split (165-04) and the E2E redraw spec (165-03) were not anticipated. Nothing under `packages/` or `tests/` was modified — the full E2E suite ran against the committed tree with no test-side change at all.

## Issues Encountered

- **The comment-hygiene guard's tracked-file blindness cost one amended commit** and is the single most transferable thing this plan learned. It is written up as deviation 1 and as a standing pattern, because four later plans in this phase add files.
- **The guard was genuinely red-to-green, as the phase warned it must be.** `layout.tracking.test.ts` did not exist on this base and the pre-fix tracked read did. NC-1 confirms the direction: the guard fails (exit 1, 4 of 5 cases) against the code the base branch ships, and passes against the code this plan ships. Nothing in this plan was green before its fix.
- **The recorded tracked-read set under mutation is `[ 'pathname', 'pathname', 'search' ]`, not `[ 'pathname' ]`.** `pathname` twice because the pre-fix body reads it once for the regex test and once for the `next=` target. Worth noting because `165-RESEARCH.md`'s sketch of the control asserts only `arrayContaining(['pathname'])`, and a later reader comparing the two might otherwise think the production shape drifted.
- **Local Supabase was already running when this plan started** (it was left running by `165-01`) and was left running. Port 5273 was free and both E2E runs used it. Disk had 245 GiB free, so the ENOSPC constraint the memory index records for the sibling repo did not bite; `tests/e2e-runs/` is gitignored and both run directories were kept.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **165-03 (the committed Playwright spec, D-16/D-18) is unblocked and is what discharges this plan's three `human_judgment: true` coverage entries.** D3 (no document VT for an overlay navigation; nameless VT under an open dialog) and D4 (scroll survival from a scrolled start) are asserted here only at the level of source presence. The runtime observations, and NC-2 / NC-3 / NC-4 that prove those observations can fail, belong to 165-03 and 165-06.
- **165-04 (the route split) inherits a dissolved constraint.** RESEARCH Pitfall 2's two-move migration is now a one-move: the host is landed, the results tree's source order no longer decides any paint race, and the drawer-first comments are already corrected, so the split does not have to carry a drawer block at L1 and move it later. D-25's statistics move is untouched and still owed.
- **165-05 (the question-info opener) has its host ready and its hazard unchanged.** `drawerHost.open` takes the same payload shape from any caller; what 165-05 must still decide is the `voter-questions-popup-info-modal` testid, which `questionInfo.fixture.ts` and `perm-interactive-info.spec.ts` both read. Both specs are green today against the **body**-mounted testid; moving it to the host dialog changes what `toBeHidden()` measures in expander mode (a dialog that exists but is closed, rather than one never mounted). PATTERNS B5 says so and this plan did not touch it.
- **One obligation is owed and named:** `<svelte:boundary>` has never been observed **firing** on this branch. Research assumption A1 flags it, and D-12's negative control — revert the opener to a bare `entity` prop read and drive an entity close — is its falsification. It is not in any current plan's task list; 165-06 is the natural home.
- **Standing constraints carried forward.** `spike/results-redraw` is never merged (D-02). `STATE.md`'s milestone counters are still deliberately uncorrected; D-22 requires that correction to land with the `REQUIREMENTS.md` edit in 165-08, which is also where RNAV-01..06 are registered — so `requirements.mark-complete` has no rows to tick yet, and the four ids in this summary's `requirements-completed` are forward references by design.
- **No blockers.**

## Self-Check: PASSED

- All nine created files — FOUND on disk (`test -f` over each, exit 0).
- Commits `5e110fef4`, `8eb954b25`, `e716be96c` — all FOUND in `git log`.
- Task 1 `<verify>` block 1 re-run at final HEAD — exit 0. Blocks 2 and 3 re-run — exit 0 (`check` 2191 files / 0 errors / 0 warnings; `test:unit` 104 files / 1838 tests; full E2E 165/0/0).
- Task 2 `<verify>` re-run — `layout.tracking` exit 0 / 5 passed, `viewTransition` exit 0 / 5 passed, the `redrawLab`-absence + spike-031-citation pair exit 0.
- Task 3 `<verify>` re-run — exit 0 with the regex widened to `^## [0-9]+\. NC-1` per deviation 4; post-revert baseline exit 0 / 5 passed.
- Plan-level `<verification>` re-run — `check` exit 0, `lint:check` exit 0 (0 `[ERROR]` lines, read from the command's own status and never through a pipe), regex literal hashes identical on both revisions, `git status --porcelain` empty.
- `commits: 3` is MEASURED: `git rev-list --count b136645e66ca80acd989e8807ac4e9464c5037ee..HEAD` → `3`.

---
*Phase: 165-results-navigation-redraw*
*Completed: 2026-09-23*
