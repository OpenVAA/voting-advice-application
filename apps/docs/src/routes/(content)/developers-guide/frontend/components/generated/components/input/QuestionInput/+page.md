# QuestionInput

A convenience wrapper for `Input` which fills in the necessary properties based on the info `Question` and possible `Answer` passed.

NB. To show opinion `Question`s, use the `OpinionQuestionInput` component in `$lib/components/questions`.

### Properties

- `question`: The `Question` for which to show the input. Not reactive.
- `answer`: The `Answer` object to the question. Not reactive.
- `disableMultilingual`: If `true`, text inputs will not be multilingual. @default `false`
- Any properties of `Input`, except `choices`, `ordered` and `type`. Note that `label`, `id` and `info` are prefilled but may be overridden.

### Callbacks

- `onChange`: Event handler triggered when the value changes with the new `value`.

### Usage

```tsx
<QuestionInput {question} onChange={(v) => console.info(v)} />
```

## Source

[frontend/src/lib/components/input/QuestionInput.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/input/QuestionInput.svelte)

[frontend/src/lib/components/input/QuestionInput.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/input/QuestionInput.type.ts)
