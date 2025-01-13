<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  const { opinionQuestions, opinionAnswers, unansweredRequiredInfoQuestions } =
    getContext<CandidateContext>('candidate');

  if (!$opinionQuestions || !Object.values($opinionQuestions).length) {
    goto($getRoute(ROUTE.CandAppQuestionsError), { replaceState: true });
  }

  if ($unansweredRequiredInfoQuestions?.length) {
    goto($getRoute(ROUTE.CandAppProfile));
  }

  const { topBarSettings, progress } = getLayoutContext(onDestroy);

  topBarSettings.push({
    progress: 'show'
  });

  progress.current.set(0);

  $: if ($opinionQuestions && $opinionAnswers) {
    progress.current.set(Object.keys($opinionAnswers).length);
    progress.max.set($opinionQuestions.length);
  }
</script>

<slot />
