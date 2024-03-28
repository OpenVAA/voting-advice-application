<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import BasicPage from '$lib/templates/basicPage/BasicPage.svelte';
  import Button from '$lib/components/button/Button.svelte';
  import QAExpander from './QAExpander.svelte';
</script>

<BasicPage title={$t('candidateApp.help.title')}>
  <div class="text-center">
    <p class="pb-lg">{$t('candidateApp.help.description')}</p>
  </div>

  <QAExpander
    question={$t('candidateApp.help.questions.question1.question')}
    answer={$t('candidateApp.help.questions.question1.answer')} />

  <QAExpander
    question={$t('candidateApp.help.questions.question2.question')}
    answer={$t('candidateApp.help.questions.question2.answer')} />

  <QAExpander
    question={$t('candidateApp.help.questions.question3.question')}
    answer={$t('candidateApp.help.questions.question3.answer')} />

  <QAExpander
    question={$t('candidateApp.help.questions.question4.question')}
    answer={$t('candidateApp.help.questions.question4.answer')} />

  <QAExpander
    question={$t('candidateApp.help.questions.question5.question')}
    answer={$t('candidateApp.help.questions.question5.answer')} />

  <svelte:fragment slot="primaryActions">
    <Button
      icon="next"
      variant="main"
      text={$t('candidateApp.help.continueFilling')}
      href={$getRoute(Route.CandAppHome)} />
  </svelte:fragment>
</BasicPage>
