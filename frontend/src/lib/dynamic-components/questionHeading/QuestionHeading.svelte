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
  import { getCustomData, type TermDefinition } from '@openvaa/app-shared';
  import { Election } from '@openvaa/data';
  import { type Readable, readable } from 'svelte/store';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { ElectionTag } from '$lib/components/electionTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { Tooltip } from '$lib/components/tooltip';
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
  let titleParts: Array<{ text?: string; term?: string; explanation?: string; title?: string }> = [
    { text: question.text }
  ];

  $: customData = getCustomData(question);
  $: blockWithStats = questionBlocks?.getByQuestion(question);
  $: numQuestions = questionBlocks?.questions.length;
  $: addTermsToTitle(customData.terms);

  ////////////////////////////////////////////////////////////////////
  // Functions
  ////////////////////////////////////////////////////////////////////

  function addTermsToTitle(terms?: Array<TermDefinition>) {
    titleParts = [{ text: question.text }];

    terms?.forEach((term) => {
      term.triggers?.forEach((trigger) => {
        titleParts.forEach((section) => {
          if (!section.text) return;

          const index = titleParts.indexOf(section);
          const newSectionStrings = section.text.split(trigger);
          if (newSectionStrings.length === 1) return;

          newSectionStrings.forEach((s, i) => {
            if (i === 0) {
              titleParts[index].text = s;
            } else {
              titleParts.splice(index + i, 0, { term: trigger, explanation: term.content, title: term.title });
              titleParts.splice(index + i + 1, 0, { text: newSectionStrings[i] });
            }
          });
        });
      });
    });
  }
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
        {onShadedBg} />
    {:else if blockWithStats}
      <!-- Index of question within all questions -->
      {$t('common.question')}
      <span class="text-secondary">{blockWithStats.index + 1}/{numQuestions}</span>
    {/if}
  </PreHeading>
  <!-- class={videoProps ? 'my-0 text-lg sm:my-md sm:text-xl' : ''} -->
  <h1>
    {#each titleParts as { text, term, explanation, title }}
      {#if text}
        <span>{text}</span>
      {:else if term && explanation}
        <Tooltip tip={explanation} {title}>
          {term}
        </Tooltip>
      {/if}
    {/each}
  </h1>
</HeadingGroup>
