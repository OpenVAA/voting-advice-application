<!--@component

# Contestant App protected layout

- Renders the view of the first gate the signed-in user must pass (see `$contestant/gates`) in place of the page, when the server load reports one.
- Otherwise renders the page. The data of the entity the user edits is applied one level down, by the entity layout.
- Moves focus to the navigation target of the view it renders when that view replaced another without a navigation, as when a gate is passed. On first render and while a navigation is in flight it requests nothing.
-->

<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { navigating } from '$app/state';
  import { GATE_VIEWS } from '$contestant/gates/gateViews';
  import { focusNavigationTarget } from '$lib/utils/focusNavigationTarget';
  import type { Snippet } from 'svelte';
  import type { ContestantGateId } from '$contestant/gates/gates';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Move focus when the view is replaced without a navigation
  ////////////////////////////////////////////////////////////////////

  /** The view last rendered: a gate's id, `null` for the page, and `undefined` before the first render. */
  let renderedView: ContestantGateId | null | undefined;
  /** Ends the wait of the last focus request. Called before a newer request and on destroy, and never as the effect's cleanup: a rerun load replaces `data`, so a cleanup would end a pending wait whenever the effect ran again with the same view. */
  let cancelPendingFocus: (() => void) | undefined;

  // A rerun load replaces the view without a navigation, so the root layout's focus reset does not run for it and this layout requests the move itself. While a navigation is in flight it requests nothing: that navigation's own focus reset follows.
  $effect(() => {
    const view = data.gate ?? null;
    const previousView = renderedView;
    renderedView = view;
    if (previousView === undefined || previousView === view) return;
    if (untrack(() => navigating.to) !== null) return;
    cancelPendingFocus?.();
    cancelPendingFocus = focusNavigationTarget();
  });
  onDestroy(() => cancelPendingFocus?.());
</script>

<!-- `!= null`: `LayoutData` also has an arm with every member absent, for the load's returns that only redirect, and that arm is not a gate. -->
{#if data.gate != null}
  {@const GateView = GATE_VIEWS[data.gate]}
  <GateView />
{:else}
  {@render children?.()}
{/if}
