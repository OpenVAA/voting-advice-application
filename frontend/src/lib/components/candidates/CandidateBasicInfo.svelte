<script lang="ts">
  import {t} from '$lib/i18n';
  import {Icon} from '$lib/components/icon';
  import InfoItem from './InfoItem.svelte';
  import {getAnswerForDisplay} from '$lib/utils/answers';

  export let candidate: CandidateProps;
  export let questions: QuestionProps[];
</script>

<div class="p-lg">
  <div class="infoGroup" role="group">
    <InfoItem label={$t('candidate.list')}>
      <div class="flex gap-sm">
        <Icon name="party" />
        {candidate.party.name} ({candidate.party.shortName})
      </div>
    </InfoItem>
    <InfoItem label={$t('candidate.electionSymbol')}>
      {candidate.electionSymbol ?? '—'}
    </InfoItem>
  </div>
  {#if questions?.length}
    <div class="infoGroup" role="group">
      {#each questions as question}
        {@const answer = getAnswerForDisplay(candidate, question)}
        <InfoItem label={question.text}>
          {#if answer == null}
            <span class="text-secondary">{$t('candidate.missingAnswer')}</span>
          {:else if question.type === 'multipleChoiceCategorical' && Array.isArray(answer)}
            {answer.join($t('candidate.multipleAnswerSeparator'))}
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
    @apply mt-16 flex flex-col gap-md border-t-md pt-16 first:mt-0 first:border-t-0 first:pt-0;
  }
</style>
