<script lang="ts">
  import {Page} from '../page';
  import type {FrontPageProps} from './FrontPage.type';

  type $$Props = FrontPageProps;

  export let title: $$Props['title'];

  // Merge default values to $$restProps
  $$restProps.class = `bg-base-300 ${$$restProps.class ?? ''}`;
  $$restProps.headerClass = `!absolute w-full bg-transparent ${$$restProps.headerClass ?? ''}`;
  $$restProps.mainClass = `!p-0 ${$$restProps.mainClass ?? ''}`;
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
  - `footer`: the footer to display at the bottom of the page
    
### Properties

- `title`: The required page `title`.
- Any valid properties of the `Page` template.

### Usage

```tsx
<FrontPage title="General Elections 2066">

  <svelte:fragment slot="heading">
    <p>{$page.data.appLabels.appTitle}</p>
    <h1>{$page.data.election.name}</h1>
  </svelte:fragment>

  <img
    slot="hero"
    src="/images/hero.png"
    alt="" />

  <p class="text-center">
    Lorem ipsum
  </p>

  <svelte:fragment slot="footer">
    Footer contents
  </svelte:fragment>

</FrontPage>

```
-->

<Page {title} {...$$restProps}>
  <!-- Header -->
  <slot name="header" slot="banner" />

  <!-- Default slot for Page starts -->

  <!-- Hero image -->
  {#if $$slots.hero}
    <figure role="presentation" class="hero bg-[#d4dbef]">
      <slot name="hero" />
    </figure>
  {/if}

  <div class="flex flex-grow flex-col items-center justify-between pl-safelgl pr-safelgr pt-lg">
    <!-- Title block -->
    <div class="max-w-xl py-lg text-center">
      <slot name="heading">
        <h1>{title}</h1>
      </slot>
    </div>

    <!-- Main content -->
    <div class="flex max-w-xl flex-grow flex-col items-center justify-start pb-lg">
      <slot />
    </div>
  </div>

  <!-- Footer -->
  <footer class="mt-lg pb-safelgb text-center text-sm text-secondary">
    <slot name="footer" />
  </footer>
</Page>

<style lang="postcss">
  .hero > img {
    @apply h-[30vh] w-full max-w-lg object-cover;
  }
</style>
