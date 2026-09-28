<script lang="ts">
  import './layout.css';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { DRAWER_ID } from '$lib/consts';
  import Navigation from '$lib/components/Navigation.svelte';

  const { children } = $props();
  let checked = $state(false);
</script>

<svelte:head><link rel="icon" href="/favicon.png" /></svelte:head>

<div class="drawer drawer-end">
  <input id={DRAWER_ID} type="checkbox" class="drawer-toggle" bind:checked />
  <div class="drawer-content">
    <Header />
    <div>
      {@render children()}
      <Footer />
    </div>
  </div>
  <div class="drawer-side">
    <label for={DRAWER_ID} aria-label="Close menu" class="drawer-overlay"></label>
    <div class="menu min-h-screen w-[80dvw] bg-base-200 p-lg">
      <button aria-label="Close menu" class="mb-md cursor-pointer self-end" onclick={() => (checked = false)}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <Navigation full onLinkClick={() => (checked = false)} />
    </div>
  </div>
</div>
