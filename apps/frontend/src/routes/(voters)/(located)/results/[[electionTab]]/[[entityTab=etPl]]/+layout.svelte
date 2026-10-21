<!--@component

# Results entity-tab layout

The middle of the three results route levels. It owns the entity-type tab strip, the resolution of the ACTIVE entity type, and the tab-change handler. The election-tab layout above it owns the page chrome and the election picker; the innermost page below it owns the list and the drawer opener.

## Why the param is optional, and why there is no `+page.svelte` beside this file

`entityTab` is optional and matcher-gated (`etPl`), like the three params around it. Keeping it optional is what lets a bare `/results/{election}` URL — with no plural segment at all — render this layout and everything below it, with the active tab IMPLIED from the voter context rather than forced into the URL. An implied tab is never written into the URL: a force-filled plural makes the leaf's load guards and `buildListRoute` bounce navigation between the implied and the explicit shape, so `buildListRoute` never defaults it.

There is deliberately NO `+page.svelte` at this level. The list lives on the single innermost page node, so every URL shape resolves to the SAME page component instance and a tab switch updates it rather than remounting it. A page file at this level would serve the implied shape and the explicit shape through different component instances in different route files, so the first switch away from the implied tab would remount the list (see spike 033).

## Chooser instead of children at this level

When the active entity type cannot be resolved — no nominations for the active election — this layout renders the no-nominations warning INSTEAD of `{@render children()}`, which is the same shape the election-tab layout uses when no election can be implied.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { Tabs } from '$lib/components/tabs';
  import { getVoterContext } from '$lib/contexts/voter';
  import { buildListRoute, pluralForEntityType } from '$lib/routes';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import type { EntityType } from '@openvaa/data';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // The reactive context getters (currentResultsEntityType, matches, selectedElections) are read via voterCtx.X. Genuinely stable members (startEvent, t) remain destructured.
  //
  // dataRoot is NOT in that set, and neither is appSettings. Both are bare reactive accessors, so per CLAUDE.md's Context Destructuring Rule neither may be destructured: appSettings is value-replacing, so a destructured local stops updating, and dataRoot is identity-stable behind a #version bridge, so the destructure takes the version dependency once at init and never again. dataRoot must be read as `voterCtx.dataRoot.<prop>` directly inside the consuming tracking scope, never through an intermediate $derived alias — referential equality would suppress downstream notification and the cold/direct-URL snapshot would stay empty. This level reads neither, but the rule is restated here because the rule travels with the file, not with the one file that happens to break it. See CLAUDE.md "Context Destructuring Rule" and its stable-reference carve-out.
  const voterCtx = getVoterContext();
  const { startEvent, t } = voterCtx;
  // Local alias for template readability. `selectedElections` is value-replacing, so a $derived read alias is safe and correct.
  const elections = $derived(voterCtx.selectedElections);

  ////////////////////////////////////////////////////////////////////
  // URL-derived state
  ////////////////////////////////////////////////////////////////////
  //
  // Each level RE-DERIVES what it needs from the route params and the context rather than receiving it as a prop from the level above. That is what keeps "the URL is the single source of truth" true across three files instead of one: a prop-drilled `activeElectionId` would make this layout's correctness depend on its parent's derivation staying in step with the URL.

  const _urlElectionTab = $derived(page.params.electionTab);

  // Single-election fallback: when the route segment is absent AND there's exactly one available election, auto-select it. The server guard in `[[electionTab]]/+layout.ts` is expected to redirect-and-canonicalize this case, so this fallback is the client-side safety net.
  const activeElectionId = $derived<string | undefined>(
    _urlElectionTab ?? (elections.length === 1 ? elections[0].id : undefined)
  );

  // The map of plurals available for the active election (possibly just candidates, possibly just organizations, possibly both). Computed from matches so we always render consistent tab labels without going through a separate $state twin.
  type EntityTab = { id: EntityType; label: string };
  const entityTabs = $derived<Array<EntityTab>>(
    activeElectionId && voterCtx.matches[activeElectionId]
      ? (Object.keys(voterCtx.matches[activeElectionId]) as Array<EntityType>).map((type) => ({
          id: type,
          label: ucFirst(t(`common.${type}.plural`))
        }))
      : []
  );

  // Plural → singular mapping uses American spelling. The implied entity type lives on voterContext via `currentResultsEntityType`: URL-first with default-pick fallback to the first available tab for the active election. Reading through `voterCtx.X` per the CLAUDE.md Context Destructuring Rule preserves reactivity (must not destructure).
  const activeEntityType = $derived(voterCtx.currentResultsEntityType);

  // An open drawer is an OVERLAY keyed on `entity` + `id`, not a part of the list hierarchy, and it must mount even when the active entity type cannot be resolved. This carve-out guarantees that an entity URL whose type cannot be resolved still mounts the drawer, over an empty list, rather than a blank page. The reachable case is a bare `/results` whose card links carry no election segment: SvelteKit then slots the PLURAL into the freeform `[[electionTab]]`, no election resolves, and the type goes undefined. `perm-localisation-positive` opens a drawer from exactly that page.
  const drawerVisible = $derived<boolean>(!!(page.params.entity && page.params.id));

  ////////////////////////////////////////////////////////////////////
  // Handlers (all selector changes push to URL)
  ////////////////////////////////////////////////////////////////////

  // `noScroll: true`: the entity-type tabs sit in the lower half of the page, so SvelteKit's default scroll-to-top would throw a voter who has scrolled down to reach them back up to the intro on every switch.
  function handleEntityTabChange(tab: EntityTab): void {
    const plural = pluralForEntityType(tab.id);
    if (!plural) return;
    goto(buildListRoute(activeElectionId, plural, page), { noScroll: true });
    startEvent('results_changeTab', { section: tab.id });
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
