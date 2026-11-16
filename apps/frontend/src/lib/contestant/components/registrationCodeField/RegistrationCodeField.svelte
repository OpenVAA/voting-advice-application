<!--
@component One labelled text input for a registration code, with the format of a code as its hint and an error: the input library's `Input` of the `text` kind, on a lighter row so that it shows on a shaded page. It knows nothing of what a code leads to: its caller says when it is in error.

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
- `checkValidity`: Bindable: Function that answers whether the control reports its entry valid, as the element's own `checkValidity()` does.
- Any valid attributes of a `<div>` element, given to the root element of the `Input`.

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
  errorTestId="register-code-error" />
```
-->

<script lang="ts">
  import { Input } from '$lib/components/input';
  import { getComponentContext } from '$lib/contexts/component';
  import { getUUID } from '$lib/utils/components';
  import type { RegistrationCodeFieldProps } from './RegistrationCodeField.type';

  let {
    value = $bindable(''),
    label = undefined,
    info = undefined,
    error = $bindable(),
    errorReason = undefined,
    id: idProp = undefined,
    errorTestId = undefined,
    'data-testid': testId = undefined,
    ...restProps
  }: RegistrationCodeFieldProps = $props();

  export function focus(): void {
    field?.focus();
  }

  /** Whether the control itself reports its entry valid. */
  export function checkValidity(): boolean {
    return field?.checkValidity() ?? false;
  }

  const { t } = getComponentContext();

  // Generated once, so that the id is the same on every read.
  const fallbackId = getUUID();
  const id = $derived(idProp ?? fallbackId);

  let field: Input | undefined = $state();

  // `Input` takes an entry in when it is committed; the caller is handed every keystroke, exactly as typed.
  function handleInput({ currentTarget }: { currentTarget: EventTarget & HTMLElement }): void {
    if (currentTarget instanceof HTMLInputElement) value = currentTarget.value;
  }
</script>

<Input
  bind:this={field}
  bind:value
  bind:error
  type="text"
  {id}
  label={label ?? t('contestantApp.register.code')}
  info={info ?? t('contestantApp.register.codeFormat')}
  name="code"
  autocomplete="off"
  autocapitalize="characters"
  spellcheck="false"
  autocorrect="off"
  data-testid={testId}
  {errorTestId}
  {errorReason}
  onShadedBg
  containerProps={restProps}
  oninput={handleInput} />
