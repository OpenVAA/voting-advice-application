# EntityInfo

Used to show an entity's basic info and their answers to `info` questions in an `EntityDetails` component.

### Dynamic component

This is a dynamic component, because it accesses `appSettings` and `dataRoot` from `AppContext`.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- `questions`: An array of `info` questions.
- Any valid attributes of a `<div>` element

### Settings

- `results.sections: 'organization'`: Whether to show a link to the nominating organization.
- `survey.showIn: 'entityDetails'`: Whether to show the survey banner.

### Usage

```tsx
<EntityInfo entity={candidate} questions={$infoQuestions} />
```

## Source

[frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte)

[frontend/src/lib/dynamic-components/entityDetails/EntityInfo.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.type.ts)
