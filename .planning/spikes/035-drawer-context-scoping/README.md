---
spike: 035
idea: drawer-context-scoping
name: drawer-context-scoping
type: comparison
validates: "Given the app-wide DrawerHost that re-provides the opener's whole getAllContexts() map through ContextBridge, when the opener instead provides only the named contexts its content needs — or the bridge is designed away — then hosted content still resolves every context it reads, the drawer keeps its swap / out-animation / teardown contract, and the full E2E suite stays green"
verdict: VALIDATED
related: [034, 036, 032]
tags: [svelte5, context, drawer, dialog, portal, getAllContexts, createContext]
---

# Spike 035: drawer-context-scoping

## What This Validates

Owner's question: *"The context bridge is a bit questionable. Is there any way to only provide the named context from the caller?"*

Yes — and there are two ways to need no bridge at all. Three production variants, each on its own branch off
`spike/drawer-context-scoping` (base = `bfe4f8ec0` + the harness), each run through the **full E2E suite**:

| Variant | Branch | Idea |
|---|---|---|
| **035a** mechanism harness | `spike/drawer-context-scoping` (`apps/frontend/src/spike035/`, copy in `harness/`) | jsdom proof of each mechanism in isolation |
| **035b scoped host** | `spike/035b-scoped-host` | Mount `DrawerHost` in `routes/(voters)/+layout.svelte` instead of the root layout. Delete `ContextBridge`; payload has no `contexts`. |
| **035c named carriers** | `spike/035c-named-carriers` | Keep the root host. Payload carries `carry: [carryVoterContext()]` — each context module exports a `carry*Context()` that captures its value and returns `() => setContext(KEY, value)`. Question info carries nothing. |
| **035d portal** | `spike/035d-portal` | Keep the root dialog *shell*. Content renders in the opener's own tree inside `<DrawerPortal>`, whose `{@attach}` moves the element into the host's slot. No bridge, no `svelte:boundary`. |

## Research

- **What does the hosted content actually need?** `context-closure.mjs` (static transitive-import walk from the hosted component):
  - `EntityDetails` (177 files reached) → `getComponentContext`, `getAppContext` (both at root) + **`getVoterContext`, `getFilterContext`** (below root).
  - `QuestionExtendedInfo` (81 files) → **only `getComponentContext`**, which is at root. The question-info opener's `getAllContexts()` capture bridges nothing it needs.
- **`getAllContexts()` carries everything in the ancestry**, wanted or not — harness: 5 of 5 ancestor entries including an unrelated one (in the real tree: the 6 root contexts, re-set to the same values, plus voter, filter and any `NavGroup` flag the opener happens to sit under).
- **Ecosystem practice:** bits-ui's `Portal` does exactly what our bridge does — `mount(PortalConsumer, { target, props: { children }, context: getAllContexts() })` (fetched from `huntabyte/bits-ui` main, `portal.svelte`). So the current design is the standard one; it isn't a local oddity.
- **Svelte 5.53 APIs:** `createContext<T>()` returns `[get, set]` with a private key — a carrier `() => set(get())` works without exporting any key (harness). `mount(..., { context })` also exists, but it's just the same map bridge in another form.

| Approach | Pros | Cons | Status |
|---|---|---|---|
| Whole-map bridge (status quo) | Opener needs no knowledge of content's needs | Carries everything; every hosted component silently depends on it; teardown hazard (host renders after opener dies) | baseline |
| Named carriers (035c) | Explicit; question-info needs none | Opener must know content's transitive context needs; a missed one → `error(500)` inside the boundary → drawer force-closes | built |
| Scoped host (035b) | No bridge at all; smallest diff | Host is per-app, not app-wide; a candidate/admin drawer would need its own mount | built |
| Portal (035d) | No bridge; content dies with opener | Moves DOM under Svelte; needs `{#if open}` gating + `browser` guard; `title` getter still reads opener state after teardown | built |

## How to Run

```bash
# mechanisms (6 tests, ~1 s)
cd apps/frontend && npx vitest run src/spike035          # on spike/drawer-context-scoping
# a variant, full suite
git switch spike/035b-scoped-host && tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset
# close-animation frame probe: append probe-close.ts to voter-results-redraw.spec.ts (uncommitted), then
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --project voter-results-redraw
```

## Investigation Trail

1. **Mechanisms (035a, jsdom, 6/6 pass).** A snippet rendered by a root host sees the *host's* ancestry (`voter=MISSING`) — the reason a bridge exists. Named Symbol-key carriers work. `createContext()` carriers work. A portal renders inside the host slot with the opener's contexts, stays reactive, and on opener unmount leaves a dead-but-intact DOM snapshot in the slot (`portal cleanup: node still in slot=true`) — the host decides when to remove it.
2. **Scoped host (035b).** Root layout loses `<DrawerHost/>`; voters layout gains it after `</Layout>`. `ContextBridge.svelte`/`.type.ts` deleted, `contexts` gone from payload and both openers. **+5 / −59 lines.** svelte-check 0 errors. **Full E2E 171/171 passed** (11.1 min; preflight OK), including `voter-results-redraw` (5 tests: VT invariants, node identity, swap + teardown), `perm-interactive-info` (question-info drawer), `voter-alliance`, both journeys, `a11y-smoke`. Phase 165's reason for the root mount ("so a modally-opened drawer sits in the top layer regardless of where its opener lives") is satisfied by `showModal()` itself, not by the mount point — confirmed by the redraw spec passing.
3. **Named carriers (035c).** `carryFilterContext()` in the filter module; `carryVoterContext()` in the voter module carries filter too (voter initialises filter, so the coupling lives where it belongs). `ContextBridge` now runs carriers. **+35 / −18.** 0 errors. **Full E2E 171/171 passed** (11.0 min).
4. **Portal (035d).** `DrawerPortal.svelte` + `drawerHost.slot`; host clears the slot when the close finishes / on force-close. Question-info button renders its portal only while `drawerHost.current?.key === key`. **+51 / −77.** 0 errors. **Full E2E 171/171 passed** (11.2 min).
5. **Out-animation (probe-close.ts, `voter-results-redraw` project, 8/8 passed).** Sampled every frame after clicking the backdrop. Baseline (bridge) and portal are *indistinguishable*: 1158 chars of entity details visible every frame through the ~170 ms slide (translateY 0 → 672 px), dialog closed on the next frame, content gone. The portal's dead snapshot looks exactly like the live payload. (The probe's `pageerror` listener was attached too late to count — no claim about page errors is drawn from it; RNAV-05's teardown test covers that and passes in every variant.)

## Results

**Verdict: VALIDATED — the bridge can go. Winner: 035b (scoped host).** Runner-up for a future cross-app drawer: 035c.

- **Can the caller provide only the named contexts?** Yes (035c) — and for question-info the correct named set is *empty*. But it moves a hidden obligation to a different place: the opener must know the transitive context needs of everything its content renders (EntityDetails reaches the filter context only transitively, via `EntityListWithControls`). Getting that wrong fails at runtime in the boundary, not at compile time.
- **Scoped host (035b)** removes the question instead of answering it: both openers live under `(voters)`, so a host mounted in the voters layout sees voter + filter natively. It is the smallest change (−54 net lines), and it deletes a component, a payload field and two `getAllContexts()` captures. What it gives up is *app-wide*: if the candidate or admin app ever gets a drawer, it mounts its own `<DrawerHost/>` in its own layout (a one-line mount per app root, with one module-level `drawerHost` singleton still fine since only one app is mounted at a time).
- **Portal (035d)** is the most elegant model — content lives and dies with its opener, no bridge, no error boundary — but it's the biggest diff, moves DOM under Svelte's feet (safe only because the moved node sits inside a wrapper Svelte owns), needs gating on the question-info button and a `browser` guard, and still leaves the `title` getter reading opener state after teardown. Not worth it while 035b exists.
- **Not recommended:** `mount(..., { context })` (same map, other shape); a single app-wide context (see 036: high risk, ≥58 files).

**If 035b is adopted, also:** drop the "last defined value" (`shownEntity`/`shownQuestion`) convention? **No** — still needed: the host still renders the snippet through the out-animation after the opener unmounts. Keep it and keep the `svelte:boundary`. Update the stale doc comments in `DrawerHost.svelte`, `drawerHostState.svelte.ts`, both openers and the results `+page.svelte` (they describe a root mount and a context map), and the CLAUDE.md/skill references to "one app-wide DrawerHost + ContextBridge".
