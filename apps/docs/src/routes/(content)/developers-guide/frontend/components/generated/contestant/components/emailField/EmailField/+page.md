# EmailField

One labelled email input with an optional hint and an error. It knows nothing of what it is used for: its label, its name and its autocomplete token are given by its caller.

The field holds no rule of its own about what an acceptable address is. Its caller says when it is in error, by setting `error`, and whether the address is usable is the control's own verdict, which `checkValidity()` answers. The value is never rewritten: what the user typed or pasted is what the caller is handed.

### Properties

- `value`: Bindable: The address in the field. Default: `''`
- `label`: The visible label of the field. Default: `t('common.email')`
- `name`: The name the control is submitted under. Two email fields in one form need different names. Default: `'email'`
- `autocomplete`: What the control tells the browser it holds: `'username'` where the address signs a user in, `'email'` elsewhere. Default: `'email'`
- `info`: An optional hint shown under the control.
- `error`: Bindable: The message shown while the field is in error. Cleared when the user edits the field.
- `id`: The id of the control. The hint takes the id `<id>-info` and the error `<id>-error`. Default: a generated id
- `errorTestId`: The test id of the error message.
- `data-testid`: The test id of the control, not of the root element.
- `focus`: Bindable: Function to set focus to the control.
- `checkValidity`: Bindable: Function that answers whether the control holds a usable address.
- Any valid attributes of a `<div>` element.

### Accessibility

- The label is visible and tied to the control by `for`; the control has no placeholder.
- The control is described by the hint and the error that are rendered, and is `aria-invalid` while the error is shown.
- The error has `role="alert"`.

### Usage

```tsx
<EmailField bind:value={email} bind:error={emailError} autocomplete="username" />
<EmailField
  bind:value={confirmation}
  label={t('common.emailConfirmation')}
  name="email-confirmation"
  info="A hint shown under the control." />
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte)
- Types: [apps/frontend/src/lib/contestant/components/emailField/EmailField.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/emailField/EmailField.type.ts)
