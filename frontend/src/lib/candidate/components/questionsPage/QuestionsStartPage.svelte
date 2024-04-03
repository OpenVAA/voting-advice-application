<script lang="ts">
  import Icon from '$lib/components/icon/Icon.svelte';
  import BasicPage from '$lib/templates/basicPage/BasicPage.svelte';
  import {t} from '$lib/i18n';
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {get} from 'svelte/store';
  import Button from '$lib/components/button/Button.svelte';
  import {getRoute, Route} from '$lib/utils/navigation';

  const {questionsStore} = getContext<CandidateContext>('candidate');
  const questions = get(questionsStore) ?? [];
  const numQuestions = Object.values(questions).length;
  const firstQuestionUrl = $getRoute({
    route: Route.CandAppQuestions,
    id: Object.values(questions)[0].id
  });
</script>

<BasicPage title={$t('candidateApp.opinions.title')}>
  <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('candidateApp.opinions.tip')}
  </svelte:fragment>
  <p class="text-center">
    {$t('candidateApp.opinions.instructions', {numQuestions})}
  </p>

  <Button
    slot="primaryActions"
    href={firstQuestionUrl}
    variant="main"
    icon="next"
    text={$t('candidateApp.opinions.continue')} />
</BasicPage>
