<!--@component

# Admin protected layout

- Only displays children if user is authenticated with admin privileges
- Handles loading and error states

-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getAdminContext } from '$lib/contexts/admin';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { logDebugError } from '$lib/utils/logger';

  export let data;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getAppContext();
  const adminContext = getAdminContext();
  const { topBarSettings } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // Process data
  ////////////////////////////////////////////////////////////////////

  let error: Error | undefined;
  let ready: boolean = false;

  $: {
    try {
      // Update admin context with user data
      if (data.userData) {
        adminContext.isAuthenticated = true;
        // Store any other admin data in the context as needed
        ready = true;
      } else {
        error = new Error('No user data available');
      }
    } catch (e) {
      error = e instanceof Error ? e : new Error('Unknown error');
      logDebugError(`[Admin protected layout] Error processing data: ${error.message}`);
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Top bar settings
  ////////////////////////////////////////////////////////////////////

  topBarSettings.push({
    actions: {
      logout: 'show'
    }
  });
</script>

{#if error}
  <ErrorMessage message="You are not authorized to access this area" />
{:else if !ready}
  <Loading />
{:else}
  <slot />
{/if}
