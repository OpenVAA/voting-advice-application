<!--
@component
Show a `Question`’s text and metadata, such as category and applicable elections.

### Dynamic component

This is a dynamic component, because it accesses the settings via `AppContext` and selected elections from `VoterContext` or `CandidateContext`.

### Properties

- `question`: The `Question` whose text and metadata to show.
- `questionBlocks`: The `QuestionBlocks` containing the question.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default false
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
  import { type Readable,readable } from 'svelte/store';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { ElectionTag } from '$lib/components/electionTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getAppContext } from '$lib/contexts/app';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getVoterContext } from '$lib/contexts/voter';
  import { concatClass } from '$lib/utils/components';
  import { getElectionsToShow } from '$lib/utils/questions';
  import type { QuestionBlock } from '$lib/contexts/utils/questionBlockStore.type';
  import type { QuestionHeadingProps } from './QuestionHeading.type';

  type $$Props = QuestionHeadingProps;

  export let question: $$Props['question'];
  export let questionBlocks: $$Props['questionBlocks'] = undefined;
  export let onShadedBg: $$Props['onShadedBg'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, dataRoot, t } = getAppContext();
  let elections: Readable<Array<Election>>;
  if ($appType === 'voter') {
    elections = getVoterContext().selectedElections;
  } else if ($appType === 'candidate') {
    elections = getCandidateContext().selectedElections;
  } else {
    elections = readable($dataRoot.elections);
  }

  ////////////////////////////////////////////////////////////////////
  // Prepare some properties
  ////////////////////////////////////////////////////////////////////

  let blockWithStats: { block: QuestionBlock; index: number; indexInBlock: number; indexOfBlock: number } | undefined;
  let numQuestions: number | undefined;

  $: blockWithStats = questionBlocks?.getByQuestion(question);
  $: numQuestions = questionBlocks?.questions.length;
</script>

<HeadingGroup {...concatClass($$restProps, 'relative')}>
  <PreHeading class="flex flex-row flex-wrap items-center justify-center gap-sm">
    {#if $appSettings.elections.showElectionTags}
      {#each getElectionsToShow({ question, elections: $elections }) as election}
        <ElectionTag {election} {onShadedBg} />
      {/each}
    {/if}
    {#if $appSettings.questions.showCategoryTags}
      <CategoryTag
        category={question.category}
        suffix={blockWithStats ? `${blockWithStats.indexInBlock + 1}/${blockWithStats.block.length}` : undefined} 
        {onShadedBg}/>
    {:else if blockWithStats}
      <!-- Index of question within all questions -->
      {$t('common.question')}
      <span class="text-secondary">{blockWithStats.index + 1}/{numQuestions}</span>
    {/if}
  </PreHeading>

  <!-- class={videoProps ? 'my-0 text-lg sm:my-md sm:text-xl' : ''} -->
  <h1>{question.text}</h1>
</HeadingGroup>
