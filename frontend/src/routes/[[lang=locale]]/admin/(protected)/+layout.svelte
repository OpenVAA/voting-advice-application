<!--@component

# Admin protected layout

- Only displays children if user is authenticated with admin privileges
- Handles loading and error states

-->

<script lang="ts">
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getAdminContext } from '$lib/contexts/admin';
  import { logDebugError } from '$lib/utils/logger';

  export let data;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t, userData } = getAdminContext();

  ////////////////////////////////////////////////////////////////////
  // Process data
  ////////////////////////////////////////////////////////////////////

  let error: Error | undefined;
  let ready: boolean = false;

  $: {
    // Update admin context with user data
    if (data.userData) {
      userData.set(data.userData);
      ready = true;
    } else {
      error = new Error('No user data available');
      logDebugError('[Admin protected layout] Error: No user data available');
    }
  }
</script>

{#if error}
  <ErrorMessage message={$t('adminApp.error.unauthorized')} />
{:else if !ready}
  <Loading />
{:else}
  <slot />
{/if}
