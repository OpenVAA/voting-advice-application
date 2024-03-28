<script lang="ts">
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import BasicPage from '$lib/templates/basicPage/BasicPage.svelte';
  import Button from '$lib/components/button/Button.svelte';
  import HelpExpander from './HelpExpander.svelte';
</script>

<BasicPage title={$t('candidateApp.help.title')}>
  <div class="text-center">
    <p class="pb-lg">{$t('candidateApp.help.description')}</p>
  </div>

  <HelpExpander
    question={$t('candidateApp.help.question1.question')}
    solution={$t('candidateApp.help.question1.solution')} />

  <HelpExpander
    question={$t('candidateApp.help.question2.question')}
    solution={$t('candidateApp.help.question2.solution')} />

  <HelpExpander
    question={$t('candidateApp.help.question3.question')}
    solution={$t('candidateApp.help.question3.solution')} />

  <HelpExpander
    question={$t('candidateApp.help.question4.question')}
    solution={$t('candidateApp.help.question4.solution')} />

  <HelpExpander
    question={$t('candidateApp.help.question5.question')}
    solution={$t('candidateApp.help.question5.solution')} />

  <svelte:fragment slot="primaryActions">
    <Button
      icon="next"
      variant="main"
      text={$t('candidateApp.help.continueFilling')}
      href={$getRoute(Route.CandAppHome)} />
  </svelte:fragment>
</BasicPage>
