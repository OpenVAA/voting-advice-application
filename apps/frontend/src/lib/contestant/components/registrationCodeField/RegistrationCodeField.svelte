<!--
@component One labelled text input for a registration code, with the format of a code as its hint and an error. It knows nothing of what a code leads to: its caller says when it is in error.

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
  errorTestId="register-code-error" />
```
-->

<script lang="ts">
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass, getUUID } from '$lib/utils/components';
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
    input?.focus();
  }

  const { t } = getComponentContext();

  // Generated once, so that the id is the same on every read.
  const fallbackId = getUUID();
  const id = $derived(idProp ?? fallbackId);

  let input: HTMLInputElement | undefined = $state();

  const effectiveInfo = $derived(info ?? t('contestantApp.register.codeFormat'));

  /** The ids of what is rendered under the control. */
  const describedBy = $derived(
    [effectiveInfo ? `${id}-info` : undefined, error ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined
  );

  // Spread onto the message, so that a caller that gives no test id leaves the message its own.
  const errorTestIdProps = $derived(errorTestId === undefined ? {} : { 'data-testid': errorTestId });

  // Clears the caller's message and nothing else: the value is left as the user entered it.
  function clearError(): void {
    error = undefined;
  }
</script>

<div {...concatClass(restProps, 'flex w-full flex-col gap-xs')}>
  <label for={id} class="text-start">{label ?? t('contestantApp.register.code')}</label>
  <input
    bind:value
    bind:this={input}
    {id}
    type="text"
    name="code"
    autocomplete="off"
    autocapitalize="characters"
    spellcheck="false"
    autocorrect="off"
    class="input w-full"
    aria-describedby={describedBy}
    aria-invalid={error ? 'true' : undefined}
    data-testid={testId}
    oninput={clearError} />
  {#if effectiveInfo}
    <p id="{id}-info" class="small-info text-start">{effectiveInfo}</p>
  {/if}
  {#if error}
    <ErrorMessage inline message={error} id="{id}-error" role="alert" data-reason={errorReason} {...errorTestIdProps} />
  {/if}
</div>
