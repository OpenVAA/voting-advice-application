<!--@component

# Admin protected layout

- Only displays children if user is authenticated with admin privileges
- Handles loading and error states

-->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getAdminContext } from '$lib/contexts/admin';
  import { logDebugError } from '$lib/utils/logger';

  let { data, children }: { data: any; children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const adminCtx = getAdminContext();
  const { t } = adminCtx;

  ////////////////////////////////////////////////////////////////////
  // Process data
  ////////////////////////////////////////////////////////////////////

  let error = $state<Error | undefined>();
  let ready = $state(false);

  $effect(() => {
    // Update admin context with user data
    if (data.userData) {
      adminCtx.userData = data.userData;
      ready = true;
    } else {
      error = new Error('No user data available');
      logDebugError('[Admin protected layout] Error: No user data available');
    }
  });
</script>

{#if error}
  <ErrorMessage message={t('adminApp.error.unauthorized')} />
{:else if !ready}
  <Loading />
{:else}
  {@render children?.()}
{/if}
