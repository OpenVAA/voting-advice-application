<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {Page} from '$lib/components/shared/page';
  import {AppLogo} from '$lib/components/appLogo';
  import {AppNav} from '$lib/components/appNav';
  import {HelpIcon, MenuIcon} from '$lib/components/icons';
  import type {FrontPageProps} from './FrontPage.type';

  type $$Props = FrontPageProps;

  export let title: $$Props['title'];
  export let hgroupId: $$Props['hgroupId'] = 'mainHgroup';

  // Merge default values to $$restProps
  $$restProps.headerClass = `!absolute w-full bg-transparent ${$$restProps.headerClass ?? ''}`;
  $$restProps.mainWrapperClass = `!p-0 ${$$restProps.mainWrapperClass ?? ''}`;
  $$restProps.navLabel ??= $_('header.navLabel');
</script>

<Page {title} {...$$restProps}>
  <!-- Header -->
  <svelte:fragment slot="navOpen">
    <MenuIcon />
    <AppLogo />
  </svelte:fragment>

  <div slot="header">
    <a class="btn-ghost btn" href="/help">
      <HelpIcon title={$page.data.appLabels.actionLabels.help} />
    </a>
  </div>

  <!-- Rest of the nav menu -->
  <AppNav slot="nav" />

  <!-- Main content -->
  <!-- Hero image -->
  {#if $$slots.hero}
    <figure role="presentation" class="hero bg-[#d4dbef]">
      <slot name="hero" />
    </figure>
  {/if}

  <div
    class="flex flex-grow flex-col items-center justify-between pb-safelgb pl-safelgl pr-safelgr pt-lg">
    <!-- Title block -->
    <hgroup id={hgroupId} class="max-w-xl py-lg text-center">
      <slot name="heading">
        <h1>{title}</h1>
      </slot>
    </hgroup>

    <!-- Main content -->
    <div class="flex max-w-xl flex-grow flex-col items-center justify-start pb-lg">
      <slot />
    </div>

    <!-- Footer -->
    <footer class="mt-lg text-center text-sm text-secondary">
      <slot name="footer" />
    </footer>
  </div>
</Page>
