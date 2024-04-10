<script lang="ts">
  import {t} from '$lib/i18n';
  import {Icon} from '$lib/components/icon';
  import InfoItem from './InfoItem.svelte';

  export let candidate: CandidateProps;

  // TODO: this would be good to refactor in the future to be properly dynamic, but then there are issues
  // on how to represent dynamic values on candidate's basic info page
  const questions = [
    {
      label: $t('candidate.preview.motherTongues'),
      answer: candidate.motherTongues,
      type: 'multipleChoiceCategorical'
    },
    {
      label: $t('candidate.preview.otherLanguages'),
      answer: candidate.otherLanguages,
      type: 'multipleChoiceCategorical'
    },
    {
      label: $t('candidate.preview.gender'),
      answer: candidate.gender,
      type: 'text'
    },
    {
      label: $t('candidate.preview.unaffiliated'),
      answer: $t(candidate.unaffiliated ? 'common.answerYes' : 'common.answerNo'),
      type: 'text'
    },
    {
      label: $t('candidate.preview.electionManifesto'),
      answer: candidate.manifesto,
      type: 'text'
    },
    {
      label: $t('candidate.preview.birthday'),
      answer: new Date(candidate.birthday).toDateString(),
      type: 'text'
    }
  ];
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
        <InfoItem label={question.label}>
          {#if question.answer === undefined || question.answer === ''}
            <span class="text-secondary">{$t('candidate.missingAnswer')}</span>
          {:else if question.type === 'multipleChoiceCategorical' && Array.isArray(question.answer)}
            {question.answer.join($t('candidate.multipleAnswerSeparator'))}
          {:else if question.type === 'preferenceOrder'}
            <ol class="pl-18">
              {#each question.answer as item}
                <li>{item}</li>
              {/each}
            </ol>
          {:else}
            {question.answer}
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
