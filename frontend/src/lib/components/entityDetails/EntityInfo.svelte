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
    <InfoItem label={$t('entity.electionSymbol')}>
      {entity.electionSymbol ?? '—'}
    </InfoItem>
  </div>
  {#if questions?.length}
    <div class="infoGroup" role="group">
      {#each questions as question}
        {@const answer = getAnswerForDisplay(entity, question)}
        <InfoItem label={question.text}>
          {#if answer == null}
            <span class="text-secondary">{$t('entity.missingAnswer')}</span>
          {:else if question.type === 'multipleChoiceCategorical' && Array.isArray(answer)}
            {answer.join($t('entity.multipleAnswerSeparator'))}
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
</div>

<style lang="postcss">
  .infoGroup {
    /* first: is valid although the linter flags it */
    @apply mt-16 flex flex-col gap-md border-t-md border-t-[var(--line-color)] pt-16 first:mt-0 first:border-t-0 first:pt-0;
  }
</style>