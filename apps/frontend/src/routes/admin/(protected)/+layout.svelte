<!--@component

# Admin protected layout

- Only displays children if user is authenticated with admin privileges
- Handles loading and error states
- Renders the view of the gate the server load reported (see `$lib/admin/gates`) in place of the page, and moves focus to it when it replaced another view without a navigation

-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

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
      log.error('[Admin protected layout] Error: No user data available');
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
