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
  import { getComponentContext } from '$lib/contexts/component';
  import type { MainContentProps } from './MainContent.type';

  type $$Props = MainContentProps;

  export let title: $$Props['title'];
  export let noteClass: $$Props['noteClass'] = 'text-secondary text-center max-w-xl';
  export let noteRole: $$Props['noteRole'] = 'note';
  export let primaryActionsLabel: $$Props['primaryActionsLabel'] = undefined;
  export let titleClass: $$Props['titleClass'] = '';

  const { t } = getComponentContext();

  /** We use `videoHeight` and `videoWidth` as proxies to check for the presence of content in the `video` slot. Note that we cannot merely check if the slot is provided, because it might be empty. */
  // let videoHeight = 0;
  // let videoWidth = 0;
  // let hasVideo = videoWidth > 0 && videoHeight > 0;
</script>

<svelte:head>
  <title>{title} – {$t('dynamic.appName')}</title>
</svelte:head>

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
