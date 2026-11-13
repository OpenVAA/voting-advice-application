<!--@component

# Contestant app main layout

- Inits ContestantContext
- Sets top bar settings
- Render the `Layout` component for the Contestant App
- Queues the possible Contestant App notification
- Shows a maintenance page if the Contestant App is not accessible yet or not supported
- Shows the message that a sign-out could not be confirmed, while the context holds a failed one, and withdraws it on an entry route or when the session reads as gone

### Settings

- `access.contestantApp`: Whether to show the Contestant App.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { getContestantAppName } from '$contestant/utils/contestantAppName';
  import { Layout, MaintenancePage } from '$layouts/main';
  import { Alert } from '$lib/components/alert';
  import { Notification } from '$lib/components/notification';
  import { getAppContext } from '$lib/contexts/app';
  import { initContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { ContestantNav } from '$lib/dynamic-components/navigation/contestant';
  import { isEntryRoute } from '$lib/routes';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get app context
  ////////////////////////////////////////////////////////////////////

  const ctx = getAppContext();
  const { appType, popupQueue, t } = ctx;
  // appSettings is a reactive accessor — read via ctx.X, never destructure.
  const appSettings = $derived(ctx.appSettings);
  const contestantAppName = $derived(getContestantAppName({ appSettings: ctx.appSettings, t }));

  ////////////////////////////////////////////////////////////////////
  // Init Candidate Context
  ////////////////////////////////////////////////////////////////////

  const contestantCtx = initContestantContext();
  appType.set('contestant');

  // The session's load does not run again on a link, so `isAuthenticated` can stay true after the session has gone. The gate sends a live session away from an entry route, so a request that reaches one found no session.
  $effect(() => {
    if (contestantCtx.logoutFailed && (!contestantCtx.isAuthenticated || isEntryRoute(page.route.id))) {
      contestantCtx.clearLogoutFailure();
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  // onMount one-shot queue (NOT a reactive $effect), matching the voter layout. A reactive $effect re-queues on every appSettings change and, on a busy page, its repeated re-runs keep resetting downstream debounced effects: on a page that sets a password that leaves PasswordValidator's 200ms debounce (cleared on each re-run) unsettled, so the password never reads as valid.
  onMount(() => {
    if (!appSettings.access.contestantApp || !appSettings.dataAdapter.supportsContestantApp) return;
    // Show possible notification
    if (appSettings.notifications.contestantApp?.show)
      popupQueue.push({
        component: Notification,
        props: { data: appSettings.notifications.contestantApp }
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

  const menuId = 'contestant-app-menu';
  let isDrawerOpen = $state(false);
</script>

{#if !appSettings.dataAdapter.supportsContestantApp}
  <MaintenancePage
    title={t('contestantApp.notSupported.title', { contestantAppName })}
    content={t('contestantApp.notSupported.content', { contestantAppName })}
    emoji={t('contestantApp.notSupported.heroEmoji')} />
{:else if !appSettings.access.contestantApp}
  <MaintenancePage
    title={t('dynamic.contestantAppNotAccessible.title', { contestantAppName })}
    content={t('dynamic.contestantAppNotAccessible.content', { contestantAppName })} />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    {#snippet menu()}
      <ContestantNav onKeyboardFocusOut={() => navigation.close?.()} id={menuId} hidden={!isDrawerOpen} />
    {/snippet}
    {@render children?.()}
  </Layout>
  {#if contestantCtx.logoutFailed}
    <Alert title={t('error.general')} icon="warning" onClose={contestantCtx.clearLogoutFailure}>
      {t('common.logoutFailed')}
    </Alert>
  {/if}
{/if}
