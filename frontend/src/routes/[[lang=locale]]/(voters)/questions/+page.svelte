<script lang="ts">
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {openFeedbackModal, settings} from '$lib/utils/stores';
  import {Button} from '$lib/components/button';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {Icon} from '$lib/components/icon';
  import {BasicPage} from '$lib/templates/basicPage';

  const questionCategories = new Set<string>();
  $page.data.questions.forEach((question) => {
    if (question.category) questionCategories.add(question.category.id);
  });
</script>

<BasicPage title={$t('viewTexts.yourOpinionsTitle')}>
  <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('viewTexts.questionsTip')}
  </svelte:fragment>

  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('questions.heroEmoji')} />
  </svelte:fragment>

  <svelte:fragment slot="banner">
    {#if $settings.header.showFeedback && $openFeedbackModal}
      <Button
        on:click={$openFeedbackModal}
        variant="icon"
        icon="feedback"
        text={$t('navigation.sendFeedback')} />
    {/if}
    {#if $settings.header.showHelp}
      <Button
        href={$getRoute(Route.Help)}
        variant="icon"
        icon="help"
        text={$t('actionLabels.help')} />
    {/if}
  </svelte:fragment>

  <p class="text-center">
    {$t('viewTexts.yourOpinionsIngress', {
      numStatements: $page.data.questions.length,
      numCategories: questionCategories.size
    })}
  </p>

  <svelte:fragment slot="primaryActions">
    <Button
      href={$getRoute({route: Route.Question, id: $page.data.questions[0].id})}
      variant="main"
      icon="next"
      text={$t('actionLabels.startQuestions')} />
  </svelte:fragment>
</BasicPage>
