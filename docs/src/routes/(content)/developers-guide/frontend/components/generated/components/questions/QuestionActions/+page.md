# QuestionActions

Display a question's secondary actions, such as skip.

### Properties

- `answered`: Set to `true` if the question has already been answered. This controls which actions are shown. @default `false`
- `disabled`: Whether to disable all the actions. @default `false`
- `disablePrevious`: Whether to disable the previous button. @default `false`
- `variant`: Use to switch between looser and tighter layouts. @default `'default'`
- `separateSkip`: Whether to separate `skip` and `next` actions both as events and button symbols. @default `false`
- `nextLabel`: The text label for the `next` button. @default `$t('questions.next')` or `$t('questions.skip')`
- `previousLabel`: The text label for the `previous` button. @default `$t('questions.previous')`
- Any valid properties of a `<div>` element

### Callbacks

If `separateSkip` is set to `true`, the `onNext` callback is switched to a `onSkip` callback if the user has not yet answered the question. Otherwise, only `onNext` callbacks will be triggered.

- `onDelete`: Triggered when the user has clicked on the delete answer button. This is only available if `answered` is `true`.
- `onNext`: Triggered when the user has clicked on the next button. This is only available if `answered` is `true` or `separateSkip` is `true`.
- `onPrevious`: Triggered when the user has clicked on the previous button.
- `onSkip`: Triggered when user has clicked on the skip button. This is only available if `answered` is `false` and `separateSkip` is `true`.

### Usage

```tsx
<QuestionActions
  answered={voterAnswer != null}
  separateSkip={true}
  variant="tight"
  onPrevious={gotoPreviousQuestion}
  onDelete={deleteAnswer}
  onNext={gotoNextQuestion}
  onSkip={skipQuestion}
/>
```

## Source

[frontend/src/lib/components/questions/QuestionActions.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionActions.svelte)

[frontend/src/lib/components/questions/QuestionActions.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionActions.type.ts)
