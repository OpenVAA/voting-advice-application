<script lang="ts">
  import {getContext} from 'svelte';
  import {page} from '$app/stores';
  import {QuestionPage} from '$candidate/templates/question';
  import {t} from '$lib/i18n';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  const {questionsStore} = getContext<CandidateContext>('candidate');

  $: questions = $questionsStore;
  $: questionId = $page.params.questionId;
  $: currentQuestion = questions?.[questionId];
</script>

{#if questions && currentQuestion}
  <QuestionPage {questions} {currentQuestion} />
{:else}
  {$t('questions.notFound')}
{/if}
