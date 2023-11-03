<script lang="ts">
  import LoignPage from './LoginPage.svelte';
  import {setContext} from 'svelte';
  import {authContext} from '$lib/components/authentication/authenticationStore';

  setContext('auth', authContext);

  const user = authContext.user;
</script>

{#if $user}
  <slot />
{:else}
  <LoignPage />
{/if}
