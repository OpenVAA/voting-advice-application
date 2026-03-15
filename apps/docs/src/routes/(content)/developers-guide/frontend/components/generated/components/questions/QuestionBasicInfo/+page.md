# QuestionBasicInfo

Display the question's expandable information content.

### Properties

- `info`: The info content to show as a plain or HTML string.
- `onCollapse`: A callback triggered when the info content is collapsed. Mostly used for tracking.
- `onExpand`: A callback triggered when the info content is expanded. Mostly used for tracking.
- Any valid properties of an `<Expander>` component

### Usage

```tsx
<QuestionInfo {info}/>
```

## Source

[frontend/src/lib/components/questions/QuestionBasicInfo.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionBasicInfo.svelte)

[frontend/src/lib/components/questions/QuestionBasicInfo.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionBasicInfo.type.ts)
