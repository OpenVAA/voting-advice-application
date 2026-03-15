# FeedbackModal

Show a modal dialog for sending feedback.

### Properties

- `title`: Optional title for the modal. Defaults to `{$t('feedback.title')}`
- Any valid properties of a `<Modal>` component.

### Usage

```tsx
<script lang="ts">
  let openFeedback: () => void;
</script>
<FeedbackModal bind:openFeedback>
<Button on:click={openFeedback} text="Open feedback"/>
```

## Source

[frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.svelte)

[frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/feedback/modal/FeedbackModal.type.ts)
