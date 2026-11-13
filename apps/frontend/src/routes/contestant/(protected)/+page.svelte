<!--@component

# Contestant App root page

Shows one of three views to a signed-in user who is past the gates and whom the server load did not redirect:

- `readFailed`: the list of the user's entities could not be read. The page renders `ReadFailure` and nothing else, and the user stays signed in.
- `nothingToEdit`: the user edits no entity. The page renders `NothingToEdit` and nothing else.
- `select`: the user edits several entities and chooses one. The page lists one card per entity, candidates first, then organizations, each group in alphabetical order of the displayed name, and each card links to that entity's home. The groups are headed only when both types are listed.

While a gate is pending the protected layout shows the gate's view in place of this page, and the load names no view.

The selection view provides the user's entities to the data root itself, on mount and whenever the list changes. Until they are provided the list region shows a loading state, and an error message when they cannot be resolved afterwards.

Nothing records which entity was chosen, and the view shows no notice of any kind.
-->

<script lang="ts">
  import { log } from '@openvaa/app-shared';
  import { NothingToEdit } from '$contestant/components/nothingToEdit';
  import { ReadFailure } from '$contestant/components/readFailure';
  import { userEntityData, userEntityDisplayName } from '$contestant/utils/userEntityDisplayName';
  import { MainContent } from '$layouts/main';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { EntityList } from '$lib/dynamic-components/entityList';
  import { getUUID } from '$lib/utils/components';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import { groupEntitiesForSelection } from './entitySelection.helpers';
  import type { UserEntity } from '$lib/api/base/dataWriter.type';
  import type { EntityCardProps } from '$lib/dynamic-components/entityCard';
  import type { PageData } from './$types';
  import type { SelectionEntityType } from './entitySelection.helpers';

  let { data }: { data: PageData } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // entities, locale and dataRoot are reactive accessors: read via contestantCtx.X inside the tracking scope, never destructured, and dataRoot never through an alias.
  const contestantCtx = getContestantContext();
  const { getRoute, setDataRoot, t } = contestantCtx;
  const { pageStyles } = getLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Provide the user's entities
  ////////////////////////////////////////////////////////////////////

  /** The list whose entities the data root holds, or `'failed'` when providing them threw. */
  let provided = $state.raw<ReadonlyArray<UserEntity> | 'failed' | undefined>(undefined);

  // The data root is mutated through `setDataRoot(updater)`, which runs the updater untracked, so the root's version counter is no dependency of this effect.
  $effect(() => {
    if (data.view !== 'select') return;
    const entities = contestantCtx.entities;
    try {
      setDataRoot((dr) => dr.update(() => dr.provideEntityData(entities.map(userEntityData))));
      provided = entities;
    } catch (e) {
      log.error(`Error providing the user's entities to the data root: ${e instanceof Error ? e.message : e}`);
      provided = 'failed';
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Build the groups of cards
  ////////////////////////////////////////////////////////////////////

  type CardGroup = { type: SelectionEntityType; headingId: string; cards: Array<EntityCardProps> };

  const headingIds: Record<SelectionEntityType, string> = { candidate: getUUID(), organization: getUUID() };

  /** What the list region shows. The groups are empty in every state but `resolved`. */
  type Selection = { state: 'loading' | 'error' | 'resolved'; groups: Array<CardGroup>; showHeadings: boolean };

  const UNRESOLVED = { groups: [], showHeadings: false };

  const selection = $derived.by((): Selection => {
    const entities = contestantCtx.entities;
    if (provided === 'failed') return { state: 'error', ...UNRESOLVED };
    // Cards are built only from the list this page provided: an entity the root holds from elsewhere is not shown.
    if (provided !== entities) return { state: 'loading', ...UNRESOLVED };
    try {
      const { groups, showHeadings } = groupEntitiesForSelection({
        entities,
        locale: contestantCtx.locale,
        displayName: (entity) => userEntityDisplayName(entity, contestantCtx.dataRoot)
      });
      return {
        state: 'resolved',
        showHeadings,
        groups: groups.map((group) => ({
          type: group.type,
          headingId: headingIds[group.type],
          cards: group.entities.map(({ type, id }) => ({
            entity: contestantCtx.dataRoot.getEntity(type, id),
            variant: 'list',
            action: getRoute.current({ route: 'ContestantAppEntityHome', entityType: type, entityId: id }),
            headerOnly: true,
            showType: true,
            keepScroll: false
          }))
        }))
      };
    } catch (e) {
      log.error(`Error resolving the user's entities from the data root: ${e instanceof Error ? e.message : e}`);
      return { state: 'error', ...UNRESOLVED };
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  // The shaded background belongs to the selection view alone, so the overlay is pushed while that view is shown and reverted with it.
  $effect(() => {
    if (data.view === 'select') return pageStyles.push({ drawer: { background: 'bg-base-300' } });
  });
</script>

{#if data.view === 'readFailed'}
  <ReadFailure />
{:else if data.view === 'nothingToEdit'}
  <NothingToEdit />
{:else if data.view === 'select'}
  <MainContent title={t('contestantApp.entitySelection.title')}>
    <p class="text-center">{t('contestantApp.entitySelection.ingress')}</p>
    <div class="mt-lg gap-lg flex flex-col self-stretch" data-testid="contestant-entity-selection-list">
      {#if selection.state === 'loading'}
        <Loading />
      {:else if selection.state === 'error'}
        <ErrorMessage inline />
      {:else}
        {#each selection.groups as group (group.type)}
          <section
            class="gap-md flex flex-col"
            data-testid="contestant-entity-selection-group"
            data-entity-type={group.type}
            aria-labelledby={selection.showHeadings ? group.headingId : undefined}>
            {#if selection.showHeadings}
              <h2 id={group.headingId} class="mx-md text-lg" data-testid="contestant-entity-selection-group-heading">
                {ucFirst(t(`common.${group.type}.plural`))}
              </h2>
            {/if}
            <EntityList cards={group.cards} />
          </section>
        {/each}
      {/if}
    </div>
  </MainContent>
{/if}
