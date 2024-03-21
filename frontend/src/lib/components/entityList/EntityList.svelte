<script lang="ts">
  import {onDestroy} from 'svelte';
  import {error} from '@sveltejs/kit';
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import {logDebugError} from '$lib/utils/logger';
  import {Button} from '$lib/components/button';
  import {EntityCard, type EntityCardProps} from '$lib/components/entityCard';
  import type {CardAction, EntityListProps} from './EntityList.type';

  type $$Props = EntityListProps;

  export let entities: $$Props['entities'] = undefined;
  export let rankings: $$Props['rankings'] = undefined;
  export let actionCallBack: $$Props['actionCallBack'] = undefined;
  export let itemsPerPage: NonNullable<$$Props['itemsPerPage']> = 10;
  export let itemsTolerance: NonNullable<$$Props['itemsTolerance']> = 0.2;
  export let itemsShown: $$Props['itemsShown'] = 0;

  /** All of the list items regardless of their type */
  let allItems: Array<RankingProps<EntityProps> | EntityProps>;
  /** The items spread onto pages */
  let pages: Array<Array<RankingProps<EntityProps> | EntityProps>>;
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
    if (rankings && entities) throw error(500, 'Only supply either entities or rankings.');
    if (!rankings && !entities) throw error(500, 'Supply either entities or rankings.');
    allItems = (rankings ? rankings : entities) as Array<RankingProps<EntityProps> | EntityProps>;
    pages = [];
    currentPage = 0;
    let start = 0;
    while (start < allItems.length) {
      let end = start + itemsPerPage;
      // The batch size is `itemsPerPage` unless the last batch would fall within `itemsTolerance` in which case it is combined with the second to last batch
      if (allItems.length - end <= Math.ceil(itemsPerPage * itemsTolerance)) {
        end = allItems.length;
      }
      pages.push(allItems.slice(start, end));
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
   * Parse the `EntityCardProps` and `CardAction` for an item that may be either a ranking or an entity.
   * @param item A ranking or an entity
   * @returns {ecProps, action}
   */
  function parseItem(item: RankingProps<EntityProps> | EntityProps): {
    ecProps: EntityCardProps;
    action: CardAction;
  } {
    const isRanking = 'entity' in item;
    const entity = isRanking ? item.entity : item;
    return {
      ecProps: isRanking ? {ranking: item as RankingProps<EntityProps>} : {entity},
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

- `actionCallBack`: An optional function that is called for each entity in the list to determine the action to be performed when the entity card is clicked. @default `undefined`
- `entityCardProps`: Optional properties that will be passed to each `EntityCard` in the list. @default `undefined`
- `itemsPerPage`: The number of entities to display on each page of the list. @default `10`
- `itemsTolerance`: The fraction of `itemsPerPage` that can be exceeded on the last page to prevent showing a short last page. @default `0.2`
- `entities`: A list of candidates or a parties if no rankings are available.
- `rankings`: A list of ranked entities, i.e. candidates or parties.

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
  entities={candidates} 
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
              {logDebugError(`Unknown action type: ${typeof action}`)}
              <EntityCard {...ecProps} />
            {/if}
          {/each}
        {/if}
        <!-- Show the button for the next page. We use sr-only to keep in the DOM even after it has been clicked for better keyboard navigation -->
        <Button
          on:click={() => showPage(i)}
          class="mt-lg self-center {i <= currentPage ? 'sr-only' : ''}"
          disabled={i <= currentPage}
          variant="main"
          text={$t('components.entityList.showMore')} />
      </div>
    {/if}
  {/each}
</div>
