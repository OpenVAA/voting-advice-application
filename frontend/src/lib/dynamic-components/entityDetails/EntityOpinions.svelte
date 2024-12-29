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
  import { QuestionOpenAnswer } from '$lib/components/questions';
  import type { AnyEntityVariant, AnyQuestionVariant, EntityType } from '@openvaa/data';
  import type { EntityDetailsProps } from './EntityDetails.type';
  import { getAppContext } from '$lib/contexts/app';
  import { unwrapEntity } from '$lib/utils/entities';
  import QuestionChoices from '$lib/components/questions/QuestionChoices.svelte';
  import type { AnswerStore } from '$lib/contexts/voter';

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
  
  let entityType: EntityType;
  let nakedEntity: AnyEntityVariant;
  let shortName: string;

  $: {
    ({ entity: nakedEntity } = unwrapEntity(entity));
    ({ shortName } = nakedEntity);
    entityType = nakedEntity.type;
  }

</script>


<div class="grid p-lg">
  {#each questions as question}
    {@const { id, text, type, category, customData } = question}
    {@const answer = nakedEntity.getAnswer(question)}
    <!-- We need to be careful in the value conversion that we don't end up with an 'undefined' string -->
    {@const otherSelected = answer?.value ? `${answer?.value}` : undefined}
    {@const voterAnswer = answers ? `${$answers?.[id]?.value}` : undefined}
    {@const headingId = `questionHeading-${id}`}

    <div class="mb-xxl mt-lg grid">
      <HeadingGroup id={headingId} class="mb-lg text-center">
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
        {#if type === 'singleChoiceCategorical' || type === 'singleChoiceOrdinal'}
          <QuestionChoices
            {question}
            aria-labelledby={headingId}
            name={id}
            mode="display"
            selectedId={voterAnswer}
            {otherSelected}
            otherLabel={shortName} />
        {:else}
          {$t('error.general')}
        {/if}

        {#if answer?.info}
          <QuestionOpenAnswer content={answer.info}/>
        {/if}
      {/if}
    </div>
  {/each}
</div>
