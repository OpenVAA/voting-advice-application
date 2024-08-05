<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import { Page } from '../page';
  import type { SingleCardPageProps } from './SingleCardPage.type';

  type $$Props = SingleCardPageProps;

  export let cardClass: $$Props['cardClass'] = '';
  export let noteClass: $$Props['noteClass'] = '-mt-md mb-xl text-secondary text-center';
  export let noteRole: $$Props['noteRole'] = 'note';

  // We need this explicit typing to get rid of linter errors below
  function _concatClass(props: SvelteRestProps, classes: string) {
    return concatClass(props, classes) as SingleCardPageProps;
  }
</script>

<!--
@component
A template for pages that show just a single card, such as a single candidate.

The content is provided in the default slot with some optional named slots.

Use the properties to add to the classes of the elements containing the slots, to define some ids, pass Aria labels and show an optional progress bar in the header. You can also pass any valid properties of the `<Page>` template this is based on.

### Slots

- default: the card that's the main content of the page
- `banner`: content for the secondary actions displayed on the right side of the `<header>`

### Properties

- `title`: The required page `title`.
- `cardClass?`: Optional class string to add to the `<div>` tag that defines the card wrapping the `default` slot.
- `noteClass?`: Optional class string to add to the `<div>` tag wrapping the `note` slot.
- `noteRole?`: Aria role for the `note` slot. @default `'note'`
- `class`: Additional class string to append to the element's default classes.
- Any valid properties of the `<Page>` template.


### Usage

```tsx
  <SingleCardPage title="Nomen Notatur">

    <svelte:fragment slot="banner">
      <Button on:click={addToList} variant="icon" icon="addToList" title="Add to list"/>
    </svelte:fragment>

    <span slot="note" class="text-warning">Warning!</span>

    <EntityDetails content={candidate} />
        
  </SingleCardPage>
```
-->

<Page {..._concatClass($$restProps, 'bg-base-300')}>
  <!-- Header -->
  <slot name="banner" slot="banner" />

  <!-- Note -->
  {#if $$slots.note}
    <div class={noteClass} role={noteRole}>
      <slot name="note" />
    </div>
  {/if}

  <!-- The card -->
  <div
    class="-mx-lg -mb-safelgb -mt-lg flex w-screen max-w-xl flex-grow self-center rounded-t-lg
           bg-base-100 pb-[3.5rem] match-w-xl:shadow-xl {cardClass}">
    <slot />
  </div>
</Page>
