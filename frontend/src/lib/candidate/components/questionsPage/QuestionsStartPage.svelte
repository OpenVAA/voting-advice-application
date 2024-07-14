<script lang="ts">
  import { getContext } from 'svelte';
  import { get } from 'svelte/store';
  import { Button } from '$lib/components/button';
  import { Icon } from '$lib/components/icon';
  import { t } from '$lib/i18n';
  import { BasicPage } from '$lib/templates/basicPage';
  import type { CandidateContext } from '$lib/utils/candidateStore';
  import { getRoute, Route } from '$lib/utils/navigation';

  const { questionsStore } = getContext<CandidateContext>('candidate');
  const questions = get(questionsStore) ?? [];

  // The number of questions to be answered.
  const numQuestions = Object.values(questions).length;
  // The url of the first question where the user is navigated to after the start page.
  const firstQuestionUrl = $getRoute({
    route: Route.CandAppQuestions,
    id: Object.values(questions)[0].id
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
    {$t('candidateApp.questions.instructions', { numQuestions })}
  </p>

  <Button
    slot="primaryActions"
    href={firstQuestionUrl}
    variant="main"
    icon="next"
    text={$t('candidateApp.questions.continue')} />
</BasicPage>
