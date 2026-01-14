# Feedback

Show a form for sending feedback.

### Dynamic component

Accesses the `AppContext` and the `FeedbackWriter` api.

### Properties

- `showActions`: Whether to show the standard action buttons below the feedback form. Default: `true`
- `variant`: The layout variant of the feedback form. Default: `'default'`
- Any valid attributes of a `<form>` element.

### Bindable properties

- `canSubmit`: Bind to this to know whether the feedback can be submitted, i.e. the user has entered something. Default: `false`
- `status`: Bind to this to access the status of the feedback form. Default: `'default'`
- `submit`: Submit the feedback or close the modal if it's already been submitted.
- `reset`: Reset the form so that if the user opens it again, they can fill new feedback. You should call this when closing any modal containing the feedback.

### Events

- `cancel`: Fired when the user clicks the cancel button or the submit button again after submitting or an error, indicating that the form should close.
- `error`: Fired when there is an error sending the feedback.
- `sent`: Fired when the feedback is successfully sent.

### Tracking events

- `feedback_sent`: Feedback is succesfully sent. Contains `rating` and `description` properties.
- `feedback_error`: There was an error sending the feedback. Contains `rating` and `description` properties.

### Usage

```tsx
<script lang="ts">
  let reset: () => void;
  function close() {
    // Also hide the feedback somehow
    reset();
  }
</script>
<Feedback bind:reset on:cancel={close} on:sent={close}/>
```

## Source

[frontend/src/lib/dynamic-components/feedback/Feedback.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/feedback/Feedback.svelte)

[frontend/src/lib/dynamic-components/feedback/Feedback.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/feedback/Feedback.type.ts)
