# Components

For information about component properties, typing and documentation, see [Svelte components](../contributing/style-guides.md#svelte-components) in the Contributors’ guide.

## Dynamic and static components

The components used in the app are divided into dynamic and static ones, contained in [\$lib/components](../../frontend/src/lib/components) and [\$lib/dynamic-components](../../frontend/src/lib/dynamic-components), respectively.

**Static components** are ’dumb’ in the sense that their access to the application state is limited to the [`ComponentContext`](../../frontend/src/lib/contexts/component/componentContext.type.ts), which currently includes only localization functions and a `darkMode` store. The reasons for this restriction is twofold:

1. When properties related to the application state are changed, static components need not be updated.
2. Static components can be used anywhere, even outside the app if the `ComponentContext` is available.

**Dynamic components**, on the other hand, are given full access to the application state and data. They implement sometimes complex logic dependent on the application settings, VAA data, search and route parameters, user selections etc. [`EntityDetails`](../../frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte), for example, provides the Voter’s answers to the [`EntityOpinions`](../../frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte) subcomponent if it’s used within the Voter App:

```tsx
const { appType } = getAppContext();
let answers: AnswerStore | undefined;
if ($appType === 'voter') {
  const context = getVoterContext();
  answers = context.answers;
}
// In the html part
<EntityOpinions {answers} ... />
```
