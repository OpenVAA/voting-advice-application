<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setTyped } from './keys.svelte';
  let { children }: { children: Snippet } = $props();
  setTyped({ label: 'typed-voter' });
</script>
{@render children()}
