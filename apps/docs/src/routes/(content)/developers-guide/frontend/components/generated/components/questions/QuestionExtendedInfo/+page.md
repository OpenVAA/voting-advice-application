# QuestionExtendedInfo

Display the question's expandable information content.

### Properties

- `question`: The question to show the info for.
- `title`: Optional title for the info, by default the question text.
- Any valid properties of a `<div>` element

### Callback properties

- `onSectionCollapse`: A callback triggered when an info section is collapsed. Mostly used for tracking.
- `onSectionExpand`: A callback triggered when an info section is expanded. Mostly used for tracking.

### Usage

```tsx
<QuestionExtendedInfo {question} />
```

## Source

[apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte)

[apps/frontend/src/lib/components/questions/QuestionExtendedInfo.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/questions/QuestionExtendedInfo.type.ts)
