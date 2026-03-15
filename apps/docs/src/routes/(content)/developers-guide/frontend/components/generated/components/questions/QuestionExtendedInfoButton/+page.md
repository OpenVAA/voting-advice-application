# QuestionExtendedInfoButton

A button that will display the question's extended information content in a `Drawer`.

### Properties

- `question`: The question whose expanded info to show.
- Any valid properties of a `<Button>` component

### Callback properties

- `onOpen`: A callback function to be executed when the drawer is opened, mostly for tracking.
- `onSectionCollapse`: A callback triggered when an info section is collapsed. Mostly used for tracking.
- `onSectionExpand`: A callback triggered when an info section is expanded. Mostly used for tracking.

### Usage

```tsx
<QuestionExtendedInfoButton {question} />
```

## Source

[frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte)

[frontend/src/lib/components/questions/QuestionExtendedInfoButton.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionExtendedInfoButton.type.ts)
