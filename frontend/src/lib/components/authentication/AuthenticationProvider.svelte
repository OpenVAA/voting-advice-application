<script>
  export let loggedIn = true;
</script>

{#if loggedIn}
  <slot />
{:else}
  <div>Login</div>
{/if}
