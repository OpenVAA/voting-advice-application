<script>
  import LoignPage from './LoignPage.svelte';

  export let loggedIn = false;
</script>

{#if loggedIn}
  <slot />
{:else}
  <LoignPage />
{/if}
