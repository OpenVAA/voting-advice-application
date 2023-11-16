<script lang="ts">
  import LoginPage from './LoginPage.svelte';
  import {authContext, loadLocalStorage} from '$lib/components/authentication/authenticationStore';
  import {onMount, setContext} from 'svelte';

  setContext('auth', authContext);
  const user = authContext.user;
  const token = authContext.token;

  onMount(() => {
    loadLocalStorage();
    $token && authContext.loadUserData();
  });
</script>

{#if $user}
  <slot />
{:else if $token === undefined || ($token && !$user)}
  <div class="mt-100 flex h-screen flex-col items-center">
    <span class="loading loading-spinner loading-lg" />
  </div>
{:else}
  <LoginPage />
{/if}
