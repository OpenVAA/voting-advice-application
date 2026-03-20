<!--@component

# App `main` content layout

Defines the layout of the content of the `main` element (following the possible video player) of all the standard pages in the app.

The layout varies slightly based on the presence of a video player.

### Snippet Props

- `children`: main content of the page
- `note`: optional content for the complementary notification displayed at the top of the page, right below the `<header>`
- `hero`: an optional hero image
- `heading`: optional content for the main title block, defaults to a `<h1>` element containing the required `title` property
- `fullWidth`: optional full width content displayed between the default slot and `primaryActions`
- `primaryActions`: optional content for the primary actions displayed at the bottom of the page

### Properties

- `title`: The required page `title`.
- `noteClass`: Optional class string to add to the `<div>` tag wrapping the `note` slot.
- `noteRole`: Aria role for the `note` slot. @default 'note'
- `primaryActionsLabel`: Optional `aria-label` for the section that contains the primary page actions. @default t('common.primaryActions')
- `titleClass`: Optional class string to add to the `<div>` tag wrapping the `title` slot.
- `contentClass`: Optional class string to add to the `<div>` tag wrapping the `default` slot.
- Any valid attributes of a `<div>` element.
-->

<svelte:options runes />

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getComponentContext } from '$lib/contexts/component';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { concatClass } from '$lib/utils/components';
  import type { MainContentProps } from './MainContent.type';

  let {
    title,
    noteClass = 'text-secondary text-center max-w-xl',
    noteRole = 'note',
    primaryActionsLabel = undefined,
    titleClass = '',
    contentClass = '',
    note,
    hero,
    heading,
    fullWidth,
    primaryActions,
    children,
    ...restProps
  }: MainContentProps = $props();

  const { t } = getComponentContext();
  const {
    video: { hasContent: hasVideo }
  } = getLayoutContext(onDestroy);
</script>

<svelte:head>
  <title>{title} – {t('dynamic.appName')}</title>
</svelte:head>

<div
  {...concatClass(restProps, 'flex flex-grow flex-col items-center gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg')}>
  <!-- Note -->
  {#if note}
    <div class={noteClass} role={noteRole}>
      {@render note()}
    </div>
  {/if}

  <div class="flex w-full flex-grow flex-col items-stretch justify-center sm:items-center">
    <!-- Hero image -->
    {#if !$hasVideo}
      {#if hero}
        {@render hero()}
      {/if}
    {/if}

    <!-- Title block -->
    <div class="w-full max-w-xl text-center transition-[padding] {titleClass}" class:py-lg={!$hasVideo}>
      {#if heading}
        {@render heading()}
      {:else}
        <h1>{title}</h1>
      {/if}
    </div>

    <!-- Default content -->
    <div class="flex w-full max-w-xl flex-col items-center {contentClass}">
      {@render children?.()}
    </div>
  </div>

  <!-- Full-width content -->
  {#if fullWidth}
    <div class="-mb-safelgb -ml-safelgl -mr-safelgr flex flex-col items-stretch self-stretch">
      {@render fullWidth()}
    </div>
  {/if}

  <!-- Main actions -->
  {#if primaryActions}
    <section
      class="flex w-full max-w-xl flex-col items-center justify-end"
      aria-label={primaryActionsLabel ?? t('common.primaryActions')}>
      {@render primaryActions()}
    </section>
  {/if}
</div>
