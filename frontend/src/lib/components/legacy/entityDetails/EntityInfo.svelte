<script lang="ts">
  import { error } from '@sveltejs/kit';
  import { t } from '$lib/i18n';
  import { settings } from '$lib/legacy-stores';
  import { getAnswer } from '$lib/utils/legacy-answers';
  import { getEntityType, isCandidate, isParty } from '$lib/utils/legacy-entities';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import InfoItem from './InfoItem.svelte';
  import { InfoAnswer } from '../infoAnswer';
  import { PartyTag } from '../partyTag';
  import type { EntityDetailsProps } from './EntityDetails.type';

  export let entity: LegacyEntityProps;
  export let questions: EntityDetailsProps['infoQuestions'];

  let entityType: Exclude<LegacyEntityType, 'all'>;
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
  {#if (isCandidate(entity) && entity.party) || $settings.entityDetails.showMissingElectionSymbol[entityType] || entity.electionSymbol || (isParty(entity) && entity.info)}
    <div class="infoGroup" role="group">
      {#if isParty(entity) && entity.info}
        <div>
          {@html sanitizeHtml(entity.info)}
        </div>
      {/if}
      {#if isCandidate(entity) && entity.party}
        <!-- TODO: This becomes incorrect with `@openvaa/data` that supports party membership as distinct from nominating party. We need to handle cases where the list differs from party membership as well as $t('common.unaffiliated') -->
        <InfoItem label={$t('common.electionList')}>
          <PartyTag party={entity.party} variant="full" />
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
            <InfoItem label={question.text} vertical={question.type === 'text'}>
              <InfoAnswer {entity} {question} />
            </InfoItem>
          {/if}
        {/each}
      {/if}
      {#if linkQuestions.length}
        <InfoItem label={$t('entityDetails.links')}>
          {#each linkQuestions as question}
            <InfoAnswer {entity} {question} hideMissing class="mb-sm" />
          {/each}
        </InfoItem>
        ´
      {/if}
    </div>
  {/if}
</div>

<style lang="postcss">
  .infoGroup {
    /* first: is valid although the linter flags it */
    @apply mt-16 flex flex-col gap-md border-t-md border-t-[var(--line-color)] pt-16 first:mt-0 first:border-t-0 first:pt-0;
  }
</style>
