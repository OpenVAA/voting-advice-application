<!--
@component
Used to show an entity's answers to `opinion` questions and possibly those of the voter, too, in an `EntityDetails` component.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- `questions`: An array of `opinion` questions.
- `answers`: An optional `AnswerStore` with the Voter’s answers to the questions.

### Usage

```tsx
<EntityOpinions entity={candidate} questions={$opinionQuestions} />
```
-->

<script lang="ts">
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { OpinionQuestionInput, QuestionOpenAnswer } from '$lib/components/questions';
  import { getAppContext } from '$lib/contexts/app';
  import { unwrapEntity } from '$lib/utils/entities';
  import type { AnyEntityVariant, AnyQuestionVariant } from '@openvaa/data';
  import type { AnswerStore } from '$lib/contexts/voter';
  import type { EntityDetailsProps } from './EntityDetails.type';
  import QuestionWeightInput from '$lib/components/questions/QuestionWeightInput.svelte';
  import { QUESTION_WEIGHTS, type QuestionWeightConfig } from '$lib/utils/matching';

  export let entity: EntityDetailsProps['entity'];
  export let questions: Array<AnyQuestionVariant>;
  export let answers: AnswerStore | undefined = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, t } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Parse entity components
  ////////////////////////////////////////////////////////////////////

  let nakedEntity: AnyEntityVariant;
  let shortName: string;

  $: {
    ({ entity: nakedEntity } = unwrapEntity(entity));
    ({ shortName } = nakedEntity);
  }

  ////////////////////////////////////////////////////////////////////
  // Initialize possible question weights
  ////////////////////////////////////////////////////////////////////

  const questionWeights: QuestionWeightConfig | undefined =
    $appSettings.matching.questionWeights && $appSettings.matching.questionWeights !== 'none'
      ? QUESTION_WEIGHTS[$appSettings.matching.questionWeights]
      : undefined;
</script>

<div class="mt-xl gap-xxl px-lg pb-safelgb grid">
  {#each questions as question}
    {@const { id, text, category } = question}
    {@const answer = nakedEntity.getAnswer(question)}
    {@const voterAnswer = $answers?.[id]}
    <div class="grid">
      <HeadingGroup class="mb-lg text-center">
        {#if $appSettings.questions.showCategoryTags && category}
          <PreHeading><CategoryTag {category} /></PreHeading>
        {/if}
        <h3>{text}</h3>
      </HeadingGroup>

      {#if $appType === 'candidate'}
        {#if answer?.value == null}
          <div class="small-label mb-16 text-center">
            {$t('questions.answers.entityHasntAnswered', { entity: shortName })}
          </div>
        {/if}
      {/if}

      {#if $appType === 'voter'}
        {#if questionWeights && voterAnswer?.value != null && voterAnswer?.weight != null && voterAnswer?.weight != 1}
          <QuestionWeightInput mode="display" selected={voterAnswer.weight} options={questionWeights} class="mb-md" />
        {/if}

        {#if voterAnswer?.value == null && answer?.value == null}
          <div class="small-label mb-16 text-center">
            {$t('questions.answers.bothHaventAnswered', { entity: shortName })}
          </div>
        {:else if voterAnswer?.value == null}
          <div class="small-label mb-16 text-center">
            {$t('questions.answers.youHaventAnswered')}
          </div>
        {:else if answer?.value == null}
          <div class="small-label mb-16 text-center">
            {$t('questions.answers.entityHasntAnswered', { entity: shortName })}
          </div>
        {/if}
      {/if}

      <!-- Only show the answering choices if either one has answered -->
      {#if voterAnswer?.value != null || answer?.value != null}
        <OpinionQuestionInput
          {question}
          mode="display"
          answer={voterAnswer}
          otherAnswer={answer}
          otherLabel={shortName} />

        {#if answer?.info}
          <QuestionOpenAnswer content={answer.info} class="mt-md" />
        {/if}
      {/if}
    </div>
  {/each}
</div>
