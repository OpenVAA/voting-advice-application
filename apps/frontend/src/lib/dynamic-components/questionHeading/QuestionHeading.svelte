<!--
@component
Show a `Question`'s text and metadata, such as category and applicable elections.

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
<QuestionHeading id="{question.id}-heading" {question} questionBlocks={selectedQuestionBlocks}/>
```
-->

<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { ElectionTag } from '$lib/components/electionTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { Term } from '$lib/components/term';
  import { getAppContext } from '$lib/contexts/app';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getVoterContext } from '$lib/contexts/voter';
  import { concatClass } from '$lib/utils/components';
  import { getElectionsToShow } from '$lib/utils/questions';
  import { escapeRegExp } from '$lib/utils/regexp';
  import type { TermDefinition } from '@openvaa/app-shared';
  import type { Election } from '@openvaa/data';
  import type { QuestionBlock } from '$lib/contexts/utils/questionBlockStore.type';
  import type { QuestionHeadingProps } from './QuestionHeading.type';

  type TitlePart = { text: string; explanation?: string; title?: string };

  let { question, questionBlocks, onShadedBg, ...restProps }: QuestionHeadingProps = $props();

  const { appSettings, appType, dataRoot, t } = getAppContext();
  // Get the elections source based on app type; reading happens in reactive contexts below
  const voterCtx = $appType === 'voter' ? getVoterContext() : undefined;
  const candidateCtx = $appType === 'candidate' ? getCandidateContext() : undefined;
  let elections = $derived(
    voterCtx ? voterCtx.selectedElections : candidateCtx ? candidateCtx.selectedElections : $dataRoot.elections
  );

  let customData = $derived(getCustomData(question));
  let titleParts: Array<TitlePart> = $derived(addTermsToTitle(customData.terms));
  let blockWithStats = $derived(questionBlocks?.getByQuestion(question));
  let numQuestions = $derived(questionBlocks?.questions.length);

  function addTermsToTitle(terms?: Array<TermDefinition>) {
    const triggers = terms
      ?.flatMap((t) => t.triggers ?? [])
      ?.sort((a, b) => b.length - a.length)
      .map(escapeRegExp);
    const parts = triggers ? question.text.split(new RegExp(`(${triggers.join('|')})`)) : [question.text];
    return parts.map<TitlePart>((part) => {
      const term = terms?.find((t) => t.triggers?.includes(part));
      return term ? { text: part, explanation: term.content, title: term.title } : { text: part };
    });
  }
</script>

<HeadingGroup {...concatClass(restProps, 'relative')}>
  <PreHeading class="gap-sm flex flex-row flex-wrap items-center justify-center">
    {#if $appSettings.elections.showElectionTags}
      {#each getElectionsToShow({ question, elections }) as election}
        <ElectionTag {election} {onShadedBg} />
      {/each}
    {/if}
    {#if $appSettings.questions.showCategoryTags}
      <CategoryTag
        category={question.category}
        suffix={blockWithStats ? `${blockWithStats.indexInBlock + 1}/${blockWithStats.block.length}` : undefined}
        {onShadedBg} />
    {:else if blockWithStats}
      {t('common.question')}
      <span class="text-secondary">{blockWithStats.index + 1}/{numQuestions}</span>
    {/if}
  </PreHeading>
  <h1>
    {#each titleParts as { text, explanation, title }}
      {#if explanation}<Term definition={title ? `${title}: ${explanation}` : explanation}>{text}</Term
        >{:else}{text}{/if}
    {/each}
  </h1>
</HeadingGroup>
