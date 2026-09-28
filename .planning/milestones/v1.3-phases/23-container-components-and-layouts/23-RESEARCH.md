# Phase 23: Container Components and Layouts - Research

**Researched:** 2026-03-19
**Domain:** Svelte 5 migration -- slots to snippets, createEventDispatcher to callbacks, layout component modernization
**Confidence:** HIGH

## Summary

Phase 23 migrates container components (those with `<slot>` elements), dispatching components (those using `createEventDispatcher`), and layout components to Svelte 5 idioms. This is the natural continuation of Phase 22's leaf component migration, now tackling components that pass content through and those that emit events upward.

The migration scope is well-defined: 14 components with `<slot>` elements in `lib/components/`, 6 in `lib/dynamic-components/`, 3 layout components in `routes/`, plus approximately 50+ consumer call sites that use `slot="..."` syntax or `on:event` directives for dispatched events. The largest surface area is MainContent.svelte with ~47 consumer route files using various named slots (`note`, `hero`, `heading`, `fullWidth`, `primaryActions`).

All patterns are well-established from Svelte 5 documentation and Phase 22 precedent. The primary risk is not technical complexity but the sheer number of consumer sites that must be updated atomically -- a single missed `slot="actions"` on a component that has already been migrated to `{@render}` will cause a compilation error.

**Primary recommendation:** Batch by component dependency chains -- migrate a component and ALL its consumers together. Start with leaf dispatchers (Expander, SurveyButton, Navigation) that have few consumers, then tackle container components (Alert, Modal chain), and finally the high-fan-out layout components (Layout, MainContent, SingleCardContent).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Named slots map directly to snippet prop names: `slot="actions"` becomes `actions` snippet prop
- Default slot becomes `children` (official Svelte 5 convention)
- No suffix -- just the slot name (not `actionsSnippet`)
- `$$slots.note` checks become simple truthiness: `{#if note}{@render note()}{/if}`
- TimedModal slot forwarding: accept `actions` snippet prop and pass it directly to child Modal
- All callback props use camelCase `on` prefix: `onExpand`, `onCollapse`, `onKeyboardFocusOut`, `onCancel`, `onSent`, `onError`, `onClick`
- Alert: `dispatchEvent('open'/'close')` becomes `onOpen`/`onClose` callback props
- Expander: `dispatch('expand'/'collapse')` becomes `onExpand`/`onCollapse` callback props
- Navigation: `dispatch('keyboardFocusOut')` becomes `onKeyboardFocusOut` callback prop
- SurveyButton: `dispatch('click')` becomes `onClick` callback prop
- Feedback: `dispatch('cancel'/'error'/'sent')` becomes `onCancel`/`onError`/`onSent` callback props
- DataConsent: verify `onchange` alignment to camelCase if needed
- Layout.svelte: full runes, `$bindable()` for `isDrawerOpen`, `menu` slot becomes `menu` snippet prop
- MainContent.svelte: all 6 named slots become snippet props, full runes conversion
- All 6 legacy container components get full runes conversion alongside snippet/dispatcher work
- ModalContainer: `on:transitionend` becomes `ontransitionend`, `svelte:document on:keydown` becomes `<svelte:document onkeydown={handler} />`
- TimedModal: `$:` reactive becomes `$effect`, slot forwarding becomes snippet pass-through
- Both apps must remain compilable throughout (atomic consumer updates)
- E2E tests verified at phase end, not per-component

### Claude's Discretion
- Migration ordering and plan batching strategy
- Minimal safe change set per route layout file (snippet-only vs full modernization)
- How to handle `svelte:document` event binding
- Edge cases in snippet conversion for complex components

### Deferred Ideas (OUT OF SCOPE)
- Layout.svelte / MainContent.svelte / SingleCardContent.svelte conversion to proper `+layout` files
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-04 | `createEventDispatcher` replaced with callback props in all 6 dispatching components (Alert, Expander, Navigation, SurveyButton, Feedback, DataConsent) | Callback prop patterns verified from Svelte 5 docs and Phase 22 precedent. Each component's dispatch usage and consumer call sites fully mapped below. |
| COMP-05 | Named `<slot>` elements replaced with `{@render}` snippet props in all container components | Snippet prop patterns verified from Svelte 5 docs. All 20 components with `<slot>` elements inventoried, all named slot consumers mapped. |
| LAYOUT-01 | Root Layout.svelte migrated to runes with `$bindable()` props and snippet-based content | Layout.svelte structure analyzed: `menu` named slot, default slot, `isDrawerOpen` bind, `on:click` event. 3 consumers mapped (voter, candidate, admin +layout.svelte). |
| LAYOUT-02 | MainContent.svelte 6 named slots converted to snippet props with all consumer call sites updated | All 47+ MainContent consumers inventoried. 6 named slots (note, hero, heading, fullWidth, primaryActions) plus default mapped with usage patterns. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase uses only Svelte 5 built-in features.

### Core
| Feature | Source | Purpose | Why Standard |
|---------|--------|---------|--------------|
| `{#snippet}` / `{@render}` | Svelte 5.53.12 | Replace `<slot>` elements | Official Svelte 5 replacement for slots |
| `$props()` with `Snippet` type | Svelte 5.53.12 | Type snippet props | Official typing mechanism |
| Callback props | Svelte 5.53.12 | Replace `createEventDispatcher` | Official Svelte 5 pattern |
| `$bindable()` | Svelte 5.53.12 | Two-way binding props | Official runes-mode binding |
| `$effect` | Svelte 5.53.12 | Replace `$:` reactive | Official reactive replacement |
| `$state` | Svelte 5.53.12 | Reactive state | Already established in Phase 22 |

### Type Imports
```typescript
import type { Snippet } from 'svelte';
```

## Architecture Patterns

### Pattern 1: Named Slot to Snippet Prop (Container Components)

**What:** Replace `<slot name="X">` with `{@render X?.()}` and update type to include snippet prop.

**Component side (before):**
```svelte
<!-- Alert.svelte (Svelte 4) -->
{#if $$slots.actions}
  <slot name="actions" />
{:else}
  <Button ... />
{/if}
<slot />
```

**Component side (after):**
```svelte
<!-- Alert.svelte (Svelte 5) -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children, actions, ...restProps }: AlertProps = $props();
</script>

{#if actions}
  {@render actions()}
{:else}
  <Button ... />
{/if}
{@render children?.()}
```

**Consumer side (before):**
```svelte
<Alert title="...">
  <div slot="actions">
    <Button ... />
  </div>
  Some default content
</Alert>
```

**Consumer side (after):**
```svelte
<Alert title="...">
  {#snippet actions()}
    <div>
      <Button ... />
    </div>
  {/snippet}
  Some default content
</Alert>
```

**Key detail:** Default content placed directly between component tags (without `{#snippet}` wrapper) becomes the implicit `children` prop. Named snippet content must use `{#snippet name()}...{/snippet}`.

### Pattern 2: svelte:fragment to Snippet

**Before:**
```svelte
<svelte:fragment slot="primaryActions">
  <Button ... />
</svelte:fragment>
```

**After:**
```svelte
{#snippet primaryActions()}
  <Button ... />
{/snippet}
```

### Pattern 3: Element with slot Attribute to Snippet

**Before:**
```svelte
<figure role="presentation" slot="hero">
  <Icon ... />
</figure>
```

**After:**
```svelte
{#snippet hero()}
  <figure role="presentation">
    <Icon ... />
  </figure>
{/snippet}
```

**Important:** The `slot="..."` attribute is removed and the element moves inside the snippet block. The element itself is no longer a direct child of the component.

### Pattern 4: Inline Element with slot to Snippet (Single Element)

**Before:**
```svelte
<HeadingGroup slot="heading">
  <h1>Title</h1>
</HeadingGroup>
```

**After:**
```svelte
{#snippet heading()}
  <HeadingGroup>
    <h1>Title</h1>
  </HeadingGroup>
{/snippet}
```

### Pattern 5: Component with slot Attribute to Snippet

**Before:**
```svelte
<Button slot="actions" variant="main" text="Close" onclick={closeAlert} />
```

**After:**
```svelte
{#snippet actions()}
  <Button variant="main" text="Close" onclick={closeAlert} />
{/snippet}
```

### Pattern 6: Slot Forwarding (Pass-Through)

**Before (TimedModal):**
```svelte
<Modal {...$$restProps}>
  <slot name="actions" slot="actions" />
  <slot />
</Modal>
```

**After (TimedModal):**
```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children, actions, ...restProps }: TimedModalProps = $props();
</script>

<Modal {actions} {...restProps}>
  {@render children?.()}
</Modal>
```

The snippet prop `actions` is accepted by TimedModal and passed directly to Modal as a prop. No intermediate `{#snippet}` wrapping needed.

### Pattern 7: createEventDispatcher to Callback Props

**Before (Expander):**
```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ expand: null; collapse: null }>();
  function toggleExpanded() {
    expanded = !expanded;
    dispatch(expanded ? 'expand' : 'collapse');
  }
</script>
```

**After (Expander):**
```svelte
<script>
  let { onExpand, onCollapse, ...restProps }: ExpanderProps = $props();
  function toggleExpanded() {
    expanded = !expanded;
    if (expanded) onExpand?.(); else onCollapse?.();
  }
</script>
```

**Consumer before:**
```svelte
<Expander on:expand={() => track('expand')} on:collapse={() => track('collapse')}>
```

**Consumer after:**
```svelte
<Expander onExpand={() => track('expand')} onCollapse={() => track('collapse')}>
```

### Pattern 8: Event Forwarding to Callback Forwarding

**Before (VoterNav forwarding Navigation's dispatch):**
```svelte
<Navigation on:keyboardFocusOut {...restProps}>
```

**After:**
```svelte
<Navigation onKeyboardFocusOut={() => { /* handle or forward */ }} {...restProps}>
```

Or if VoterNav needs to expose this as its own callback prop:
```svelte
<script>
  let { onKeyboardFocusOut, ...restProps }: VoterNavProps = $props();
</script>
<Navigation {onKeyboardFocusOut} {...restProps}>
```

### Pattern 9: ModalContainer Legacy Event Modernization

**Before:**
```svelte
<svelte:document on:keydown={handleEscape} />
<dialog on:transitionend={handleTransitionEnd} ...>
```

**After:**
```svelte
<svelte:document onkeydown={handleEscape} />
<dialog ontransitionend={handleTransitionEnd} ...>
```

Note: `svelte:document` uses lowercase event attribute syntax (same as HTML elements) in Svelte 5.

### Pattern 10: Layout $bindable() for isDrawerOpen

**Before (Layout.svelte):**
```svelte
<script>
  export let isDrawerOpen: $$Props['isDrawerOpen'] = false;
</script>
```

**After:**
```svelte
<script>
  let { isDrawerOpen = $bindable(false), ...restProps }: LayoutProps = $props();
</script>
```

### Anti-Patterns to Avoid

- **Mixing slot consumers and snippet consumers for the same component:** Once a component uses `{@render}`, ALL consumers must use snippet syntax. You cannot have one consumer using `slot="actions"` and another using `{#snippet actions()}`. This means all consumer updates must be atomic with the component migration.
- **Wrapping children in {#snippet children()}:** Default content should be placed directly between component tags. Only named snippets need explicit `{#snippet}` blocks.
- **Using `@render` without optional chaining on optional snippets:** Always use `{@render snippet?.()}` or `{#if snippet}{@render snippet()}{/if}` for snippets that might not be provided.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conditional slot checking | Custom boolean props to flag slot presence | Snippet truthiness (`{#if note}{@render note()}{/if}`) | Built-in Svelte 5 pattern; snippets are undefined when not passed |
| Event forwarding chains | Manual callback chains through intermediaries | Direct snippet/callback prop pass-through | Svelte 5 props flow naturally without dispatch middlemen |
| Type definitions for snippets | Manual function type signatures | `import type { Snippet } from 'svelte'` | Official Svelte type; enables type inference |

## Common Pitfalls

### Pitfall 1: Slot-to-Snippet Compilation Mismatch
**What goes wrong:** Migrating a component to `{@render}` but missing a consumer that still uses `slot="..."` causes a compilation error.
**Why it happens:** Components with `{@render}` cannot accept slotted content. The reverse is fine (slot-based components can accept snippets).
**How to avoid:** Grep for all `slot="name"` usages of each component BEFORE migrating it. Update ALL consumers in the same commit.
**Warning signs:** Compilation errors mentioning slot/snippet incompatibility.

### Pitfall 2: AdminNav and CandidateNav Use Wrong Event Names
**What goes wrong:** AdminNav uses `on:navFocusOut` and CandidateNav uses `on:navFocusOut`, but Navigation dispatches `keyboardFocusOut`. These are event forwarding via `on:navFocusOut` which forwards ALL dispatched events from Navigation.
**Why it happens:** The `on:navFocusOut` directive does not match the dispatched event name. This appears to be Svelte 4 event bubbling syntax where `on:eventName` without a handler forwards all events. Actually, closer inspection reveals AdminNav uses `on:navFocusOut` but the consumer (admin/+layout.svelte) listens for `on:keyboardFocusOut`. This is because AdminNav and CandidateNav forward Navigation's events upward via event forwarding.
**How to avoid:** When converting to callback props, trace the full chain: Navigation dispatches `keyboardFocusOut` -> VoterNav/CandidateNav/AdminNav forward it -> route layouts consume it. Replace with `onKeyboardFocusOut` callback prop at each level.
**Warning signs:** `on:eventName` without handler (event forwarding syntax) on Nav wrapper components.

### Pitfall 3: ConfirmationModal Has Internal slot="actions" Usage
**What goes wrong:** ConfirmationModal itself passes `<div slot="actions">` to its child Modal. When Modal is migrated, ConfirmationModal's internal usage must also be updated.
**Why it happens:** ConfirmationModal is both a container (accepts default slot) and a consumer (uses Modal with slot="actions").
**How to avoid:** Migrate the Modal chain bottom-up: ModalContainer first (only has default slot + events), then Modal (has actions + default), then TimedModal and ConfirmationModal simultaneously.

### Pitfall 4: TimedModal $: Reactive Statement with Store Subscription
**What goes wrong:** TimedModal has `$: if ($progressBarTimer)` which reads from a tweened store. Converting to `$effect` requires understanding that `$progressBarTimer` is a store subscription.
**Why it happens:** In runes mode, `$storeName` auto-subscription still works for stores, but the `$:` reactive block pattern changes to `$effect`.
**How to avoid:** Convert to `$effect(() => { const t = Math.ceil($progressBarTimer); ... })` which will track the store subscription automatically.

### Pitfall 5: DataConsent's onchange Already Lowercase
**What goes wrong:** DataConsent already has `onchange` prop (lowercase), but the Phase 23 convention establishes camelCase for custom callbacks.
**Why it happens:** DataConsent was already using callback props before Phase 22, and used `onchange` matching native HTML event naming.
**How to avoid:** The context says to "verify and align naming to camelCase if needed." Since DataConsent is NOT using createEventDispatcher (it already uses callback props), and `onchange` is defined in its type file, this is a rename from `onchange` to `onChange`. Update the type file, the component, and the one consumer (DataConsentPopup).

### Pitfall 6: MainContent Consumer Count is Massive
**What goes wrong:** Attempting to update MainContent and its ~47 consumers in a single plan leads to an overwhelming change set.
**Why it happens:** MainContent is the primary content layout used by virtually every route in the app.
**How to avoid:** Dedicate a full plan to MainContent + its consumers. Group consumers by named slot usage patterns to systematically transform them.

### Pitfall 7: Alert's Dual Role as Dialog/Alert
**What goes wrong:** Alert uses `$$slots.actions` to determine its ARIA role (`dialog` vs `alert`). This must be preserved.
**Why it happens:** The `actions` snippet truthiness check serves double duty: rendering and accessibility role determination.
**How to avoid:** Replace `$$slots.actions` with `actions` (snippet prop truthiness) in both the role assignment AND the conditional rendering.

### Pitfall 8: Drawer.svelte Has Legacy on:click
**What goes wrong:** Drawer.svelte is in legacy mode and has `on:click={() => closeModal?.()}` on a Button component.
**Why it happens:** Drawer was not migrated in Phase 22 because it's a container component.
**How to avoid:** When migrating Drawer to runes, also convert `on:click` to `onclick` and `$$restProps` to `...restProps`.

## Code Examples

### Example 1: Alert Full Migration (Component Side)

```svelte
<svelte:options runes />

<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/button';
  import { Icon } from '$lib/components/icon';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
  import type { Snippet } from 'svelte';
  import type { AlertProps } from './Alert.type';

  let {
    title,
    icon = undefined,
    autoOpen = true,
    onClose = undefined,
    onOpen = undefined,
    isOpen = $bindable(false),
    children,
    actions,
    ...restProps
  }: AlertProps = $props();

  const { t } = getComponentContext();
  const contentId = getUUID();

  onMount(() => {
    if (autoOpen) openAlert();
  });

  export function openAlert() {
    isOpen = true;
    onOpen?.();
  }

  export function closeAlert() {
    isOpen = false;
    onClose?.();
  }
</script>

<div
  role={actions ? 'dialog' : 'alert'}
  aria-modal="false"
  aria-label={title}
  aria-describedby={contentId}
  {...concatClass(restProps, '...')}
  class:vaa-alert-hidden={!isOpen}>
  {#if icon}
    <Icon name={icon} class="justify-self-center" />
  {/if}
  <div id={contentId} class="w-full">
    {@render children?.()}
  </div>
  <div>
    {#if actions}
      {@render actions()}
    {:else}
      <Button onclick={closeAlert} color="warning" text={t('common.close')} class="-mt-[1rem] sm:mt-0" />
    {/if}
  </div>
  <button onclick={closeAlert} class="btn btn-circle btn-ghost btn-sm absolute top-2 right-2">
    <span aria-hidden="true">x</span>
    <span class="sr-only">{t('common.close')}</span>
  </button>
</div>
```

### Example 2: Alert Consumer Migration

```svelte
<!-- Before -->
<Alert bind:closeAlert title="..." {...restProps}>
  <div class="...">
    <h3>Title</h3>
    <p>Content</p>
  </div>
  <DataConsent onchange={closeAlert} description="none" slot="actions" />
</Alert>

<!-- After -->
<Alert bind:closeAlert title="..." {...restProps}>
  <div class="...">
    <h3>Title</h3>
    <p>Content</p>
  </div>
  {#snippet actions()}
    <DataConsent onchange={closeAlert} description="none" />
  {/snippet}
</Alert>
```

### Example 3: MainContent Consumer Migration

```svelte
<!-- Before -->
<MainContent title={t('elections.title')}>
  <figure role="presentation" slot="hero">
    <Icon name="election" />
  </figure>
  <p>Content here</p>
  <Button
    slot="primaryActions"
    variant="main"
    text="Continue"
    onclick={next} />
</MainContent>

<!-- After -->
<MainContent title={t('elections.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <Icon name="election" />
    </figure>
  {/snippet}
  <p>Content here</p>
  {#snippet primaryActions()}
    <Button
      variant="main"
      text="Continue"
      onclick={next} />
  {/snippet}
</MainContent>
```

### Example 4: Layout Route Consumer Migration

```svelte
<!-- Before -->
<Layout {menuId} bind:isDrawerOpen>
  <VoterNav on:keyboardFocusOut={() => navigation.close?.()} id={menuId} hidden={!isDrawerOpen} slot="menu" />
  <slot />
</Layout>

<!-- After -->
<Layout {menuId} bind:isDrawerOpen>
  {#snippet menu()}
    <VoterNav onKeyboardFocusOut={() => navigation.close?.()} id={menuId} hidden={!isDrawerOpen} />
  {/snippet}
  <slot />
</Layout>
```

### Example 5: Navigation Callback Chain

```svelte
<!-- Navigation.svelte (component) -->
<script lang="ts">
  let { hidden = false, onKeyboardFocusOut, children, ...restProps }: NavigationProps = $props();
</script>
<nav use:onKeyboardFocusOut={onKeyboardFocusOut} ...>
  {@render children?.()}
</nav>

<!-- VoterNav.svelte (intermediate) -->
<script lang="ts">
  let { onKeyboardFocusOut, ...restProps }: VoterNavProps = $props();
</script>
<Navigation {onKeyboardFocusOut} {...restProps}>
  ...
</Navigation>

<!-- voters/+layout.svelte (final consumer) -->
<VoterNav onKeyboardFocusOut={() => navigation.close?.()} ... />
```

## Component Migration Inventory

### Components Requiring Full Runes Conversion + Snippet Migration

| Component | Current State | Slots | Dispatchers | Consumer Count |
|-----------|---------------|-------|-------------|----------------|
| Alert.svelte | Legacy mode | `actions` (named), default | `open`, `close` | ~9 (Notification, DataConsentPopup, FeedbackPopup, SurveyPopup, PreregisteredNotification, located/+layout.svelte, DataConsentInfoButton, EntityListControls) |
| Modal.svelte | Legacy mode | `actions` (named), default | None | ~6 (DataConsentInfoButton, EntityListControls, located/+layout.svelte, ConfirmationModal, TimedModal, FeedbackModal) |
| ModalContainer.svelte | Legacy mode | default | None (uses on:transitionend, on:keydown, on:click) | ~3 (Modal, Drawer) |
| TimedModal.svelte | Legacy mode | `actions` (named) + forwarding, default | None | ~1 (LogoutButton) |
| Drawer.svelte | Legacy mode | default | None | Multiple entity detail pages |
| ConfirmationModal.svelte | Legacy mode | default (+ internal slot="actions" to Modal) | None | ~1 (ButtonWithConfirmation) |
| SingleCardContent.svelte | Legacy mode | `note` (named), default | None | ~2 (entity detail, candidate preview) |
| MainContent.svelte | Legacy mode | `note`, `hero`, `heading`, `fullWidth`, `primaryActions` (5 named), default | None | ~47 route files |
| Layout.svelte | Legacy mode | `menu` (named), default | None | 3 (voter, candidate, admin +layout.svelte) |

### Components Already in Runes Requiring Only Slot-to-Snippet

| Component | Slots | Consumer Count |
|-----------|-------|----------------|
| Button.svelte | `badge` (named) | ~3 (candidate/+page, EntityListControls) |
| HeadingGroup.svelte | default | ~8 (various route pages) |
| PreHeading.svelte | default | ~8 (via HeadingGroup consumers) |
| Warning.svelte | default | few |
| InputGroup.svelte | default | few |
| Expander.svelte | default | ~6 (QuestionBasicInfo, QuestionExtendedInfo x2, direct uses) |
| ButtonWithConfirmation.svelte | default | few |
| Term.svelte | default (inline) | few |
| EntityCard.svelte | default | ~3 (self-recursive, entity list pages) |
| EntityCardAction.svelte | default | ~2 (EntityCard internal) |
| Navigation.svelte | default | ~3 (VoterNav, CandidateNav, AdminNav) |
| NavGroup.svelte | default | ~many (within nav components) |
| NavItem.svelte | default | ~many (within nav components) |
| InfoItem.svelte | default | ~many (entity detail pages) |

### Components Requiring Dispatcher Removal Only

| Component | Already Runes? | Dispatched Events | Consumer Count |
|-----------|---------------|-------------------|----------------|
| Expander.svelte | Yes | `expand`, `collapse` | ~6 |
| Navigation.svelte | Yes | `keyboardFocusOut` | 3 (VoterNav, CandidateNav, AdminNav) |
| SurveyButton.svelte | Yes | `click` | 1 (SurveyPopup) |
| Feedback.svelte | Yes | `cancel`, `error`, `sent` | 2 (FeedbackModal, FeedbackPopup) |
| DataConsent.svelte | Yes (already callback) | None (rename `onchange` to `onChange`) | 1 (DataConsentPopup) |

### Event Forwarding Chains (Must Trace Through)

| Chain | Components | Final Consumers |
|-------|-----------|----------------|
| `keyboardFocusOut` | Navigation -> VoterNav -> voters/+layout.svelte | `navigation.close?.()` |
| `keyboardFocusOut` | Navigation -> CandidateNav -> candidate/+layout.svelte | `navigation.close?.()` |
| `keyboardFocusOut` | Navigation -> AdminNav -> admin/+layout.svelte | `navigation.close?.()` |
| `navFocusOut` (BUG?) | AdminNav uses `on:navFocusOut` -- does not match Navigation's `keyboardFocusOut` dispatch | Likely non-functional event forwarding |
| `click` | SurveyButton -> SurveyPopup | `onClick` triggers close timeout |
| `cancel`/`sent` | Feedback -> FeedbackModal | `closeFeedback` |
| `sent` | Feedback -> FeedbackPopup | `onSent` close timeout |
| `expand`/`collapse` | Expander -> QuestionBasicInfo (wrapper) -> route pages | Tracking callbacks |
| `expand`/`collapse` | Expander -> QuestionExtendedInfo (wrapper) -> route pages | Tracking callbacks |

### AdminNav/CandidateNav Event Forwarding Investigation

AdminNav.svelte (line 38): `<Navigation slot="nav" on:navFocusOut {...restProps}>`
CandidateNav.svelte (line 48): `<Navigation slot="nav" on:navFocusOut {...restProps}>`

These use `on:navFocusOut` but Navigation dispatches `keyboardFocusOut`. In Svelte 4, `on:eventName` without a handler forwards events with that name from the component. Since the dispatched event is `keyboardFocusOut` (not `navFocusOut`), the `on:navFocusOut` is forwarding a non-existent event -- it is effectively a no-op.

However, the route layouts listen on `on:keyboardFocusOut`:
- `admin/+layout.svelte`: `<AdminNav on:keyboardFocusOut={() => navigation.close?.()} ...>`
- `candidate/+layout.svelte`: `<CandidateNav on:keyboardFocusOut={() => navigation.close?.()} ...>`

This means the `keyboardFocusOut` event is NOT being forwarded through CandidateNav/AdminNav. The `on:navFocusOut` captures nothing, and `on:keyboardFocusOut` on the wrapper also captures nothing because CandidateNav/AdminNav do not forward that event.

Compare with VoterNav (line 57): `<Navigation on:keyboardFocusOut {...restProps}>` -- this correctly forwards `keyboardFocusOut`.

**Resolution during migration:** When converting to callback props, make CandidateNav and AdminNav properly forward `onKeyboardFocusOut`:
```svelte
let { onKeyboardFocusOut, ...restProps } = $props();
<Navigation {onKeyboardFocusOut} {...restProps}>
```
Also, CandidateNav and AdminNav have `slot="nav"` which references a slot that does NOT exist on Navigation. This is harmless but should be removed during migration.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<slot name="X" />` | `{@render X?.()}` with snippet prop | Svelte 5.0 (Oct 2024) | All container components |
| `$$slots.X` conditional | `{#if X}` truthiness check | Svelte 5.0 | Conditional rendering |
| `createEventDispatcher` | Callback props (`onX`) | Svelte 5.0 | All event-dispatching components |
| `on:event` directive (dispatch) | `onEvent={callback}` prop | Svelte 5.0 | Consumer call sites |
| `on:event` forwarding | Direct prop pass-through | Svelte 5.0 | Event forwarding chains |
| `<slot name="X" slot="X" />` | Snippet prop pass-through | Svelte 5.0 | TimedModal forwarding pattern |
| `svelte:document on:keydown` | `<svelte:document onkeydown={} />` | Svelte 5.0 | ModalContainer |
| `type $$Props = ...` | Type parameter on `$props()` | Svelte 5.0 | All legacy components |

## Type Updates Required

### Snippet Props in Type Files

Type files need to include snippet props using `Snippet` from `svelte`:

```typescript
import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type AlertProps = SvelteHTMLElements['dialog'] & {
  title: string;
  icon?: IconName;
  autoOpen?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;  // NEW
  children?: Snippet;    // NEW
  actions?: Snippet;     // NEW
};
```

### Callback Props in Type Files

```typescript
// Expander.type.ts additions
export type ExpanderProps = SvelteHTMLElements['div'] & {
  // ... existing props ...
  onExpand?: () => void;   // NEW
  onCollapse?: () => void; // NEW
  children?: Snippet;      // NEW
};

// Navigation.type.ts additions
export type NavigationProps = SvelteHTMLElements['nav'] & {
  hidden?: boolean;
  onKeyboardFocusOut?: () => void; // NEW
  children?: Snippet;              // NEW
};
```

### Intermediate Components Need Updated Types Too

VoterNav, CandidateNav, AdminNav types need `onKeyboardFocusOut` added since they now explicitly pass it through.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (E2E) |
| Config file | `vitest.config.ts` (per workspace) + `playwright.config.ts` |
| Quick run command | `yarn test:unit` |
| Full suite command | `yarn test:e2e` (requires Docker stack) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-04 | Dispatchers replaced with callbacks | E2E (runtime behavior) | `yarn test:e2e` | Existing 92 E2E tests |
| COMP-05 | Slots replaced with snippets | E2E (content rendering) | `yarn test:e2e` | Existing 92 E2E tests |
| LAYOUT-01 | Layout runes + snippets | E2E (full app navigation) | `yarn test:e2e` | Existing 92 E2E tests |
| LAYOUT-02 | MainContent snippets | E2E (page rendering) | `yarn test:e2e` | Existing 92 E2E tests |

### Sampling Rate
- **Per task commit:** TypeScript check (`npx svelte-check` or build check)
- **Per wave merge:** `yarn test:unit`
- **Phase gate:** Full 92 E2E tests green before verification

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. The 92 E2E tests serve as the regression gate. TypeScript compilation serves as the immediate correctness check (snippet/slot mismatch causes compilation errors).

## Open Questions

1. **AdminNav/CandidateNav `on:navFocusOut` and `slot="nav"`**
   - What we know: These are non-functional -- `navFocusOut` does not match the dispatched event name, and `slot="nav"` references a non-existent slot on Navigation.
   - What's unclear: Whether this is intentional dead code or a latent bug.
   - Recommendation: Fix during migration by properly forwarding `onKeyboardFocusOut` through these components. This restores the intended behavior (keyboard focus out closes the drawer in candidate and admin apps).

2. **Route layout files: snippet-only vs. full modernization**
   - What we know: Route layout files (voters/+layout.svelte, etc.) have `on:keyboardFocusOut` that must change when Navigation is migrated. They also have `$:` reactive statements and other legacy patterns.
   - What's unclear: Whether to convert those `$:` statements now or defer to Phase 24 (ROUTE-01).
   - Recommendation: Only change what is necessary for the snippet/callback migration. Keep `$:` statements for Phase 24. Minimize the change surface.

3. **Components with default slot only: priority for migration**
   - What we know: Many components (HeadingGroup, Warning, NavGroup, NavItem, etc.) have only a default `<slot />` which needs to become `{@render children?.()}`.
   - What's unclear: Whether consumers using `<Component>content</Component>` pattern need any changes.
   - Recommendation: Default content passed between component tags works identically with `children` -- consumers do NOT need changes for default-slot-only components. Only the component itself changes (`<slot />` to `{@render children?.()}`). This dramatically reduces the consumer update scope.

## Sources

### Primary (HIGH confidence)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide) -- slot to snippet, createEventDispatcher to callbacks
- [Svelte 5 Snippet Docs](https://svelte.dev/docs/svelte/snippet) -- snippet syntax, typing, children prop
- [Svelte Legacy Slots Docs](https://svelte.dev/docs/svelte/legacy-slots) -- compatibility notes
- Codebase inspection -- all 20+ components and 50+ consumers read and analyzed directly

### Secondary (MEDIUM confidence)
- Phase 22 established patterns in this codebase (per-component runes opt-in, concatClass, $bindable)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Svelte 5 built-in features, no third-party dependencies
- Architecture: HIGH -- Patterns directly from official Svelte 5 migration guide and verified against codebase
- Pitfalls: HIGH -- Every component and consumer file was read and cross-referenced; event forwarding chains fully traced
- Inventory: HIGH -- All slot usages and dispatcher consumers found via comprehensive grep search

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- Svelte 5 APIs are mature)
