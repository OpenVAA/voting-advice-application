# QuestionExtendedInfoDrawer

A `Drawer` that displays the question's extended information.

### Properties

- `question`: The question whose expanded info to show.
- Any valid properties of a `<Drawer>` component

### Callback properties

- `onSectionCollapse`: A callback triggered when an info section is collapsed. Mostly used for tracking.
- `onSectionExpand`: A callback triggered when an info section is expanded. Mostly used for tracking.

### Usage

```tsx
<QuestionExtendedInfoDrawer {question} onClose={() => console.info('Closed!')}/>
```

## Source

[frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.svelte)

[frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/questions/QuestionExtendedInfoDrawer.type.ts)
