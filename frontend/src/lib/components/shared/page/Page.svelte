<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {CloseIcon, MenuIcon} from '$lib/components/icons';
  import type {PageProps} from './Page.type';

  type $$Props = PageProps;

  export let title: $$Props['title'];
  export let drawerToggleId: $$Props['drawerToggleId'] = 'pageDrawerToggle';
  export let mainId: $$Props['mainId'] = 'mainContent';
  export let navId: $$Props['navId'] = 'pageNav';
  export let asideClass: $$Props['asideClass'] = '';
  export let headerClass: $$Props['headerClass'] = '';
  export let mainClass: $$Props['mainClass'] = '';
  export let mainWrapperClass: $$Props['mainWrapperClass'] = '';
  export let navClass: $$Props['navClass'] = '';
  export let navLabel: $$Props['navLabel'] = undefined;
  export let navOpenLabel: $$Props['navOpenLabel'] = $_('header.openMenu');
  export let navCloseLabel: $$Props['navCloseLabel'] = $_('header.closeMenu');
  export let navToggleLabel: $$Props['navToggleLabel'] = $_('header.toggleMenu');
  export let skipToMainLabel: $$Props['skipToMainLabel'] = $_('header.skipToMain');
  export let progress: $$Props['progress'] = undefined;
  export let progressMin: $$Props['progressMin'] = 0;
  export let progressMax: $$Props['progressMax'] = 100;
  export let progressTitle: $$Props['progressTitle'] = $_('header.progressTitle');
  export let hideSlots: $$Props['hideSlots'] = undefined;

  let drawerOpen = false;
  let drawerCloseElement: HTMLButtonElement | undefined = undefined;
  let drawerOpenElement: HTMLButtonElement | undefined = undefined;

  function toggleDrawer() {
    drawerOpen = !drawerOpen;
    const el = drawerOpen ? drawerCloseElement : drawerOpenElement;
    el?.focus();
    // drawerWrapperElement?.classList.toggle('drawer-open');
  }

  // Merge the necessary drawer class to possible extra classes defined in the props
  $$restProps.class = `drawer ${$$restProps.class ?? ''}`;

  // TODO: Fix progress bar color on iOS Safari:
  // see https://stackoverflow.com/questions/38622911/styling-meter-bar-for-mozilla-and-safari
  // TODO: Consider whether we could allow passing of any HTMLElement props to the
  // container elements of the slots instead of just class and label for nav.
  // TODO: We might need to convert the checkbox that controls the menu to a
  // button and handle showing/hiding with on:click in order to use proper Aria
  // attributes: see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-expanded
</script>

<!--
@component
Use as an abstract template for creating page layout components, which still
share the most important parts of the app layout. It is based on DaisyUI's
[Drawer component](https://daisyui.com/components/drawer/).

The content is provided in named slots with the tag contents going inside the 
`main` element.

Use the properties to add to the classes of the elements containing the slots,
to define some ids and to pass Aria labels. You can also pass any valid
attributes to the root `div` element of the Drawer component.

### Properties

- See `Page.type.ts` or code completion info.

### Slots

- default: content for the `main` element
- `navOpen` icon or text for the button that opens the menu, defaults to the menu
  icon
- `header` content for the rest of the `header` after `navOpen`
- `aside` content for the notification at the top of the page right after `header`
- `navClose` icon or text for the button that closes the menu from within it, 
  defaults to a close icon
- `nav` content for the rest of the `nav` below `navClose`

### Usage

```tsx
  <Page asideClass="text-secondary text-center">
    <svelte:fragment slot="header">
      <button on:click={foo}>Bar</button>
    </svelte:fragment>
    <svelte:fragment slot="aside">
      Your constituency is Loremipsum.
    </svelte:fragment>
    <svelte:fragment slot="nav">
      <ul class="menu-group">
        <li class="menu-item"><a href="#">Home</a></li>
        <li class="menu-item"><a href="#">About</a></li>
      </ul>
    </svelte:fragment>
    <h1>The page title</h1>
    <p>Lorem ipsum</p>
  </Page>
```
-->

<!-- Page title -->
<svelte:head>
  <title>{title} – {$page.data.appLabels.appTitle}</title>
</svelte:head>

<!-- Skip links for screen readers and keyboard users -->
<a href="#{mainId}" class="sr-only focus:not-sr-only">{skipToMainLabel}</a>

<!-- Drawer container -->
<div {...$$restProps}>
  {#if $$slots.nav && !hideSlots?.includes('nav')}
    <!-- NB. The Wave ARIA checker will show an error for this but the use of both the 
      non-hidden labels in aria-labelledby should be okay for screen readers. -->
    <input
      id={drawerToggleId}
      bind:checked={drawerOpen}
      type="checkbox"
      class="drawer-toggle"
      tabindex="-1"
      aria-label={navToggleLabel} />
  {/if}
  <!-- Drawer content -->
  <div class="drawer-content flex flex-col">
    {#if $$slots.header && !hideSlots?.includes('header')}
      <header
        class="relative flex min-h-header items-center justify-between pr-6 pt-safet {headerClass}">
        {#if $$slots.nav && !hideSlots?.includes('nav')}
          <button
            on:click={toggleDrawer}
            bind:this={drawerOpenElement}
            aria-expanded={drawerOpen}
            aria-controls={navId}
            class="btn-ghost drawer-button btn flex cursor-pointer items-center gap-md text-neutral">
            <slot name="navOpen">
              <MenuIcon title={navOpenLabel} />
            </slot>
          </button>
        {/if}
        <slot name="header" />
        {#if progress != null}
          <meter
            id="main-progress-bar"
            value={progress}
            min={progressMin}
            max={progressMax}
            title={progressTitle}
            class="absolute bottom-0 left-0 h-4 w-full translate-y-[50%]" />
        {/if}
      </header>
    {/if}
    <div
      class="flex flex-grow flex-col items-center pb-safelgb pl-safelgl pr-safelgr pt-lg {mainWrapperClass}">
      {#if $$slots.aside && !hideSlots?.includes('aside')}
        <aside class={asideClass}>
          <slot name="aside" />
        </aside>
      {/if}
      <main
        id={mainId}
        tabindex="-1"
        class="flex w-full flex-grow flex-col items-center justify-center {mainClass}">
        <slot />
      </main>
    </div>
  </div>
  <!-- Drawer side menu -->
  <div class="drawer-side">
    {#if $$slots.nav && !hideSlots?.includes('nav')}
      <label
        for={drawerToggleId}
        aria-hidden="true"
        aria-label={navCloseLabel}
        class="drawer-overlay cursor-pointer" />
      <nav class="menu w-4/5 max-w-sm bg-base-100 {navClass}" aria-label={navLabel} id={navId}>
        <!-- TODO: The close button should be placed at the same position as the opening button in the header
             and have a height equalt to that of the header. It's now calculated by hand (24 + top padding
             + bottom padding) and liable to fall out of kilter if the logo is changed... -->
        <button
          on:click={toggleDrawer}
          bind:this={drawerCloseElement}
          tabindex="0"
          class="flex min-h-[3.5rem] items-center gap-md px-16 !pt-safenavt pb-md hover:bg-base-200 active:bg-base-200">
          <slot name="navClose">
            <CloseIcon title={navCloseLabel} />
          </slot>
        </button>
        <slot name="nav" />
      </nav>
    {/if}
  </div>
</div>

<style>
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
</style>
