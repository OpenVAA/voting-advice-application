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
</script>

<div class="mt-xl grid gap-xxl px-lg pb-safelgb">
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
        {#if answer == null}
          <div class="small-label mb-16 text-center">
            {$t('questions.answers.entityHasntAnswered', { entity: shortName })}
          </div>
        {/if}
      {:else if voterAnswer == null && answer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.answers.bothHaventAnswered', { entity: shortName })}
        </div>
      {:else if voterAnswer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.answers.youHaventAnswered')}
        </div>
      {:else if answer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.answers.entityHasntAnswered', { entity: shortName })}
        </div>
      {/if}

      <!-- Only show the answering choices if either one has answered -->
      {#if voterAnswer != null || answer != null}
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
