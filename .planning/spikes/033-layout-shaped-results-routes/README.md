---
spike: 033
idea: results-redraw
name: layout-shaped-results-routes
type: standard
validates: "Given results routes shaped like the layout ([electionTab] lower half → [entityTab] list → [entity]/[id] nomination page), when switching tabs and opening/closing entities, then the shell and tabs stay mounted and the nomination page opens the overlay without touching the list"
verdict: VALIDATED
related: [031, 032, 014a, 014b]
tags: [sveltekit, routing, layouts, restructure, mount-forensics]
---

# Spike 033: layout-shaped-results-routes

> **The `results-layered/` route tree this spike built is superseded by D-08's optional-param split and is never merged.** It exists only on the unmerged branch `spike/results-redraw`, which Phase 165 keeps in place as its reproduction rig (D-02) and never merges (D-01); criterion 6 / RNAV-06 forbids a `/results-layered` tree in the shipped application outright. What survives from this spike is its mount forensics, not its route shape. See `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` § 5.

## What This Validates

The proposed restructure, built as a parallel tree next to the untouched `/results` so both can be compared live:

```
results-layered/+layout.svelte                                  L1 shell: title, hero, ingress, election picker; lower half = children
results-layered/[electionTab]/+layout.svelte                    L2 entity-type tabs for that election
results-layered/[electionTab]/+page.svelte                      (no entityTab) list of the implied default type
results-layered/[electionTab]/[entityTab=etPl]/+layout.svelte   L3 list + filters (LayeredList.svelte)
results-layered/[electionTab]/[entityTab=etPl]/[entity=etSg]/[id]/+page.svelte   P4 nomination → opens the overlay
```

Entity cards still build `/results/…` links (`ResultEntity` route); an L1 click-capture handler rewrites them into this
tree. Tracking / popups / election-info were not ported — only what the four symptoms touch.

## How to Run

```bash
# dev server on :5180 (see 031); open the same URL with /results → /results-layered, e.g.
# http://localhost:5180/results-layered/<electionId>?electionId[0]=…&constituencyId[0]=…
ROOT=/results-layered node .planning/spikes/031-results-nav-flicker-forensics/forensics.mjs http://localhost:5180 legacy,hardened,hardened-global
```

## Investigation Trail

1. **With the pre-032 loader (`legacy`), the layered tree remounts exactly like `/results`:** every click destroys
   L1 → L3 + MainContent (`(located) data rerun — ready true → false`). The route shape cannot protect anything below
   `(located)/+layout.svelte`'s `{:else if !ready}` — confirms 031: the remount is above the results routes.
2. **With the 032 fixes:** L1 + L2 never remount. Opening/closing an entity mounts/destroys only P4 (+ its drawer);
   the list DOM is untouched. Scroll 700 → 700 on open and close. Same VT behaviour as `/results` (the overlay rules
   key on `entity` + `id` params, which the new tree keeps).
3. **One regression vs `/results`:** the first switch from the implied tab (`/RL/E`, list rendered by
   `[electionTab]/+page.svelte`) to an explicit one (`/RL/E/organizations`, list rendered by the `[entityTab]` layout)
   remounts L3 — different component instances in different route files. `/results` keeps one list instance because
   one layout renders every shape. Later tab switches stay in the `[entityTab]` layout (only the `{#key}`'d
   `EntityListWithControls` remounts, as in `/results`).
4. Route params are no longer optional (`[electionTab]`, not `[[electionTab]]`), so the matcher-fallthrough guard and
   the entity/id coupling guard in today's `+page.ts` disappear — a mismatched URL is simply a 404.

## Results

**Verdict: VALIDATED** — the layout-shaped tree works and is *equivalent* in rendering behaviour to the fixed `/results`
(it does not fix anything the 032 fixes don't). Its value is organisational:

| | `/results` (today) | layout-shaped (033) |
|---|---|---|
| Files | 1 layout (~390 lines) owns list + drawer + tabs + picker | 4 small files, each owning one level |
| Drawer | `{#if drawerVisible}` inside the list layout, `+page.svelte` empty | P4 IS the nomination page; unmount = close |
| URL guards | optional params + matcher-fallthrough + coupling guards | required params; invalid shapes 404 |
| Implied → explicit tab | one list instance | L3 remounts once (fixable: always redirect `[electionTab]` → default plural once matches exist, or render the list from L2 and let L3 only select) |
| Cross-type drawer (org list + candidate) | supported | supported (`[entityTab]/[entity]/[id]`) |

Signal for the build: adopt only if the organisational win is wanted; if so, remove the implied-tab page (redirect or
render from L2) to avoid the one remount.
