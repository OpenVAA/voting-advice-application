<script lang="ts">
  import {Icon} from '$lib/components/icon';
  import {BasicPage} from '$lib/templates/basicPage';
  import {t} from '$lib/i18n';
  import {getContext} from 'svelte';
  import {get} from 'svelte/store';
  import {Button} from '$lib/components/button';
  import {getRoute, Route} from '$lib/utils/navigation';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  const {questionsStore, progressStore} = getContext<CandidateContext>('candidate');
  const questions = get(questionsStore) ?? [];
  const numQuestions = Object.values(questions).length;
  const firstQuestionUrl = $getRoute({
    route: Route.CandAppQuestions,
    id: Object.values(questions)[0].id
  });
</script>

<BasicPage
  title={$t('candidateApp.questions.start')}
  progress={$progressStore?.progress}
  progressMax={$progressStore?.max}>
  <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('candidateApp.questions.tip')}
  </svelte:fragment>
  <p class="text-center">
    {$t('candidateApp.questions.instructions', {numQuestions})}
  </p>

  <Button
    slot="primaryActions"
    href={firstQuestionUrl}
    variant="main"
    icon="next"
    text={$t('candidateApp.questions.continue')} />
</BasicPage>
