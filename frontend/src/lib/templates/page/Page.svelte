<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Icon } from '$lib/components/icon';
  import { NavItem } from '$lib/components/navigation';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { appType } from '$lib/legacy-stores';
  import { concatClass } from '$lib/utils/components';
  import { startEvent } from '$lib/utils/legacy-analytics/track';
  import { CandidateNav, VoterNav } from './parts';
  import { AppLogo } from '../parts/appLogo';
  import type { PageProps } from './Page.type';

  type $$Props = PageProps;

  export let title: $$Props['title'];
  export let drawerToggleId: $$Props['drawerToggleId'] = 'pageDrawerToggle';
  export let mainId: $$Props['mainId'] = 'mainContent';
  export let navId: $$Props['navId'] = 'pageNav';
  export let headerClass: $$Props['headerClass'] = undefined;
  export let drawerContentClass: $$Props['drawerContentClass'] = undefined;
  export let mainClass: $$Props['mainClass'] = undefined;
  export let invertLogo: $$Props['invertLogo'] = false;
  export let progress: $$Props['progress'] = undefined;
  export let progressMin: $$Props['progressMin'] = 0;
  export let progressMax: $$Props['progressMax'] = 100;

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
   * Create a context which can be used by the nested navigation components to close the drawer
   */
  const { navigation } = getLayoutContext(onDestroy);
  navigation.close = closeDrawer;

  // TODO: Fix progress bar color on iOS Safari:
  // see https://stackoverflow.com/questions/38622911/styling-meter-bar-for-mozilla-and-safari
  // TODO: Consider whether we could allow passing of any HTMLElement props to the
  // container elements of the slots instead of just class and label for nav.
</script>

<!--
@component
Use as an abstract template for creating page templates, which still share the 
most important parts of the app layout. It is based on DaisyUI's 
[Drawer component](https://daisyui.com/components/drawer/).

The content is provided in named slots with the default slot contents forming
the page's basic content.

Use the properties to add to the classes of the elements containing the slots,
to define some ids, pass Aria labels and show an optional progress bar in the
header. You can also pass any valid attributes to the root `<div>` element of 
the Drawer component.

### Slots

- default: the page's basic content
- `banner`: content for the rest of the `<header>` after `drawerOpenButton`
- `drawerOpenButton`: icon or text for the button that opens the menu.
  @default The app logo and the menu icon

### Properties

- `title`: The required page `title`.
- `mainId?`: The id used for the `<main>` that contains the page's main content.
  This is needed for the hidden skip link at the start of the page.
  @default 'mainContent'
- `headerClass?`: Optional class string to add to the `<header>` tag wrapping the
  `drawerOpenButton` and `header` slots.
- `mainClass?`: Optional class string to add to the `<div>` tag wrapping the page's
  main content.
- `invertLogo`: Whether to invert the logo and accompanying menu button colors. Set 
  to true if the header is dark. @default `false`
- `navId?`: The id for the `<nav>` element containing the navigation.
  @default 'pageNav'
- `progress?`: Optional value for the progress bar. The bar will be hidden
  if the property is `undefined` or `null`. Use the bar to show the user's
  progress in the application, not as a loading indicator: it uses the
  `<meter>` element.
- `progressMin?`: Optional minimum value for the progress bar.
  @default 0
- `progressMax?`: Optional maximum value for the progress bar.
  @default 100
- `class`: Additional class string to append to the element's default classes.
- Any valid attributes of a `<div>` element.

### Tracking events

- `menu_open`: Fired when the user opens the menu.

### Usage

```tsx
  <Page title="Example page" headerClass="bg-base-100">
    <svelte:fragment slot="banner">
      <Button on:click={showInfo} variant="icon" icon="info" text="Show info"/>
    </svelte:fragment>
    <h1>The page title</h1>
    <p>Main body text</p>
  </Page>
```
-->

<!-- Page title -->
<svelte:head>
  <title>{title} – {$t('dynamic.appName')}</title>
</svelte:head>

<!-- Skip links for screen readers and keyboard users. We use tabindex="1" so that's it's available before any alerts injected by layouts. -->
<!-- svelte-ignore a11y-positive-tabindex -->
<a href="#{mainId}" tabindex="1" class="sr-only focus:not-sr-only">{$t('common.skipToMain')}</a>

<!-- Drawer container -->
<div {...concatClass($$restProps, 'drawer')}>
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
  <div class="drawer-content flex flex-col {drawerContentClass ?? ''}">
    <header
      class="min-h-header relative flex items-center justify-between bg-base-300 pr-6 pt-safet {headerClass ?? ''}">
      <button
        on:click={openDrawer}
        bind:this={drawerOpenElement}
        aria-expanded={drawerOpen}
        aria-controls={navId}
        aria-label={$t('common.openMenu')}
        class="btn btn-ghost drawer-button flex cursor-pointer items-center gap-md {invertLogo
          ? 'text-primary-content'
          : 'text-neutral'}">
        <slot name="drawerOpenButton">
          <Icon name="menu" />
          <AppLogo inverse={invertLogo} aria-hidden="true" />
        </slot>
      </button>
      <!-- The rest of the header -->
      <div class="flex gap-0">
        <slot name="banner" />
      </div>
      {#if progress != null}
        <meter
          id="main-progress-bar"
          value={progress}
          min={progressMin}
          max={progressMax}
          title={$t('common.progress')}
          class="absolute left-0 top-0 h-4 w-full translate-y-[-1px]" />
      {/if}
    </header>
    <main
      id={mainId}
      class="flex flex-grow flex-col items-center pb-safelgb pl-safelgl pr-safelgr pt-lg {mainClass ?? ''}">
      <!-- Main page content -->
      <slot />
    </main>
  </div>

  <!-- Drawer side menu -->
  <div class="drawer-side z-10">
    <div on:click={closeDrawer} aria-hidden="true" class="drawer-overlay cursor-pointer" />
    <!-- Navigation contents -->
    <svelte:component
      this={$appType === 'candidate' ? CandidateNav : VoterNav}
      on:keyboardFocusOut={closeDrawer}
      class="h-full w-4/5 max-w-sm bg-base-100 {drawerOpen ? '' : 'hidden'}"
      id={navId}>
      <NavItem on:click={closeDrawer} icon="close" text={$t('common.closeMenu')} class="pt-16" id="drawerCloseButton" />
    </svelte:component>
  </div>
</div>

<style lang="postcss">
  /* Progress bar */
  #main-progress-bar {
    @apply border-none;
  }
  #main-progress-bar::-webkit-meter-bar {
    @apply border-none bg-transparent bg-none;
  }
  #main-progress-bar::-webkit-meter-optimum-value {
    @apply rounded-r-full bg-primary bg-none;
  }
  #main-progress-bar::-moz-meter-bar {
    @apply rounded-r-full bg-primary bg-none;
  }
</style>
