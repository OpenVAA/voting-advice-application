<script lang="ts">
  import { error } from '@sveltejs/kit';
  import { onDestroy } from 'svelte';
  import { Button } from '$lib/components/button';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { opinionQuestionCategories, settings } from '$lib/legacy-stores';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../../../../Layout.svelte';
  import { getQuestionsContext } from '../../questions.context';
  import { filterAndSortQuestions } from '../../questions.utils';
  import type { PageData } from './$types';

  const { pageStyles, progress } = getLayoutContext(onDestroy);
  pageStyles.push({ drawer: { background: 'bg-base-300' } });

  /**
   * A page for showing a category's introduction page.
   * TODO: This has a lot of overlap with the single question page, but combining them would be a mess with template slots. Both this and the question page should be thoroughly refactored when the slotless page templates are available and the app state management is more coherent.
   */

  export let data: PageData;

  const { firstQuestionId, selectedCategories } = getQuestionsContext();

  let category: LegacyQuestionCategoryProps | undefined;
  let nextQuestionId: string | undefined;
  let nextCategoryId: string | undefined;
  let questions: Array<LegacyQuestionProps>;

  // Prepare category data reactively when the route param or question categories (triggered by locale changes) change
  $: update(data.categoryId, $opinionQuestionCategories);

  async function update(categoryId: string, promisedCategories: Promise<Array<LegacyQuestionCategoryProps>>) {
    const cc = await promisedCategories;
    const qq = cc.map((c) => c.questions).flat();
    category = cc.find((c) => c.id === categoryId);
    if (!category) error(500, `Category not found: ${categoryId}`);
    questions = filterAndSortQuestions(qq, $firstQuestionId, $selectedCategories);
    nextQuestionId = category.questions?.[0].id;
    // Find the next category which is included in `selectedCategories`
    nextCategoryId = cc
      .slice(cc.indexOf(category!) + 1)
      .find((c) => !$selectedCategories || $selectedCategories.includes(c.id))?.id;
    if (nextQuestionId) progress.current.set(Math.max(0, questions.findIndex((q) => q.id === nextQuestionId) + 1));
  }
</script>

<svelte:head>
  <title>{category ? category.name : $t('questions.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

{#if !category}
  <Loading class="mt-lg" />
{:else}
  {@const { customData, name, info } = category}

  <Layout title={name}>
    <figure role="presentation" slot="hero">
      {#if customData?.emoji}
        <HeroEmoji emoji={customData.emoji} />
      {/if}
    </figure>

    <svelte:fragment slot="heading">
      <HeadingGroup class="relative">
        <h1><CategoryTag {category} /></h1>
        <PreHeading class="text-secondary">
          {$t('questions.category.numQuestions', {
            numQuestions: category.questions?.length ?? -1
          })}
        </PreHeading>
      </HeadingGroup>
    </svelte:fragment>

    {#if info}
      <p class="text-center">{info}</p>
    {/if}

    <svelte:fragment slot="primaryActions">
      <Button
        variant="main"
        disabled={!nextQuestionId}
        href={$getRoute({ route: ROUTE.Question, id: nextQuestionId })}
        text={$t('common.continue')} />
      {#if $settings.questions.categoryIntros?.allowSkip}
        <Button
          icon="skip"
          color="secondary"
          href={$getRoute(
            nextCategoryId ? { route: ROUTE.QuestionCategory, id: nextCategoryId } : { route: ROUTE.Results }
          )}
          text={nextCategoryId ? $t('questions.category.skip') : $t('questions.skipToResults')}
          class="justify-center" />
      {/if}
    </svelte:fragment>
  </Layout>
{/if}
