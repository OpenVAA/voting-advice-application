# Phase 165 — Results Navigation Redraw · Discussion Points

**Phase**: 165 · Results Navigation Redraw
**Roadmap entry**: `.planning/ROADMAP.md` § *Phase 165: Results Navigation Redraw*
**Grounding spikes**: `.planning/spikes/031-results-nav-flicker-forensics`, `032-results-redraw-hardened-fixes`, `033-layout-shaped-results-routes`, `034-global-drawer-host`
**Written**: 2026-09-22

---

## How to fill this in

- Every decision lists its options as `- [ ]` boxes. **Exactly one** carries `★ RECOMMENDED`.
- **Leaving a decision's boxes all unchecked = accepting the ★ option.** You never have to tick anything to agree.
- Tick a different box to **overrule**. One box per decision.
- Free text (`**EDIT:**` / `**NOTE:**`, or a written-in option) beats every box.

**⚠ DECIDE — shape-changing, skim these first:**
`A-1` (which branch the phase builds on) · `C-1` (do the route restructure at all) · `C-2` (implied-tab handling) · `D-1` (drawer-host mechanism) · `D-3` (does question-info move) · `F-1` (how criteria 2 + 3 are proven) · `H-1` (where requirements get registered)

---

## § 0 — Re-verified factual baseline

Measured on this worktree (`spike/results-redraw`, HEAD `e65857f04`) on 2026-09-22. The roadmap's phase entry is a restatement of the spike READMEs; this table is what is actually on the tree.

| # | Claim | Verified? | Evidence |
|---|---|---|---|
| 1 | The four 032 fixes are **already written in production files** on this branch, gated by lab toggles that only restore the old behaviour | ✅ | `(located)/+layout.ts` (`fixLoader` branch), `lib/utils/viewTransition.ts` (`isOverlayNavigation`, `VT_NO_NAMES_CLASS`), `routes/+layout.svelte` (`onNavigate` + `html.vt-no-names *` rule), results `+layout.svelte` (`handleEntityTabChange` … `{ noScroll: true }`) |
| 2 | The regression guard exists and passes | ✅ | `(located)/layout.tracking.test.ts` — 4 URL cases + 1 control case that flips `lab.loader = 'current'` |
| 3 | Lab scaffolding footprint | ✅ | **6** files under `apps/frontend/src/lib/spike/`; **9** files under `results-layered/`; **14** files outside `lib/spike/` import from it; **24** `SPIKE` comment markers; **8** `labMount(` call sites |
| 4 | The spike branch is **behind** `integration/ship-12-squash`, not ahead of it | ✅ | merge-base is `e1f1944cf`; spike has **4** commits since (all spike docs + code), ship-12 has **20** — incl. the OIDC/JWKS hardening (`fetchJwksLeakSafe.ts`, `oidcFailure.ts`), `filterRelevance.ts`, the survey-popup dismissal fix and its own edit to `Tabs.svelte` |
| 5 | Criterion 4's restructure is **not** required to fix any of the four symptoms | ✅ | Spike 033 § Results: "*equivalent* in rendering behaviour to the fixed `/results` (it does not fix anything the 032 fixes don't). Its value is organisational." Spike 031 § Impact: the route-shape assumption is "**invalidated**" |
| 6 | Criterion 5's drawer host is **not** required either, and carries a PARTIAL verdict | ✅ | Spike 034 verdict `PARTIAL`; "not needed for the four reported symptoms"; question-info path **unexercised locally** (needs `questions.interactiveInfo.enabled` + info content, which the local seed does not render) |
| 7 | Today's results loader **deliberately refuses** to force-fill `entityTab` into the URL | ✅ | `results/[[electionTab]]/+layout.ts` doc-comment: "Force-filling it … bounces navigation, because downstream consumers … emit same-shape URLs", and `+page.ts` "Post-88-02 loop fix". **This constrains C-2.** |
| 8 | `ROUTE.ResultEntity` hard-codes the optional-param path, and a consistency test pins it | ✅ | `lib/routes/route.ts` → `ResultEntity: …/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`; `lib/routes/routeConsistency.test.ts` |
| 9 | E2E results fixtures reach the page by `buildRoute({ route: 'Results' })` + testids, not by hand-built deep URLs | ✅ | `tests/tests/fixtures/voter/resultsPage.fixture.ts` — `gotoResults` uses `buildRoute`; every other step is `getByTestId` |
| 10 | Spikes 031–034 are in `.planning/spikes/MANIFEST.md` but **not** in the `spike-findings-*` skill (which stops at 016/030) | ✅ | `./.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` has no 031–034 rows |

**Consequence of rows 5 + 6:** three of the six success criteria (1, 2, 3) are already demonstrated on this branch and need only de-labbing; criteria 4 and 5 are genuine, optional, *additive* work whose value is organisational rather than symptom-fixing. `C-1` and `D-1` are therefore real go/no-go decisions, not implementation details.

---

## § A — Branch and integration

### A-1 ⚠ DECIDE — Which branch does Phase 165 build on?

The spike branch is **behind** ship-12 by 20 commits, and those commits touch files the phase also touches (`Tabs.svelte` has edits on both sides). The lab code is committed on the spike branch and the phase deletes it, so carrying it forward buys nothing.

- [ ] **★ RECOMMENDED — Branch `feat/165-results-navigation-redraw` off `integration/ship-12-squash`; re-apply the 11 production-file changes from the spike by hand, never merging `lib/spike/` or `results-layered/`.** The diff is ~30 lines plus one test file; re-applying it is cheaper than a merge that resolves `Tabs.svelte` and drags 15 lab files in to delete them again. Cost: the changes are re-typed rather than cherry-picked, so each one must be re-read against the spike README as it lands.
- [ ] Merge `integration/ship-12-squash` into `spike/results-redraw` and continue there. Cost: resolves the `Tabs.svelte` conflict, then still requires deleting 15 files and 24 markers; the branch's history permanently carries the lab.
- [ ] Rebase `spike/results-redraw` onto `integration/ship-12-squash`, then build. Cost: same lab-deletion work, and a rebase of commits that mix spike docs with spike code.
- [ ] Wait for the ship-12 debugging session to finish before starting at all. Cost: blocks the phase on unrelated work; the roadmap only requires the *merge* to happen after, not the build.

### A-2 — What happens to `spike/results-redraw` afterwards?

- [ ] **★ RECOMMENDED — Leave the branch in place, unmerged, as the reproduction rig.** The lab panel is the only way to flip back to the broken behaviour side by side, and `forensics.mjs` targets it. Cost: a stale branch sits in the repo; note its purpose in the phase's evidence doc so nobody merges it.
- [ ] Delete the branch once the phase lands; the spike READMEs are the record. Cost: the live A/B rig is gone, so a future regression has to be re-instrumented from scratch.

---

## § B — The four validated fixes (criteria 1–3)

These are proven; what is open is their **final shape** once the lab is gone.

### B-1 — Does the `(located)` layout keep blanking to `<Loading/>` on any future load rerun?

`(located)/+layout.svelte`'s `$effect` sets `ready = false` whenever `data.questionData` / `data.nominationData` identity changes. Untracking the URL reads stops *results navigation* from triggering that — but a locale change, an `invalidate()`, or any load rerun added later will still collapse the whole subtree. The lab's `keepReady` toggle is a stale-while-revalidate variant of this; spike 031 found it stops the remount but leaves 170–260 nodes of list churn per navigation, so it is "a fallback, not the fix".

- [ ] **★ RECOMMENDED — Ship the loader fix alone; delete the `keepReady` path.** One mechanism, one place, and the guard in `layout.tracking.test.ts` is what keeps it honest. Cost: a *future* load rerun from some other cause still blanks the subtree — accepted, and named in the phase's residue.
- [ ] Ship the loader fix **and** make stale-while-revalidate permanent (first `ready` is sticky; later reruns re-provide data under the existing tree). Cost: two mechanisms where one suffices; the list still churns its nodes, so it does not actually remove the visible defect it appears to defend against.
- [ ] Ship the loader fix and additionally assert in the guard test that `ready` is never reset after first true. Cost: asserts a property of a component from a load-function test — wrong instrument, and it would pass vacuously.

### B-2 ⚠ — How does the regression guard keep its negative control once the lab is deleted?

`layout.tracking.test.ts`'s control case currently does `lab.loader = 'current'` to restore the tracked read and assert the Proxy catches it. The repo's standing acceptance rule (REQUIREMENTS.md § *Standing acceptance rule*) says a guard that has not been observed failing is not satisfied — so the control cannot simply be deleted with the lab.

- [ ] **★ RECOMMENDED — Replace the lab flip with a self-contained control: the test constructs a tiny local load-shaped function that reads `url.pathname` tracked, runs it through the same `recordingUrl` Proxy, and asserts `pathname` IS recorded.** The instrument is proven against a known-bad reader without any production code existing to be bad. Cost: the control exercises a stand-in, not the real load — so it proves the Proxy works, not that the real load was ever wrong. The spike README is the record of the latter.
- [ ] Keep a permanently-checked-in "legacy" copy of the load function purely as the control's subject. Cost: a second copy of a load function that must be kept in sync forever, and a grep for `url.pathname` in that directory stops meaning anything.
- [ ] Drop the control case; the four positive cases are the guard. Cost: violates the standing acceptance rule head-on — a green Proxy that silently stopped recording would read exactly the same.

### B-3 — `isOverlayNavigation` keys on the `entity` + `id` params

Spike 032 open nit: "fine while the results drawer is the only routed overlay."

- [ ] **★ RECOMMENDED — Keep the param-keyed predicate; add a unit test that pins the contract (both params present on either end ⇒ true; either absent ⇒ false) and a comment naming the assumption.** Cheapest thing that is also tested. Cost: adding a second routed overlay later silently needs this edited — the test names the assumption but cannot detect a new overlay.
- [ ] Generalise: overlay routes declare themselves (`+page.ts` returns `{ overlay: true }`, read off `navigation.to`). Cost: SvelteKit does not expose the destination's load data in `onNavigate`, so this needs a route-id allowlist instead — more surface, same fragility, dressed up.
- [ ] Key on "a modal `<dialog>` is currently open" at navigation time. Cost: correct on close, wrong on open — the dialog does not exist yet when the opening navigation starts, which is the frame the header flash happens in.

### B-4 — Where the `html.vt-no-names *` rule lives

- [ ] **★ RECOMMENDED — Leave it in `routes/+layout.svelte`'s `<style>` block, next to the reduced-motion rule it pairs with.** Both are VT escape-hatches for the same layout; keeping them adjacent keeps the landmine comment about `@media`-wrapping-`:global` readable. Cost: a `:global` rule in a component stylesheet, which is deliberate here.
- [ ] Move it to `app.css` with the other global styles. Cost: separates the rule from `startViewTransition`, which is the only thing that toggles the class, and from the reduced-motion rule it belongs with.

---

## § C — Route restructure (criterion 4)

### C-1 ⚠ DECIDE — Do the restructure at all?

Criterion 4 asks for `[electionTab]` → `[entityTab]` → `[entity]/[id]` levels. Spike 033 **validated that it works** and **invalidated the reason it was proposed**: it fixes nothing the 032 fixes do not. Its value is that one ~400-line layout owning list + drawer + tabs + picker becomes four small files, params stop being optional, and two URL guards (matcher-fallthrough 404, entity/id coupling redirect) disappear because the shapes they catch become unroutable.

- [ ] **★ RECOMMENDED — Do it, as criterion 4 states, with the implied-tab remount closed (see C-2).** The criterion is the phase's contract, the spike built and measured the tree, and the organisational win is real and permanent. Cost: the largest and riskiest part of the phase by far, touching `ROUTE.ResultEntity`, `routeConsistency.test.ts`, `buildListRoute`, both `+page.ts` guards and the visual baselines — for zero user-visible improvement over the 032 fixes alone.
- [ ] Do it, but **as its own phase (165.1)**, shipping 165 as criteria 1–3 + 5 + 6 first. Cost: splits the roadmap entry and leaves `/results` in two shapes across two merges; criterion 4 has to be moved rather than met.
- [ ] **Don't restructure.** Strike criterion 4, record the spike-033 finding as the reason, keep today's optional-param tree and its two guards. Cost: the roadmap criterion is retired rather than met — must be written down explicitly in ROADMAP.md and REQUIREMENTS.md, not quietly dropped.

**NOTE (if you pick "don't"):** say so here and C-2/C-3/C-4 become moot.

### C-2 ⚠ DECIDE — The implied-tab remount

Spike 033's one measured regression: the first switch from `/results/{election}` (list rendered by `[electionTab]/+page.svelte`) to `/results/{election}/organizations` (list rendered by the `[entityTab]` layout) remounts the list, because they are different component instances in different route files. Today's `/results` keeps one instance because one layout renders every shape.

**Constraint from baseline row 7:** today's loader *deliberately* does not force-fill `entityTab`, and `+page.ts` carries a "Post-88-02 loop fix" comment recording that force-filling previously caused a navigation loop — because `buildListRoute` emitted URLs without the plural while the loader redirected to add it.

- [ ] **★ RECOMMENDED — Render the list from the `[electionTab]` level; `[entityTab]` only selects which type the shared list shows.** One list instance across every shape, exactly as today, and the 88-02 loop cannot reopen because no redirect is introduced. Cost: `[entityTab]/+layout.svelte` becomes thin, which trims the organisational win C-1 is bought for.
- [x] Redirect `/results/{election}` → `/results/{election}/{defaultPlural}` so the list only ever lives at the `[entityTab]` level. Cost: reintroduces exactly the force-fill the 88-02 fix removed; safe **only** if every emitter (`buildListRoute`, the close path, `ROUTE.ResultEntity` consumers) is changed in the same commit to always carry the plural — and one missed emitter is a navigation loop in production.
- [ ] Accept the single remount on the implied→explicit transition. Cost: a measured remount on a navigation criterion 1 says must not remount — the criterion would need a carve-out.

**NOTE** Instead of redirect, can't we just keep the routeParams optional, rendering both their layouts with implied defaults and the list in the innermost layout/page? And when a param is missing and cannot be implied, make that layout show the picker instead of children?

### C-3 — Backward compatibility for existing `/results` URLs

- [ ] **★ RECOMMENDED — Every shape that resolves today keeps resolving: bare `/results` (picker, 2+ elections), `/results/{election}`, `/results/{election}/{plural}`, `/results/{election}/{plural}/{singular}/{id}`, and the cross-type `organizations/candidate/{id}` edge.** Anything that is a 404 or a redirect today stays one. Cost: a `/results/+page.svelte` picker level must exist in the new tree; the shapes must be enumerated in a route test rather than assumed.
- [x] Canonicalise aggressively — redirect every non-canonical shape to the fullest form. Cost: more redirects on first paint, and it collides with C-2's recommended option.

**NOTE**: See above + no urls are published anywhere.

### C-4 — The two guards that disappear with required params

`+page.ts`'s matcher-fallthrough 404 and its entity-without-id / id-without-entity 307 redirect both exist because all four segments are optional. With required params those URLs are simply unroutable.

- [ ] **★ RECOMMENDED — Let them go; SvelteKit's 404 is the answer.** Their doc-comments migrate into the new tree's README/component docs so the reasoning survives the deletion. Cost: a user who today gets a graceful 307 back to the list on `/results/{e}/candidates/candidate` (no id) gets a 404 instead.
- [ ] Reinstate the coupling redirect at the `[entityTab]` level so the graceful bounce survives. Cost: a guard whose triggering URL cannot be produced by the router — it would be untestable through the app, and an untestable guard is the shape this repo rejects.

---

## § D — One app-wide drawer host (criterion 5)

### D-1 ⚠ DECIDE — Mechanism

The roadmap explicitly defers this here: "*The mechanism (payload + context bridge vs. global shell + portal) is decided at discuss-phase.*"

- [x] **★ RECOMMENDED — Payload + context bridge, as spike 034 built and measured it.** `drawerHost.open({ key, title, content: Snippet, contexts: getAllContexts(), onDismiss })`; the host wraps content in `ContextBridge`. Measured: entity→entity swap with no second `showModal` and no backdrop flash, an animated close the per-route `Drawer` cannot do, backdrop covering the header from frame 1. Cost: two standing obligations — every hosted component silently depends on the bridge, and payloads must be teardown-safe (see D-2); verdict is `PARTIAL` because the question-info path was never exercised.
- [ ] Global dialog shell + **portal** the opener's own rendered DOM into it. Content stays in the opener's tree, so no context bridge and the opener owns teardown. Cost: **unproven** — spike 034 named it as "worth comparing in the build" and did not build it; Svelte 5 has no portal primitive, so it means manually relocating a DOM subtree, which breaks `transition:` directives, focus order and the a11y contract `ModalContainer` currently holds.
- [ ] Don't hoist; keep the per-route drawer with the 032 fixes, and strike criterion 5. Cost: no entity→entity swap, no close animation (`ModalContainer.handleClose` calls `dialog.close()` synchronously, so close stays instant) — and the criterion is retired rather than met, which must be recorded explicitly.

### D-2 — Teardown safety

Spike 034 item 2 is the phase's sharpest landmine: the host keeps rendering the payload through its 250 ms out-animation, *after the opener is destroyed*; the snippet read the opener's `entity` prop, got `undefined`, `EntityDetails` threw mid-flush, the host's effect never ran and **the dialog stayed open**. The spike's fix was opener-side (`$state.raw` last-defined entity, kept current by `$effect.pre`).

- [ ] **★ RECOMMENDED — Both halves: the opener-side last-defined pattern as the documented convention, plus a `<svelte:boundary>` around the hosted content in the host itself.** The convention prevents the throw; the boundary means that if a future opener forgets it, the drawer closes badly instead of hanging the whole app. Cost: a boundary that should never fire, and a convention each new opener must be taught.
- [ ] Opener-side pattern only (what the spike shipped). Cost: one forgotten opener re-hangs the app, and the failure mode is a frozen page rather than a visible error.
- [ ] Host-side only — host snapshots what it needs at open time. Cost: a `Snippet` closes over its opener's live scope; it cannot be meaningfully snapshotted, so this does not actually work for the payload shape D-1 chose.

### D-3 ⚠ DECIDE — Does the extended-question-info drawer move to the host in this phase?

Criterion 5 says the host serves "the entity-details overlay **AND** the extended-question-info drawer". Spike 034 wired it and type-checked it but could not run it: the local seed renders no `voter-questions-popup-info-button`, because it needs `questions.interactiveInfo.enabled` plus actual info content.

- [ ] **★ RECOMMENDED — Move it, and make it exercisable: the seed template gains a question with extended info and the setting enabled, plus an E2E spec that opens and closes it through the host.** An unexercised path is precisely what 034 flagged, and criterion 5 names it. Cost: touches `packages/dev-seed` and the E2E base dataset — the widest blast radius in the phase, and dataset changes can move visual baselines.
- [ ] Move it, and verify with a component/unit test only (no seed change, no E2E). Cost: the host path ships never having rendered in a real browser — the same PARTIAL the spike closed with.
- [ ] Leave question-info on its own `QuestionExtendedInfoDrawer`; the host serves entity details only. Cost: criterion 5's "AND" is narrowed and must be recorded; the app keeps two drawer mechanisms, which is the thing the criterion exists to remove.

### D-4 — Close motion

- [ ] **★ RECOMMENDED — Reuse the existing `DELAY` constants and the `fly` shape `Drawer.svelte` already uses; skip the out-animation delay entirely under `prefers-reduced-motion: reduce` (close immediately).** Consistent with the rest of the app and with the reduced-motion gate already in `shouldAnimate`. Cost: none identified.
- [ ] Keep the spike's hard-coded 250 ms. Cost: a magic number beside a `DELAY` module that exists for this, and no reduced-motion branch — so a reduced-motion user waits on an animation they never see.

---

## § E — Scroll and tab behaviour (criterion 2)

### E-1 — Which navigations get `noScroll`

Criterion 2 names three: entity open, entity close, entity-tab switch. Entity open already carries `data-sveltekit-noscroll` on the card anchor; close and tab-switch carry `{ noScroll: true }` on this branch. Election change (`handleElectionChange`) does **not**.

- [ ] **★ RECOMMENDED — The three named navigations keep scroll; election change keeps the default scroll-to-top.** Switching election replaces the entire list with different content — landing mid-list in a list you have not seen is disorienting, and criterion 2 does not name it. Cost: a voter switching elections from a scrolled position is moved, which could read as inconsistent with the tab behaviour beside it.
- [ ] `noScroll` on election change too, for uniformity. Cost: leaves the voter partway down a list they have never seen, with the tab bar and heading scrolled off.
- [ ] Explicitly scroll the tab bar into view on election change instead of jumping to the top. Cost: a third scroll behaviour on one screen, and a new scroll call to keep out of the forensics ledger.

---

## § F — Verification and evidence

### F-1 ⚠ DECIDE — How criteria 2 and 3 are proven

Criterion 2 says "observed in the browser"; criterion 3 is about what paints above what. The spike proved both with `forensics.mjs` + mid-transition screenshots — a one-off script in `.planning/`, not a committed test.

- [ ] **★ RECOMMENDED — Commit a Playwright spec in the default E2E suite that asserts: scroll position survives open/close/tab-switch from a scrolled start; no document VT runs for overlay navigations; and any VT running with a `dialog[open]` present carries no named groups.** The last two are observable from the page (`document.startViewTransition` can be wrapped in an init script, and the `vt-no-names` class is on `<html>`). Cost: a spec that instruments the VT API, which is heavier than the fixtures around it — and it must be written so a reduced-motion or unsupported-browser run skips rather than fails.
- [ ] Scroll assertions in the E2E suite; VT layering proven by the visual-regression project's screenshots. Cost: full-page screenshots are taken at rest, not mid-transition — the visual project cannot see a layering defect that only exists for 300 ms.
- [ ] Keep `forensics.mjs` as the instrument; record its output in a phase evidence doc. Cost: nothing in CI guards the fix, so criteria 2 and 3 regress silently the next time someone touches `onNavigate`.

### F-2 — Negative controls

The standing acceptance rule requires each guard be observed failing.

- [ ] **★ RECOMMENDED — One measured negative-control pair per fix (loader untrack, overlay-VT skip, name-strip, `noScroll`), recorded in `165-NEGATIVE-CONTROL.md` with command, exit code and counts.** Matches the format every v2.15 phase used. Cost: four revert-measure-restore cycles, each needing a dev server and a clean DB.
- [ ] Controls for the loader guard only (the one with a unit test); the rest evidenced by the spike's legacy-vs-hardened run. Cost: three of the four guards ship never having been observed failing *at this phase's HEAD* — the spike's measurements were taken on a different tree.

### F-3 — How a spec asserts "did not remount"

The spike used `labMount()` ledgers, which the phase deletes.

- [ ] **★ RECOMMENDED — Assert node identity: tag a list DOM node before the navigation, assert the same node is still there after.** That is literally what "did not remount" means, and it needs zero production instrumentation. Cost: needs `page.evaluate` on both sides of the navigation, so the spec is a little lower-level than its neighbours.
- [ ] Ship a dev-only mount ledger behind `import.meta.env.DEV`. Cost: reintroduces the lab under a new name, and the E2E suite runs the dev server — so "dev-only" does not actually keep it out of the tested build.
- [ ] Assert only the visible consequences (scroll kept, no `<Loading/>` flash). Cost: a remount that happens to preserve scroll and paint fast would pass — which is exactly the state `keepReady` produces, and 031 rejected it as not-the-fix.

### F-4 — Visual-regression baselines

The restructure (C-1) and the VT changes can move `voter-results-desktop.png` / `voter-results-mobile.png`. The standing corollary: baselines are captured **only** in `mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64`, never on a developer Mac. Note the known disk constraint on this machine (`.planning` memory: ENOSPC from Docker.raw bloat voids full-suite runs).

- [ ] **★ RECOMMENDED — Run the visual project first and only re-capture if the diff is explained by an intended change; an unexplained diff is a defect to investigate, not a baseline to bless.** Cost: requires the pinned container, so the disk must be reclaimed before the phase's final gate.
- [ ] Re-capture up front, assuming the restructure moves them. Cost: blesses whatever the new tree renders, including a regression it introduced.
- [ ] Defer the visual gate to the PR. Cost: a broken baseline surfaces after the work is declared done, on someone else's schedule.

---

## § G — Removing the scaffolding (criterion 6)

### G-1 — Deletion scope and whether a guard replaces it

Measured: **6** files in `lib/spike/`, **9** under `results-layered/`, **14** files importing from `lib/spike`, **24** `SPIKE` markers, **8** `labMount(` sites.

- [ ] **★ RECOMMENDED — Delete all of it, and add one cheap standing assertion (a unit test grepping `apps/frontend/src` for `lib/spike` imports and for a `results-layered` route directory, expecting zero).** The repo's habit is a guard per closed hole, and this one costs three lines. Cost: one more test file; the grep is a content anchor that must be re-derived if directories move.
- [ ] Delete all of it; no guard. Cost: nothing stops a future spike branch from being merged with its lab intact — which is the exact shape this criterion exists to close.
- [ ] Delete `lib/spike/` and the markers, but keep `results-layered/` behind a dev-only route guard as a comparison rig. Cost: criterion 6 says "no `/results-layered` tree" in terms; and a second results implementation rots within one phase.

### G-2 — The spike's node scripts

`forensics.mjs`, `probe-global.mjs`, `probe-qinfo.mjs` live under `.planning/spikes/`, outside the app.

- [ ] **★ RECOMMENDED — Leave them where they are.** They are spike records, not app code, and criterion 6 scopes to `apps/frontend/src`. Cost: they reference the lab panel and so will not run against the shipped tree — worth one line in their READMEs saying so.
- [ ] Port `forensics.mjs` into `tests/scripts/` as a maintained diagnostic. Cost: a second instrument to maintain alongside whatever F-1 produces.

---

## § H — Requirements and documentation

### H-1 ⚠ DECIDE — Where Phase 165's requirements get registered

The roadmap entry says "**Requirements**: TBD (to be registered at discuss-phase)". `.planning/REQUIREMENTS.md` is scoped to v2.15, which STATE.md records as **100 % complete (29/29 phases, 270/270 plans)** — yet the roadmap's progress table already lists 165 in that milestone's table.

- [ ] **★ RECOMMENDED — Register a new `### Results Navigation` section in the existing `.planning/REQUIREMENTS.md` with `RNAV-01…06` mapped one-to-one onto the six success criteria, and add the rows to § Traceability.** Keeps one requirements document and one traceability table; 165 is an addendum to v2.15, which is how the roadmap already files it. Cost: reopens a milestone recorded as complete — STATE.md's 29/29 and 100 % need correcting in the same commit, or the two documents disagree.
- [ ] Open milestone v2.16 and register there. Cost: a milestone for a single frontend phase, and `/gsd-complete-milestone v2.15` has to run first, which is a larger piece of process than the phase.
- [ ] No REQUIREMENTS.md entry — the roadmap's six success criteria are the whole contract. Cost: breaks the traceability table's invariant that every phase maps to requirements, and leaves the phase invisible to the requirement rollup.

### H-2 — Do spikes 031–034 get wrapped into the findings skill?

`.planning/spikes/MANIFEST.md` carries all four rows, but `./.claude/skills/spike-findings-voting-advice-application-gsd/` stops before them — so the discuss/plan workflows' "unpackaged spikes" warning applies.

- [ ] **★ RECOMMENDED — Add a `results-redraw` domain to the existing findings skill during this phase, carrying the two invariants that outlive the code: "a document VT must never run with names while a modal is open" and "the `(located)` load must not read the URL tracked".** Those two are the durable knowledge; the rest is now source. Cost: a skill edit inside a frontend phase.
- [ ] Leave the READMEs as the record; cite them from `CLAUDE.md` instead. Cost: the warning keeps firing on every future discuss/plan run, and the invariants are not auto-loaded during implementation.
- [ ] Do nothing. Cost: the two landmines are rediscovered the next time someone adds a `view-transition-name` or a tracked `url` read.

### H-3 — CLAUDE.md

- [ ] **★ RECOMMENDED — One short subsection under § *Frontend (SvelteKit)* stating the two invariants above and pointing at `lib/utils/viewTransition.ts` and `layout.tracking.test.ts`.** CLAUDE.md is the file agents always read; these are exactly the kind of rule its Context-Destructuring section already carries. Cost: CLAUDE.md grows.
- [ ] Document them only in the source files' doc-comments (where they already are). Cost: only found by someone already editing the right file — which is not the person about to add a `view-transition-name` somewhere else.

---

## Fill status

| § | Decisions | ⚠ DECIDE | Ticked |
|---|---|---|---|
| A — Branch and integration | 2 | 1 (`A-1`) | |
| B — The four validated fixes | 4 | 1 (`B-2`) | |
| C — Route restructure | 4 | 2 (`C-1`, `C-2`) | |
| D — Drawer host | 4 | 2 (`D-1`, `D-3`) | |
| E — Scroll and tabs | 1 | 0 | |
| F — Verification | 4 | 1 (`F-1`) | |
| G — Scaffolding removal | 2 | 0 | |
| H — Requirements and docs | 3 | 1 (`H-1`) | |
| **Total** | **24** | **8** | |

**Deferred ideas parked (not in this phase):**
- Element-scoped VT (or a plain CSS fade on the tab panel) for the in-drawer tab switch, instead of today's whole-viewport root cross-fade — spike 032 open nit, cosmetic.
- A second routed overlay of any kind (would force B-3's generalisation).

**Free text — anything the options above missed:**

**NOTE:**

**EDIT:**
