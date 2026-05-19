# Phase 22: Leaf Component Migration - Research

**Researched:** 2026-03-18
**Domain:** Svelte 5 runes mode migration for leaf components
**Confidence:** HIGH

## Summary

Phase 22 migrates all shared, dynamic, candidate, and admin leaf components from Svelte 4 syntax to Svelte 5 runes mode. The project runs Svelte 5.53.12 and currently has zero components using runes mode -- all 97+ `.svelte` files in `src/lib/components`, `src/lib/dynamic-components`, `src/lib/candidate/components`, and `src/lib/admin/components` use `export let` with `type $$Props`, `$$restProps` via `concatClass`/`concatProps` utilities, and `on:click` event forwarding.

The migration is mechanically straightforward but high-volume: 336 `export let` declarations across 88 files, 85 files using `$$restProps`, 97 files using `$$Props`, 131 event handler occurrences across 48 files, and 52 `$:` reactive statements across 27 leaf component files. The critical design decisions are already locked: per-component `<svelte:options runes />` (not global), destructured `$props<Type>()` with rest spread, and batch E2E verification at phase end.

**Primary recommendation:** Migrate in dependency order (deepest-leaf components first), updating all call sites in both apps immediately per component. Use the locked `$props<ComponentProps>()` destructuring pattern with `...restProps` replacing `$$restProps` throughout. The `concatClass`/`concatProps` utilities work unchanged -- they just receive `restProps` instead of `$$restProps`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Update ALL call sites (voter + candidate + admin) immediately as each shared component is migrated
- Both apps must remain compilable throughout the migration -- no temporary breakage accepted
- Candidate-only components (7 in lib/candidate/components/) are included in Phase 22 migration scope
- Any other candidate components that are rational to migrate alongside leaf work should also be included
- Admin components (4 in lib/admin/components/) are included in Phase 22 migration scope
- Use per-component `<svelte:options runes />` in each migrated file -- NOT global `runes: true`
- Global `compilerOptions.runes = true` switch deferred to Phase 26 (Validation Gate)
- Keep using existing ComponentProps type declarations (rename from `type $$Props` to a non-deprecated name)
- Destructure with: `let { prop1, prop2, ...restProps } = $props<ComponentProps>()`
- Resolve TODO[Svelte 5] markers that align with the migration work being done
- Defer TODO[Svelte 5] markers that require deeper redesign beyond syntax migration to Phase 25
- Leaf dynamic-components (no named slots) are in scope for Phase 22
- Dynamic-components with named slots go to Phase 23
- E2E tests verified at phase end, not per-component or per-batch
- All 92 E2E tests must pass after the full leaf component migration is complete

### Claude's Discretion
- Migration ordering within the phase (which components first)
- Exact `concatClass`/`concatProps` utility adaptation for rest props
- How to handle edge cases in event modifier replacement
- Compression algorithm for batching related component migrations

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | All shared and voter-app leaf components use `$props()` instead of `export let` | Standard $props() destructuring pattern documented; 336 export let declarations across 88 files identified |
| COMP-02 | All `$$restProps`/`$$slots`/`$$Props` removed from migrated components | 85 files use $$restProps, 3 use $$slots, 97 use $$Props; replacement patterns documented |
| COMP-03 | Component-level event forwarding (`on:click` etc.) replaced with callback props | 2 components forward bare `on:click` (Button, NavItem); 48 files have on:event handlers; patterns documented |
| COMP-06 | `$bindable()` annotations added to all props that use `bind:` | 99 bind: occurrences across 43 files; exported function binding pattern requires bind:this migration |
| COMP-07 | `svelte:self` replaced with explicit self-import in EntityCard and EntityTag | 2 files; self-import pattern documented |
| COMP-08 | All `svelte:component` deprecation warnings resolved (7 occurrences, 3 files) | 4 occurrences found in AppLogo (1) and EntityFilters (3); direct component usage pattern documented |
| COMP-09 | Event modifiers replaced with inline JavaScript equivalents | All in Video.svelte: `|once` (7), `|capture` (3); replacement patterns documented |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Component framework | Already installed, runes mode available via per-component opt-in |
| @sveltejs/kit | (catalog) | Application framework | Already installed, no changes needed for component migration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| concatClass/concatProps | (internal) | Rest props merging | Every component that spreads rest props onto elements -- works unchanged with `restProps` instead of `$$restProps` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-component `<svelte:options runes />` | Global `compilerOptions.runes = true` | Global breaks unmigrated files -- locked decision to defer to Phase 26 |
| `npx sv migrate svelte-5` | Manual migration | Automated tool could batch-convert but may miss project-specific patterns like `concatClass($$restProps, ...)` |

**Note on `npx sv migrate svelte-5`:** The official Svelte migration tool can automate much of the mechanical work (`export let` to `$props`, `$:` to `$derived`/`$effect`, `on:` to event attributes). However, it may not correctly handle project-specific patterns like the `concatClass($$restProps, ...)` utility, the `type $$Props = ComponentProps` typing pattern, or the exported function binding pattern. Use it as a starting point but manually verify each component.

## Architecture Patterns

### Migration Transform Pattern (per component)

Each component follows the same mechanical transformation:

**Step 1: Add runes opt-in**
```svelte
<svelte:options runes />
```
If `<svelte:options accessors />` already exists (only Video.svelte), combine: `<svelte:options runes />` and handle accessors removal separately (see Pitfall 5).

**Step 2: Convert props declaration**
```svelte
<!-- BEFORE -->
<script lang="ts">
  type $$Props = ButtonProps;
  export let text: $$Props['text'];
  export let variant: $$Props['variant'] = 'normal';
  export let icon: $$Props['icon'] = null;
</script>

<!-- AFTER -->
<script lang="ts">
  let {
    text,
    variant = 'normal',
    icon = null,
    ...restProps
  }: ButtonProps = $props();
</script>
```

**Step 3: Replace `$$restProps` with `restProps`**
```svelte
<!-- BEFORE -->
<div {...concatClass($$restProps, 'flex items-center')}>

<!-- AFTER -->
<div {...concatClass(restProps, 'flex items-center')}>
```
The `concatClass` and `concatProps` utility functions work unchanged -- they accept any object, not specifically `$$restProps`.

**Step 4: Replace `$$slots` with snippet prop checks**
```svelte
<!-- BEFORE (Button.svelte) -->
{#if $$slots.badge && variant !== 'main'}

<!-- AFTER (Phase 22 interim: use children/snippet check) -->
<!-- Named slots are Phase 23; for Phase 22, keep the slot and just check differently -->
```
**Important**: Button has a named `badge` slot. Per CONTEXT.md, named slots are Phase 23. Button's leaf aspects (event forwarding, props) are Phase 22, but the `badge` slot conversion is Phase 23.

**Step 5: Convert `$:` reactive statements**
```svelte
<!-- BEFORE -->
$: effectiveText = loading ? loadingText || t('common.loading') : text;
$: {
  classes = 'btn relative flex...';
  // ...complex class building
}

<!-- AFTER -->
let effectiveText = $derived(loading ? loadingText || t('common.loading') : text);
let classes = $derived.by(() => {
  let c = 'btn relative flex...';
  // ...complex class building
  return c;
});
```

**Step 6: Convert event forwarding to callback props**
```svelte
<!-- BEFORE (Button.svelte) -->
<svelte:element this={href == null ? 'button' : 'a'} on:click ...>

<!-- AFTER -->
<script lang="ts">
  let { onclick, ...restProps }: ButtonProps = $props();
</script>
<svelte:element this={href == null ? 'button' : 'a'} {onclick} ...>
```

**Step 7: Update call sites**
```svelte
<!-- BEFORE -->
<Button on:click={handleNext} text="Continue" variant="main" />

<!-- AFTER -->
<Button onclick={handleNext} text="Continue" variant="main" />
```

### Exported Function Binding Migration (Critical Pattern)

Several leaf components export functions via `export function` that consumers bind to with `bind:closeAlert`, `bind:openModal`, etc. In runes mode, exports from components cannot be bound to directly. The pattern must change to `bind:this`.

**Components affected (in-scope leaf components):**
- `Alert.svelte`: exports `openAlert()`, `closeAlert()` -- 5 consumer call sites
- `ModalContainer.svelte`: exports `openModal()`, `closeModal()` -- 14+ consumer call sites

**Note**: ModalContainer has a default slot (container component), so its full migration may be Phase 23. However, the `export function` pattern affects leaf components that consume it (Alert, etc.). Plan accordingly.

**BEFORE (Svelte 4):**
```svelte
<!-- Alert.svelte -->
<script>
  export function openAlert() { /* ... */ }
  export function closeAlert() { /* ... */ }
</script>

<!-- Consumer -->
<Alert bind:closeAlert title="Can we help?" />
<button on:click={closeAlert}>Close</button>
```

**AFTER (Svelte 5 runes mode):**
```svelte
<!-- Alert.svelte (runes mode) -->
<script>
  // export function still works in runes mode
  export function openAlert() { /* ... */ }
  export function closeAlert() { /* ... */ }
</script>

<!-- Consumer (must change binding approach) -->
<script>
  let alertRef: ReturnType<typeof Alert>;
</script>
<Alert bind:this={alertRef} title="Can we help?" />
<button onclick={() => alertRef?.closeAlert()}>Close</button>
```

**IMPORTANT**: This is a significant call-site change that affects 19+ consumer files. If Alert is migrated to runes mode, ALL consumers using `bind:closeAlert` or `bind:closeModal` must simultaneously update to `bind:this`. This is a strong argument for migrating Alert (and ModalContainer) as a coordinated batch with all their consumers.

**Alternative**: Keep `export function` components as legacy (non-runes) in Phase 22 and migrate them in Phase 23. Since Alert and Modal have named slots, they are technically Phase 23 containers. The `bind:closeAlert`/`bind:openModal` pattern in their consumers does NOT need to change until those components themselves move to runes mode.

### `svelte:self` Replacement Pattern

```svelte
<!-- BEFORE (EntityTag.svelte) -->
{#if !hideParent && nomination?.parentNomination}
  <svelte:self entity={nomination?.parentNomination} variant="short" />
{/if}

<!-- AFTER -->
<script lang="ts">
  import EntityTag from './EntityTag.svelte';
</script>
{#if !hideParent && nomination?.parentNomination}
  <EntityTag entity={nomination?.parentNomination} variant="short" />
{/if}
```

```svelte
<!-- BEFORE (EntityCard.svelte) -->
<svelte:self variant="subcard" {...concatClass(ecProps, 'offset-border')} />

<!-- AFTER -->
<script lang="ts">
  import EntityCard from './EntityCard.svelte';
</script>
<EntityCard variant="subcard" {...concatClass(ecProps, 'offset-border')} />
```

### `svelte:component` Replacement Pattern

```svelte
<!-- BEFORE (EntityFilters.svelte) -->
<svelte:component this={TextEntityFilter} {filter} />
<svelte:component this={NumericEntityFilter} {filter} {targets} />
<svelte:component this={EnumeratedEntityFilter} {filter} {targets} />

<!-- AFTER - components are already imported, just use directly -->
<TextEntityFilter {filter} />
<NumericEntityFilter {filter} {targets} />
<EnumeratedEntityFilter {filter} {targets} />
```

```svelte
<!-- BEFORE (AppLogo.svelte) - dynamic component -->
<svelte:component this={LogoComponent} {...logoProps} />

<!-- AFTER - in Svelte 5, components are first-class values -->
<LogoComponent {...logoProps} />
```

### Event Modifier Replacement Pattern (Video.svelte)

All event modifiers are in Video.svelte:

```svelte
<!-- BEFORE -->
on:click|once={tryUnmute}
on:click|capture={() => screenJump(-1)}

<!-- AFTER: |once replacement -->
<script>
  function once<T extends (...args: any[]) => any>(fn: T): T {
    let called = false;
    return ((...args: any[]) => {
      if (called) return;
      called = true;
      return fn(...args);
    }) as T;
  }
</script>
<!-- Usage -->
onclick={once(tryUnmute)}

<!-- AFTER: |capture replacement -->
onclickcapture={() => screenJump(-1)}
```

**Combined modifiers** (Video has `on:click|once` on multiple buttons for the same `tryUnmute` function):
Since `tryUnmute` is called from multiple buttons each with `|once`, each button needs its own `once` wrapper instance. Create them in the script block or use a factory pattern. Alternatively, since `tryUnmute` already handles the "try once" semantic internally (it attempts to unmute), evaluate whether `|once` is truly needed or if the function is already idempotent.

### `svelte:document` and `svelte:window` Event Handlers

```svelte
<!-- BEFORE -->
<svelte:document on:keydown={handleEscape} />
<svelte:window on:resize={() => calculatePosition()} />

<!-- AFTER -->
<svelte:document onkeydown={handleEscape} />
<svelte:window onresize={() => calculatePosition()} />
```

### `$bindable()` Pattern for Bound Props

```svelte
<!-- BEFORE -->
<script>
  export let isOpen = false;          // parent does: bind:isOpen
  export let value;                    // parent does: bind:value
</script>

<!-- AFTER -->
<script>
  let { isOpen = $bindable(false), value = $bindable() } = $props();
</script>
```

Key files needing `$bindable()`:
- `Select.svelte`: `bind:selected` (5 consumer call sites)
- `Toggle.svelte`: `bind:checked` (3 consumer call sites)
- `Input.svelte`: `bind:value` (4 consumer call sites)
- `Video.svelte`: `bind:atEnd`, `bind:mode` (used by layout context)
- `ConstituencySelector.svelte`: `bind:selectionComplete` (used by route)
- `AccordionSelect.svelte`: `bind:value` (1 consumer)
- `LanguageSelector.svelte`: `bind:selected` (admin component)

### `<svelte:options accessors />` Migration (Video.svelte)

Video.svelte is the only component using `<svelte:options accessors />`. In runes mode, the `accessors` option is ignored -- all exports are automatically accessible via `bind:this`. The comment says "To enable accessing properties via the component reference in `LayoutContext`".

```svelte
<!-- BEFORE -->
<svelte:options accessors />

<!-- AFTER -->
<svelte:options runes />
<!-- accessors is removed -- exports are accessible via bind:this automatically -->
```

Verify that the LayoutContext accesses Video properties via `bind:this` (which it should, since that's how accessors work).

### Anti-Patterns to Avoid

- **Mutating props directly**: In runes mode, props are read-only unless marked `$bindable()`. Never assign to a destructured prop without `$bindable()`.
- **Using `$effect` for derived values**: If a value depends only on other reactive values and performs no side effects, use `$derived` or `$derived.by()`, not `$effect`.
- **Forgetting `<svelte:options runes />`**: Without this tag, the component stays in legacy mode and `$props()` will not work.
- **Converting `$:` blocks that assign to `export let` props**: Some `$:` blocks update bound props (e.g., `$: atEnd = isAtEnd(currentTime)` in Video). These need `$bindable()` on the prop AND the reactive statement becomes `$effect(() => { atEnd = isAtEnd(currentTime); })` since it has a side effect (updating a bindable prop).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rest props merging | Custom spread logic | Existing `concatClass(restProps, classes)` | Already handles edge cases, works with spread syntax unchanged |
| Event modifier `once` | Inline boolean flag per handler | Reusable `once()` wrapper function | Multiple buttons share the same pattern in Video.svelte |
| Type inference for props | Manual interface per component | Existing `.type.ts` files with `$props<Type>()` | Types already exist, just change consumption syntax |
| Automated migration | Manual search-and-replace | `npx sv migrate svelte-5` as starting point | Catches patterns humans miss, but verify project-specific idioms |

**Key insight:** The `concatClass` and `concatProps` utilities require zero changes. They accept a generic object parameter, not specifically `$$restProps`. The migration is purely at the call site: `concatClass($$restProps, ...)` becomes `concatClass(restProps, ...)`.

## Common Pitfalls

### Pitfall 1: Breaking Both Apps Simultaneously
**What goes wrong:** Migrating a shared component without updating all call sites in voter, candidate, and admin apps causes one app to fail compilation.
**Why it happens:** Shared components are imported by 25+ candidate route files, 4 admin component files, and dozens of voter routes.
**How to avoid:** For each component migration, grep ALL consumers across `src/routes/`, `src/lib/dynamic-components/`, `src/lib/candidate/`, `src/lib/admin/` and update every `on:click` -> `onclick` call site before committing.
**Warning signs:** TypeScript errors in files you did not edit.

### Pitfall 2: `$:` to `$derived` with Side Effects
**What goes wrong:** Converting `$: foo = bar + 1` to `let foo = $derived(bar + 1)` works. But converting `$: { doSomething(); foo = bar; }` to `$derived` breaks because it has side effects.
**Why it happens:** `$derived` must be a pure computation. `$:` blocks that perform side effects AND assign values need to be split: the assignment becomes `$derived` and the side effect becomes `$effect`.
**How to avoid:** Classify each `$:` statement:
  - Pure derivation (`$: x = f(y)`) -> `let x = $derived(f(y))` or `$derived.by()`
  - Side effect only (`$: console.log(x)`) -> `$effect(() => console.log(x))`
  - Mixed -> Split into `$derived` + `$effect`
**Warning signs:** `$derived` callback contains assignments, function calls with side effects, or DOM manipulation.

### Pitfall 3: Forgetting `$bindable()` on Props Used with `bind:`
**What goes wrong:** Parent does `<Select bind:selected={val} />` but Select's `selected` prop is not marked `$bindable()`. Runtime error.
**Why it happens:** In Svelte 4, all `export let` props were implicitly bindable. In Svelte 5 runes mode, only `$bindable()` props can be bound.
**How to avoid:** Before migrating any component, search for `bind:propName` in ALL consumer files. Mark each bound prop with `$bindable()`.
**Warning signs:** Grep for `bind:` usage of the component across the codebase. 99 `bind:` occurrences across 43 files in the component library.

### Pitfall 4: Exported Function Binding Changes
**What goes wrong:** A component in runes mode exports functions (`export function closeAlert()`), but consumers do `bind:closeAlert`. In runes mode, `bind:` only works with `$bindable()` props, not exports.
**Why it happens:** Svelte 5 enforces separation between props (bindable) and exports (accessible via `bind:this`).
**How to avoid:** Components with `export function` that are bound by consumers (Alert, ModalContainer) must have ALL their consumers updated to use `bind:this` pattern when the component moves to runes mode. Since these components also have named slots (Phase 23), defer their full runes migration to Phase 23.
**Warning signs:** `export function` in component AND `bind:functionName` in any consumer file.

### Pitfall 5: Video.svelte `accessors` Option
**What goes wrong:** Video.svelte uses `<svelte:options accessors />` to expose props via component reference for LayoutContext. In runes mode, `accessors` is ignored (all exports are available via `bind:this` automatically).
**Why it happens:** Runes mode changes how component instances work.
**How to avoid:** Verify that LayoutContext accesses Video via `bind:this` and only reads exports, not arbitrary props. If it reads props, those must become exports or be handled differently.
**Warning signs:** LayoutContext code that accesses `videoRef.someProp` where `someProp` is a prop, not an export.

### Pitfall 6: Named Slots in "Leaf" Components
**What goes wrong:** Some components classified as "leaf" actually have named slots: Button (`badge`), Alert (`actions`), Modal (`actions`). Migrating these to runes mode triggers the need to convert named slots to snippet props.
**Why it happens:** Phase boundary confusion between leaf (Phase 22) and container (Phase 23).
**How to avoid:** For Phase 22, components with named slots should have their leaf aspects migrated (props, events, `$:` statements) but named slots left as-is. Named slot conversion is Phase 23. Since `<svelte:options runes />` does NOT break existing `<slot>` usage (slots still work in runes mode, they are just deprecated), the component can use runes mode while keeping legacy slot syntax temporarily.
**Warning signs:** `<slot name="...">` in a component being migrated.

### Pitfall 7: Reactive Statements that Mutate Props
**What goes wrong:** `$: atEnd = isAtEnd(currentTime)` in Video.svelte assigns to `atEnd` which is an `export let` prop used with `bind:atEnd`. In runes mode, this is not a simple `$derived` -- it's a side-effecting update of a bindable prop.
**Why it happens:** The `$:` syntax conflated derivation and assignment. Runes separate them.
**How to avoid:** For props that are both set internally AND bound externally:
```svelte
let { atEnd = $bindable() } = $props();
$effect(() => { atEnd = isAtEnd(currentTime); });
```
**Warning signs:** `$:` followed by assignment to a prop that has `bind:` usage in consumers.

## Code Examples

### Complete Component Migration: EntityTag

Source: Codebase analysis + [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide)

**BEFORE:**
```svelte
<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { concatClass } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import type { AnyEntityVariant, EntityType } from '@openvaa/data';
  import type { IconName } from '$lib/components/icon';
  import type { EntityTagProps } from './EntityTag.type';

  type $$Props = EntityTagProps;

  export let entity: $$Props['entity'];
  export let variant: $$Props['variant'] = 'default';
  export let hideParent: $$Props['hideParent'] = undefined;

  let nakedEntity: AnyEntityVariant;
  $: ({ entity: nakedEntity, nomination } = unwrapEntity(entity));

  const ICONS: Record<EntityType, IconName> = { /* ... */ };
</script>

<div {...concatClass($$restProps, 'flex flex-row items-center gap-xs font-bold')}>
  <Icon name={ICONS[nakedEntity.type]} /* ... */ />
  <!-- ... -->
  {#if !hideParent && nomination?.parentNomination}
    <svelte:self entity={nomination?.parentNomination} variant="short" />
  {/if}
</div>
```

**AFTER:**
```svelte
<svelte:options runes />

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { concatClass } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import EntityTag from './EntityTag.svelte';
  import type { AnyEntityVariant, EntityType } from '@openvaa/data';
  import type { IconName } from '$lib/components/icon';
  import type { EntityTagProps } from './EntityTag.type';

  let { entity, variant = 'default', hideParent, ...restProps }: EntityTagProps = $props();

  const unwrapped = $derived(unwrapEntity(entity));
  let nakedEntity = $derived(unwrapped.entity);
  let nomination = $derived(unwrapped.nomination);

  const ICONS: Record<EntityType, IconName> = { /* ... */ };
</script>

<div {...concatClass(restProps, 'flex flex-row items-center gap-xs font-bold')}>
  <Icon name={ICONS[nakedEntity.type]} /* ... */ />
  <!-- ... -->
  {#if !hideParent && nomination?.parentNomination}
    <EntityTag entity={nomination?.parentNomination} variant="short" />
  {/if}
</div>
```

### Button.svelte Event Forwarding Migration (Leaf Aspects Only)

```svelte
<svelte:options runes />

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { Loading } from '../loading';
  import type { ButtonProps } from './Button.type';

  // Note: onclick comes via restProps since ButtonProps extends HTML element props
  let {
    text,
    variant = 'normal',
    icon = null,
    iconPos = 'right',
    color = 'primary',
    href = undefined,
    disabled = undefined,
    loading = undefined,
    loadingText = undefined,
    ...restProps
  }: ButtonProps = $props();

  const { t } = getComponentContext();

  let effectiveText = $derived(loading ? loadingText || t('common.loading') : text);

  // Complex class building with $derived.by
  let classes = $derived.by(() => {
    let c = 'btn relative flex flex-nowrap min-h-touch min-w-touch h-auto items-center gap-y-6 gap-x-6';
    // ... variant switch, iconPos switch, color ...
    return c;
  });

  let labelClass = $derived.by(() => {
    let lc = 'vaa-button-label first-letter:uppercase';
    // ... variant switch ...
    return lc;
  });
</script>

<!-- Note: on:click removed -- onclick flows through restProps automatically -->
<svelte:element
  this={href == null ? 'button' : 'a'}
  role="button"
  tabindex={disabled ? -1 : 0}
  href={disabled ? undefined : href}
  aria-label={variant === 'icon' ? effectiveText : undefined}
  title={variant === 'icon' || variant === 'responsive-icon' ? effectiveText : undefined}
  disabled={disabled || loading || undefined}
  {...concatClass(restProps, classes)}>
  <!-- badge slot stays as-is for Phase 22 (Phase 23 converts to snippet) -->
  <!-- ... -->
</svelte:element>
```

**Call site update:**
```svelte
<!-- BEFORE -->
<Button on:click={handleNext} text="Continue" variant="main" />

<!-- AFTER -->
<Button onclick={handleNext} text="Continue" variant="main" />
```

### `once()` Utility for Event Modifier Replacement

```typescript
// Can be added to $lib/utils/events.ts or inline in Video.svelte
function once<T extends (...args: any[]) => any>(fn: T) {
  let called = false;
  return function (this: any, ...args: Parameters<T>) {
    if (called) return;
    called = true;
    return fn.apply(this, args);
  } as T;
}
```

### Type File Updates

The `.type.ts` files need minimal changes. The `type $$Props` was only used in the component files themselves, not in the type definition files. However, ButtonProps currently extends `SvelteHTMLElements['button']` which includes all HTML attributes including event handlers. The `onclick` handler is already part of the HTML element type, so it flows through `...restProps` naturally.

For components like NavItem that explicitly forward `on:click`, update their type to include `onclick`:
```typescript
// NavItem.type.ts -- onclick is already in SvelteHTMLElements, so no change needed
export type NavItemProps = SvelteHTMLElements['button'] & SvelteHTMLElements['a'] & {
  // ... specific props
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `export let prop` | `let { prop } = $props()` | Svelte 5.0 (Oct 2024) | Every component file |
| `type $$Props` | Generic parameter `$props<Type>()` | Svelte 5.0 | Type declarations |
| `$$restProps` | `...rest` in destructuring | Svelte 5.0 | All files using rest props |
| `$$slots.name` | Check snippet prop existence | Svelte 5.0 | 3 files (Button, Alert, Modal) |
| `on:click` (forwarding) | `onclick` via props/spread | Svelte 5.0 | 48 files + all call sites |
| `on:click={handler}` (handling) | `onclick={handler}` | Svelte 5.0 | All event handlers |
| `createEventDispatcher` | Callback props | Svelte 5.0 | 6 components (Phase 23 scope for most) |
| `$: x = f(y)` | `let x = $derived(f(y))` | Svelte 5.0 | 52 reactive statements |
| `svelte:self` | Self-import | Svelte 5.0 | 2 components |
| `svelte:component this={X}` | `<X />` directly | Svelte 5.0 | 3 files, 4 occurrences |
| `\|once` modifier | `once()` wrapper function | Svelte 5.0 | 7 occurrences in Video |
| `\|capture` modifier | `onclickcapture` attribute | Svelte 5.0 | 3 occurrences in Video |
| `accessors` option | Automatic in runes mode | Svelte 5.0 | 1 component (Video) |

**Deprecated/outdated:**
- `$$restProps`, `$$slots`, `$$Props`: Still functional but deprecated; will be removed in future Svelte version
- `on:` directive: Still works, deprecated in favor of property-based events
- `<svelte:self>`: Deprecated, replaced by self-import
- `<svelte:component>`: Deprecated in runes mode, components are first-class values
- `createEventDispatcher`: Deprecated, replaced by callback props
- `accessors` option: Ignored in runes mode

## Open Questions

1. **Button's `badge` slot in Phase 22 vs Phase 23**
   - What we know: Button has a named `badge` slot. CONTEXT.md says "Button leaf aspects migrated now, named slot is Phase 23."
   - What's unclear: Can Button be fully converted to runes mode (with `<svelte:options runes />`) while keeping the legacy `<slot name="badge">` syntax? Answer: Yes, slots still work in runes mode, they just produce deprecation warnings. The slot-to-snippet conversion is Phase 23.
   - Recommendation: Add `<svelte:options runes />` in Phase 22, convert props/events/reactivity. Accept the slot deprecation warning until Phase 23.

2. **Alert/ModalContainer export function binding pattern**
   - What we know: Alert exports `openAlert()`/`closeAlert()`, ModalContainer exports `openModal()`/`closeModal()`. Consumers use `bind:closeAlert` etc. In runes mode, this must become `bind:this`.
   - What's unclear: Whether to defer these components entirely to Phase 23 (they have named slots too) or migrate leaf aspects now.
   - Recommendation: Defer Alert and ModalContainer to Phase 23 since they are containers (named slots). Their consumers' `bind:functionName` pattern does not need to change until the component itself enters runes mode. This avoids a massive 19+ file call-site refactor in Phase 22.

3. **Video.svelte complexity**
   - What we know: Most complex leaf component -- 17 `export let` props, 17+ `$:` statements, `<svelte:options accessors />`, multiple `bind:` props, event modifiers, media bindings. Two TODO[Svelte 5] markers.
   - What's unclear: Whether all Video.svelte reactive patterns can be cleanly expressed with runes without behavioral changes.
   - Recommendation: Migrate Video.svelte last within its batch, after all simpler components establish the pattern. Test video functionality manually after migration.

4. **`svelte-visibility-change` Svelte 5 compatibility**
   - What we know: Installed version is 0.6.0. Latest is 0.7.0 (released 2025-03-22). Used only in `+layout.svelte` (a route file, Phase 24 scope). No explicit Svelte 5 compatibility statement.
   - What's unclear: Whether 0.6.0 or 0.7.0 works correctly with Svelte 5 runes mode.
   - Recommendation: Not blocking for Phase 22 since it is only used in a route file. Verify in Phase 24.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + Playwright (E2E) |
| Config file | `apps/frontend/vitest.config.ts` (unit), `tests/playwright.config.ts` (E2E) |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:e2e` (requires Docker stack running) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | All leaf components use $props() | manual + E2E | `yarn workspace @openvaa/frontend check` (typecheck) | N/A -- typecheck covers |
| COMP-02 | No $$restProps/$$slots/$$Props | manual grep | `grep -r '$$restProps\|$$slots\|$$Props' src/lib/components/ src/lib/dynamic-components/` | N/A -- grep verification |
| COMP-03 | Event forwarding uses callback props | E2E | `yarn test:e2e` | Covered by existing E2E tests |
| COMP-06 | $bindable() on bound props | typecheck + E2E | `yarn workspace @openvaa/frontend check` | N/A -- typecheck catches |
| COMP-07 | svelte:self replaced | manual grep | `grep -r 'svelte:self' src/lib/` | N/A -- grep verification |
| COMP-08 | svelte:component resolved | manual grep | `grep -r 'svelte:component' src/lib/` | N/A -- grep verification |
| COMP-09 | Event modifiers replaced | manual grep | `grep -rE '\|once\|\|preventDefault\|\|capture' src/lib/` | N/A -- grep verification |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend check` (typecheck, ~30s)
- **Per wave merge:** `yarn build` (full build verification)
- **Phase gate:** All 92 E2E tests pass: `yarn test:e2e`

### Wave 0 Gaps
None -- existing test infrastructure (typecheck + E2E) covers all phase requirements. No new test files needed since component migration is verified by:
1. TypeScript compilation (catches type errors from incorrect $props, missing $bindable, etc.)
2. E2E tests (catches runtime behavioral regressions)
3. Grep-based verification (catches remaining legacy patterns)

## Component Inventory & Classification

### Shared Components (src/lib/components/) -- 41 directories

**Pure leaf (no slots, no named slots):**
Avatar, CategoryTag, ElectionSymbol, ElectionTag, EntityTag (svelte:self), ErrorMessage, Hero, HeroEmoji, Icon, Image, InfoAnswer, InfoBadge, Loading, MatchScore, Notification, OpenVAALogo, PreventNavigation, ScoreGauge, SuccessMessage, Toggle, Video (accessors + modifiers), Warning

**Leaf with default slot only:**
Expander (createEventDispatcher -- Phase 23 scope for dispatch), HeadingGroup, PreHeading, InputGroup, Term

**Leaf with complex internals:**
AccordionSelect, Button (named badge slot -- Phase 23 for slot), ButtonWithConfirmation, ConstituencySelector (+ SingleGroup), ElectionSelector, Input, Select, Tabs, EntityFilters (+ sub-filters)

**Container (named slots -- Phase 23):**
Alert (actions slot + export function), Modal (actions slot), ModalContainer (default slot + export function), TimedModal (actions slot), ConfirmationModal, Drawer

**Question sub-components:**
QuestionActions, QuestionArguments, QuestionBasicInfo, QuestionChoices, QuestionExtendedInfo, QuestionExtendedInfoButton, QuestionExtendedInfoDrawer, QuestionOpenAnswer, OpinionQuestionInput

**Controller sub-components:**
InfoMessages, ProgressBar, WarningMessages

### Dynamic Components (src/lib/dynamic-components/) -- 12 directories

**Leaf (no named slots, in scope):**
AppLogo (svelte:component), DataConsent (createEventDispatcher -- part of Phase 23 for dispatch), DataConsentInfoButton, DataConsentPopup, EntityCardAction, EntityChildren, EntityDetails, EntityDetailsDrawer, EntityInfo, EntityOpinions, InfoItem, EntityListControls, Feedback (createEventDispatcher -- Phase 23), FeedbackModal, FeedbackPopup, Footer, LogoutButton, QuestionHeading, SurveyBanner, SurveyButton (createEventDispatcher -- Phase 23), SurveyPopup

**Leaf with svelte:self (in scope):**
EntityCard (svelte:self + default slot)

**Container with default slot (leaf aspects in Phase 22):**
Navigation, NavGroup, NavItem (event forwarding + default slot)

### Candidate Components (src/lib/candidate/components/) -- 6 directories
LogoutButton, PasswordField, PasswordSetter, PasswordValidator, PreregisteredNotification, TermsOfUseForm

### Admin Components (src/lib/admin/components/) -- 2 directories
FeatureJobs, JobDetails, LanguageSelector, WithPolling (default slot)

## Sources

### Primary (HIGH confidence)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide) - $props, $bindable, event forwarding, svelte:self, svelte:component, event modifiers
- [$props documentation](https://svelte.dev/docs/svelte/$props) - Destructuring syntax, typing, rest props
- [$bindable documentation](https://svelte.dev/docs/svelte/$bindable) - Bindable prop syntax
- [bind: documentation](https://svelte.dev/docs/svelte/bind) - Component bindings in runes mode, bind:this
- [svelte:self legacy docs](https://svelte.dev/docs/svelte/legacy-svelte-self) - Deprecation, self-import replacement
- [Spreading events tutorial](https://svelte.dev/tutorial/svelte/spreading-events) - Event handler spreading in Svelte 5
- Codebase analysis (all file counts, patterns, and call sites verified by grep)

### Secondary (MEDIUM confidence)
- [svelte:component deprecation issue #12668](https://github.com/sveltejs/svelte/issues/12668) - Confirms deprecation approach
- [svelte:self deprecation issue #13219](https://github.com/sveltejs/svelte/issues/13219) - Confirms replacement pattern
- [Svelte 5 exports in runes mode #11974](https://github.com/sveltejs/svelte/issues/11974) - Confirms export function behavior in runes

### Tertiary (LOW confidence)
- svelte-visibility-change compatibility - Not explicitly confirmed for Svelte 5; however, not blocking since only used in route files (Phase 24 scope)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Svelte 5.53.12 already installed, all patterns verified against official docs
- Architecture: HIGH - Migration patterns are well-documented, codebase patterns thoroughly audited
- Pitfalls: HIGH - All pitfalls verified against actual codebase patterns (exported function binding, named slots, `$:` statement classification)

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (Svelte 5 patterns are stable post-release)
