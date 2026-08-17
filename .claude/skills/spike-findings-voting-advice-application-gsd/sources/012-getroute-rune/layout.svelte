<!--
  SPIKE 012 — layout for the getroute-rune sub-route.

  Initializes the four candidate variants ONCE at this layout's mount via
  a Symbol-keyed context. Child pages (./+page.svelte, ./nested/+page.svelte)
  consume the SAME instances, so variant A's mount-time snapshot stays
  observable across client-side navigations between siblings.
-->
<script lang="ts">
  import { initSpike012Variants } from './spike012Context.svelte';

  initSpike012Variants();

  let { children } = $props();
</script>

{@render children()}
