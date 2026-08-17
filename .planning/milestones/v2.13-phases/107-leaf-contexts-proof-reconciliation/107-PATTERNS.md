# Phase 107: Leaf Contexts + Proof Reconciliation - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 5 source files (2 conversion targets, 3 reconciliation targets) + 2 type files + 2 barrels (verify-only)
**Analogs found:** 5 / 5 (all in-tree; canonical idiom is Phase 106 conversions in the same directory tree)

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` | context provider (leaf) | request-response (DataWriter wrappers) + reactive-derive (`isAuthenticated`) | `contexts/layout/VideoController.svelte.ts` (arrow-field methods + plain fields) | exact (same idiom group: F-style leaf class, no version bridge) |
| `apps/frontend/src/lib/contexts/component/componentContext.svelte.ts` | context provider (leaf, composing) | delegation / getter-forwarding | `contexts/data/dataContext.svelte.ts` init-factory + `darkMode` composition | role-match |
| `apps/frontend/src/lib/contexts/component/darkMode.svelte.ts` | reactive helper (Group B primitive) | event-driven (matchMedia listener) | `contexts/app/popup/popupStore.svelte.ts` (private `$state` + getter, arrow handler) | exact |
| `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` | context provider (Group C version-bridge) | version-bridge over non-rune `DataRoot` | already-class; reconcile against CONVENTIONS §22 | self-analog (reconcile only) |
| `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` | context provider (Group C version-bridge) | version-bridge over non-rune `FilterGroup` + `$effect` subscription | already-class; reconcile against CONVENTIONS §22/§20 | self-analog (reconcile only) |

**Verify-only (no edits expected — barrels must stay byte-identical):**
`contexts/auth/index.ts`, `contexts/component/index.ts` — both are plain
`export * from './*.svelte'` + `export * from './*.type'`. The class name is
NOT exported (only `getXContext`/`initXContext` factories), so converting the
internal shape leaves the barrel surface unchanged. Confirm after edit.

---

## Canonical Final Idiom (Phase 106 reference — copy this shape)

The freshest, already-landed examples of the final class idiom live in the same
directory tree. Use these two as the literal template:

### `contexts/app/popup/popupStore.svelte.ts` (lines 19-41) — leaf, private-state + getter

```ts
class PopupStore implements PopupStoreApi {
  #queue = $state<Array<PopupQueueItem>>([]);
  #current = $derived(this.#queue[0]);

  push = (item: PopupQueueItem): void => {     // §18 arrow field — survives detach
    this.#queue = [...this.#queue, item];
  };
  shift = (): void => {
    this.#queue = this.#queue.slice(1);
  };

  get current(): PopupQueueItem | undefined {  // prototype getter (NOT spread by consumer)
    return this.#current;
  }
}

export function popupStore(): PopupStoreApi {
  return new PopupStore();
}
```

### `contexts/layout/VideoController.svelte.ts` (lines 28-52) — public `$state` fields + arrow method

```ts
export class VideoController implements VideoControllerApi {
  show = $state(false);          // §17: reassigned $state FIELD read as instance.show stays reactive
  hasContent = $state(false);
  mode = $state<VideoMode>('video');
  player = $state<Video | undefined>(undefined);

  load = async (props, { autoshow = true } = {}): Promise<boolean> => { // §18 arrow field
    const player = this.player;
    if (!player) return false;
    // ...
  };
}
```

**Idiom rules distilled (from `.planning/spikes/CONVENTIONS.md` §17–22):**
- §17 — A reassigned `$state` FIELD read as `instance.foo` stays reactive; no `{current}` handle needed. Public `$state` fields are fine when the consumer reads `instance.foo` (NOT when spread).
- §18 — Any method that crosses the context boundary (destructured / passed as handler) MUST be an arrow-function FIELD so it captures `this` on detach.
- §19 — Destructure trap unchanged; CLAUDE.md Context Destructuring Rule still applies to reactive getters.
- §20 — Init/merge goes in field initializers or `$derived`, NEVER `$effect` (SSR + `effect_orphan`). `$effect` only when the class is instantiated inside a component init (which `initFilterContext` is).
- §22 — Version-bridge classes (DataRoot/FilterGroup) KEEP the bridge: private `#root` + private `#version = $state(0)` + reactive getter + arrow `setX(updater)` internalizing `untrack`. Do not simplify away.
- Spread caveat: if a consumer spreads the instance (`{ ...ctx }`), prototype getters are dropped — those handles must be OWN properties (see `dataContext` constructor-assigned `dataRoot`/`reactiveDataRoot`).

---

## Pattern Assignments

### `auth/authContext.svelte.ts` (leaf context — CONVERT)

**Analog:** `contexts/layout/VideoController.svelte.ts` (arrow-field methods) + `popupStore.svelte.ts` (getter over derived).

Currently a factory closure returning a `setContext` object literal (lines 22-72).
Convert to a class `AuthContextProvider implements AuthContext`, instantiated in `initAuthContext()`.

**Target shape:**
- `isAuthenticated` — `$derived` FIELD (success criterion 1): `#isAuthenticated = $derived(!!page.data.session)` with a `get isAuthenticated()` returning it, OR a public `$derived` field if not spread (auth is NOT spread by appContext as an instance — verify; if unsure use private-`$derived` + getter, matching `popupStore.#current`).
- The four DataWriter wrappers (`logout`, `requestForgotPasswordEmail`, `resetPassword`, `setPassword`) — ARROW-FUNCTION FIELDS (§18; success criterion 1 says "detached by consumers"). Preserve the existing bodies verbatim (lines 34-58), including the `prepareDataWriter(dataWriterPromise)` await and the `authToken: ''` cookie-auth stubbing.
- NO `$effect` (§20) — `page.data.session` read is synchronous via `$derived`.

**Imports to keep** (lines 1-9): `error` from `@sveltejs/kit`; `getContext/hasContext/setContext` from `svelte`; `page` from `$app/state`; `dataWriter as dataWriterPromise`; `logDebugError`; `prepareDataWriter`; types.

**Factory pattern to keep** (lines 13-23, 64): the `CONTEXT_KEY` symbol, the `hasContext` guards in `getAuthContext`/`initAuthContext`, and `return setContext<AuthContext>(CONTEXT_KEY, new AuthContextProvider())`.

**Type file** (`authContext.type.ts`) stays byte-identical — class must `implements AuthContext`.

---

### `component/componentContext.svelte.ts` (leaf composing context — CONVERT)

**Analog:** `dataContext.svelte.ts` init-factory + composition of `DarkMode` helper.

Currently spreads `getI18nContext()` and adds a `get darkMode()` over `darkModeState.current` (lines 23-28). Success criterion 2: expose the i18n surface + `get darkMode()` reading the `DarkMode` helper class **with no `{ current }` handle re-export**.

**Target shape — class `ComponentContextProvider implements ComponentContext`:**
- Constructor instantiates the `DarkMode` helper directly: `#darkMode = new DarkMode()`.
- `get darkMode(): boolean { return this.#darkMode.current; }` — forwards reactively (delegation getter, CONVENTIONS §17 Group G).
- The i18n surface (`I18nContext`): since `ComponentContext = I18nContext & { darkMode }`, and i18n members are STABLE references (per CLAUDE.md), spread them in the constructor onto `this` OR keep the `{ ...getI18nContext(), get darkMode() }` object-literal init if conversion to a class makes the i18n spread awkward. Prefer: assign i18n members as own properties in the constructor (`Object.assign(this, getI18nContext())`) so a spread-safe shape is preserved AND the `get darkMode()` is a prototype accessor (componentContext is consumed via `getComponentContext()`, not spread by an orchestrator — verify before relying on prototype getter).

**Coupling with `darkMode.svelte.ts`:** the no-`{current}`-re-export criterion means `createDarkMode()` factory may be inlined or the class imported directly. Prefer importing the `DarkMode` class (export it) and dropping the `createDarkMode` factory + `{ readonly current: boolean }` return type — see darkMode reconciliation below.

---

### `component/darkMode.svelte.ts` (reactive helper — RECONCILE to final idiom)

**Analog:** `popupStore.svelte.ts` (private `$state` + getter, arrow event handler).

Already a class `DarkMode` (lines 17-35) — this is the cleanest proof. Reconciliation actions:
- The `change` listener (lines 26-28) is currently an inline arrow — already §18-compliant (captures `this`). Keep.
- Export the `DarkMode` class so `componentContext` can compose it directly (success criterion 2 — no `{ current }` handle). The `createDarkMode()` factory returning `{ readonly current: boolean }` (lines 43-45) is the spike-era residue to remove IF `componentContext` switches to `new DarkMode()`. Confirm no other consumer imports `createDarkMode` first.
- Keep the SSR `browser && window` guard in the constructor (lines 21-29) and NO `$effect` (§20) — verbatim.

**Imports** (line 1): `browser` from `$app/environment`. Keep.

---

### `data/dataContext.svelte.ts` (version-bridge — RECONCILE to §22)

**Analog:** self (already canonical Group-C); reconcile against CONVENTIONS §22.

Already class `DataContextProvider implements DataContext` (lines 47-98). This is the reference §22 version-bridge. Reconciliation actions:
- Private `#dataRoot` + `#version = $state(0)` + `untrack`-wrapped subscribe bump (lines 48-67) — keep verbatim, this IS the §22 idiom.
- `setDataRoot` arrow field internalizing `untrack` (lines 95-97) — keep.
- Own-property handles `dataRoot` / `reactiveDataRoot` assigned in constructor (lines 53-86) — keep as OWN properties because appContext spreads via `{ ...dataCtx }` (prototype getters would be dropped — documented at lines 31-37).
- **`reactiveDataRoot.instance` back-compat read** (lines 83-85): success criterion 3 requires this be documented as **intentional-until-flatten (Phase 113)**, NOT orphaned. The existing comment ("non-reactive read — same object") is present; tighten the doc-comment to explicitly cite "back-compat, removed at Phase 113 FLATTEN" so it isn't mistaken for dead code.
- Final-idiom consistency sweep: align doc-comment vocabulary with the §17/§18/§22 terminology used in PopupStore/VideoController headers.

---

### `filter/filterContext.svelte.ts` (version-bridge + `$effect` — RECONCILE to §22/§20)

**Analog:** self (canonical Group-C with constructor `$effect`); reconcile against CONVENTIONS §22 + §20.

Already class `FilterContextProvider implements FilterContext` (lines 44-131). Reconciliation actions:
- `#version = $state(0)` + `#filterGroup = $derived.by(...)` with `void this.#version` defensive edge (lines 45-77) — keep; this is §22 + the §20 "reactive projection in `$derived` field" rule.
- Constructor `$effect` attaching/detaching the `FilterGroup.onChange` handler (lines 86-94) — keep. This is the documented §20 exception: legal because `initFilterContext()` runs during component init (effect context). Ensure the doc-comment (lines 38-42) cites §20/§23 explicitly.
- Mutators (`setFilter`, `resetFilters`, `addFilter`, `removeFilter`) are arrow fields (lines 105-130) — §18-compliant. Keep. (`addFilter`/`removeFilter` are intentional Phase-62 no-op stubs — leave the `console.warn` + D-06 references.)
- Prototype getters `filterGroup` / `version` (lines 97-103) are safe (consumer reads `fctx.X`, not spread — documented line 42). Keep.
- Final-idiom consistency sweep: harmonize header doc-comment terminology with the other four files; no behavioral change.

---

## Shared Patterns

### Context init/get factory + symbol key (ALL five files)
**Source:** every file, e.g. `dataContext.svelte.ts:7-12,104-117`
**Apply to:** all — keep byte-identical; only the inner object→class changes.
```ts
const CONTEXT_KEY = Symbol();
export function getXContext(): XContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getXContext() called before initXContext()');
  return getContext<XContext>(CONTEXT_KEY);
}
export function initXContext(args): XContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initXContext() called for a second time');
  return setContext<XContext>(CONTEXT_KEY, new XContextProvider(args));
}
```

### Arrow-function fields for boundary-crossing methods (§18)
**Source:** `popupStore.svelte.ts:23-29`, `VideoController.svelte.ts:39-51`, `dataContext.svelte.ts:95-97`
**Apply to:** authContext (4 DataWriter wrappers), all filter/data mutators. Regular methods lose `this` on detach.

### `class X implements XContextApi` + byte-identical `.type.ts`
**Apply to:** all five — the public type contract is the invariant. Consumers and back-compat handles stay until Phase 113. Do NOT touch `.type.ts` files except to verify the class still satisfies them.

### Spread-safety decision (§17 vs own-property)
**Source:** `dataContext.svelte.ts:31-37,53-86` (own-property, because spread by appContext) vs `popupStore`/`filterContext` (prototype getter, not spread).
**Apply to:** before choosing prototype getter vs own-property field, check whether an orchestrator (`appContext`/`voterContext`/`candidateContext`) spreads the instance. auth + component: verify consumption path before picking getter shape.

### No `$effect` for init; constructor `$effect` only inside component init (§20)
**Apply to:** auth (`$derived` only — no effect), darkMode (constructor `browser`-guard, no effect), component (no effect). filter is the sanctioned exception (constructor `$effect` for `onChange` bridge).

---

## No Analog Found

None — all five files have in-tree analogs (three are already-class self-analogs; the two conversion targets map directly onto the Phase 106 PopupStore/VideoController idiom in the same directory tree).

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/**`, `apps/frontend/src/lib/utils/**`
**Key reference docs:** `.planning/spikes/CONVENTIONS.md` §17–22 + migration order; `.planning/spikes/CONTEXT-CLASS-PROOF.md`; `.planning/spikes/CONTEXT-MEMBER-AUDIT.md` (member classification — read during planning for per-member group labels).
**Files scanned:** 9 read in full (5 targets, 2 types, 2 barrels) + 2 canonical idiom references (PopupStore, VideoController).
**Pattern extraction date:** 2026-06-13
