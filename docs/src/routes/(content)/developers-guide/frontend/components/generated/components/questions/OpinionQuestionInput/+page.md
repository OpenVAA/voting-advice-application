# OpinionQuestionInput

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
  otherLabel={$t('candidateApp.common.candidateAnswerLabel')} />
```

## Source

[frontend/src/lib/components/questions/OpinionQuestionInput.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/OpinionQuestionInput.svelte)

[frontend/src/lib/components/questions/OpinionQuestionInput.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts)
