<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { opinionQuestionCategories, opinionQuestions, settings } from '$lib/stores';
  import { FIRST_QUESTION_ID, getRoute, ROUTE } from '$lib/utils/navigation';
  import { getQuestionsContext } from './questions.context';
  import Layout from '../../Layout.svelte';

  const { firstQuestionId, selectedCategories, numSelectedQuestions } = getQuestionsContext();

  const { progress } = getLayoutContext(onDestroy);
  progress.current.set(0);

  // Await the necessary promises here and save their contents in synced variables
  let questionsSync: Array<QuestionProps> | undefined;
  let categoriesSync: Array<QuestionCategoryProps> | undefined;

  // Reset firstQuestion if set
  $firstQuestionId = null;

  // Needs to react to language change
  $: Promise.all([$opinionQuestions, $opinionQuestionCategories]).then(([oq, cc]) => {
    questionsSync = oq;
    categoriesSync = cc;
    // Select all categories by default
    if (!$selectedCategories) $selectedCategories = cc.map((c) => c.id);
  });

  /** The total number of selected questions */
  $: if (categoriesSync) {
    $numSelectedQuestions = categoriesSync
      .filter((c) => !$selectedCategories || $selectedCategories.includes(c.id))
      .reduce((acc, c) => acc + (c.questions?.length ?? 0), 0);
  }

  let canContinue = false;
  $: canContinue =
    !!questionsSync &&
    ($numSelectedQuestions === questionsSync.length || $numSelectedQuestions >= $settings.matching.minimumAnswers);

  let firstCategoryId: string | undefined;
  $: firstCategoryId = categoriesSync
    ? categoriesSync.find((c) => $selectedCategories == null || $selectedCategories.includes(c.id))?.id
    : undefined;
</script>

<Layout title={$t('questions.title')}>
  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$t('dynamic.questions.heroEmoji')} />
  </figure>

  {#if !(questionsSync && categoriesSync)}
    <Loading />
  {:else if !$settings.questions.questionsIntro.allowCategorySelection || categoriesSync.length < 2 || questionsSync.length <= $settings.matching.minimumAnswers}
    <p class="text-center">
      {$t('questions.intro.ingress.withoutCategorySelection', {
        numCategories: categoriesSync.length,
        numQuestions: questionsSync.length
      })}
    </p>
    <div class="grid justify-items-center gap-sm">
      {#each categoriesSync as category}
        <CategoryTag {category} />
      {/each}
    </div>
  {:else}
    <p class="text-center">
      {$t('questions.intro.ingress.withCategorySelection', {
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

  <Button
    slot="primaryActions"
    disabled={!canContinue}
    href={$getRoute(
      $settings.questions.categoryIntros?.show && firstCategoryId
        ? { route: ROUTE.QuestionCategory, id: firstCategoryId }
        : { route: ROUTE.Question, id: FIRST_QUESTION_ID }
    )}
    variant="main"
    icon="next"
    text={$t('questions.intro.start', { numQuestions: $numSelectedQuestions })} />
</Layout>
