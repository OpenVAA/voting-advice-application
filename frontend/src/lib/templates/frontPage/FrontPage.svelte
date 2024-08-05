<script lang="ts">
  import { concatProps } from '$lib/utils/components';
  import { Page } from '../page';
  import { Footer } from '../parts/footer';
  import type { FrontPageProps } from './FrontPage.type';

  type $$Props = FrontPageProps;

  export let title: $$Props['title'];
</script>

<!--
@component
The template for front pages in both the Voter and Candidate Apps.

The content is provided in named slots with the default slot contents forming
the main content.

Use the properties to add to the classes of the elements containing the slots,
to define some ids, pass Aria labels and show an optional progress bar in the
header. You can also pass any valid properties of the `<Page>` template this
is based on.

### Slots

- default: main content of the page
- `header`: content for the secondary actions displayed on the right
  side of the `<header>`
- `hero`: an optional hero image
- `heading`: optional content for the main title block, defaults to a 
  `<h1>` element containing the required `title` property
    
### Properties

- `title`: The required page `title`.
- `class`: Additional class string to append to the element's default classes.
- `headerClass`: Additional class string to append to the `Page` template's `headerClass`.
- `mainClass`: Additional class string to append to the `Page` template's `mainClass`.
- Any valid properties of the `Page` template.

### Usage

```tsx
<FrontPage title="General Elections 2066">
  <svelte:fragment slot="heading">
    <p>{$t('viewTexts.appTitle')}</p>
    <h1>{$page.data.election.name}</h1>
  </svelte:fragment>

  <img
    slot="hero"
    src="/images/hero.png"
    alt="" />

  <p class="text-center">
    Lorem ipsum
  </p>
</FrontPage>

<FrontPage 
  title="Page with full background image"
  class="bg-cover bg-center
         bg-[url('path-to-image.jpg')]
         dark:bg-[url('path-to-image-dark.jpg')]"
  mainClass="bg-base-300 grow-0 mt-0 mx-auto rounded-t-lg max-w-xl">
 ...
</FrontPage>
```
-->

<Page
  {title}
  {...concatProps($$restProps, {
    class: 'bg-base-300',
    headerClass: '!absolute top-0 w-full bg-transparent',
    drawerContentClass: 'justify-end',
    mainClass: '!p-0 min-h-[60vh] sm:min-h-[65vh]'
  })}>
  <!-- Header -->
  <slot name="header" slot="banner" />

  <!-- Default slot for Page starts -->

  <!-- Hero image -->
  {#if $$slots.hero}
    <figure role="presentation" class="vaa-frontpage-hero hero bg-[#d4dbef]">
      <slot name="hero" />
    </figure>
  {/if}

  <div class="flex flex-grow flex-col items-center justify-between pl-safelgl pr-safelgr pt-lg">
    <!-- Title block -->
    <div class="max-w-xl py-lg text-center">
      <slot name="heading">
        <h1>{title}</h1>
      </slot>
      <slot name="banner" />
    </div>

    <!-- Main content -->
    <div class="flex max-w-xl flex-grow flex-col items-center justify-start pb-lg">
      <slot />
    </div>
  </div>

  <Footer />
</Page>

<style lang="postcss">
  :global(.vaa-frontpage-hero > img) {
    @apply h-[40vh] w-full object-cover;
  }
</style>
