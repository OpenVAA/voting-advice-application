<script lang="ts">
  import {concatClass} from '$lib/utils/components';
  import {Page} from '../page';
  import type {SingleCardPageProps} from './SingleCardPage.type';

  type $$Props = SingleCardPageProps;

  export let cardClass: $$Props['cardClass'] = '';

  // We need this explicit typing to get rid of linter errors below
  function _concatClass(props: SvelteRestProps, classes: string) {
    return concatClass(props, classes) as SingleCardPageProps;
  }
</script>

<!--
@component
A template for pages that show just a single card, such as a single candidate.

The content is provided in the default slot with some optional named slots.

Use the properties to add to the classes of the elements containing the slots,
to define some ids, pass Aria labels and show an optional progress bar in the
header. You can also pass any valid properties of the `<Page>` template this
is based on.

### Slots

- default: the card that's the main content of the page
- `banner`: content for the secondary actions displayed on the right
  side of the `<header>`


### Properties

- `title`: The required page `title`.
- `cardClass?`: Optional class string to add to the `<div>` tag that defines the
  card wrapping the `default` slot.
- `class`: Additional class string to append to the element's default classes.
- Any valid properties of the `Page` template.


### Usage

```tsx
  <SingleCardPage title="Nomen Notatur">

    <svelte:fragment slot="banner">
      <Button on:click={addToList} variant="icon" icon="addToList" title="Add to list"/>
    </svelte:fragment>

    <CandidateDetailsCard {candidate} />
        
  </SingleCardPage>
```
-->

<Page {..._concatClass($$restProps, 'bg-base-300')}>
  <!-- Header -->
  <slot name="banner" slot="banner" />

  <!-- The card -->
  <div
    class="-mx-lg -mb-safelgb -mt-lg w-screen max-w-xl flex-grow rounded-t-lg bg-base-100 pb-[3.5rem] lg:shadow-xl {cardClass}">
    <slot />
  </div>
</Page>
