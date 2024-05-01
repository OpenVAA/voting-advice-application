<script lang="ts">
  import {t} from '$lib/i18n';
  import {isCandidate} from '$lib/utils/entities';
  import {InfoAnswer} from '$lib/components/infoAnswer';
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
        {#if entity.party}
          <PartyTag party={entity.party} variant="full" />
        {:else}
          {$t('common.unaffiliated')}
        {/if}
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
          <InfoItem label={question.text}>
            <InfoAnswer {entity} {question} />
          </InfoItem>
        {/each}
      </div>
    {/if}
    {#if linkQuestions.length}
      <div class="infoGroup" role="group">
        <InfoItem label={$t('components.entityInfo.links')}>
          {#each linkQuestions as question}
            <InfoAnswer {entity} {question} hideMissing class="mb-sm" />
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
