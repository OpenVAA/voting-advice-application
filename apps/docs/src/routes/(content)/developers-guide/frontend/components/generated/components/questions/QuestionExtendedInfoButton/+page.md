# QuestionExtendedInfoButton

A button that opens the question's extended information content in the app's drawer host.

The dialog itself is the app's `DrawerHost` (`$lib/components/modal/drawerHost`), so this component hands the host a payload rather than rendering an overlay of its own: the content component with its props, and the accessible name. The questions route subtree is a different subtree from the results tree that also opens the host, which is why the host is mounted in the app's root layout rather than in either route.

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

[apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.svelte)

[apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/questions/QuestionExtendedInfoButton.type.ts)
