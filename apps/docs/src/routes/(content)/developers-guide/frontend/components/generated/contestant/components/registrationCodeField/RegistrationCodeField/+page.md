# RegistrationCodeField

One labelled text input for a registration code, with the format of a code as its hint and an error. It knows nothing of what a code leads to: its caller says when it is in error.

A code may be typed or pasted with or without separators and in either case. The field never rewrites it and sets no limit on its length: what the user typed or pasted is what the caller is handed. The control tells the browser to offer nothing for it and not to correct it.

### Properties

- `value`: Bindable: The code in the field, exactly as it was typed or pasted. Default: `''`
- `label`: The visible label of the field. Default: `t('contestantApp.register.code')`
- `info`: The hint shown under the control. Default: `t('contestantApp.register.codeFormat')`
- `error`: Bindable: The message shown while the field is in error. Cleared when the user edits the field.
- `errorReason`: Why the field is in error, rendered as `data-reason` on the error message.
- `id`: The id of the control. The hint takes the id `<id>-info` and the error `<id>-error`. Default: a generated id
- `errorTestId`: The test id of the error message.
- `data-testid`: The test id of the control, not of the root element.
- `focus`: Bindable: Function to set focus to the control.
- Any valid attributes of a `<div>` element.

### Accessibility

- The label is visible and tied to the control by `for`; the control has no placeholder.
- The control is described by the hint and by the error while it is rendered, and is `aria-invalid` while the error is shown.
- The error has `role="alert"`.

### Usage

```tsx
<RegistrationCodeField
  bind:value={code}
  bind:error={codeError}
  errorReason={codeErrorReason}
  data-testid="register-code"
  errorTestId="register-code-error"
/>
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.svelte)
- Types: [apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.type.ts)
