<!--@component
# Admin app main layout

- Inits AdminContext
- Sets top bar settings
- Renders the `Layout` component for the Admin App
- Shows the message that a sign-out could not be confirmed, while the context holds a failed one, and withdraws it on an entry route or when the session reads as gone
-->

<script lang="ts">
  import { page } from '$app/state';
  import { Layout, MaintenancePage } from '$layouts/main';
  import { Alert } from '$lib/components/alert';
  import { initAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { AdminNav } from '$lib/dynamic-components/navigation/admin';
  import { isEntryRoute } from '$lib/routes';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Init Admin Context
  ////////////////////////////////////////////////////////////////////

  // `appType` is a rune handle from AdminContext (inherited from AppContext); `appType.set(...)` uses that handle's own `.set`. `appSettings` is a reactive accessor — read via `ctx.appSettings`, never destructure (the alias below tracks it).
  const ctx = initAdminContext();
  const { appType, t } = ctx;
  const appSettings = $derived(ctx.appSettings);
  appType.set('admin');

  // The session's load does not run again on a link, so `isAuthenticated` can stay true after the session has gone. The gate sends a live session away from an entry route, so a request that reaches one found no session.
  $effect(() => {
    if (ctx.logoutFailed && (!ctx.isAuthenticated || isEntryRoute(page.route.id))) {
      ctx.clearLogoutFailure();
    }
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

  const menuId = 'admin-app-menu';
  let isDrawerOpen = $state(false);
</script>

{#if !appSettings.dataAdapter.supportsAdminApp}
  <MaintenancePage
    title={t('adminApp.notSupported.title')}
    content={t('adminApp.notSupported.content')}
    emoji={t('adminApp.notSupported.heroEmoji')} />
{:else if !appSettings.access.adminApp}
  <MaintenancePage
    title={t('adminApp.common.notAccessible.title')}
    content={t('adminApp.common.notAccessible.content')} />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    {#snippet menu()}
      <AdminNav onKeyboardFocusOut={() => navigation.close?.()} id={menuId} hidden={!isDrawerOpen} />
    {/snippet}
    {@render children?.()}
  </Layout>
  {#if ctx.logoutFailed}
    <Alert title={t('error.general')} icon="warning" onClose={ctx.clearLogoutFailure}>
      {t('common.logoutFailed')}
    </Alert>
  {/if}
{/if}
