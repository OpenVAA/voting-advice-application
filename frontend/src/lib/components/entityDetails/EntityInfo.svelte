<script lang="ts">
  import {t} from '$lib/i18n';
  import {getAnswerForDisplay} from '$lib/utils/answers';
  import {isCandidate} from '$lib/utils/entities';
  import {PartyTag} from '$lib/components/partyTag';
  import InfoItem from './InfoItem.svelte';
  import type {EntityDetailsProps} from './EntityDetails.type';

  export let entity: EntityProps;
  export let questions: EntityDetailsProps['infoQuestions'];
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

<div class="p-lg">
  <div class="infoGroup" role="group">
    {#if isCandidate(entity)}
      <InfoItem label={$t('candidate.list')}>
        <PartyTag party={entity.party} variant="full" />
      </InfoItem>
    {/if}
    <InfoItem label={$t('common.electionSymbol')}>
      {entity.electionSymbol ?? '—'}
    </InfoItem>
  </div>
  {#if questions?.length}
    {@const nonLinkQuestions = questions.filter((q) => q.type !== 'link')}
    {@const linkQuestions = questions.filter((q) => q.type === 'link')}
    {#if nonLinkQuestions.length}
      <div class="infoGroup" role="group">
        {#each nonLinkQuestions as question}
          {@const answer = getAnswerForDisplay(entity, question)}
          <InfoItem label={question.text}>
            {#if answer == null}
              <span class="text-secondary">{$t('common.missingAnswer')}</span>
            {:else if question.type === 'multipleChoiceCategorical' && Array.isArray(answer)}
              {answer.join($t('common.multipleAnswerSeparator'))}
            {:else if question.type === 'preferenceOrder'}
              <ol class="pl-18">
                {#each answer as item}
                  <li>{item}</li>
                {/each}
              </ol>
            {:else}
              {answer}
            {/if}
          </InfoItem>
        {/each}
      </div>
    {/if}
    {#if linkQuestions.length}
      <div class="infoGroup" role="group">
        <InfoItem label={$t('components.entityInfo.links')}>
          {#each linkQuestions as question}
            {@const answer = `${getAnswerForDisplay(entity, question)}`}
            {#if answer}
              <a
                href={answer}
                target="_blank"
                rel="noopener noreferrer"
                class="small-label mb-sm me-md inline-block hyphens-none rounded-full bg-base-300 px-md py-sm last:me-0"
                >{question.text}</a>
            {/if}
          {/each}
        </InfoItem>
      </div>
    {/if}
  {/if}
</div>

<style lang="postcss">
  .infoGroup {
    /* first: is valid although the linter flags it */
    @apply mt-16 flex flex-col gap-md border-t-md border-t-[var(--line-color)] pt-16 first:mt-0 first:border-t-0 first:pt-0;
  }
</style>
