<!--@component

# App `main` content layout for single cards

Defines the layout of the `main` content for single cards, such as individual entities.

### Slots

- default: main content of the page
- `note`: optional content for the complementary notification displayed at the top of the page, right below the `<header>`

### Properties

- `title`: The required page `title`.
- `noteClass`: Optional class string to add to the `<div>` tag wrapping the `note` slot.
- `noteRole`: Aria role for the `note` slot. @default 'note'
- Any valid attributes of a `<main>` element.
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { MainContentProps } from './MainContent.type';

  type $$Props = Omit<MainContentProps, 'titleClass' | 'primaryActionsLabel'>;

  export let title: $$Props['title'];
  export let noteClass: $$Props['noteClass'] = 'text-secondary text-center max-w-xl -mt-md mb-md';
  export let noteRole: $$Props['noteRole'] = 'note';

  const { t } = getComponentContext();
</script>

<svelte:head>
  <title>{title} – {$t('dynamic.appName')}</title>
</svelte:head>

<main
  {...concatClass($$restProps, 'flex flex-grow flex-col items-center gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg')}>
  <!-- Note -->
  {#if $$slots.note}
    <div class={noteClass} role={noteRole}>
      <slot name="note" />
    </div>
  {/if}

  <div
    class="-mx-lg -mb-safelgb -mt-lg flex w-screen max-w-xl flex-grow self-center rounded-t-lg bg-base-100 pb-[3.5rem] match-w-xl:shadow-xl">
    <!-- Main content -->
    <slot />
  </div>
</main>
