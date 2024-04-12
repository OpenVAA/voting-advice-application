<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {onDestroy} from 'svelte';
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import {parseMaybeRanked} from '$lib/utils/entities';
  import {Button} from '$lib/components/button';
  import {EntityCard, type EntityCardProps} from '$lib/components/entityCard';
  import type {CardAction, EntityListProps} from './EntityList.type';

  type $$Props = EntityListProps;

  export let contents: $$Props['contents'];
  export let actionCallBack: $$Props['actionCallBack'] = undefined;
  export let entityCardProps: $$Props['entityCardProps'] = undefined;
  export let itemsPerPage: NonNullable<$$Props['itemsPerPage']> = 10;
  export let itemsTolerance: NonNullable<$$Props['itemsTolerance']> = 0.2;
  export let itemsShown: $$Props['itemsShown'] = 0;

  /** The items spread onto pages */
  let pages: Array<$$Props['contents']>;
  /** The index of the currently shown page (the previous pages are also shown) */
  let currentPage: number;

  /** Used for a query selector with automatic scrolling */
  const PAGE_CLASS = 'vaa-entity-list-page';
  /** A small delay before scrolling so that the content has had time to expand. */
  const SCROLL_DELAY = 350;
  /** The container for the cards */
  let div: HTMLDivElement;
  /** This stores the scrolling timeout */
  let scrollTimeout: NodeJS.Timeout;

  // Paginate items onto pages reactively, so that subsequent changes to the entities, e.g. due to filters, are reflected
  $: {
    pages = [];
    currentPage = 0;
    let start = 0;
    while (start < contents.length) {
      let end = start + itemsPerPage;
      // The batch size is `itemsPerPage` unless the last batch would fall within `itemsTolerance` in which case it is combined with the second to last batch
      if (contents.length - end <= Math.ceil(itemsPerPage * itemsTolerance)) {
        end = contents.length;
      }
      pages.push(contents.slice(start, end));
      start = end;
    }
  }

  // Update itemsShown when pages or currentPage changes
  $: itemsShown = pages.slice(0, currentPage + 1).reduce((acc, page) => acc + page.length, 0);

  // Cleanup
  onDestroy(() => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
  });

  /**
   * Parse the `MaybeRanked` and `CardAction` for an item.
   * @param item A possibly ranked entity.
   * @returns {ecProps, action}
   */
  function parseItem(item: MaybeRanked): {
    ecProps: EntityCardProps;
    action: CardAction;
  } {
    const {entity} = parseMaybeRanked(item);
    return {
      ecProps: {...entityCardProps, content: item},
      action: actionCallBack ? actionCallBack(entity) : undefined
    };
  }

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
        target.scrollIntoView({behavior: 'smooth'});
        target.focus();
      }
    }, SCROLL_DELAY);
  }
</script>

<!--
@component
Show a list of entities with pagination and defined actions.

### Properties

- `contents`: A list of possibly ranked entities, e.g. candidates or a parties.
- `actionCallBack`: An optional function that is called for each entity in the list to determine the action to be performed when the entity card is clicked. @default `undefined`
- `entityCardProps`: Optional properties that will be passed to each `EntityCard` in the list. @default `undefined`
- `itemsPerPage`: The number of entities to display on each page of the list. @default `10`
- `itemsTolerance`: The fraction of `itemsPerPage` that can be exceeded on the last page to prevent showing a short last page. @default `0.2`
- Any valid attributes of a `<div>` element.

### Bindable properties

- `itemsShown`: The number of items currently shown in the list.

### Accessibility

- If such an `actionCallBack` is defined that returns either url strings or `MouseEvent` handlers for the entities, they will be wrapped in tabbable `<a>` or `<button>` elements.
- Loading more items happens using a basic `<button>`, which becomes invisible to when clicked but remains in the DOM.

### Usage

```tsx
<h2>{itemsShown} candidates of {candidates.length}</h2>
<EntityList 
  bind:itemsShown
  contents={candidates} 
  actionCallBack={({id}) => $getRoute({route: Route.Candidate, id})}/>
```
-->

<div bind:this={div} {...concatClass($$restProps, 'flex flex-col gap-md')}>
  {#each pages as items, i}
    <!-- Don't render even the show button for pages beyond the next page -->
    {#if i <= currentPage + 1}
      <div class="{PAGE_CLASS} flex flex-col gap-md" id="div-{i}">
        {#if i <= currentPage}
          <!-- Show the contents for the current page and those before it -->
          {#each items as item}
            {@const {ecProps, action} = parseItem(item)}
            {#if action == null}
              <EntityCard {...ecProps} />
            {:else if typeof action === 'function'}
              <button on:click={action}>
                <EntityCard {...ecProps} />
              </button>
            {:else if typeof action === 'string'}
              <a href={action}>
                <EntityCard {...ecProps} />
              </a>
            {:else}
              {error(500, `Unknown action type: ${typeof action}`)}
            {/if}
          {/each}
        {/if}
        {#if i > 0}
          <!-- Show the button for the next page. We use sr-only to keep in the DOM even after it has been clicked for better keyboard navigation -->
          <Button
            on:click={() => showPage(i)}
            class="mt-lg self-center {i <= currentPage ? '!sr-only' : ''}"
            disabled={i <= currentPage}
            variant="main"
            text={$t('components.entityList.showMore')} />
        {/if}
      </div>
    {/if}
  {/each}
</div>
