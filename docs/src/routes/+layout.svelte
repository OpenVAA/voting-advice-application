<script lang="ts">
  import './layout.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let { children } = $props();
</script>

<svelte:head><link rel="icon" href="/favicon.png" /></svelte:head>

<Header />

<div class="mt-headerHeight">
  {@render children()}
</div>

<Footer />
