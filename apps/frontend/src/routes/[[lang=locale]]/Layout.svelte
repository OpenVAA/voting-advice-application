<!--@component

# App outer layout

Defines the outer layout for the application, including the header and menu.

### Slots

- default: `main` content of the page, normally a `MainContent` component.
- `menu`: the navigation menu, normally a `VoterNav` or `CandidateNav` component.

### Properties

- `menuId`: the id of the navigation menu in the `menu` slot.
- `isDrawerOpen`: a bindable boolean indicating whether the drawer is open or not. NB. To close the drawer, use the method in `LayoutContext.navigation`.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Video } from '$lib/components/video';
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

  const mainContentId = 'mainContent';
  const drawerToggleId = 'pageDrawerToggle';

  ////////////////////////////////////////////////////////////////////
  // Layout and navigation menu management
  ////////////////////////////////////////////////////////////////////

  const { startEvent, t, track } = getAppContext();
  const {
    pageStyles,
    navigation,
    navigationSettings,
    video: { mode: videoMode, player, show: showVideo }
  } = getLayoutContext(onDestroy);
  navigation.close = closeDrawer;

  let drawerOpenElement: HTMLButtonElement | undefined;

  /**
   * Open the drawer. We also focus on the relevant element to make it easy
   * to toggle it back when using keyboard navigation.
   */
  function openDrawer() {
    if ($navigationSettings.hide) return;
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
</script>

<!-- Skip link for screen readers and keyboard users. We use tabindex="1" so that's it's available before any alerts injected by layouts. -->
<!-- svelte-ignore a11y-positive-tabindex -->
<a href="#{mainContentId}" tabindex="1" class="sr-only focus:not-sr-only">{$t('common.skipToMain')}</a>

<!-- Drawer container -->
<div class="drawer {$pageStyles.drawer.background}">
  <!-- NB. The Wave ARIA checker will show an error for this, but the use of both the 
    non-hidden labels in aria-labelledby should be okay for screen readers. -->
  <input
    id={drawerToggleId}
    bind:checked={isDrawerOpen}
    type="checkbox"
    class="drawer-toggle"
    disabled={$navigationSettings.hide}
    tabindex="-1"
    aria-hidden="true"
    aria-label={$t('common.openCloseMenu')} />

  <!-- Drawer content -->
  <div class="drawer-content flex flex-col">
    <Header {menuId} {openDrawer} {isDrawerOpen} {drawerOpenElement} />
    <main id={mainContentId} class="flex flex-grow flex-col items-stretch">
      <!-- Video -->
      <div
        class="flex max-h-screen w-screen justify-center overflow-hidden transition-all sm:mt-[1.75rem] sm:w-full sm:grow-0"
        class:!max-h-[0]={!$showVideo}
        inert={!$showVideo}>
        <Video
          bind:this={$player}
          bind:mode={$videoMode}
          onTrack={({ data }) => track('video', data)}
          hideControls={['transcript']}
          class="transition-opacity {$showVideo ? '' : 'opacity-0'}" />
      </div>

      <!-- Default slot -->
      <slot />
    </main>
  </div>

  <!-- Drawer side menu -->
  <div class="drawer-side z-10">
    <div on:click={closeDrawer} aria-hidden="true" class="drawer-overlay cursor-pointer" />
    <slot name="menu" />
  </div>
</div>
