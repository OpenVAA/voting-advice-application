<!--
@component One labelled email input with an optional hint and an error: the input library's `Input` of the `email` kind, on a lighter row so that it shows on a shaded page. It knows nothing of what it is used for: its label, its name and its autocomplete token are given by its caller.

The field holds no rule of its own about what an acceptable address is, and `Input` judges nothing for it either. Its caller says when it is in error, by setting `error`, and whether the address is usable is the control's own verdict, which `checkValidity()` answers; an empty field is not usable. The value is never rewritten: what the user typed or pasted is what the caller is handed, as it is typed.

### Properties

- `value`: Bindable: The address in the field. Default: `''`
- `label`: The visible label of the field. Default: `t('common.email')`
- `name`: The name the control is submitted under. Two email fields in one form need different names. Default: `'email'`
- `autocomplete`: What the control tells the browser it holds: `'username'` where the address signs a user in, `'email'` elsewhere. Default: `'email'`
- `info`: An optional hint shown under the control.
- `error`: Bindable: The message shown while the field is in error. Cleared when the user edits the field.
- `id`: The id of the control. The hint takes the id `<id>-info` and the error `<id>-error`. Default: a generated id
- `errorTestId`: The test id of the error message.
- `errorReason`: A word naming why the field is in error, written on the error message as `data-reason`. Nothing is written without one.
- `data-testid`: The test id of the control, not of the root element.
- `focus`: Bindable: Function to set focus to the control.
- `checkValidity`: Bindable: Function that answers whether the control holds a usable address.
- Any valid attributes of a `<div>` element, given to the root element of the `Input`.

### Accessibility

- The label is visible and tied to the control by `for`; the control has no placeholder.
- The control is `aria-required`, without the badge an empty required `Input` shows.
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
-->

<script lang="ts">
  import { Input } from '$lib/components/input';
  import { getComponentContext } from '$lib/contexts/component';
  import { getUUID } from '$lib/utils/components';
  import type { EmailFieldProps } from './EmailField.type';

  let {
    value = $bindable(''),
    label = undefined,
    name = 'email',
    autocomplete = 'email',
    info = undefined,
    error = $bindable(),
    id: idProp = undefined,
    errorTestId = undefined,
    errorReason = undefined,
    'data-testid': testId = undefined,
    ...restProps
  }: EmailFieldProps = $props();

  export function focus(): void {
    field?.focus();
  }

  /** Whether the field holds an address the control itself reports usable. */
  export function checkValidity(): boolean {
    return value.trim() !== '' && (field?.checkValidity() ?? false);
  }

  const { t } = getComponentContext();

  // Generated once, so that the id is the same on every read.
  const fallbackId = getUUID();
  const id = $derived(idProp ?? fallbackId);

  let field: Input | undefined = $state();

  // `Input` takes an entry in when it is committed; the caller is handed every keystroke.
  function handleInput({ currentTarget }: { currentTarget: EventTarget & HTMLElement }): void {
    if (currentTarget instanceof HTMLInputElement) value = currentTarget.value;
  }
</script>

<Input
  bind:this={field}
  bind:value
  bind:error
  type="email"
  validate={false}
  {id}
  label={label ?? t('common.email')}
  {info}
  {name}
  {autocomplete}
  inputmode="email"
  autocapitalize="none"
  spellcheck="false"
  aria-required="true"
  data-testid={testId}
  {errorTestId}
  {errorReason}
  onShadedBg
  containerProps={restProps}
  oninput={handleInput} />
