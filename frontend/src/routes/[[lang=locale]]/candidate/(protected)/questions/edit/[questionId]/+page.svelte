<script lang="ts">
  import { getContext } from 'svelte';
  import { page } from '$app/stores';
  import { QuestionPage } from '$candidate/templates/question';
  import { t } from '$lib/i18n';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  const { opinionQuestions } = getContext<CandidateContext>('candidate');

  $: questionId = $page.params.questionId;
  $: currentQuestion = $opinionQuestions?.find((question) => question.id === questionId);
</script>

{#if $opinionQuestions && currentQuestion}
  <QuestionPage {currentQuestion} editMode={true} />
{:else}
  {$t('candidateApp.questions.error.questionNotFound', { questionID: currentQuestion?.id })}
{/if}
