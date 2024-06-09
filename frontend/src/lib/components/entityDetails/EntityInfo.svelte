<script lang="ts">
  import {error} from '@sveltejs/kit';
  import {t} from '$lib/i18n';
  import {getAnswer} from '$lib/utils/answers';
  import {getEntityType, isCandidate, isParty} from '$lib/utils/entities';
  import {sanitizeHtml} from '$lib/utils/sanitize';
  import {settings} from '$lib/stores';
  import {InfoAnswer} from '$lib/components/infoAnswer';
  import {PartyTag} from '$lib/components/partyTag';
  import {SurveyBanner} from '$lib/components/survey/banner';
  import InfoItem from './InfoItem.svelte';
  import type {EntityDetailsProps} from './EntityDetails.type';

  export let entity: EntityProps;
  export let questions: EntityDetailsProps['infoQuestions'];

  let entityType: Exclude<EntityType, 'all'>;
  $: {
    const res = getEntityType(entity);
    if (!res) error(500, `No entity type found for entity: ${entity?.id}`);
    entityType = res;
  }
</script>

<!--
@component
Used to show an entity's basic info in an `EntityDetails` component.

### Properties

- `entity`: The entity
- `questions`: The list of Question objects to show

### Usage

```tsx
<EntityInfo entity={candidate} questions={infoQuestions} />
```
-->

<div class="grid p-lg">
  <!-- We don't want to render an empty infoGroup, so we need to do these unseemly double-checks -->
  {#if isCandidate(entity) || $settings.entityDetails.showMissingElectionSymbol[entityType] || entity.electionSymbol || (isParty(entity) && entity.info)}
    <div class="infoGroup" role="group">
      {#if isParty(entity) && entity.info}
        <div>
          {@html sanitizeHtml(entity.info)}
        </div>
      {/if}
      {#if isCandidate(entity)}
        <InfoItem label={$t('candidateApp.common.list')}>
          {#if entity.party}
            <PartyTag party={entity.party} variant="full" />
          {:else}
            {$t('common.unaffiliated')}
          {/if}
        </InfoItem>
      {/if}
      {#if $settings.entityDetails.showMissingElectionSymbol[entityType] || entity.electionSymbol}
        <InfoItem label={$t(`common.electionSymbol.${entityType}`)}>
          {entity.electionSymbol ?? $t('common.missingAnswer')}
        </InfoItem>
      {/if}
    </div>
  {/if}
  {#if questions?.length}
    {@const nonLinkQuestions = questions.filter((q) => q.type !== 'link')}
    {@const linkQuestions = questions.filter((q) => q.type === 'link')}
    <div class="infoGroup" role="group">
      {#if nonLinkQuestions.length}
        {#each nonLinkQuestions as question}
          {#if $settings.entityDetails.showMissingAnswers[entityType] || getAnswer(entity, question) != null}
            <InfoItem label={question.text}>
              <InfoAnswer {entity} {question} />
            </InfoItem>
          {/if}
        {/each}
      {/if}
      {#if linkQuestions.length}
        <InfoItem label={$t('components.entityInfo.links')}>
          {#each linkQuestions as question}
            <InfoAnswer {entity} {question} hideMissing class="mb-sm" />
          {/each}
        </InfoItem>
        ´
      {/if}
    </div>
  {/if}
  {#if $settings.analytics.survey?.showIn?.includes('entityDetails')}
    <SurveyBanner class="mt-lg" />
  {/if}
</div>

<style lang="postcss">
  .infoGroup {
    /* first: is valid although the linter flags it */
    @apply mt-16 flex flex-col gap-md border-t-md border-t-[var(--line-color)] pt-16 first:mt-0 first:border-t-0 first:pt-0;
  }
</style>
