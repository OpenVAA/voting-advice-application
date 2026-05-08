<!--@component
# Admin jobs layout

- Adds polling
-->

<script lang="ts">
  import WithPolling from '$lib/admin/components/jobs/WithPolling.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<WithPolling>
  {@render children?.()}
</WithPolling>
