<!--
@component
Used to show an entity's basic info and their answers to `info` questions in an `EntityDetails` component.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- `questions`: An array of `info` questions 

### Usage

```tsx
<EntityInfo entity={candidate} questions={$infoQuestions} />
```
-->

<script lang="ts">
  import {
    type AnyEntityVariant,
    type AnyNominationVariant,
    type AnyQuestionVariant,
    Candidate,
    ENTITY_TYPE,
    type EntityType
  } from '@openvaa/data';
  import { EntityTag } from '$lib/components/entityTag';
  import { InfoAnswer } from '$lib/components/infoAnswer';
  import { getAppContext } from '$lib/contexts/app';
  import { SurveyBanner } from '$lib/dynamic-components/survey/banner';
  import { unwrapEntity } from '$lib/utils/entities';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import InfoItem from './InfoItem.svelte';
  import type { EntityDetailsProps } from './EntityDetails.type';

  export let entity: EntityDetailsProps['entity'];
  export let questions: Array<AnyQuestionVariant>;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, getRoute, t } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Parse entity components
  ////////////////////////////////////////////////////////////////////

  let electionSymbol: string | undefined;
  let entityType: EntityType;
  let nakedEntity: AnyEntityVariant;
  let nomination: AnyNominationVariant | undefined;

  $: {
    ({ entity: nakedEntity, nomination } = unwrapEntity(entity));
    electionSymbol = nomination?.electionSymbol;
    entityType = nakedEntity.type;
  }
</script>

<div class="grid p-lg">
  <!-- We don't want to render an empty infoGroup, so we need to do these unseemly double-checks -->
  {#if nakedEntity.info || nomination?.parentNomination || electionSymbol || $appSettings.entityDetails.showMissingElectionSymbol[entityType]}
    <div class="infoGroup" role="group">
      {#if nakedEntity.info}
        <div>
          {@html sanitizeHtml(nakedEntity.info)}
        </div>
      {/if}
      {#if nomination?.parentNomination}
        <InfoItem label={$t('common.electionList')}>
          <!-- Add a link to the entity page for parties -->
          {#if nomination.parentNomination.entityType === ENTITY_TYPE.Organization}
            <a
              href={$getRoute({
                route: 'ResultEntity',
                entityType: nomination.parentNomination.entityType,
                entityId: nomination.parentNomination.entity.id,
                nominationId: nomination.parentNomination.id
              })}>
              <EntityTag entity={nomination.parentNomination} variant="full" />
            </a>
          {:else}
            <EntityTag entity={nomination.parentNomination} variant="full" />
          {/if}
          {#if nakedEntity instanceof Candidate && nakedEntity.organization && nakedEntity.organization !== nomination.parentNomination.entity}
            ({$t('entityDetails.memberOfOrganization', { organization: nakedEntity.organization.shortName })})
          {/if}
        </InfoItem>
      {/if}
      {#if electionSymbol || $appSettings.entityDetails.showMissingElectionSymbol[entityType]}
        <InfoItem label={$t(`common.electionSymbol.${entityType}`)}>
          {electionSymbol ?? $t('common.missingAnswer')}
        </InfoItem>
      {/if}
    </div>
  {/if}
  {#if questions?.length}
    {@const nonLinkQuestions = questions.filter((q) => q.subtype !== 'link')}
    {@const linkQuestions = questions.filter((q) => q.subtype === 'link')}
    <div class="infoGroup" role="group">
      {#if nonLinkQuestions.length}
        {#each nonLinkQuestions as question}
          {@const answer = nakedEntity.getAnswer(question)}
          {#if answer || $appSettings.entityDetails.showMissingAnswers[entityType]}
            <InfoItem label={question.text} vertical={question.type === 'text'}>
              <InfoAnswer {answer} {question} />
            </InfoItem>
          {/if}
        {/each}
      {/if}
      {#if linkQuestions.length}
        <InfoItem label={$t('entityDetails.links')}>
          {#each linkQuestions as question}
            {@const answer = nakedEntity.getAnswer(question)}
            {#if answer}
              <InfoAnswer {answer} {question} class="tag mb-sm me-sm last:me-0" />
            {/if}
          {/each}
        </InfoItem>
      {/if}
    </div>
  {/if}
  {#if $appSettings.survey?.showIn?.includes('entityDetails')}
    <SurveyBanner class="mt-lg" />
  {/if}
</div>

<style lang="postcss">
  .infoGroup {
    /* first: is valid although the linter flags it */
    @apply mt-16 flex flex-col gap-md border-t-md border-t-[var(--line-color)] pt-16 first:mt-0 first:border-t-0 first:pt-0;
  }
</style>
