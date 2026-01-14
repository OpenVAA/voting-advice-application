<script lang="ts">
  import Navigation from '$lib/components/Navigation.svelte';

  let { children } = $props();
</script>

<div class="flex min-h-[calc(100vh-var(--spacing-headerHeight))] w-full max-w-full grid-cols-[20rem_1fr_20rem] md:grid">
  <div class="row-span-full hidden md:grid">
    <Navigation />
  </div>

  <main class="col-span-full col-start-2 prose grid-cols-subgrid md:grid">
    {@render children()}
  </main>
</div>
