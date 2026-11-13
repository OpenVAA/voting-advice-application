<!--
@component Render the view of the gate a protected layout's server load reported in place of the page, or the page when no gate applies. Both apps' protected layouts render it, each with its own record of views.

### Dynamic component

Reads SvelteKit's navigation state, to tell a view replaced by a rerun load from one replaced by a navigation.

### Properties

- `gate`: The id of the gate the server load reported, or `null` or `undefined` when no gate applies.
- `views`: The view of each gate of the app, keyed by its id.
- `children`: The page, rendered when no gate applies.

### Accessibility

- Moves focus to the navigation target of the view it renders when that view replaced another without a navigation, as when a gate is passed. On first render and while a navigation is in flight it requests nothing.

### Usage

```tsx
<GateOutlet gate={data.gate} views={GATE_VIEWS}>
  {@render children?.()}
</GateOutlet>
```
-->

<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { navigating } from '$app/state';
  import { focusNavigationTarget } from '$lib/utils/focusNavigationTarget';
  import type { GateOutletProps } from './GateOutlet.type';

  let { gate, views, children }: GateOutletProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Move focus when the view is replaced without a navigation
  ////////////////////////////////////////////////////////////////////

  /** The view last rendered: a gate's id, `null` for the page, and `undefined` before the first render. */
  let renderedView: string | null | undefined;
  /** Ends the wait of the last focus request. Called before a newer request and on destroy, and never as the effect's cleanup: a rerun load replaces the layout's data, so a cleanup would end a pending wait whenever the effect ran again with the same view. */
  let cancelPendingFocus: (() => void) | undefined;

  // A rerun load replaces the view without a navigation, so the root layout's focus reset does not run for it and this outlet requests the move itself. While a navigation is in flight it requests nothing: that navigation's own focus reset follows.
  $effect(() => {
    const view = gate ?? null;
    const previousView = renderedView;
    renderedView = view;
    if (previousView === undefined || previousView === view) return;
    if (untrack(() => navigating.to) !== null) return;
    cancelPendingFocus?.();
    cancelPendingFocus = focusNavigationTarget();
  });
  onDestroy(() => cancelPendingFocus?.());
</script>

<!-- `!= null`: a layout's data also has an arm with every member absent, for the load's returns that only redirect, and that arm is not a gate. -->
{#if gate != null}
  {@const GateView = views[gate]}
  <GateView />
{:else}
  {@render children?.()}
{/if}
