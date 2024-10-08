<script lang="ts">
  import {t} from '$lib/i18n';
  import {FIRST_QUESTION_ID, getRoute, Route} from '$lib/utils/navigation';
  import {
    openFeedbackModal,
    opinionQuestions,
    opinionQuestionCategories,
    settings
  } from '$lib/stores';
  import {Button} from '$lib/components/button';
  import {HeroEmoji} from '$lib/components/heroEmoji';
  import {Loading} from '$lib/components/loading';
  import {BasicPage} from '$lib/templates/basicPage';
  import {getQuestionsContext} from './questions.context';
  import {CategoryTag} from '$lib/components/categoryTag';

  const {firstQuestionId, selectedCategories} = getQuestionsContext();

  // Await the necessary promises here and save their contents in synced variables
  let questionsSync: QuestionProps[] | undefined;
  let categoriesSync: QuestionCategoryProps[] | undefined;

  // Reset firstQuestion if set
  $firstQuestionId = null;

  // Needs to react to language change
  $: Promise.all([$opinionQuestions, $opinionQuestionCategories]).then(([oq, cc]) => {
    questionsSync = oq;
    categoriesSync = cc;
    // Select all categories by default
    $selectedCategories = cc.map((c) => c.id);
  });

  /** The total number of selected questions */
  let numSelectedQuestions = 0;
  $: if (categoriesSync) {
    numSelectedQuestions = categoriesSync
      .filter((c) => !$selectedCategories || $selectedCategories.includes(c.id))
      .reduce((acc, c) => acc + (c.questions?.length ?? 0), 0);
  }

  let canContinue = false;
  $: canContinue = numSelectedQuestions >= $settings.matching.minimumAnswers;

  let firstCategoryId: string | undefined;
  $: firstCategoryId = categoriesSync
    ? categoriesSync.find((c) => $selectedCategories == null || $selectedCategories.includes(c.id))
        ?.id
    : undefined;
</script>

<BasicPage title={$t('questions.title')}>
  <!-- <svelte:fragment slot="note">
    <Icon name="tip" />
    {$t('XXX')}
  </svelte:fragment> -->

  <svelte:fragment slot="hero">
    <HeroEmoji emoji={$t('dynamic.questions.heroEmoji')} />
  </svelte:fragment>

  <svelte:fragment slot="banner">
    {#if $settings.header.showFeedback && $openFeedbackModal}
      <Button
        on:click={$openFeedbackModal}
        variant="icon"
        icon="feedback"
        text={$t('feedback.send')} />
    {/if}
    {#if $settings.header.showHelp}
      <Button href={$getRoute(Route.Help)} variant="icon" icon="help" text={$t('help.title')} />
    {/if}
  </svelte:fragment>

  {#if !(questionsSync && categoriesSync)}
    <Loading />
  {:else if !$settings.questions.questionsIntro.allowCategorySelection || categoriesSync.length < 2}
    <p class="text-center">
      {$t('questions.intro.ingress.withoutCategories', {numQuestions: questionsSync.length})}
    </p>
  {:else}
    <p class="text-center">
      {$t('questions.intro.ingress.withCategories', {
        numCategories: categoriesSync.length,
        minQuestions: $settings.matching.minimumAnswers
      })}
    </p>
    <div class="grid gap-sm">
      {#each categoriesSync as category}
        <label class="label cursor-pointer justify-start gap-sm !p-0">
          <input
            type="checkbox"
            class="checkbox"
            name="vaa-selectedCategories"
            value={category.id}
            bind:group={$selectedCategories} />
          <CategoryTag {category} />
          <span class="text-secondary">{category.questions?.length ?? ''}</span>
        </label>
      {/each}
    </div>
  {/if}

  <svelte:fragment slot="primaryActions">
    <Button
      disabled={!canContinue}
      href={$getRoute(
        $settings.questions.categoryIntros?.show && firstCategoryId
          ? {route: Route.QuestionCategory, id: firstCategoryId}
          : {route: Route.Question, id: FIRST_QUESTION_ID}
      )}
      variant="main"
      icon="next"
      text={$t('questions.intro.start', {numQuestions: numSelectedQuestions})} />
  </svelte:fragment>
</BasicPage>
