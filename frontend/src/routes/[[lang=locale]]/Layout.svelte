<!--@component

# App `main` content layout

Defines the layout of the `main` content of all the standard pages in the app.

### Slots

- default: main content of the page
- `note`: optional content for the complementary notification displayed at the top of the page, right below the `<header>`
- `hero`: an optional hero image
- `heading`: optional content for the main title block, defaults to a `<h1>` element containing the required `title` property
- `primaryActions`: optional content for the primary actions displayed at the bottom of the page

### Properties

- `title`: The required page `title`.
- `noteClass`: Optional class string to add to the `<div>` tag wrapping the `note` slot.
- `noteRole`: Aria role for the `note` slot. @default 'note'
- `primaryActionsLabel`: Optional `aria-label` for the section that contains the primary page actions. @default $t('common.primaryActions')
- `titleClass`: Optional class string to add to the `<div>` tag wrapping the `title` slot.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { NavItem } from '$lib/dynamic-components/navigation';
  import { CandidateNav, VoterNav } from '$lib/templates/page/parts';
  import Header from './Header.svelte';
  import type { BasicPageProps } from '$lib/templates/basicPage';

  export let title: BasicPageProps['title'];
  export let noteClass: BasicPageProps['noteClass'] = 'text-secondary text-center max-w-xl';
  export let noteRole: BasicPageProps['noteRole'] = 'note';
  export let primaryActionsLabel: BasicPageProps['primaryActionsLabel'] = undefined;
  export let titleClass: BasicPageProps['titleClass'] = '';

  ////////////////////////////////////////////////////////////////////
  // Constants
  ////////////////////////////////////////////////////////////////////

  const drawerToggleId = 'pageDrawerToggle';
  const mainId = 'mainContent';
  const navId = 'pageNav';

  ////////////////////////////////////////////////////////////////////
  // Layout and navigation menu management
  ////////////////////////////////////////////////////////////////////

  const { appType, startEvent, t } = getAppContext();

  let drawerOpen = false;
  let drawerOpenElement: HTMLButtonElement | undefined;

  /**
   * Open the drawer. We also focus on the relevant element to make it easy
   * to toggle it back when using keyboard navigation.
   */
  function openDrawer() {
    drawerOpen = true;
    // We need a small timeout for drawerCloseButton to be focusable
    setTimeout(() => document.getElementById('drawerCloseButton')?.focus(), 50);
    startEvent('menu_open');
  }

  /**
   * Close the drawer. We also focus on the relevant element to make it easy
   * to toggle it back when using keyboard navigation.
   */
  function closeDrawer() {
    drawerOpen = false;
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

<svelte:head>
  <title>{title} – {$t('dynamic.appName')}</title>
</svelte:head>

<!-- Drawer container -->
<div class="drawer {$pageStyles.drawer.background}">
  <!-- NB. The Wave ARIA checker will show an error for this, but the use of both the 
    non-hidden labels in aria-labelledby should be okay for screen readers. -->
  <input
    id={drawerToggleId}
    bind:checked={drawerOpen}
    type="checkbox"
    class="drawer-toggle"
    tabindex="-1"
    aria-hidden="true"
    aria-label={$t('common.openCloseMenu')} />

  <!-- Drawer content -->
  <div class="drawer-content flex flex-col">
    <Header {navId} {openDrawer} {drawerOpen} {drawerOpenElement} />
    <main id={mainId} class="flex flex-grow flex-col items-center gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg">
      <!-- Note -->
      {#if $$slots.note}
        <div class={noteClass} role={noteRole}>
          <slot name="note" />
        </div>
      {/if}

      <div class="flex w-full flex-grow flex-col items-stretch justify-center sm:items-center">
        <!-- Video -->
        <!-- {#if $$slots.video}
                <div
                  bind:clientHeight={videoHeight}
                  bind:clientWidth={videoWidth}
                  class="-ml-safelgl -mr-safelgr -mt-lg flex w-screen justify-center sm:w-full {hasVideo
                    ? 'grow'
                    : ''} sm:mt-[1.75rem] sm:grow-0">
                  <slot name="video" />
                </div>
             {/if} -->

        <!-- Hero image -->
        <slot name="hero" />

        <!-- Title block -->
        <div class="w-full max-w-xl py-lg text-center {titleClass}">
          <slot name="heading">
            <h1>{title}</h1>
          </slot>
        </div>

        <!-- Main content -->
        <div class="flex w-full max-w-xl flex-col items-center">
          <slot />
        </div>
      </div>

      <!-- Main actions -->
      {#if $$slots.primaryActions}
        <section
          class="flex w-full max-w-xl flex-col items-center justify-end"
          aria-label={primaryActionsLabel ?? $t('common.primaryActions')}>
          <slot name="primaryActions" />
        </section>
      {/if}
    </main>
  </div>

  <!-- Drawer side menu -->
  <div class="drawer-side z-10">
    <div on:click={closeDrawer} aria-hidden="true" class="drawer-overlay cursor-pointer" />
    <svelte:component
      this={$appType === 'candidate' ? CandidateNav : VoterNav}
      on:keyboardFocusOut={closeDrawer}
      class="min-h-full w-4/5 max-w-sm bg-base-100 {drawerOpen ? '' : 'hidden'}"
      id={navId}>
      <NavItem on:click={closeDrawer} icon="close" text={$t('common.closeMenu')} class="pt-16" id="drawerCloseButton" />
    </svelte:component>
  </div>
</div>
