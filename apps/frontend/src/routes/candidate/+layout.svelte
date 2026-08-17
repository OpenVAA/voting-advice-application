<!--@component

# Candidate app main layout

- Inits CandidateContext
- Sets top bar settings
- Render the `Layout` component for the Candidate App
- Queues the possible Candidate App notification
- Shows a maintenance page if the Candidate App is not accessible yet or not supported

### Settings

- `access.candidateApp`: Whether to show the Candidate App.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Notification } from '$lib/components/notification';
  import { getAppContext } from '$lib/contexts/app';
  import { initCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { CandidateNav } from '$lib/dynamic-components/navigation/candidate';
  import Layout from '../Layout.svelte';
  import MaintenancePage from '../MaintenancePage.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get app context
  ////////////////////////////////////////////////////////////////////

  const ctx = getAppContext();
  const { appType, popupQueue, t } = ctx;
  // appSettings is a reactive accessor (see phase 113 flatten) — read via ctx.X, never destructure.
  const appSettings = $derived(ctx.appSettings);

  ////////////////////////////////////////////////////////////////////
  // Init Candidate Context
  ////////////////////////////////////////////////////////////////////

  initCandidateContext();
  appType.set('candidate');

  ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  // onMount one-shot queue (NOT a reactive $effect) — mirrors the voters layout's
  // REVERT-TO-ONMOUNT decision (apps/frontend/src/routes/(voters)/+layout.svelte:100-119).
  // A reactive $effect re-queues on every appSettings change and, on a busy
  // page, its repeated re-runs keep resetting downstream debounced effects — observed
  // on /candidate/register/password where PasswordValidator's 200ms debounce
  // (clearTimeout on each re-run) never settled, so validPassword stayed false and the
  // set-password submit button stayed disabled (perm-localisation-positive hang).
  onMount(() => {
    if (!appSettings.access.candidateApp || !appSettings.dataAdapter.supportsCandidateApp) return;
    // Show possible notification
    if (appSettings.notifications.candidateApp?.show)
      popupQueue.push({
        component: Notification,
        props: { data: appSettings.notifications.candidateApp }
      });
  });

  ////////////////////////////////////////////////////////////////////
  // Layout and top bar
  ////////////////////////////////////////////////////////////////////

  const { navigation, topBarSettings } = getLayoutContext();
  topBarSettings.use({
    actions: {
      logout: 'show'
    }
  });

  const menuId = 'candidate-app-menu';
  let isDrawerOpen = $state(false);
</script>

{#if !appSettings.dataAdapter.supportsCandidateApp}
  <MaintenancePage
    title={t('candidateApp.notSupported.title')}
    content={t('candidateApp.notSupported.content')}
    emoji={t('candidateApp.notSupported.heroEmoji')} />
{:else if !appSettings.access.candidateApp}
  <MaintenancePage
    title={t('dynamic.candidateAppNotAccessible.title')}
    content={t('dynamic.candidateAppNotAccessible.content')} />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    {#snippet menu()}
      <CandidateNav onKeyboardFocusOut={() => navigation.close?.()} id={menuId} hidden={!isDrawerOpen} />
    {/snippet}
    {@render children?.()}
  </Layout>
{/if}
