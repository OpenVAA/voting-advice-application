---
spike: 034
idea: results-redraw
name: global-drawer-host
type: standard
validates: "Given one drawer host in the root layout opened with a payload (entity details or extended question info), when opening, swapping entity → entity, closing, and switching drawer tabs, then the overlay covers the header from the first frame, never reopens on swap, animates out, and the page never paints above it"
verdict: PARTIAL
related: [031, 032, 033, 006]
tags: [svelte5, dialog, top-layer, context, snippets, drawer, overlay]
---

# Spike 034: global-drawer-host

> **`probe-global.mjs` and `probe-qinfo.mjs` target the redraw-lab panel on the unmerged branch `spike/results-redraw` and will not run against the shipped tree** — they drive the lab's toggles and read its forensic log, neither of which exists on `integration/ship-12-squash` or on any branch descended from it. That branch is kept unmerged on purpose, as Phase 165's reproduction rig (D-02); the probes stay here under `.planning/spikes/` because they are spike records, not app code (D-21). See `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` § 5.

## What This Validates

Hoisting the drawer to the root layout: `DrawerHost.svelte` owns the app's only `<dialog>`; openers call
`drawerHost.open({ key, title, content: Snippet, contexts, onDismiss })` and `drawerHost.close(key)`.

## How to Run

Lab panel → `drawer: global` (works on both `/results` and `/results-layered`), then open/close entities; on a question
with extended info, the info button uses the same host.

```bash
node .planning/spikes/034-global-drawer-host/probe-global.mjs     # open → party link (A → B) → close, with page-error capture
ROOT=/results-layered node .planning/spikes/031-results-nav-flicker-forensics/forensics.mjs http://localhost:5180 hardened-global
```

Files: `lib/spike/{drawerHostState.svelte.ts, DrawerHost.svelte, ContextBridge.svelte, GlobalEntityDrawer.svelte}`;
openers: results `+layout.svelte`, layered P4, `QuestionExtendedInfoButton.svelte`.

## Investigation Trail

1. **Context problem, found before building:** `EntityDetails` calls `getVoterContext()`, which only exists below
   `(voters)/+layout`. A snippet rendered by a root-level host gets the ROOT's contexts. Fix: the payload carries the
   opener's `getAllContexts()`; the host wraps the content in `ContextBridge`, which `setContext`s each entry.
2. **Close hung the app (real hazard):** the host keeps rendering the payload through its 250 ms out-animation — after
   the opener is destroyed. The snippet read the opener's `entity` prop, which then reads `undefined` (the parent's
   `{#if}` went false) → `EntityDetails` threw `Cannot destructure property 'type' of 'unwrapped.entity'` mid-flush →
   the host's effect never ran, the dialog stayed open. Fix: the opener renders from `$state.raw` last-defined entity
   (`$effect.pre` keeps it current). **Rule for the build: payload content must not read opener state that goes
   undefined on teardown** — or the host must render a frozen copy.
3. **After the fix:** open = one `showModal`, panel slides up, backdrop covers the header from frame 1 (no doc VT on
   overlay navigations, 032). **A → B** (party link in a candidate drawer): content swaps inside the open dialog — no
   second `showModal`, no backdrop flash. **Close**: backdrop fades + panel slides down, `dialog.close()` 250 ms later
   (the per-route `Drawer` could not animate out). Drawer-tab switch: same as 032 (names stripped, drawer in front).
4. **Not exercised:** the question-info path. The local seed/app settings don't render
   `voter-questions-popup-info-button` (needs `questions.interactiveInfo.enabled` + info content), and I did not change
   the shared DB. Code path is wired and type-checks (0 errors).

## Results

**Verdict: PARTIAL.** The host works and adds two things the per-route drawer can't do — entity → entity swap without
reopening, and an out-animation — but it is **not needed for the four reported symptoms** (032 fixes them with the
local drawer), and it brings two new obligations:

- **Context bridging** (`getAllContexts()` in the payload) — every hosted component silently depends on it.
- **Teardown-safe payloads** — content must outlive its opener by the close animation (item 2 crashed the app).

Alternative worth comparing in the build: keep the dialog shell global but **portal** the opener's own rendered DOM
into it (content stays in the opener's component tree → no context bridge, and the opener controls teardown).
Question-info through the host remains unverified locally.
