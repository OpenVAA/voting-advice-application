<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {Page} from '$lib/components/shared/page';
  import {AppLogo} from '$lib/components/appLogo';
  import {AppNav} from '$lib/components/appNav';
  import {HelpIcon, MenuIcon} from '$lib/components/icons';
  import {IconButton} from '$lib/components/iconButton';
  import type {BasicPageProps} from './BasicPage.type';

  type $$Props = BasicPageProps;

  export let title: $$Props['title'];
  export let hgroupId: $$Props['hgroupId'] = 'mainHgroup';
  export let primaryActionsLabel: $$Props['primaryActionsLabel'] = $_('primaryActionsLabel');

  // Merge default values to $$restProps
  $$restProps.headerClass = `bg-base-300 ${$$restProps.headerClass ?? ''}`;
  $$restProps.asideClass = `text-secondary text-center mb-xl ${$$restProps.asideClass ?? ''}`;
  $$restProps.navLabel ??= $_('header.navLabel');
  // Explicitly hide aside if it's not supplied. We cannot wrap it in an if
  // block below
  if (!$$slots.aside) {
    $$restProps.hideSlots ??= ['aside'];
  }
</script>

<!--
@component
The basic template for pages in the app, including the header and navigation
drawer.

The content is provided in named slots with the tag contents going into the 
main content area.

Use the properties to set the page `title`, set Aria labels and optional element 
`id`s. You can also pass any valid properties to the parent `Page` component
`BasicPage` is based on.

### Properties

- See `BasicPage.type.ts` or code completion info.

### Slots

- default: main content of the page
- `secondaryActions` content for the secondary actions displayed on the right
  side of the `header`, defaults to a Help icon
- `aside` optional content for the complementary notification displayed at the
  top of the page, right below the `header`
- `hero` an optional hero image
- `heading` optional content for the `hgroup` block, defaults to a `h1` element 
  containing the required `title` property
- `primaryActions` optional content for the primary actions displayed at the
  bottom of the page

### Usage

```tsx
  <BasicPage title="Let's start!">

    <HeroEmoji slot="hero">🚀</HeroEmoji>

    <svelte:fragment slot="aside">
      <CheckIcon/> Your constituency is <strong>Loremipsum</strong>
    </svelte:fragment>

    <svelte:fragment slot="heading">
      <p class="text-accent">Preheading</p>
      <h1>Let's Start!</h1>
    </svelte:fragment>

    <svelte:fragment slot="secondaryActions">
      <ListIcon on:click={showList}/>
      <HelpIcon on:click={showHelp}/>
    </svelte:fragment>

    <p class="text-center">
      This is the body text of the page.
    </p>
    
    <svelte:fragment slot="primaryActions">
      <NextButton>Continue</NextButton>
    </svelte:fragment>
    
  </BasicPage>
```
-->

<Page {title} {...$$restProps}>
  <!-- Header -->
  <svelte:fragment slot="navOpen">
    <MenuIcon />
    <AppLogo />
  </svelte:fragment>
  <div slot="header" class="flex gap-0">
    <slot name="secondaryActions">
      <IconButton href="/help" aria-label={$page.data.appLabels.actionLabels.help}>
        <HelpIcon />
      </IconButton>
    </slot>
  </div>

  <!-- Rest of the nav menu -->
  <AppNav slot="nav" />

  <!-- Aside -->
  <slot name="aside" slot="aside" />

  <!-- Main content -->
  <section class="flex flex-grow flex-col items-center justify-center" aria-labelledby={hgroupId}>
    <!-- Hero image -->
    {#if $$slots.hero}
      <figure role="presentation">
        <slot name="hero" />
      </figure>
    {/if}

    <!-- Title block -->
    <hgroup id={hgroupId} class="max-w-xl py-lg text-center">
      <slot name="heading">
        <h1>{title}</h1>
      </slot>
    </hgroup>

    <!-- Main content -->
    <div class="flex max-w-xl flex-col items-center">
      <slot />
    </div>
  </section>

  <!-- Main actions -->
  {#if $$slots.primaryActions}
    <section
      class="mt-lg flex w-full max-w-xl flex-col items-center justify-end"
      aria-label={primaryActionsLabel}>
      <slot name="primaryActions" />
    </section>
  {/if}
</Page>
