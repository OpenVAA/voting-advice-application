# QuestionChoices

Display the buttons used for answering Likert and other single choice questions.

The buttons are rendered as `<input type="radio">` elements contained inside a `<fieldset>`. Consider passing an `aria-labelledby` pointing to the question or an `aria-label`.

The buttons for ordinal questions are by default displayed horizontally and with a line connecting them, while categorical ones are displayed vertically using a larger text size and without a line. These can be overriden by setting the relevant properties. The vertical layout should always be used for choices with long labels.

The radio buttons' behaviour is as follows when using a pointer or touch device:

1. Selecting an option triggers the `onChange` callback
2. Clicking on the selected radio button triggers the `onReselect` callback

Keyboard navigation works in the following way:

1. `Tab` focuses the whole radio group
2. The arrow keys change the focused radio button and _select_ it at the same time
3. When the keyboard focus leaves the radio group, either of the callbacks is triggered, depending on whether value has been changed or not
4. The event is also dispatched when the user presses the `Space` or `Enter` key

### Display mode

The same component can also be used to display the answers of the voter and another entity by setting `mode` to `'display'` and supplying `otherSelected` and `otherLabel`. In this case the buttons cannot be selected.

### Properties

- `name`: The `name` of the radio group. Usually the question's id
- `choices`: The `key`-`label` pairs of the radio buttons
- `disabled`: Whether to disable all the buttons. @default `false`
- `mode`: The same component can be used both for answering the questions and displaying answers. @default `'answer'`
- `selectedId`: The initially selected key of the radio group.
- `otherSelected`: The answer key of the entity in display mode.
- `otherLabel`: The label for the entity's answer. Be sure to supply this if `otherSelected` is supplied.
- `showLine`: Whether to show a line connecting the choices. @default `true` for ordinal questions, and `false` for categorical questions
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default `false`
- `variant`: Defines the layout variant of the buttons. The `vertical` variant can be used for questions with longer labels. @default `'horizontal'` for ordinal questions, and `'vertical'` for categorical questions.
- Any valid attributes of a `<fieldset>` element

### Callbacks

- `onReselect`: Triggered when user has clicked on the same radio button that was initially selected.
- `onChange`: Triggered when the user has clicked on a different radio button than which was initially selected or there was no selected value initially.

### Usage

```tsx
<QuestionChoices
  {question}
  selectedId={$voterAnswers[question.id]}
  onChange={answerQuestion}
  onReselect={doFoo} />

<QuestionChoices
  {question}
  mode="display"
  selectedId={$voterAnswers[question.id]}
  otherSelected={candidateAnswer}
  otherLabel={$t('candidateApp.common.candidateAnswerLabel')} />
```

## Source

[frontend/src/lib/components/questions/QuestionChoices.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionChoices.svelte)

[frontend/src/lib/components/questions/QuestionChoices.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionChoices.type.ts)
