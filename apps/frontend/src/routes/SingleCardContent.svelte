<!--@component

# App `main` content layout for single cards

Defines the layout of the content of the `main` element (following the possible video player) for single cards, such as individual entities, when are not opened in a `Drawer`.

### Snippets

- `children`: main content of the page
- `note`: optional content for the complementary notification displayed at the top of the page, right below the `<header>`

### Properties

- `title`: The required page `title`.
- `noteClass`: Optional class string to add to the `<div>` tag wrapping the `note` snippet.
- `noteRole`: Aria role for the `note` snippet. @default 'note'
- Any valid attributes of a `<div>` element.
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { MainContentProps } from './MainContent.type';

  type SingleCardContentProps = Omit<MainContentProps, 'titleClass' | 'primaryActionsLabel'> & {
    note?: Snippet;
    children?: Snippet;
  };

  let {
    title,
    noteClass = 'text-secondary text-center max-w-xl -mt-md mb-md',
    noteRole = 'note',
    note,
    children,
    ...restProps
  }: SingleCardContentProps = $props();

  const { t } = getComponentContext();
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

  <div
    class="-mx-lg -mb-safelgb -mt-lg bg-base-100 match-w-xl:shadow-xl flex w-screen max-w-xl flex-grow flex-col self-center rounded-t-lg">
    <!-- Main content -->
    {@render children?.()}
  </div>
</div>
