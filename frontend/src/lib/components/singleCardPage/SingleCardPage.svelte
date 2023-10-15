<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {Page} from '$lib/components/shared/page';
  import {AppLogo} from '$lib/components/appLogo';
  import {AppNav} from '$lib/components/appNav';
  import {HelpIcon, MenuIcon} from '$lib/components/icons';
  import {IconButton} from '$lib/components/iconButton';
  import type {SingleCardPageProps} from './SingleCardPage.type';

  type $$Props = SingleCardPageProps;

  export let title: $$Props['title'];

  // Merge default values to $$restProps
  $$restProps.headerClass = `bg-base-300 ${$$restProps.headerClass ?? ''}`;
  $$restProps.asideClass = `text-secondary text-center mb-xl ${$$restProps.asideClass ?? ''}`;
  $$restProps.navLabel ??= $_('header.navLabel');
  // Explicitly hide aside if it's not supplied. We cannot wrap it in an if
  // block below
  if (!$$slots.aside) {
    $$restProps.hideSlots ??= ['aside'];
  }

  // TODO: This template has a bit of code copy-pasted from `BasicPage.svelte`.
  // It might be better to create a common parent for both of these.
</script>

<!--
@component
A template for pages that show just a single card, such as a single candidate.

The content is provided in the default slot with some optional named slots.

Use the properties to set the page `title`, set Aria labels and optional element 
`id`s. You can also pass any valid properties to the parent `Page` component
`SingleCardPage` is based on.

### Properties

- See `SingleCardPage.type.ts` or code completion info.

### Slots

- default: the card that's the main content of the page
- `secondaryActions` content for the secondary actions displayed on the right
  side of the `header`, defaults to a Help icon
- `aside` optional content for the complementary notification displayed at the
  top of the page, right below the `header`

### Usage

```tsx
  <SingleCardPage title="Nomen Notatur">

    <svelte:fragment slot="secondaryActions">
      <AddToListIcon on:click={addToList}/>
      <HelpIcon on:click={showHelp}/>
    </svelte:fragment>

    <CandidateDetailsCard {candidate} />
        
  </SingleCardPage>
```
-->

<Page {title} {...$$restProps} class="bg-base-300">
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

  <!-- The card -->
  <div
    class="-mx-lg -mb-safelgb -mt-lg w-screen max-w-xl flex-grow rounded-t-lg bg-base-100 pb-[3.5rem] lg:shadow-xl">
    <slot />
  </div>
</Page>
