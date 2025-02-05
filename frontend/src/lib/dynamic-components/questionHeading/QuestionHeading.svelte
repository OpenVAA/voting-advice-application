<!--
@component
Show a `Question`’s text and metadata, such as category and applicable elections.

### Dynamic component

This is a dynamic component, because it accesses the settings via `AppContext`.

### Properties

- `question`: The `Question` whose text and metadata to show.
- `questionBlocks`: The `QuestionBlocks` containing the question.
- Any valid properties of a `HeadingGroup` component.

### Settings

- `questions.showCategoryTags`: Whether to show the category tags.

### Usage

```tsx
<QuestionHeading
  id="{question.id}-heading"
  {question}
  questionBlocks={$selectedQuestionBlocks}/>
```
-->

<script lang="ts">
  import { Election } from '@openvaa/data';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { ElectionTag } from '$lib/components/electionTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import { getElectionsToShow } from '$lib/utils/questions';
  import type { QuestionBlock } from '$lib/contexts/utils/questionBlockStore.type';
  import type { QuestionHeadingProps } from './QuestionHeading.type';

  type $$Props = QuestionHeadingProps;

  export let question: $$Props['question'];
  export let questionBlocks: $$Props['questionBlocks'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, t } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Prepare some properties
  ////////////////////////////////////////////////////////////////////

  let blockWithStats: { block: QuestionBlock; index: number; indexInBlock: number; indexOfBlock: number } | undefined;
  let elections: Array<Election>;
  let numQuestions: number | undefined;

  $: blockWithStats = questionBlocks?.getByQuestion(question);
  $: numQuestions = questionBlocks?.questions.length;
  $: elections = getElectionsToShow(question);
</script>

<HeadingGroup {...concatClass($$restProps, 'relative')}>
  <PreHeading>
    {#each elections as election}
      <ElectionTag {election} />
    {/each}
    {#if $appSettings.questions.showCategoryTags}
      <CategoryTag category={question.category} />
      {#if blockWithStats}
        <!-- Index of question within category -->
        <span class="text-secondary">{blockWithStats.indexInBlock + 1}/{blockWithStats.block.length}</span>
      {/if}
    {:else if blockWithStats}
      <!-- Index of question within all questions -->
      {$t('common.question')}
      <span class="text-secondary">{blockWithStats.index + 1}/{numQuestions}</span>
    {/if}
  </PreHeading>

  <!-- class={videoProps ? 'my-0 text-lg sm:my-md sm:text-xl' : ''} -->
  <h1>{question.text}</h1>
</HeadingGroup>
