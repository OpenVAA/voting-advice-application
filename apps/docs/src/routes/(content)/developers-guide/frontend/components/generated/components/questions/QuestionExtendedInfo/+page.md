# QuestionExtendedInfo

Display the question's expandable information content.

### Properties

- `title`: The title for the info, usually the question text.
- `info`: The info content to show as a plain or HTML string.
- `infoSections`: An array of objects with `title` and `content` properties to show as expandable sections.
- Any valid properties of a `<div>` element

### Callback properties

- `onSectionCollapse`: A callback triggered when an info section is collapsed. Mostly used for tracking.
- `onSectionExpand`: A callback triggered when an info section is expanded. Mostly used for tracking.

### Usage

```tsx
<QuestionExtendedInfo info={question.info} infoSections={customData.infoSections} />
```

## Source

[frontend/src/lib/components/questions/QuestionExtendedInfo.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte)

[frontend/src/lib/components/questions/QuestionExtendedInfo.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionExtendedInfo.type.ts)
