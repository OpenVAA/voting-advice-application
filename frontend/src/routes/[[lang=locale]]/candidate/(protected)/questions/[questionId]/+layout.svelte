<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';
  import type { PageData } from './$types';

  export let data: PageData;
  const { questionId, i18n } = data;

  const { opinionQuestions } = getContext<CandidateContext>('candidate');

  $: currentQuestion = $opinionQuestions?.find((question) => question.id === questionId);

  $: if (!currentQuestion) {
    goto(`/${i18n.currentLocale}/candidate/questions/${questionId}/error`, { replaceState: true });
  }
</script>

<slot />
