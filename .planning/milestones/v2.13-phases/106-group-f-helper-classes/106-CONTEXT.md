# Phase 106: Group F Helper Classes — Context

**Gathered:** 2026-06-12
**Status:** Ready for planning
**Source:** Batched discussion (`.planning/v2.13-DISCUSSION-POINTS.md`) — replaces per-phase `/gsd-discuss-phase`. Research skipped: the spike artifacts ARE the research (milestone decision; v2.11 precedent).

<domain>
## Phase Boundary

Formalize the four already-class-shaped "Group F" helper factories in `apps/frontend/src/lib/contexts/`
as real Svelte 5 **classes** with `$state`/`$derived` fields + arrow-function methods. This is the
lowest-blast-radius first move of the v2.13 context-as-class migration — it establishes the class template the
leaf contexts (107) and app producers (108) build on. Per the proof approach, consumers stay **byte-identical**
(no consumer churn this phase); the flatten happens later in Phase 113.

**In scope (the 4 helpers — req CLASS-01):**
1. **`popupStore()` → `class PopupStore`** — `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts`
   (26 lines). Queue `$state<Array<PopupQueueItem>>` + `current` `$derived(queue[0])` + `push`/`shift` (arrow
   fields — they're array-wholesale-reassign). The existing TS type is `PopupStore` (in `popupStore.type.ts`) —
   resolve the class/type name clash (e.g. class `PopupStore`, type stays an interface it implements, or rename
   the type). Consumer: `routes/+layout.svelte` via `popupQueue.current`.
2. **`SettingsOverlay()` → `class SettingsOverlay`** — `contexts/utils/SettingsOverlay.svelte.ts`. Token-keyed
   overlay registry: `current` `$derived` (associative `mergeSettings` reduce over mount-ordered overlays),
   `push(overlay)` returning a revert fn, `use(overlay)` (declarative — pushes + registers `$effect` cleanup via
   `untrack`). **Preserve the `untrack` overlay mechanic and the associative-merge guarantee verbatim** — its
   `SettingsOverlay.svelte.test.ts` is the regression gate.
3. **`persistedState` → `class`** — `contexts/utils/persistedState.svelte.ts`. The `localStorageState` /
   `sessionStorageState` / `storageState` factories return a `PersistedState<TValue>` handle (`current` getter +
   `set`/`update`). Convert the handle to a class with the `$state` value field + **imperative persist inside
   arrow `set`/`update`** (NEVER `$effect` — §21/A7). Keep the versioned-payload read + **no format-migration
   shim** (D-03) behavior. The `localStorageState`/`sessionStorageState` factories stay as thin wrappers
   returning `new …(…)`. Underlies `userPreferences` (appContext, P109) + `answers` (answerStore, P110) — both
   keep reading the same API now.
4. **`VideoController` → `class`** — currently **embedded inside** `contexts/layout/layoutContext.svelte.ts` as
   the `video` const-ref (`show`/`hasContent`/`mode`/`player` `$state` mutated in place). Extract it into a real
   `class VideoController` with `$state` fields + arrow methods; `layoutContext` holds an instance.

**Boundary note for the planner — `layoutContext` orchestrator:** `initLayoutContext()` is itself a Group-F-heavy
context (its members are `SettingsOverlay` ×3 — pageStyles/topBarSettings/navigationSettings — plus `VideoController`,
`progress`, `routeTitle`, `navigation`). The roadmap does not assign `layoutContext`'s own orchestrator conversion
to a later CLASS phase. **Recommended:** fold the `initLayoutContext()` → class conversion into THIS phase, since
all its members become formal classes here — keeps the layout subsystem coherent and closes the implicit gap. If
the planner instead keeps `layoutContext` as a factory holding the new helper-class instances, flag it explicitly
as deferred so the plan-checker can weigh the coverage gap. Either way, consumers stay byte-identical.
</domain>

<decisions>
## Implementation Decisions (locked — from `.planning/v2.13-DISCUSSION-POINTS.md`)

### Class shape (cross-cutting A1–A14, CONVENTIONS §17–22)
- **A1** Keep factory wrappers (`popupStore()`/`localStorageState()`/`initLayoutContext()`): each `return new …`.
  Also adopt the typed `createContext` `[getX, setX]` pair idiom (svelte.dev/docs/svelte/context) where a context
  is registered/retrieved via `setContext`/`getContext` — verify the exact API against the installed Svelte
  version (it may be a small local helper, not a built-in). For these pure helpers (not `setContext`-registered),
  the factory-returns-instance shape suffices.
- **A5/§18** Detachable methods (`push`/`shift`/`set`/`update`/`use`/video methods — destructured or passed as
  handlers) are **arrow-function fields**, not prototype methods.
- **A6/§20** No `$effect` for initialization. Synchronous field initializers / `$derived` fields only.
  `$effect` only for post-construction reactions inside a component-instantiated class (e.g. `SettingsOverlay.use`
  cleanup is already `$effect`-scoped at the call site — keep it there).
- **A7/§21** Persistence stays imperative (arrow `set`/`update`); `persistedState` constructs OUTSIDE any effect
  context (SSR/factory-safe — §23 `effect_orphan`).
- **A2** Prototype getters by default (these helpers are NOT spread into a parent that would drop them).
- **A10** Class names: `PopupStore`, `SettingsOverlay`, `VideoController`, and a `persistedState` class (e.g.
  `PersistedStateImpl` or `PersistedState` implementing the existing interface). Instance/variable names UNCHANGED
  until Phase 114 (rename). Do NOT rename to `*State` here.
- **A4** Consumers byte-identical — retain the existing public read API (`current`, `push`, etc.). No consumer
  edits this phase.

### Verification / gates (the "validation" for this refactor)
- **A11** New/updated unit tests are headless `*.svelte.test.ts` with `$effect.root(() => …)` + `flushSync()`.
  Keep the existing `SettingsOverlay.svelte.test.ts` + `persistedState.svelte.test.ts` green (they ARE the
  behavioral contract); extend if a class-specific edge appears.
- **A12** Atomic per helper; green at every commit boundary.
- **A13** svelte-check gate = **zero NEW errors** (151 pre-existing baseline held; stash-compare).
- Green gate for this phase: `yarn build` (client + SSR) + `yarn vitest run src/lib/contexts/` +
  `yarn svelte-check`. No live E2E this phase (A15 — live E2E is at 110/111/113/116).

### Claude's Discretion
- Exact class/type-name clash resolution for `PopupStore` (interface vs class).
- Whether `VideoController` extraction also moves the `video`-related types to a sibling `.type.ts`.
- Plan/wave decomposition (likely 1 plan, 4 helpers as tasks — or split if `layoutContext` is folded in).
- Whether to delete the leftover spike scaffolding here or in 107 (see Deferred).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The proven class template (READ FIRST — this is the pattern to copy)
- `.planning/spikes/CONTEXT-CLASS-PROOF.md` — 3 landed production conversions (`dataContext`, `filterContext`,
  `darkMode`); own-property-vs-prototype-getter rule; `$effect`-in-constructor caveat; arrow-field methods.
- `apps/frontend/src/lib/contexts/component/darkMode.svelte.ts` — the simplest landed class (45 lines) —
  Group-B primitive analog: private `#state` field + prototype getter + arrow listener.
- `.planning/spikes/CONVENTIONS.md` §17–22 — the six class-shape disciplines (reassigned-field-needs-no-handle,
  arrow methods, destructure trap survives, no-`$effect`-init, imperative persistence, version-bridge `untrack`).
- `.planning/spikes/CONTEXT-MEMBER-AUDIT.md` — Part 1 entries for `popupStore`, `SettingsOverlay`,
  `persistedState`, and layout `video`; Group F (§F) classification.

### Project rules
- `.planning/v2.13-DISCUSSION-POINTS.md` — §A (cross-cutting) + §"Phase 106" — the full locked decision set.
- `CLAUDE.md` — "Context Destructuring Rule (Svelte 5)" (destructure trap survives — §19/A9).
- `apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.test.ts` +
  `apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts` — the behavioral regression gates.
</canonical_refs>

<specifics>
## Specific Ideas
- Target files: `contexts/app/popup/popupStore.svelte.ts`, `contexts/utils/SettingsOverlay.svelte.ts`,
  `contexts/utils/persistedState.svelte.ts`, and the `video` ref in `contexts/layout/layoutContext.svelte.ts`.
- `persistedState` already documents its no-migration-shim (D-03) + versioned-payload behavior in its header —
  preserve verbatim.
- `SettingsOverlay` header explains the token-keyed registry replacing `StackedState` — preserve the associative
  `mergeSettings` reduce + `untrack` revert semantics exactly.
</specifics>

<deferred>
## Deferred Ideas
- **Spike scaffolding cleanup (A14):** `apps/frontend/src/lib/contexts/_spikes-017-019/` AND
  `apps/frontend/src/lib/contexts/_spikes-020-class-conversion/` are deletable spike test dirs. Planned for
  deletion in **Phase 107** (per A14) — but the planner MAY delete them here if convenient. Do not leave them in
  the shipped tree past 107.
- Consumer `.current`→bare flatten + `reactiveFoo` de-dup → **Phase 113** (not now).
- Any `*Store`→`*State` rename → **Phase 114** (not now).
</deferred>

---

*Phase: 106-group-f-helper-classes*
*Context gathered: 2026-06-12 via batched discussion-points doc (research skipped — spikes are the research)*
