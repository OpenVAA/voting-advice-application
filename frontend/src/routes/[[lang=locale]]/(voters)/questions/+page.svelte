<script lang="ts">
  import {t} from '$lib/i18n';
  import {FIRST_QUESTION_ID, getRoute, Route} from '$lib/utils/navigation';
  import {openFeedbackModal, opinionQuestions, settings} from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {Icon} from '$lib/components/icon';
  import {Loading} from '$lib/components/loading';
  import {BasicPage} from '$lib/templates/basicPage';
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

  {#await $opinionQuestions}
    <Loading />
  {:then opinionQuestionsSync}
    {@const categories = new Set(
      opinionQuestionsSync.filter((q) => q.category).map((q) => q.category.id)
    )}
    <p class="text-center">
      {$t('viewTexts.yourOpinionsIngress', {
        numStatements: opinionQuestionsSync.length,
        numCategories: categories.size
      })}
    </p>
  {/await}

  <svelte:fragment slot="primaryActions">
    <Button
      href={$getRoute({route: Route.Question, id: FIRST_QUESTION_ID})}
      variant="main"
      icon="next"
      text={$t('actionLabels.startQuestions')} />
  </svelte:fragment>
</BasicPage>
