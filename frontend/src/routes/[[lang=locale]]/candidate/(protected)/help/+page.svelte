<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import BasicPage from '$lib/templates/basicPage/BasicPage.svelte';
  import Button from '$lib/components/button/Button.svelte';
  import Expander from '$lib/components/expander/Expander.svelte';
</script>

<BasicPage title={$t('candidateApp.help.title')}>
  <div class="text-center">
    <p class="pb-lg">{$t('candidateApp.help.description')}</p>
  </div>

  <Expander title={$t('candidateApp.help.questions.question1.question')} variant="question-help">
    {$t('candidateApp.help.questions.question1.answer')}
  </Expander>

  <Expander title={$t('candidateApp.help.questions.question2.question')} variant="question-help">
    {$t('candidateApp.help.questions.question2.answer')}
  </Expander>

  <Expander title={$t('candidateApp.help.questions.question3.question')} variant="question-help">
    {$t('candidateApp.help.questions.question3.answer')}
  </Expander>

  <Expander title={$t('candidateApp.help.questions.question4.question')} variant="question-help">
    {$t('candidateApp.help.questions.question4.answer')}
  </Expander>

  <Expander title={$t('candidateApp.help.questions.question5.question')} variant="question-help">
    {$t('candidateApp.help.questions.question5.answer')}
  </Expander>

  <svelte:fragment slot="primaryActions">
    <Button
      icon="next"
      variant="main"
      text={$t('candidateApp.help.continueFilling')}
      href={$getRoute(Route.CandAppHome)} />
  </svelte:fragment>
</BasicPage>
