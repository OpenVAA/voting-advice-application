# QuestionHeading

Show a `Question`’s text and metadata, such as category and applicable elections.

### Dynamic component

This is a dynamic component, because it accesses the settings via `AppContext` and selected elections from `VoterContext` or `CandidateContext`.

### Properties

- `question`: The `Question` whose text and metadata to show.
- `questionBlocks`: The `QuestionBlocks` containing the question.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default false
- Any valid properties of a `HeadingGroup` component.

### Settings

- `questions.showCategoryTags`: Whether to show the category tags.

### Usage

```tsx
<QuestionHeading
  id="{question.id}-heading"
  {question}
  questionBlocks={$selectedQuestionBlocks}/>
```

## Source

[frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte)

[frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.type.ts)
