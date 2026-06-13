<!--
@component
Used to show an entity's answers to `opinion` questions and possibly those of the voter, too, in an `EntityDetails` component.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- `questions`: An array of `opinion` questions.
- `answers`: An optional `AnswerStore` with the Voter's answers to the questions.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<EntityOpinions entity={candidate} questions={opinionQuestions} />
```
-->

<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { CategoryTag } from '$lib/components/categoryTag';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { OpinionQuestionInput, QuestionOpenAnswer } from '$lib/components/questions';
  import { getAppContext } from '$lib/contexts/app';
  import { unwrapEntity } from '$lib/utils/entities';
  import type { AnyEntityVariant } from '@openvaa/data';
  import type { EntityOpinionsProps } from './EntityOpinions.type';

  let { entity, questions, answers }: EntityOpinionsProps = $props();

  const ctx = getAppContext();
  const { appType, t } = ctx;
  // appSettings is a reactive accessor (Phase 113 flatten) — read via ctx.X, never destructure.
  const appSettings = $derived(ctx.appSettings);

  const unwrapped = $derived(unwrapEntity(entity));
  let nakedEntity: AnyEntityVariant = $derived(unwrapped.entity);
  let shortName: string = $derived(nakedEntity.shortName);
</script>

<div class="mt-xl gap-xxl px-lg pb-safelgb grid">
  {#each questions as question}
    {@const { id, text, category } = question}
    {@const answer = nakedEntity.getAnswer(question)}
    {@const voterAnswer = answers?.answers?.[id]}
    {@const customData = getCustomData(question)}

    <div class="grid" data-testid="entity-opinion-question">
      <HeadingGroup class="mb-lg text-center">
        {#if appSettings.questions.showCategoryTags && category}
          <PreHeading><CategoryTag {category} /></PreHeading>
        {/if}
        <h3>{text}</h3>
      </HeadingGroup>

      {#if appType.current === 'candidate'}
        {#if answer == null}
          <div class="small-label mb-16 text-center">
            {t('questions.answers.entityHasntAnswered', { entity: shortName })}
          </div>
        {/if}
      {:else if voterAnswer == null && answer == null}
        <div class="small-label mb-16 text-center">
          {t('questions.answers.bothHaventAnswered', { entity: shortName })}
        </div>
      {:else if voterAnswer == null}
        <div class="small-label mb-16 text-center">{t('questions.answers.youHaventAnswered')}</div>
      {:else if answer == null}
        <div class="small-label mb-16 text-center">
          {t('questions.answers.entityHasntAnswered', { entity: shortName })}
        </div>
      {/if}

      {#if voterAnswer != null || answer != null}
        <OpinionQuestionInput
          {question}
          mode="display"
          answer={voterAnswer}
          otherAnswer={answer}
          otherLabel={shortName} />
        {#if answer?.info && customData?.allowOpen !== false}
          <QuestionOpenAnswer content={answer.info} class="mt-md" data-testid="entity-opinion-open-answer" />
        {/if}
      {/if}
    </div>
  {/each}
</div>
