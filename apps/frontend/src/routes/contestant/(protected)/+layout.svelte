<!--@component

# Contestant App protected layout

- Renders the view of the first gate the signed-in user must pass (see `$contestant/gates`) in place of the page, when the server load reports one.
- Otherwise renders the page. The data of the entity the user edits is applied one level down, by the entity layout.
- Moves focus to the navigation target of the view it renders when that view replaced another without a navigation, as when a gate is passed, through the shared gate outlet. On first render and while a navigation is in flight it requests nothing.
-->

<script lang="ts">
  import { GATE_VIEWS } from '$contestant/gates/gateViews';
  import { GateOutlet } from '$lib/dynamic-components/gates';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<GateOutlet gate={data.gate} views={GATE_VIEWS}>
  {@render children?.()}
</GateOutlet>
