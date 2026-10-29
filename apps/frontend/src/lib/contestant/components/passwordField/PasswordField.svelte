<!--
@component PasswordField is an input box for password that comes with a button to reveal and hide the password

### Properties

- `id`: Optional id for the input.
- `password`: Bindable: The password value.
- `name`: The name the input is submitted under. Two password fields in one form need different names. Default: `'password'`
- `autocomplete`: The autocomplete value for password input. Default: `''`
- `label`: The label for the password field.
- `externalLabel`: Whether the label is outside the component and should not be rendered inside. With an outside label the input has no placeholder either: the visible label names it. Default: `false`
- `describedby`: The ids of the elements that describe the input, e.g. its error message. Rendered as the input's `aria-describedby`.
- `invalid`: Whether the input is in error. Rendered as the input's `aria-invalid`. Default: `false`
- `passwordrules`: A rule string for browsers that suggest passwords, e.g. `'minlength: 8; required: digit;'`. Rendered as the input's `passwordrules`, an attribute outside the HTML standard that some browsers read. Not rendered when not given.
- `focus`: Bindable: Function to set focus to the password input.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<PasswordField bind:password={passwordOfContext} autocomplete="current-password" />

<label for="new-password">{t('common.password')}</label>
<PasswordField
  bind:password
  id="new-password"
  name="new-password"
  autocomplete="new-password"
  externalLabel
  describedby={error ? 'new-password-error' : undefined}
  invalid={!!error} />
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { getUUID } from '$lib/utils/components';
  import type { PasswordFieldProps } from './PasswordField.type';

  let {
    id: idProp = undefined,
    password = $bindable(''),
    name = 'password',
    autocomplete = '',
    label = undefined,
    externalLabel = false,
    describedby = undefined,
    invalid = false,
    passwordrules = undefined,
    ..._restProps
  }: PasswordFieldProps = $props();

  export function focus(): void {
    input?.focus();
  }

  // Generate a stable fallback id once at mount (UUID must not regenerate per-derived-call). Effective id falls back to the prop when supplied.
  const fallbackId = getUUID();
  const id = $derived(idProp ?? fallbackId);

  const { t } = getComponentContext();

  // `passwordrules` is outside the HTML standard, so it is spread from an object rather than written as an attribute, and only when its caller gave one.
  const passwordrulesProps = $derived(passwordrules === undefined ? {} : { passwordrules });

  let passwordRevealed = $state(false);
  /** variable used to refer to the input box in code to change its type*/
  let input: HTMLInputElement | undefined = $state();
  /** function that hides and reveals the password and changes the icon of the button*/
  function toggleRevealed() {
    if (!input) return;
    passwordRevealed = !passwordRevealed;
    input.type = passwordRevealed ? 'text' : 'password';
  }
</script>

<div class="relative">
  {#if !externalLabel}
    <label for={id} class="sr-only">{label || t('common.password')}</label>
  {/if}
  <!-- The placeholder stands in for a visible label, so a field whose label is outside has none. -->
  <input
    bind:value={password}
    bind:this={input}
    {id}
    type="password"
    {name}
    class="input w-full"
    placeholder={externalLabel ? undefined : t('components.passwordInput.placeholder')}
    aria-describedby={describedby}
    aria-invalid={invalid ? 'true' : undefined}
    data-testid="password-field"
    autocomplete={autocomplete as AutoFill}
    required
    {...passwordrulesProps} />
  <Button
    type="button"
    variant="icon"
    text={passwordRevealed ? t('components.passwordInput.hidePassword') : t('components.passwordInput.showPassword')}
    class="!absolute inset-y-0 right-0"
    icon={passwordRevealed ? 'hide' : 'show'}
    onclick={toggleRevealed}
    data-testid="password-field-toggle" />
</div>
