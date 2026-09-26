---
spike: 031
idea: results-redraw
name: results-nav-flicker-forensics
type: standard
validates: "Given the current results page with a live toggle panel + forensic log, when switching entity tabs / opening an entity / switching drawer tabs / closing it, then each of the four reported symptoms is attributed to a mechanism"
verdict: VALIDATED
related: [013, 014a, 014b, 015, 016]
tags: [sveltekit, navigation, view-transitions, load-invalidation, drawer, scroll, forensics]
---

# Spike 031: results-nav-flicker-forensics

> **`forensics.mjs` targets the redraw-lab panel on the unmerged branch `spike/results-redraw` and will not run against the shipped tree** — there is no lab panel and no forensic log to read on `integration/ship-12-squash` or on any branch descended from it. That branch is kept unmerged on purpose, as Phase 165's reproduction rig (D-02); the probe stays here under `.planning/spikes/` because it is a spike record, not app code (D-21). See `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` § 5.

## What This Validates

Given the results page (`results/[[electionTab]]/+layout.svelte` owning list + drawer), when the four reported interactions run,
then each symptom maps to a concrete, independently-toggleable mechanism — and we learn whether the proposed route
restructure (032) + hoisted drawer (033) are *needed* to fix them.

## How to Run

Branch `spike/results-redraw`, worktree `../voting-advice-application-spike`.

```bash
cd ../voting-advice-application-spike/apps/frontend && npx vite dev --port 5180 --strictPort
# open http://localhost:5180/results — the 🧪 redraw-lab panel sits bottom-left
```

Panel toggles (persisted in localStorage `redrawLab`, applied on the next navigation — reload after flipping `loader`):

| Row | Options | What it changes |
|-----|---------|-----------------|
| loader | `current` / `fixed`, `keepReady` | `(located)/+layout.ts` stops tracking `url.pathname`; `keepReady` = stale-while-revalidate in `(located)/+layout.svelte` |
| VT | `on` / `scoped` / `off` | root `onNavigate` view transition; `scoped` skips it when the route id doesn't change |
| names | `keep` / `strip-modal` / `strip-all` | strips every `view-transition-name` for transitions that start/end with a drawer open |
| drawer | `local` / `global` | Spike 033 |
| slowmo | on/off | every VT animation takes 2 s, so layering is visible to the eye |

Headless reproduction (all configs, logs + mid-transition screenshots into `out/`):

```bash
node .planning/spikes/031-results-nav-flicker-forensics/forensics.mjs http://localhost:5180 baseline,fixed,fixed-strip,fixed-scoped
```

## Observability

`src/lib/spike/redrawLab.svelte.ts` — event ledger (`window.__redrawLab.events`, also `console.debug`):
`nav` (onNavigate/complete), `vt` (start with captured names + dialog state, finished), `scroll` (scrollY jumps +
caller stack of every `scrollTo` / `scrollIntoView`), `dialog` (open attr), `focus`, `mount` (ledger for
ResultsLayout / MainContent / EntityListWithControls / EntityDetailsDrawer), `dom` (node churn per watched region).

## Investigation Trail

1. **Premise from Spike 013:** the results layout persists across tab swaps. **No longer true.** The baseline
   ledger shows `destroy ResultsLayout / MainContent / EntityListWithControls` → `mount …` on *every* results
   navigation — tab switch, entity open, entity close (4 remounts in one pass).
2. **Why:** `(located)/+layout.ts` deliberately `untrack`s `parseParams({ url })` ("careful to not rerun the load
   function unnecessarily") — then reads `url.pathname` / `url.search` *tracked* two lines later for the `next=`
   redirect target. SvelteKit therefore reruns the load on every path change inside `(located)`, returning fresh
   streamed promises → `(located)/+layout.svelte`'s effect sets `ready = false` → `{:else if !ready} <Loading/>`
   replaces the entire subtree for ~20 ms → everything remounts when the data resolves (and the question +
   nomination data is re-fetched each time).
3. **Scroll-to-top (symptom 2) is the same bug.** The card link *does* set `data-sveltekit-noscroll`; SvelteKit
   then calls `scrollTo(scroll_state())` after the DOM update — but the subtree has already collapsed to
   `<Loading/>`, the page is one screen tall, scrollY is clamped to 0, so it "restores" 0. Caller stack in the log:
   `client.js:1856 navigate`.
4. **Fix A — `loader: fixed`** (untrack the path reads): 0 remounts; scrollY 700 → 700 on open and close; opening
   an entity touches only drawer DOM (`voter-results-drawer:5`, list 0). **`keepReady`** alone also stops the
   remount but the list still churns 170–260 nodes per navigation (data re-provided) — it's a fallback, not the fix.
5. **With remounts gone, VT layering is what's left.** Mid-transition screenshots (slowmo, `out/*-b1000.png`):
   - `fixed` + names kept, opening: the drawer is **invisible for the whole transition** — `main-content` is a
     named VT group painted above the root snapshot, and the root snapshot is where the top-layer `<dialog>` lives.
     `entity-detail-tabs` (named, inside the drawer) floats on its own above the list.
   - Drawer tab switch (`Tabs transitionOnChange` → document VT): **the results list covers the drawer** — this
     is symptom 4 exactly, and `vt: scoped` can't help because it isn't a navigation.
   - Header over the backdrop (symptom 2's flash) is the same mechanism with `persistent-header`.
6. **Fix B — `names: strip-modal`**: drawer stays in front during drawer-tab switches (content cross-fades inside
   it). **Fix C — `vt: scoped`**: open/close have no document VT at all; the dialog's own backdrop fade + fly-in
   are the only motion. Close under `fixed-scoped` = backdrop fades, list static (symptom 3 gone).
7. **Remaining nit:** entity-tab switch still calls `scrollTo(0,0)` — `handleEntityTabChange` uses `goto()` without
   `noScroll`, so a voter scrolled down to the tabs jumps to the top on every tab switch.

## Results

**Verdict: VALIDATED** — every symptom is attributed, and none of them needs the route restructure:

| # | Symptom | Mechanism | Fix (toggle) |
|---|---------|-----------|--------------|
| 1 | Intro fades on entity-tab switch | whole `(located)` subtree remounts (load rerun → `ready=false`) | `loader: fixed` |
| 2a | Scroll to top on entity open | same remount collapses the page before SvelteKit restores noscroll position | `loader: fixed` |
| 2b | Header above the overlay, then covered | `persistent-header` VT group painted above the root snapshot that holds the top-layer dialog | `vt: scoped` (or `names: strip-modal`) |
| 3 | Content flickers on close | remount + whole-page VT cross-fade | `loader: fixed` + `vt: scoped` |
| 4 | Results page in front during drawer-tab switch | drawer `Tabs` document VT lifts `main-content` above the dialog | `names: strip-modal` (or no VT for in-drawer tabs) |
| — | Tab switch jumps to top | `goto` without `noScroll` in `handleEntityTabChange` | one-line fix |

**Recommended combination to live-test:** `loader: fixed` + `VT: scoped` + `names: strip-modal`.

**Surprises:**
- Spike 013's "results layout persists" finding silently regressed — the tracked `url.pathname` read postdates it.
  Worth an E2E/unit guard: "navigating within results does not rerun the `(located)` load".
- Document-level View Transitions and top-layer `<dialog>`s don't mix: *any* named element outside the dialog is
  painted above it for the duration. A doc VT must never run with names while a modal is open.
- The load rerun also refetched question + nomination data on every tab/drawer click — a perf cost, not just visual.

**Impact on 032/033:** the core assumption behind them ("the flicker comes from the route shape / the drawer living in
the results layout") is **invalidated**. 032 can still be judged on code-organisation merit; 033's global host
would still need Fix B/C, because the layering problem is about document VTs vs. the top layer, not about where the
drawer component is mounted.
