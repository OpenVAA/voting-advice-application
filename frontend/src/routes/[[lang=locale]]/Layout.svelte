<!--@component

# App outer layout

Defines the outer layout for the application, including the header and menu.

### Slots

- default: main content of the page, normally a `Main` component.
- `menu`: the navigation menu, normally a `VoterNav` or `CandidateNav` component.

### Properties

- `menuId`: the id of the navigation menu in the `menu` slot.
- `isDrawerOpen`: a bindable boolean indicating whether the drawer is open or not. NB. To close the drawer, use the method in `LayoutContext.navigation`.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import Header from './Header.svelte';
  import type { LayoutProps } from './Layout.type';

  type $$Props = LayoutProps;

  export let menuId: $$Props['menuId'];
  export let isDrawerOpen: $$Props['isDrawerOpen'] = false;

  ////////////////////////////////////////////////////////////////////
  // Constants
  ////////////////////////////////////////////////////////////////////

  const mainId = 'mainContent';
  const drawerToggleId = 'pageDrawerToggle';

  ////////////////////////////////////////////////////////////////////
  // Layout and navigation menu management
  ////////////////////////////////////////////////////////////////////

  const { startEvent, t } = getAppContext();

  let drawerOpenElement: HTMLButtonElement | undefined;

  /**
   * Open the drawer. We also focus on the relevant element to make it easy
   * to toggle it back when using keyboard navigation.
   */
  function openDrawer() {
    isDrawerOpen = true;
    // We need a small timeout for drawerCloseButton to be focusable
    setTimeout(() => document.getElementById('drawerCloseButton')?.focus(), 50);
    startEvent('menu_open');
  }

  /**
   * Close the drawer. We also focus on the relevant element to make it easy
   * to toggle it back when using keyboard navigation.
   */
  function closeDrawer() {
    isDrawerOpen = false;
    drawerOpenElement?.focus();
  }

  /**
   * Init the context for layout changes.
   */
  const { pageStyles, navigation } = getLayoutContext(onDestroy);
  navigation.close = closeDrawer;

  /** We use `videoHeight` and `videoWidth` as proxies to check for the presence of content in the `video` slot. Note that we cannot merely check if the slot is provided, because it might be empty. */
  // let videoHeight = 0;
  // let videoWidth = 0;
  // let hasVideo = videoWidth > 0 && videoHeight > 0;
</script>

<!-- Skip link for screen readers and keyboard users. We use tabindex="1" so that's it's available before any alerts injected by layouts. -->
<!-- svelte-ignore a11y-positive-tabindex -->
<a href="#{mainId}" tabindex="1" class="sr-only focus:not-sr-only">{$t('common.skipToMain')}</a>

<!-- Drawer container -->
<div class="drawer {$pageStyles.drawer.background}">
  <!-- NB. The Wave ARIA checker will show an error for this, but the use of both the 
    non-hidden labels in aria-labelledby should be okay for screen readers. -->
  <input
    id={drawerToggleId}
    bind:checked={isDrawerOpen}
    type="checkbox"
    class="drawer-toggle"
    tabindex="-1"
    aria-hidden="true"
    aria-label={$t('common.openCloseMenu')} />

  <!-- Drawer content -->
  <div class="drawer-content flex flex-col">
    <Header {menuId} {openDrawer} {isDrawerOpen} {drawerOpenElement} />
    <main id={mainId} class="flex flex-grow flex-col items-center gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg">
      <slot/>
    </main>
  </div>

  <!-- Drawer side menu -->
  <div class="drawer-side z-10">
    <div on:click={closeDrawer} aria-hidden="true" class="drawer-overlay cursor-pointer" />
    <slot name="menu" />
  </div>
</div>
