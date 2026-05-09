<!--
@component
PasswordField is an input box for password that comes with a button to reveal and hide the password

### Properties

- `id`: Optional id for the input.
- `password`: Bindable: The password value.
- `autocomplete`: The autocomplete value for password input. Default: `''`
- `label`: The label for the password field.
- `externalLabel`: Whether the label is outside the component and should not be rendered inside. Default: `false`
- `focus`: Bindable: Function to set focus to the password input.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<PasswordField bind:password={passwordOfContext} autocomplete="current-password" />
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
    autocomplete = '',
    label = undefined,
    externalLabel = false,
    ...restProps
  }: PasswordFieldProps = $props();

  export function focus(): void {
    input?.focus();
  }

  // Generate a stable fallback id once at mount (UUID must not regenerate
  // per-derived-call). Effective id falls back to the prop when supplied.
  const fallbackId = getUUID();
  const id = $derived(idProp ?? fallbackId);

  const { t } = getComponentContext();

  let passwordRevealed = $state(false);
  /** variable used to refer to the input box in code to change its type*/
  let input: HTMLInputElement | undefined = $state();
  /** function that hides and reveals the password and changes the icon of the button*/
  function toggleRevealed() {
    passwordRevealed = !passwordRevealed;
    input.type = passwordRevealed ? 'text' : 'password';
  }
</script>

<div class="relative">
  {#if !externalLabel}
    <label for={id} class="sr-only">{label || t('common.password')}</label>
  {/if}
  <!-- bind: keep — two-way DOM input bind:value={password} (line below); bind:this={input} is a single ref read in toggleRevealed/focus -->
  <input
    bind:value={password}
    bind:this={input}
    {id}
    type="password"
    name="password"
    class="input w-full"
    placeholder={t('components.passwordInput.placeholder')}
    data-testid="password-field"
    autocomplete={autocomplete as AutoFill}
    required />
  <Button
    type="button"
    variant="icon"
    text={passwordRevealed ? t('components.passwordInput.hidePassword') : t('components.passwordInput.showPassword')}
    class="!absolute inset-y-0 right-0"
    icon={passwordRevealed ? 'hide' : 'show'}
    onclick={toggleRevealed}
    data-testid="password-field-toggle" />
</div>
