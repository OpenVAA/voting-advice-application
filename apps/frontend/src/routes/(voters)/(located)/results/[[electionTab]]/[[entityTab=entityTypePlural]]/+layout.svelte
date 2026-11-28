<!--@component

# Results entity-tab layout

The middle of the three results route levels. It owns the entity-type tab strip, the resolution of the ACTIVE entity type, and the tab-change handler. The election-tab layout above it owns the page chrome and the election picker; the innermost page below it owns the list and the drawer opener.

## Why the param is optional, and why there is no `+page.svelte` beside this file

`entityTab` is optional and matcher-gated (`entityTypePlural`), like the three params around it. Keeping it optional is what lets a bare `/results/{election}` URL — with no plural segment at all — render this layout and everything below it, with the active tab IMPLIED from the voter context rather than forced into the URL. An implied tab is never written into the URL: a force-filled plural makes the leaf's load guards and `buildListRoute` bounce navigation between the implied and the explicit shape, so `buildListRoute` never defaults it.

There is deliberately NO `+page.svelte` at this level. The list lives on the single innermost page node, so every URL shape resolves to the SAME page component instance and a tab switch updates it rather than remounting it. A page file at this level would serve the implied shape and the explicit shape through different component instances in different route files, so the first switch away from the implied tab would remount the list (see spike 033).

## Chooser instead of children at this level

When the active entity type cannot be resolved — no nominations for the active election — this layout renders the no-nominations warning INSTEAD of `{@render children()}`, which is the same shape the election-tab layout uses when no election can be implied.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Tabs } from '$lib/components/tabs';
  import { getVoterContext } from '$lib/contexts/voter';
  import { buildListRoute, hasEntityDrawer, pluralForEntityType } from '$lib/routes';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import type { EntityType } from '@openvaa/data';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const voterCtx = getVoterContext();
  const { track, t } = voterCtx;

  ////////////////////////////////////////////////////////////////////
  // URL-derived state
  ////////////////////////////////////////////////////////////////////
  //
  // Each level reads the context's URL-derived getters (`currentResultsElection`, `currentResultsEntityType`) and the route params rather than receiving them as props from the level above, so every level stays in step with the URL.

  // The map of plurals available for the active election (possibly just candidates, possibly just organizations, possibly both). Computed from matches so we always render consistent tab labels without going through a separate $state twin.
  type EntityTab = { id: EntityType; label: string };
  const entityTabs = $derived.by<Array<EntityTab>>(() => {
    const electionId = voterCtx.currentResultsElection?.id;
    return electionId && voterCtx.matches[electionId]
      ? (Object.keys(voterCtx.matches[electionId]) as Array<EntityType>).map((type) => ({
          id: type,
          label: ucFirst(t(`common.${type}.plural`))
        }))
      : [];
  });

  const activeEntityType = $derived(voterCtx.currentResultsEntityType);

  // An open drawer is an OVERLAY keyed on `entity` + `id`, not a part of the list hierarchy, and it must mount even when the active entity type cannot be resolved. This carve-out guarantees that an entity URL whose type cannot be resolved still mounts the drawer, over an empty list, rather than a blank page. The reachable case is a bare `/results` whose card links carry no election segment: SvelteKit then slots the PLURAL into the freeform `[[electionTab]]`, no election resolves, and the type goes undefined. `perm-localisation-positive` opens a drawer from exactly that page. The election-tab layout above carries the same carve-out for the unresolved election, so the carve-out applies at both levels.
  const drawerVisible = $derived(hasEntityDrawer(page.params));

  ////////////////////////////////////////////////////////////////////
  // Handlers (all selector changes push to URL)
  ////////////////////////////////////////////////////////////////////

  // `noScroll: true`: the entity-type tabs sit in the lower half of the page, so SvelteKit's default scroll-to-top would throw a voter who has scrolled down to reach them back up to the intro on every switch.
  function handleEntityTabChange(tab: EntityTab): void {
    const plural = pluralForEntityType(tab.id);
    if (!plural) return;
    goto(buildListRoute(voterCtx.currentResultsElection?.id, plural, page), { noScroll: true });
    track('results_changeTab', { entityType: tab.id });
  }
</script>

<div class="pb-safelgb pl-safemdl pr-safemdr match-w-xl:px-0 w-full max-w-xl">
  {#if entityTabs.length > 1}
    <Tabs
      tabs={entityTabs}
      activeTab={activeEntityType}
      onChange={handleEntityTabChange}
      style="view-transition-name: results-entity-tabs"
      data-testid="voter-results-entity-tabs" />
  {/if}

  <!--
    Chooser instead of children at this level, with the overlay carve-out the `drawerVisible` derivation above explains: children render when there is something for them to render — a resolvable list, OR a drawer. The innermost page carries its own narrowing gate on the same value, so in the drawer-only case it mounts the opener and no list.
  -->
  {#if activeEntityType || drawerVisible}
    {@render children()}
  {:else}
    <div class="py-lg text-error text-center text-lg" data-testid="voter-results-no-nominations-warning">
      {t('error.noNominations')}
    </div>
  {/if}
</div>
