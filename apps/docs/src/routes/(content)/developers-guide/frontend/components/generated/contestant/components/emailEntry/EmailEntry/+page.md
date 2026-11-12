# EmailEntry

An email address and its confirmation: two `EmailField`s and the comparison of the two. It serves any screen that asks a user to enter and confirm an address, and knows nothing of what the address is for.

The two addresses are compared trimmed and without regard to case. The mismatch is shown at the confirmation when that field loses focus while both hold text, and by `validate()`; an edit of either field removes it. Neither field rewrites what was typed or pasted.

### Properties

- `email`: Bindable: The address in the first field. Default: `''`
- `id`: The base of the two controls' ids: the address takes `<id>-email` and its confirmation `<id>-confirmation`. Default: a generated id
- `validate`: Bindable: Function that judges the two fields. It returns `true` for two equal, usable addresses. Otherwise it returns `false`, shows at each field what is wrong with it and moves focus to the first field in error.
- Any valid attributes of a `<div>` element.

### Accessibility

- Each control has a visible label of its own, and the two have different names and ids.
- A message is an alert tied to its control, which is `aria-invalid` while the message is shown.

### Usage

```tsx
<form method="POST" novalidate onsubmit={handleSubmit}>
  <EmailEntry bind:email bind:this={entry} />
</form>

function handleSubmit(event: SubmitEvent): void {
  event.preventDefault();
  if (!entry?.validate()) return;
  …
}
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte)
- Types: [apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.type.ts)
