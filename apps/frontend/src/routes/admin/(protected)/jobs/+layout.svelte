<!--@component
# Admin jobs layout

- Adds polling
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import WithPolling from '$lib/admin/components/jobs/WithPolling.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<WithPolling>
  {@render children?.()}
</WithPolling>
