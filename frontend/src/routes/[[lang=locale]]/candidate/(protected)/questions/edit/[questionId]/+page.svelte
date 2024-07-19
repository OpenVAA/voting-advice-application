<script lang="ts">
  import {getContext} from 'svelte';
  import {page} from '$app/stores';
  import {QuestionPage} from '$candidate/templates/question';
  import {t} from '$lib/i18n';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  const {opinionQuestions} = getContext<CandidateContext>('candidate');

  $: questionId = $page.params.questionId;
  $: currentQuestion = $opinionQuestions?.find((question) => question.id === questionId);
</script>

{#if $opinionQuestions && currentQuestion}
  <QuestionPage questions={$opinionQuestions} {currentQuestion} editMode={true} />
{:else}
  {$t('question.notFound')}
{/if}
