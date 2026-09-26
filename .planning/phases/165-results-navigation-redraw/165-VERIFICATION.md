---
phase: 165-results-navigation-redraw
verified: 2026-09-23T19:20:00Z
status: passed
human_verified: "2026-09-24 — all three human_verification items passed in 165-UAT.md (tests 2, 3, 4)"
score: 6/6 must-haves verified (all six ROADMAP success criteria backed by codebase + measured evidence)
behavior_unverified: 0
overrides_applied: 0
covered_files:
  - ".planning/REQUIREMENTS.md"
  - ".planning/phases/165-results-navigation-redraw/165-01-PLAN.md"
  - ".planning/phases/165-results-navigation-redraw/165-01-SUMMARY.md"
  - ".planning/phases/165-results-navigation-redraw/165-02-PLAN.md"
  - ".planning/phases/165-results-navigation-redraw/165-02-SUMMARY.md"
  - ".planning/phases/165-results-navigation-redraw/165-03-PLAN.md"
  - ".planning/phases/165-results-navigation-redraw/165-03-SUMMARY.md"
  - ".planning/phases/165-results-navigation-redraw/165-04-PLAN.md"
  - ".planning/phases/165-results-navigation-redraw/165-04-SUMMARY.md"
  - ".planning/phases/165-results-navigation-redraw/165-05-PLAN.md"
  - ".planning/phases/165-results-navigation-redraw/165-05-SUMMARY.md"
  - ".planning/phases/165-results-navigation-redraw/165-05.1-PLAN.md"
  - ".planning/phases/165-results-navigation-redraw/165-05.1-SUMMARY.md"
  - ".planning/phases/165-results-navigation-redraw/165-06-PLAN.md"
  - ".planning/phases/165-results-navigation-redraw/165-06-SUMMARY.md"
  - ".planning/phases/165-results-navigation-redraw/165-07-PLAN.md"
  - ".planning/phases/165-results-navigation-redraw/165-07-SUMMARY.md"
  - ".planning/phases/165-results-navigation-redraw/165-08-PLAN.md"
  - ".planning/phases/165-results-navigation-redraw/165-08-SUMMARY.md"
  - ".planning/phases/165-results-navigation-redraw/165-BASE-FLAKE-MEASUREMENT.md"
  - ".planning/phases/165-results-navigation-redraw/165-CONTEXT.md"
  - ".planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md"
  - ".planning/phases/165-results-navigation-redraw/deferred-items.md"
  - "CLAUDE.md"
  - "apps/frontend/src/lib/_guards/spike-scaffolding.test.ts"
  - "apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte"
  - "apps/frontend/src/lib/routes/route.ts"
  - "apps/frontend/src/lib/utils/viewTransition.ts"
  - "apps/frontend/src/routes/(voters)/(located)/+layout.ts"
  - "apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts"
  - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte"
  - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts"
  - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte"
  - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte"
  - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts"
  - "apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/page.guards.test.ts"
  - "apps/frontend/src/routes/(voters)/(located)/results/statistics/+page.svelte"
  - "apps/frontend/src/routes/+layout.svelte"
  - "tests/playwright.config.ts"
  - "tests/tests/specs/voter/voter-results-redraw.spec.ts"
covered_digest: "v1:sha256:557deeacacf30c8285ca72c3b81b00c2ff4b9511b58a4eab931b8a315a40acdd"
human_verification:
  - test: "With DevTools open, scroll the voter results list to a mid-list position, click an entity card to open the drawer, switch its internal tabs, then close it. Repeat scrolled to the very top and again as close to the bottom as the list allows."
    expected: "Scroll position is visually unchanged on open, tab-switch and close from a scrolled (non-top) start. The page never visibly snaps to the top mid-interaction, and the document VT never paints the results list above the open drawer (no flash of the list in front of the modal, even for a frame)."
    why_human: "165-NEGATIVE-CONTROL.md records the DOM/JS-level measurements (scrollY offset deltas, transition group counts, name-strip class presence) but explicitly does not claim visual correctness to a human eye — that judgement is reserved for D-19's visual-regression gate, which itself only captures the closed-drawer state (no baseline exists with the drawer open, per deferred item D-165-07-01). Nobody has looked at the actual paint."
  - test: "Open the entity drawer, then open the extended-question-info drawer from inside a question's info affordance (via `perm-interactive-info`'s user flow), confirming both are served by the same `DrawerHost` without a visible remount or a double-open animation."
    expected: "The question-info drawer opens through the same app-wide host, animates in/out consistently with the entity drawer, and no stale content from the entity drawer flashes first."
    why_human: "This half of criterion 5 (D-13) is exercised only by the `perm-interactive-info` E2E project — a different project from the one this document's own negative controls (NC-1..NC-7) were taken against. No row in 165-NEGATIVE-CONTROL.md measures it directly; its coverage is inferred from a passing E2E run, not from an injected regression."
  - test: "On a slower or more loaded machine (or with CPU throttling in DevTools), click through several rapid results navigations during an active View Transition and confirm clicks are not silently swallowed."
    expected: "No click during a transition is dropped or delayed beyond a perceptible instant."
    why_human: "§ 16 item 5 / § 18f item 1 of 165-NEGATIVE-CONTROL.md record, as accepted residue, that the document VT still intercepts pointer events on `<html>` for ~235-256 ms during a transition on the measured host (14 CPUs, 6 workers, load 10-13). `165-05.1` fixed the state race that made this visible as a bug, not the interception itself. A slower host could still exceed the click budget; no automated evidence bounds this."
---

# Phase 165: Results Navigation Redraw — Verification Report

**Phase Goal:** Navigating within the voter results — switching entity tabs, opening an entity, switching tabs inside it, closing it — never remounts or repaints what did not change, never moves the scroll position, and never paints the page above an open overlay.

**Verified:** 2026-09-23
**Status:** human_needed
**HEAD verified against:** `54722d89a` (clean working tree)

## Method

This is goal-backward verification against the six ROADMAP success criteria, cross-checked against `165-NEGATIVE-CONTROL.md` (the phase's own evidence document — read in full, not sampled) and against the live codebase directly, independent of any SUMMARY claim. Every codebase assertion below was re-derived in this session (grep, diff, `git show`, or a single named `vitest` run), not copied from a plan or summary. Two named unit tests were run live at current HEAD (`layout.tracking`, `spike-scaffolding`) rather than trusted from the record. No full-suite re-run was performed — G-7/G-8/G-9 in `165-NEGATIVE-CONTROL.md` are accepted as measured evidence because (a) their exit codes, counts and provenance are recorded with full detail (never a bare "passed"), (b) the gate head `9536af4e7` is a proven ancestor of current HEAD, and (c) `git diff --name-only 9536af4e7..HEAD` shows zero product-source or test-source files changed since — only documentation (REQUIREMENTS.md, ROADMAP.md, CLAUDE.md, skill file, deferred-items, STATE.md) and the negative-control document itself.

## Per-Criterion Verdicts

### Criterion 1 — No results navigation remounts the results subtree

**Status: ✓ VERIFIED**

- `apps/frontend/src/routes/(voters)/(located)/+layout.ts` reads both `{ electionId, constituencyId }` (via `parseParams`) and `{ pathname, search }` inside `untrack(...)` — confirmed by direct read of the file at HEAD `54722d89a`. No tracked `url.*` read remains in the load body.
- `layout.tracking.test.ts` exists and, run live in this session (`yarn workspace @openvaa/frontend test:unit layout.tracking`), passes 5/5. Its own in-file positive control (a recording `url` Proxy against a deliberately-tracked read) proves the instrument can catch the defect it exists to catch.
- `165-NEGATIVE-CONTROL.md` § 7 (NC-1) shows the guard is not vacuous: restoring the pre-fix tracked-read body (byte-identical to the base branch's own two lines, diff-proven) turns the guard RED with the exact fingerprint `['pathname','pathname','search']` — the tracked-read signature spike 031 attributed the redraw to — while the in-file control stays green under the same mutation, isolating the red to the production code rather than the harness.
- **Bounded, and honestly recorded as such**: § 16 item 3 and `deferred-items.md`/REQUIREMENTS.md both state that a load rerun from some *other* cause (a locale change, an explicit `invalidate()`) still collapses the subtree — D-03 accepted this as residue rather than closing it with a second caching layer. This is a scoping decision, not a contradiction of the criterion as ROADMAP states it (which is specifically about *navigation* — tab/entity/drawer — not every possible load-rerun trigger).

### Criterion 2 — Scroll is preserved on entity open, close and tab switch, from a scrolled start

**Status: ⚠️ PRESENT_BEHAVIOR_UNVERIFIED at the visual level; DOM-measurement level VERIFIED**

- `voter-results-redraw.spec.ts` exists, runs in its own Playwright project (`tests/playwright.config.ts:432-438`), and is part of the 171/171 green default suite recorded at `9536af4e7` (G-7).
- `165-NEGATIVE-CONTROL.md` § 12 (NC-6) demonstrates the spec is a real guard, not a vacuous one: dropping `{ noScroll: true }` from the entity-tab handler's organizations branch takes the measured scroll offset from 171 (baseline) to 0 — and the scrolled start itself is hard-asserted, so the equality being tested cannot pass by both sides being zero.
- `deferred-items.md` D-165-03-01 records a real, measured edge case explicitly **not** covered: at maximum document scroll, opening the drawer clamps `scrollY` by ~277px (a probable `content-visibility: auto` interaction, not isolated). The spec deliberately measures from a mid-list position to avoid this, and REQUIREMENTS.md states the bound in terms.
- What is **not** established anywhere in the record is that this reads correctly to a human eye across the actual range of scroll positions a voter would use (top, deep mid-list, bottom) — the E2E assertion is a numeric `scrollY`/`scrollHeight` comparison, not a human visual check, and no visual-regression baseline exists with the drawer open (D-19/D-165-07-01). Routed to human verification (see frontmatter) rather than marked fully VERIFIED, per the honest-verifier convention: the DOM-level truth (scrollY invariant across the tested cases) is proven; the perceptual truth the criterion is ultimately about is not.

### Criterion 3 — No document View Transition paints above an open modal

**Status: ✓ VERIFIED at the mechanism level; visual correctness routed to human verification**

- `viewTransition.ts` exports `isOverlayNavigation` (exempts entity+id navigations from the document VT entirely) and `VT_NO_NAMES_CLASS = 'vt-no-names'`, both confirmed present in the file at HEAD.
- `apps/frontend/src/routes/+layout.svelte:267-268` carries the `html.vt-no-names *` rule with `view-transition-name: none !important` — confirmed present, and the `!important` is confirmed load-bearing by the adjacent comment (named elements carry inline `style="view-transition-name:…"`, which beats a non-`!important` class rule).
- `165-NEGATIVE-CONTROL.md` §§ 10–11 (NC-4, NC-5) show both halves are real guards: deleting the overlay exemption makes a transition get recorded for an `entity`+`id` navigation (4 named groups, where none should run); dropping just the `!important` (not the rule) returns 5 names while the strip class is still applied, i.e., the class was present but powerless without `!important`, precisely the failure mode the comment warns about.
- **Bounded, and honestly recorded**: § 15/§ 18f state plainly that this document does not establish the *visual* result is correct to a human eye (that is D-19's job, and no baseline captures an open drawer), and that the VT **skip path** (`prefers-reduced-motion` / no `startViewTransition` support) has never been taken by any run in the phase — "it skips rather than fails" is true by construction only, not measured. Both caveats are carried into REQUIREMENTS.md RNAV-03 verbatim. Routed to human verification for the visual half.

### Criterion 4 — Results routes follow the layout

**Status: ✓ VERIFIED (structural claims); explicitly has no negative control, honestly disclosed**

- Confirmed by direct filesystem read: exactly one `+page.svelte` exists in the whole `results/` tree, at `results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte`. All four params (`electionTab`, `entityTab`, `entity`, `id`) are optional (`[[...]]` bracket syntax) at every level.
- The middle layer, `results/[[electionTab]]/[[entityTab=etPl]]/+layout.svelte`, is new relative to the base branch (absent from `git ls-tree 4d023c587`) and its own doc-comment explains — citing spike 033 by name — exactly why there is deliberately no `+page.svelte` at that level: a page node at more than one level remounted the list on the first switch away from an implied tab.
- **D-10 confirmed literally, not just by claim**: both `results/[[electionTab]]/+layout.ts` and the leaf `+page.ts` are **byte-identical** to their base-branch (`4d023c587`) counterparts (`diff` returns nothing for either). The matcher-fallthrough 404 (`throw error(404, 'Not Found')`) and the entity/id-coupling 307 (`throw redirect(307, …)`) are both present, unmodified — this phase did not touch these guards at all, which is stronger evidence than "confirm they are present."
- **"No redirect introduced anywhere" is accurate, not an overclaim**: all redirects present in the tree (the electionTab canonicalization 307s, the entity/id-coupling 307) pre-date the phase — confirmed by the byte-identical diffs above. The phase added a new layout level; it did not add new redirect logic.
- **The statistics re-home (D-25) is confirmed**: `results/statistics/+page.svelte` exists (moved off the `[[electionTab]]` chain), and `route.ts:76` defines `Statistics: `${VOTER_LOCATED}/results/statistics`` — matching.
- **Honestly bounded, and this is the one criterion where the phase's own evidence document is most explicit about a gap**: § 15/§ 16/§ 18f all state in terms that criterion 4 has **no negative control** — D-17 scoped the seven negative-control pairs to the four *fixes* (1, 2, 3, 5), not the structural route split. The claim rests on ten consecutive green wrapper runs plus the spec's own vacuity assertions and leaf-route guard tests, not on an injected-regression pair. This gap is called out by name in REQUIREMENTS.md RNAV-04, not concealed.

### Criterion 5 — One app-wide drawer host

**Status: ✓ VERIFIED for the entity-details half; ⚠️ routed to human verification for the question-info half and one named unclosed gap**

- `DrawerHost.svelte` exists at `apps/frontend/src/lib/components/modal/drawerHost/`, is imported and rendered once in the root layout (`apps/frontend/src/routes/+layout.svelte:26,234`).
- The two former per-route drawer components (`EntityDetailsDrawer`, `QuestionExtendedInfoDrawer`) are confirmed **deleted** — no matching file exists anywhere under `apps/frontend/src`.
- `<svelte:boundary onerror={handlePayloadError}>` wraps the hosted payload content (`DrawerHost.svelte:146-154`) — confirmed present. `165-NEGATIVE-CONTROL.md` § 13 (NC-7) shows this is a real guard: reverting the opener-side convention makes the boundary fire and be observed firing (6 error lines), against 0 in three control runs.
- **A specific, named gap in that same net is confirmed still open in the live file**: `DrawerHost.svelte:131` reads `aria-label={shown?.title()}` — outside the `<svelte:boundary>` block that starts at line 146. This is exactly what `deferred-items.md` D-165-06-01 and REQUIREMENTS.md RNAV-05's "Bounded:" clause describe: a second throw (via the payload's `title()` getter) escapes the boundary because it's read in the dialog's own `aria-label` binding, not inside the wrapped content. Confirmed by direct line inspection, not merely by the residue document's claim.
- **The extended-question-info half of this criterion (D-13) is exercised only by `perm-interactive-info`**, a different Playwright project from the one every row in `165-NEGATIVE-CONTROL.md` §§ 7–13 was measured against. No negative control in the evidence document touches this half at all — it rests on a passing E2E run, not an injected regression. Routed to human verification (frontmatter item 2).

### Criterion 6 — The spike scaffolding is gone

**Status: ✓ VERIFIED**

- Filesystem-confirmed at HEAD: `apps/frontend/src/lib/spike` does not exist; `apps/frontend/src/routes/(voters)/(located)/results-layered` does not exist.
- `apps/frontend/src/lib/_guards/spike-scaffolding.test.ts` exists, is a real filesystem-walking guard (not an import-only check — it separately scans for the `SPIKE` marker even without an accompanying import, addressing exactly the gap an import-only guard would have), and — run live in this session — passes 5/5 (`yarn workspace @openvaa/frontend test:unit spike-scaffolding`).
- `165-NEGATIVE-CONTROL.md` § 9 (NC-3) shows the guard is non-vacuous both structurally (a floor of >700 scanned files, well below the measured 823, asserted first) and by injection: it was observed failing against four distinct realistic reintroductions (a scaffolding import, a marker-only comment with no import, a `results-layered` directory, and a mis-rooted walk).
- `voter-results-redraw.spec.ts` is part of the green 171/171 default-suite run (G-7), satisfying "the voter results E2E specs pass."
- **Bounded, and honestly disclosed rather than silently narrowed**: the guard scopes to `apps/frontend/src` only, by design — `.planning/spikes/` keeps the spike's own records and probes on purpose (D-21), and the unmerged `spike/results-redraw` branch still exists as the reproduction rig (D-02). The lab's one persisted browser artifact, a `redrawLab` localStorage key, is inert (nothing reads it post-deletion) rather than actively cleaned up — recorded as accepted residue, not a gap in the criterion as ROADMAP states it (which is about the application's own source tree).

## Coverage Entry D7 — Does the RNAV-01..06 requirement prose over-claim against its evidence?

**Verdict: No. Each of the six RNAV entries in `.planning/REQUIREMENTS.md` carries an explicit "Bounded:" clause that matches — not merely gestures at, but matches in specifics — the corresponding limitation recorded in `165-NEGATIVE-CONTROL.md` §§ 15/16/18f.** This was checked entry by entry, not assumed from the presence of the word "Bounded":

- RNAV-01's residue clause (a locale change or `invalidate()` still collapses the subtree) is § 16 item 3 verbatim in substance.
- RNAV-02's residue clause (the maximum-scroll clamp, mechanism not isolated) is `deferred-items.md` D-165-03-01 verbatim in substance.
- RNAV-03's residue clause (visual correctness is D-19's instrument, not this one; no baseline captures an open drawer; the skip path has never been taken) is § 15's own three-part caveat plus § 18f item 3, all present.
- RNAV-04's residue clause ("criterion 4 has no negative control") is § 15/§ 16 item 4 stated in the same words.
- RNAV-05's residue clause (the `title()` getter throw escapes the boundary; the question-info half is exercised by a different project) is § 15's own two-part caveat, and this verification independently confirmed the `title()` line is genuinely outside the boundary in the live file (see Criterion 5 above) — the requirement's caveat is not just recorded, it is true.
- RNAV-06's residue clause (guard scopes to `apps/frontend/src` only; `.planning/spikes/` and the unmerged branch are deliberate; the `redrawLab` key is inert) matches § 15/Residue section precisely.

No RNAV entry claims a stronger result than its cited evidence section supports. If anything, the requirement prose is *more* conservative than a typical closed-out requirement entry in this file — every one of the six carries a named, specific bound rather than a bare "done." This is the opposite failure mode from over-claiming, and it is the correct one for a phase this evidence-dense.

## What Was NOT Re-Litigated

Per the task's explicit instruction, the following are confirmed as *honestly recorded accepted residue* rather than treated as gaps requiring closure, and are not held against the phase's status:

1. The ~235–256 ms document-VT pointer-event interception on `<html>` (WINDOWS 278) — confirmed present in `165-05.1-SUMMARY.md`/§ 16 item 5, not fixed, recorded as residue. Routed to human verification (frontmatter item 3) because no automated evidence bounds its severity on a slower host.
2. The `title()` getter throw escaping the host boundary (WINDOWS 279) — independently confirmed still present in the live file (see Criterion 5). Recorded, not fixed. Not a blocker per the task's framing, but worth the human's awareness since it is now independently confirmed rather than merely cited.
3. The VT skip path never taken by any run — confirmed absent from every row in §§ 10–13 and from G-7/G-8/G-9. Recorded, not exercised.
4. Criterion 4 has no negative control — confirmed via § 15/16/18f, and structurally consistent with D-17's explicit scoping to the four fixes.
5. The visual gate cannot see an open drawer (WINDOWS 280) — confirmed via § 18g's own disposition section, which states this as a named limit of the instrument.
6. The 0/16 accordion-flake bound (≤19.4% residual, not zero) — read in § 8 (NC-2) but not independently re-derived in this session; accepted as recorded per the task's framing.

## Gate Evidence Accepted (Not Re-Run)

G-1 through G-9 in `165-NEGATIVE-CONTROL.md` § 18 are accepted as valid evidence for this verification because:

- Every row states exit code, verbatim counts, and non-cache-replay proof (`Cached: 0 cached` on all four turbo-backed rows) — not a bare "passed."
- G-7 (full E2E, 171/0/0/0/0) and G-8 (a11y-smoke, 18/0/0/0/0) and G-9 (visual, 7/0/0/0/0, 4/4 baselines matched) all carry positive preflight confirmation (`preflight failures 0, successes 1`), not merely an absence of failure — satisfying this repo's E2E preflight requirement independently of trusting the summary's narration.
- The gate head `9536af4e7370101b88f124120b720537e31f8e2a` is a confirmed ancestor of current HEAD `54722d89a` (`git merge-base --is-ancestor` exit 0, checked live in this session).
- `git diff --name-only 9536af4e7..HEAD` shows **zero** product-source or test-source files changed since the gate run — only planning/documentation files (REQUIREMENTS.md, ROADMAP.md, CLAUDE.md, a skill reference doc, deferred-items.md, STATE.md, todos). The gate evidence therefore still describes the tree at current HEAD.
- Two of the gate's underlying unit guards (`layout.tracking`, `spike-scaffolding`) were independently re-run live in this session and both passed, corroborating rather than merely trusting G-1's aggregate count.

## Overall Verdict

**status: human_needed.** All six ROADMAP success criteria are backed by genuine codebase artifacts, genuine wiring, and genuine injected-regression evidence (where the phase's own D-17 discipline required it) — this is not a paperwork-only phase; the negative-control document's claims were independently spot-checked against the live tree and held up in every case checked, including finding the `title()` boundary gap exactly where predicted. No must-have is FAILED. Three items are routed to human verification because the evidence trail itself — not this verifier's suspicion — draws the line at DOM/JS-measurable truth and explicitly declines to claim the corresponding visual/perceptual truth: (1) scroll preservation as it looks to a human across the full range of scroll positions, (2) the question-info drawer's parity with the entity drawer through the shared host, and (3) click responsiveness during a VT on a slower host than the one measured. None of these three is a fabricated concern — each is named, in the phase's own words, as something no row in its evidence document establishes.

## Recommendation

Ready to proceed pending the three human-verification items above. None blocks merge on technical grounds; they are UAT-shaped (perceptual/cross-device) checks the automated evidence trail explicitly does not claim to cover, consistent with this phase's own stated discipline of not implying more than was measured.

---

_Verified: 2026-09-23_
_Verifier: Claude (gsd-verifier)_
