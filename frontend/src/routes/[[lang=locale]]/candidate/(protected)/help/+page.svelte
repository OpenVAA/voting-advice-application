<script lang="ts">
  import { Button } from '$lib/components/button';
  import { Expander } from '$lib/components/expander';
  import { t } from '$lib/i18n';
  import { BasicPage } from '$lib/templates/basicPage';
  import { getRoute, Route } from '$lib/utils/navigation';
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
