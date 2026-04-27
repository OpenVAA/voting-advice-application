<!--@component

# All nominations page

List all nominations in the application.
-->

<script lang="ts">
  import { FilterGroup } from '@openvaa/filters';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getVoterContext } from '$lib/contexts/voter';
  import { buildParentFilters } from '$lib/contexts/voter/filters/buildParentFilters';
  import { EntityList, EntityListControls } from '$lib/dynamic-components/entityList';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { ucFirst } from '$lib/utils/text/ucFirst';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, locale, t } = getVoterContext();

  ////////////////////////////////////////////////////////////////////
  // Entities
  ////////////////////////////////////////////////////////////////////

  const nominations = $dataRoot.candidateNominations;

  ////////////////////////////////////////////////////////////////////
  // Filters
  ////////////////////////////////////////////////////////////////////

  // This will hold the filtered entities returned by EntityListControls
  let filteredEntities = new Array<MaybeWrappedEntityVariant>();

  const filterGroup = new FilterGroup(
    buildParentFilters({
      nominations,
      names: {
        alliance: ucFirst(t('common.alliance.singular')),
        faction: ucFirst(t('common.faction.singular')),
        organization: ucFirst(t('common.organization.singular'))
      },
      locale
    })
  );
</script>

<MainContent title={t('dynamic.nominations.title')}>
  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={t('dynamic.nominations.heroEmoji')} />
    </figure>
  {/snippet}
  <p class="text-center">{@html sanitizeHtml(t('dynamic.nominations.content'))}</p>
  {#snippet fullWidth()}
    <div class="bg-base-300 flex min-h-[120vh] flex-col items-center" data-testid="voter-nominations-container">
      <div class="pb-safelgb pl-safemdl pr-safemdr match-w-xl:px-0 w-full max-w-xl">
        <h3 class="my-lg mx-10 text-xl">
          {t('results.candidate.numShown', { numShown: filteredEntities.length })}
        </h3>
        <EntityListControls
          entities={nominations}
          {filterGroup}
          onUpdate={(results) => (filteredEntities = results)}
          class="mb-md mx-10"
          data-testid="voter-nominations-controls" />
        <EntityList
          cards={filteredEntities.map((e) => ({ entity: e, action: false, showElection: true }))}
          class="mb-lg"
          data-testid="voter-nominations-list" />
      </div>
    </div>
  {/snippet}
</MainContent>
