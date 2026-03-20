<svelte:options runes />

<!--
@component
Show a list of possibly wrapped entities with pagination and defined actions.

### Dynamic component

This is a dynamic component, because it renders the dynamic `EntityCard` component.

### Properties

- `cards`: The properties for the `EntityCard`s to show.
- `itemsPerPage`: The number of entities to display on each page of the list. @default `50`
- `itemsTolerance`: The fraction of `itemsPerPage` that can be exceeded on the last page to prevent showing a short last page. @default `0.2`
- `scrollIntoView`: Whether to scroll loaded items into view. This may results in glitches when the list is contained in a modal. @default `true`
- Any valid attributes of a `<div>` element.

### Bindable properties

- `itemsShown`: The number of items currently shown in the list.

### Accessibility

- Loading more items happens using a basic `<button>`, which becomes invisible to when clicked but remains in the DOM.

### Usage

```tsx
<h2>{itemsShown} candidates of {candidates.length}</h2>
<EntityList bind:itemsShown contents={candidates} actionCallBack={({id}) => $getRoute({route: ROUTE.Candidate, id})}/>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { EntityCard } from '$lib/dynamic-components/entityCard';
  import { concatClass } from '$lib/utils/components';
  import { DELAY } from '$lib/utils/timing';
  import type { EntityCardProps } from '$lib/dynamic-components/entityCard';
  import type { EntityListProps } from './EntityList.type';

  let { cards, itemsPerPage = 50, itemsTolerance = 0.2, itemsShown = $bindable(0), scrollIntoView = true, ...restProps }: EntityListProps = $props();

  const { t } = getComponentContext();

  let pages: Array<EntityListProps['cards']> = $state([]);
  let currentPage: number = $state(0);
  const PAGE_CLASS = 'vaa-entity-list-page';
  let div: HTMLDivElement;
  let scrollTimeout: NodeJS.Timeout;

  $effect(() => {
    const newPages: Array<EntityListProps['cards']> = [];
    let start = 0;
    while (start < cards.length) {
      let end = start + itemsPerPage;
      if (cards.length - end <= Math.ceil(itemsPerPage * itemsTolerance)) end = cards.length;
      newPages.push(cards.slice(start, end));
      start = end;
    }
    pages = newPages;
    currentPage = 0;
  });

  $effect(() => { itemsShown = pages.slice(0, currentPage + 1).reduce((acc, page) => acc + page.length, 0); });

  onDestroy(() => { if (scrollTimeout) clearTimeout(scrollTimeout); });

  function showPage(index: number) { currentPage = index; if (scrollIntoView) scrollToCard(index); }

  function scrollToCard(index: number) {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const target = div?.querySelectorAll(`.${PAGE_CLASS}`)?.[index];
      if (target instanceof HTMLElement) { target.scrollIntoView({ behavior: 'smooth' }); target.focus(); }
    }, DELAY.md);
  }
</script>

<div bind:this={div} data-testid="entity-list" {...concatClass(restProps, 'flex flex-col gap-md')}>
  {#each pages as items, i}
    {#if i <= currentPage + 1}
      <div class="{PAGE_CLASS} gap-md flex flex-col" id="div-{i}">
        {#if i <= currentPage}
          {#each items as item}
            {#key item}<EntityCard {...item} />{/key}
          {/each}
        {/if}
        {#if i > 0}
          <Button onclick={() => showPage(i)} class="mt-lg self-center {i <= currentPage ? '!sr-only' : ''}" disabled={i <= currentPage} variant="main" data-testid="entity-list-show-more" text={t('entityList.showMore')} />
        {/if}
      </div>
    {/if}
  {/each}
</div>
