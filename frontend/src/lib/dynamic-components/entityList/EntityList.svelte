<!--
@component
Show a list of possibly wrapped entities with pagination and defined actions.

### Dynamic component

This is a dynamic component, because it renders the dynamic `EntityCard` component.

### Properties

- `cards`: The properties for the `EntityCard`s to show.
- `itemsPerPage`: The number of entities to display on each page of the list. @default `50`
- `itemsTolerance`: The fraction of `itemsPerPage` that can be exceeded on the last page to prevent showing a short last page. @default `0.2`
- Any valid attributes of a `<div>` element.

### Bindable properties

- `itemsShown`: The number of items currently shown in the list.

### Accessibility

- Loading more items happens using a basic `<button>`, which becomes invisible to when clicked but remains in the DOM.

### Usage

```tsx
<h2>{itemsShown} candidates of {candidates.length}</h2>
<EntityList 
  bind:itemsShown
  contents={candidates} 
  actionCallBack={({id}) => $getRoute({route: ROUTE.Candidate, id})}/>
```
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { EntityCard } from '$lib/dynamic-components/entityCard';
  import { concatClass } from '$lib/utils/components';
  import type { EntityListProps } from './EntityList.type';
  import { getComponentContext } from '$lib/contexts/component';
  import { DELAY } from '$lib/utils/timing';

  type $$Props = EntityListProps;

  export let cards: $$Props['cards'];
  export let itemsPerPage: NonNullable<$$Props['itemsPerPage']> = 50;
  export let itemsTolerance: NonNullable<$$Props['itemsTolerance']> = 0.2;
  export let itemsShown: $$Props['itemsShown'] = 0;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Pagination and scrolling
  ////////////////////////////////////////////////////////////////////

  /** The items spread onto pages */
  let pages: Array<$$Props['cards']>;
  /** The index of the currently shown page (the previous pages are also shown) */
  let currentPage: number;

  /** Used for a query selector with automatic scrolling */
  const PAGE_CLASS = 'vaa-entity-list-page';
  /** The container for the cards */
  let div: HTMLDivElement;
  /** This stores the scrolling timeout */
  let scrollTimeout: NodeJS.Timeout;

  // Paginate items onto pages reactively, so that subsequent changes to the entities, e.g. due to filters, are reflected
  $: {
    pages = [];
    currentPage = 0;
    let start = 0;
    while (start < cards.length) {
      let end = start + itemsPerPage;
      // The batch size is `itemsPerPage` unless the last batch would fall within `itemsTolerance` in which case it is combined with the second to last batch
      if (cards.length - end <= Math.ceil(itemsPerPage * itemsTolerance)) {
        end = cards.length;
      }
      pages.push(cards.slice(start, end));
      start = end;
    }
  }

  // Update itemsShown when pages or currentPage changes
  $: itemsShown = pages.slice(0, currentPage + 1).reduce((acc, page) => acc + page.length, 0);

  // Cleanup
  onDestroy(() => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
  });

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  /**
   * Show the items for the page and scroll them into view.
   */
  function showPage(index: number) {
    currentPage = index;
    scrollToCard(index);
  }

  /**
   * Scroll to a the card indexed by `scrollTo` after a small delay so that the content has had time to expand.
   */
  function scrollToCard(index: number) {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const target = div?.querySelectorAll(`.${PAGE_CLASS}`)?.[index];
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth' });
        target.focus();
      }
    }, DELAY.md);
  }
</script>

<div bind:this={div} {...concatClass($$restProps, 'flex flex-col gap-md')}>
  {#each pages as items, i}
    <!-- Don't render even the show button for pages beyond the next page -->
    {#if i <= currentPage + 1}
      <div class="{PAGE_CLASS} flex flex-col gap-md" id="div-{i}">
        {#if i <= currentPage}
          <!-- Show the contents for the current page and those before it -->
          {#each items as item}
            {#key item}
              <EntityCard {...item} />
            {/key}
          {/each}
        {/if}
        {#if i > 0}
          <!-- Show the button for the next page. We use sr-only to keep in the DOM even after it has been clicked for better keyboard navigation -->
          <Button
            on:click={() => showPage(i)}
            class="mt-lg self-center {i <= currentPage ? '!sr-only' : ''}"
            disabled={i <= currentPage}
            variant="main"
            text={$t('entityList.showMore')} />
        {/if}
      </div>
    {/if}
  {/each}
</div>
