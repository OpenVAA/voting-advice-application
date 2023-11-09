<script lang="ts">
  import LoginPage from './LoginPage.svelte';
  import {onMount, setContext} from 'svelte';
  import {authContext} from '$lib/components/authentication/authenticationStore';

  setContext('auth', authContext);

  const user = authContext.user;
  onMount(() => authContext.loadUserData());
</script>

{#if $user}
  <slot />
{:else}
  <LoginPage />
{/if}
