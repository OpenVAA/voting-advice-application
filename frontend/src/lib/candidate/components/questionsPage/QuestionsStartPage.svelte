<script lang="ts">
  import { getContext } from 'svelte';
  import { get } from 'svelte/store';
  import { Button } from '$lib/components/button';
  import { Icon } from '$lib/components/icon';
  import { t } from '$lib/i18n';
  import { BasicPage } from '$lib/templates/basicPage';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  const { opinionQuestions, unansweredOpinionQuestions } = getContext<CandidateContext>('candidate');
  const questions = get(opinionQuestions);

  if (!questions || Object.keys(questions).length === 0) {
    throw new Error('No questions found');
  }

  // The number of questions to be answered.
  const numQuestions = Object.keys(questions).length;
  // The url of the first question where the user is navigated to after the start page.
  const firstQuestionUrl = $getRoute({
    route: ROUTE.CandAppQuestions,
    id: $unansweredOpinionQuestions?.[0]?.id
  });
</script>

<!--
@component
Renders the question start page, which tells the user information on how to answer the questions.

### Usage
```tsx
  <QuestionsStartPage />
```
-->

<BasicPage title={$t('candidateApp.questions.start')}>
  <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('candidateApp.questions.tip')}
  </svelte:fragment>
  <p class="text-center">
    {$t('candidateApp.questions.intro.ingress', { numQuestions })}
  </p>

  <Button slot="primaryActions" href={firstQuestionUrl} variant="main" icon="next" text={$t('common.continue')} />
</BasicPage>
