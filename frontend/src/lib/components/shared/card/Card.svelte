<script lang="ts">
  import {concatClass} from '$lib/utils/components';
  import type {CardProps} from './Card.type';

  type $$Props = CardProps;

  export let interactive: $$Props['interactive'] = false;
</script>

<!--@component
A generic card component. For making `Card`s interactive, it is preferred to wrap it in an `<a>` or a `<button>` element, instead of providing an `on:click` handler.

### Properties

- `interactive`: Set to `true` if you want to explicitly use the styling for an interactive card, i.e. shadow on hover and a pointer cursor. The styles are automatically applied if the component is wrapped in an `<a>` or a `<button>`. @default `false`
- Any valid attributes of an `<article>` element

### Slots

- `image`: The image to display in the card, e.g. a portrait or a logo.
- `title`: The card title.
- `subtitle`: The details below the card title, e.g. a candidate's party and election number.
- `callout`: The callout in the corner of the card, e.g. a match percentage.
- default: The content of the card below the other slots, e.g. a candidate's subcategory matches.

### Usage

```tsx
<a href="/candidate/{id}">
  <Card>
    <h3 slot="title">{name}</h3>
    <PartyTag slot="subtitle" {party}/>
    <svelte:fragment slot="callout">
      {match}%
    </svelte:fragment>
    {#each themes as theme}
      <div>{theme}</div>
    {/each}
  </Card>
</a>
```
-->

<article
  {...concatClass(
    $$restProps,
    `vaa-card ${interactive ? 'interactive' : ''} relative flex flex-col rounded-md bg-base-100 px-md py-16 gap-md`
  )}>
  <div class="flex justify-stretch gap-md">
    {#if $$slots.image}
      <div>
        <slot name="image" />
      </div>
    {/if}
    <div class="flex w-full flex-row items-center justify-between gap-md">
      <div class="flex flex-col items-start gap-4">
        {#if $$slots.image}
          <div><slot name="title" /></div>
        {/if}
        {#if $$slots.subtitle}
          <div><slot name="subtitle" /></div>
        {/if}
      </div>
      {#if $$slots.callout}
        <div class="flex flex-row">
          <slot name="callout" />
        </div>
      {/if}
    </div>
  </div>
  {#if $$slots.default}
    <slot />
  {/if}
</article>

<style lang="postcss">
  /* Nb. hover: is a valid class prefix even though the linter flags it */
  :global(a > .vaa-card),
  :global(button > .vaa-card),
  .vaa-card.interactive {
    @apply cursor-pointer text-neutral transition-shadow ease-in-out hover:shadow-xl;
  }
</style>
