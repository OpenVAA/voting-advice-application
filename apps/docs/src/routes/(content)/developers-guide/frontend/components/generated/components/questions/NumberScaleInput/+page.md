# NumberScaleInput

Display a `NumberQuestion`'s answering input as a native range slider (DaisyUI `range range-primary`) with a live numeric value label. The same component renders a read-only dual-marker view in `display` mode (voter value + entity value), mirroring the `QuestionChoices` display-mode marker pattern and reused by `EntityOpinions`.

**Contract:** the component assumes the question has a valid range
(`question.min` and `question.max` both defined, non-equal). The caller (`OpinionQuestionInput`) gates on `question.isMatchable`, so a rangeless number question never reaches this component and cannot render a broken 0-width range.

Native `<input type="range">` is chosen deliberately so keyboard-arrow exact-value stepping works for free: ArrowUp/ArrowRight step +1, ArrowDown/ArrowLeft −1, Home→min, End→max. Values at exactly `min`/`max` are reachable and clamp.

### Properties

- `question`: The `NumberQuestion`. Not reactive.
- `mode`: `'answer'` (default) or `'display'`.
- `value`: The voter's current numeric answer, or `null` when unanswered.
- `otherValue`: The entity's numeric answer in `display` mode.
- `otherLabel`: The label for the entity's answer in `display` mode.
- `onShadedBg`: Set to `true` on a dark (`base-300`) background. @default `false`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<NumberScaleInput {question} {value} onChange={answerQuestion} />

<NumberScaleInput
  {question}
  mode="display"
  {value}
  otherValue={entityValue}
  otherLabel={t('candidateApp.common.candidateAnswerLabel')} />
```

## Source

[apps/frontend/src/lib/components/questions/NumberScaleInput.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/questions/NumberScaleInput.svelte)

[apps/frontend/src/lib/components/questions/NumberScaleInput.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/questions/NumberScaleInput.type.ts)
