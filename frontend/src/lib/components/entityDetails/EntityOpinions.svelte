<script lang="ts">
  import {t} from '$lib/i18n';
  import {isCandidate} from '$lib/utils/entities';
  import {answeredQuestions, settings} from '$lib/utils/stores';
  import {CategoryTag} from '$lib/components/categoryTag';
  import {LikertResponseButtons, QuestionOpenAnswer} from '$lib/components/questions';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {getLikertAnswer} from '$lib/utils/answers';
  import type {EntityDetailsProps} from './EntityDetails.type';

  export let entity: EntityProps;
  export let questions: EntityDetailsProps['opinionQuestions'];

  let shortName: string;

  $: shortName = isCandidate(entity)
    ? `${entity.firstName[0].toLocaleUpperCase()}. ${entity.lastName}`
    : entity.shortName;

  /** This is needed to ensure typing but will be no longer needed, when vaa-data model is implemented an Question object methods can be used to enforce typing. */
  function getVoterLikertAnswer(question: QuestionProps): number | undefined {
    const answer = $answeredQuestions[question.id]?.value;
    return typeof answer === 'number' ? answer : undefined;
  }
</script>

<!--
@component
Used to show an entity's opinions in an `EntityDetails` component.

### Properties

- `entity`: The entity
- `questions`: The list of Question objects to show

### Usage

```tsx
<EntityOpinions entity={candidate} questions={opinionQuestions} />
```
-->

<div class="p-lg">
  {#each questions as question}
    {@const {id, text, type, values, category, customData} = question}
    {@const answer = getLikertAnswer(entity, question)}
    {@const voterAnswer = getVoterLikertAnswer(question)}
    {@const headingId = `questionHeading-${id}`}

    <div class="mb-60 mt-20">
      <HeadingGroup id={headingId} class="mb-lg text-center">
        {#if $settings.questions.showCategoryTags && category}
          <PreHeading><CategoryTag {category} /></PreHeading>
        {/if}
        <h3>{text}</h3>
      </HeadingGroup>

      {#if voterAnswer == null && answer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.bothHaventAnswered', {entity: shortName})}
        </div>
      {:else if voterAnswer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.youHaventAnswered')}
        </div>
      {:else if answer == null}
        <div class="small-label mb-16 text-center">
          {$t('questions.entityHasntAnswered', {entity: shortName})}
        </div>
      {/if}

      {#if type === 'singleChoiceOrdinal'}
        <LikertResponseButtons
          aria-labelledby={headingId}
          name={id}
          mode="display"
          selectedKey={voterAnswer}
          entityKey={answer?.value}
          entityLabel={shortName}
          options={values}
          variant={customData?.vertical ? 'vertical' : undefined} />
      {:else}
        {$t('error.general')}
      {/if}

      {#if answer?.openAnswer}
        <QuestionOpenAnswer>
          {answer.openAnswer}
        </QuestionOpenAnswer>
      {/if}
    </div>
  {/each}
</div>
