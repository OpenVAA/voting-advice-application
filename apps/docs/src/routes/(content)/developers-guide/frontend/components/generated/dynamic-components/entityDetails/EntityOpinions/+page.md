# EntityOpinions

Used to show an entity's answers to `opinion` questions and possibly those of the voter, too, in an `EntityDetails` component.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- `questions`: An array of `opinion` questions.
- `answers`: An optional `AnswerStore` with the Voter's answers to the questions.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<EntityOpinions entity={candidate} questions={$opinionQuestions} />
```

## Source

[frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte)

[frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.type.ts)
