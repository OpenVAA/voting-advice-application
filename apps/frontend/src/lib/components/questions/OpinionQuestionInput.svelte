<!--
@component
Display an opinion `Question`'s answering input. Shows an error if the question is of an unsupported type.

NB. The layout differs from the `QuestionInput` component, which is used for info questions.

### Properties

- `question`: The opinion `Question` for which to show the input. Not reactive.
- `answer`: The `Answer` object to the question. Not reactive.
- `mode`: The same component can be used both for answering the questions and displaying answers. @default `'answer'`
- `otherAnswer`:The `Answer` of the other entity in `display` mode. @default undefined
- `otherLabel`: The label for the entity's answer. Be sure to supply this if `otherSelected` is supplied.
- Any properties of `QuestionInput`.

### Usage

```tsx
<OpinionQuestionInput
  {question}
  answer={$voterAnswers[question.id]}
  onChange={answerQuestion} />
<OpinionQuestionInput
  {question}
  mode="display"
  answer={$voterAnswers[question.id]}
  otherAnswer={candidate.getAnswer(question)}
  otherLabel={t('candidateApp.common.candidateAnswerLabel')} />
```
-->

<script lang="ts">
  import { getCustomData } from '@openvaa/app-shared';
  import { isBooleanQuestion, isMultipleChoiceQuestion, isNumberQuestion, isSingleChoiceQuestion } from '@openvaa/data';
  import { untrack } from 'svelte';
  import { getComponentContext } from '$lib/contexts/component';
  import { logDebugError } from '$lib/utils/logger';
  import { isMultiChoiceCountValid } from '$lib/utils/multiChoiceValidity';
  import NumberScaleInput from './NumberScaleInput.svelte';
  import QuestionChoices from './QuestionChoices.svelte';
  import ErrorMessage from '../errorMessage/ErrorMessage.svelte';
  import type { Id } from '@openvaa/core';
  import type { Choice } from '@openvaa/data';
  import type { OpinionQuestionInputProps } from './OpinionQuestionInput.type';

  let {
    question,
    mode = 'answer',
    answer = undefined,
    otherAnswer = undefined,
    otherLabel = undefined,
    valid = $bindable(true),
    onChange,
    ...restProps
  }: OpinionQuestionInputProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Multi-choice validity
  ////////////////////////////////////////////////////////////////////

  // The current multi-choice selection, seeded from the ensured answer value and
  // updated on every checkbox toggle. Reset when the question identity changes
  // (voter same-type Q→Q reuse does not remount this component).
  let currentMultiSelection = $state<Array<Id>>([]);
  $effect(() => {
    // Track question identity so the seed re-runs on Q→Q navigation; read the
    // answer untracked so a parent answer update does not clobber in-progress
    // toggles.
    void question.id;
    untrack(() => {
      const ensured = question.ensureValue(answer?.value);
      currentMultiSelection = Array.isArray(ensured) ? [...ensured] : [];
    });
  });

  // validity for the current multi-choice selection count, delegating to
  // the shared `isMultiChoiceCountValid` helper (single source of truth) so the
  // formula stays in lockstep with its unit test. Reads the authored min/max via
  // `getCustomData` and the choice count off the question.
  function computeMultiChoiceValid(count: number): boolean {
    if (!isMultipleChoiceQuestion(question)) return true;
    const { minSelections, maxSelections } = getCustomData(question);
    return isMultiChoiceCountValid({
      count,
      minSelections,
      maxSelections,
      choiceCount: question.choices.length
    });
  }

  // Push validity to the bound `valid` prop. Only multi-choice constrains it;
  // every other question type leaves it `true` (the component never
  // disables anything — callers gate on this value). This $effect handles the
  // mount seed, question-identity changes, and the non-multi-choice reset; the
  // multi-choice onChange wrapper additionally assigns `valid` SYNCHRONOUSLY
  // (see below) because this $effect flushes too late for the same-stack read
  // in the voter layout's handleAnswer.
  $effect(() => {
    if (!isMultipleChoiceQuestion(question)) {
      valid = true;
      return;
    }
    valid = computeMultiChoiceValid(currentMultiSelection.length);
  });

  // Debug warning — runs reactively so devs see the warning whenever the
  // prop combination becomes invalid, not just at mount.
  $effect(() => {
    if (mode === 'display' && otherAnswer && !otherLabel)
      logDebugError('You should supply an otherLabel when mode is "display" and otherSelected is provided');
  });

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // BooleanQuestion support
  ////////////////////////////////////////////////////////////////////

  // Synthesized pseudo-choices for `BooleanQuestion`. Uses existing i18n keys
  // under `common.answer.*` (verified present in en/fi/sv/da).
  // Order: `no` first matches the ordinal low→high left-to-right convention
  // (see `QuestionChoices.doShowLine` default for booleans).
  const booleanChoices = $derived<Array<Choice>>([
    { id: 'no', label: t('common.answer.no') },
    { id: 'yes', label: t('common.answer.yes') }
  ]);

  // Translate between stored boolean answer value and pseudo-choice id.
  // Answers MUST be stored as boolean (`true`/`false`), never as the strings
  // `'yes'`/`'no'`. The branch's onChange adapter maps `'yes'` → `true` and
  // `'no'` → `false` before bubbling to the parent.
  function booleanToChoiceId(v: unknown): string | null {
    if (v === true) return 'yes';
    if (v === false) return 'no';
    return null;
  }
</script>

<div data-testid="opinion-question-input">
  {#if isSingleChoiceQuestion(question)}
    {@const selectedId = question.ensureValue(answer?.value)}
    {@const otherSelected = question.ensureValue(otherAnswer?.value)}
    <QuestionChoices
      {question}
      {mode}
      {selectedId}
      {otherSelected}
      {otherLabel}
      onChange={onChange ? (d) => onChange({ value: d.value, question: d.question }) : undefined}
      {...restProps} />
  {:else if isBooleanQuestion(question)}
    {@const selectedId = booleanToChoiceId(answer?.value)}
    {@const otherSelected = booleanToChoiceId(otherAnswer?.value)}
    <QuestionChoices
      {question}
      choices={booleanChoices}
      {mode}
      {selectedId}
      {otherSelected}
      {otherLabel}
      onChange={onChange ? (d) => onChange({ value: d.value === 'yes', question: d.question }) : undefined}
      {...restProps} />
  {:else if isNumberQuestion(question) && question.isMatchable}
    <!-- `isMatchable` gates on a defined min/max range so rangeless number
         questions fall through to the unsupported fallback rather than rendering
         a broken 0-width slider. Values routed through `ensureValue`; missing /
         non-number answers coerce to `null` (unanswered). -->
    {@const rawValue = question.ensureValue(answer?.value)}
    {@const rawOther = question.ensureValue(otherAnswer?.value)}
    {@const numberValue = typeof rawValue === 'number' ? rawValue : null}
    {@const otherNumberValue = typeof rawOther === 'number' ? rawOther : null}
    <!-- restProps is spread FIRST: it carries `value?: unknown` from
         InputPropsBase, which would otherwise override the typed
         `value={numberValue}` and fail NumberScaleInput's `number | null` prop. -->
    <NumberScaleInput
      {...restProps}
      {question}
      {mode}
      value={numberValue}
      otherValue={otherNumberValue}
      {otherLabel}
      onChange={onChange ? (d) => onChange({ value: d.value, question: d.question }) : undefined} />
  {:else if isMultipleChoiceQuestion(question)}
    <!-- Checkbox multi-select mode. Values are choice-Id arrays routed
         through `ensureValue`; missing / non-array answers coerce to `null`.
         Validity is surfaced via the bound `valid` prop — this component never
         disables anything; callers gate Save (candidate) / Skip (voter). -->
    {@const rawSelected = question.ensureValue(answer?.value)}
    {@const rawOther = question.ensureValue(otherAnswer?.value)}
    {@const selectedIds = Array.isArray(rawSelected) ? rawSelected : null}
    {@const otherSelectedIds = Array.isArray(rawOther) ? rawOther : null}
    <QuestionChoices
      {question}
      {mode}
      {selectedIds}
      {otherSelectedIds}
      {otherLabel}
      onChange={(d) => {
        if (Array.isArray(d.value)) {
          currentMultiSelection = d.value;
          // Assign the bound `valid` SYNCHRONOUSLY before bubbling onChange:
          // `$bindable` writes propagate to the parent's bound $state within this
          // same call stack, whereas the validity $effect above flushes only
          // after the event handler returns. The voter layout's handleAnswer
          // reads `opinionInputValid` inside this synchronous
          // onChange stack, so it must see fresh validity here.
          valid = computeMultiChoiceValid(d.value.length);
        }
        onChange?.({ value: d.value, question: d.question });
      }}
      {...restProps} />
  {:else}
    <ErrorMessage inline message={t('error.unsupportedQuestion')} class="text-center" />
  {/if}
</div>
