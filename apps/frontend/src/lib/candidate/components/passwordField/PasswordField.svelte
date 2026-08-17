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

  type $$Props = PasswordFieldProps;

  export let id: $$Props['id'] = undefined;
  export let password: $$Props['password'] = '';
  export let autocomplete: $$Props['autocomplete'] = '';
  export let label: $$Props['label'] = undefined;
  export let externalLabel: $$Props['externalLabel'] = false;
  export function focus(): void {
    input?.focus();
  }

  id ??= getUUID();

  const { t } = getComponentContext();

  let passwordRevealed = false;
  /** variable used to refer to the input box in code to change its type*/
  let input: HTMLInputElement;
  /** function that hides and reveals the password and changes the icon of the button*/
  function toggleRevealed() {
    passwordRevealed = !passwordRevealed;
    input.type = passwordRevealed ? 'text' : 'password';
  }
</script>

<div class="relative">
  {#if !externalLabel}
    <label for={id} class="sr-only">{label || $t('common.password')}</label>
  {/if}
  <input
    {id}
    type="password"
    name="password"
    class="input w-full"
    placeholder={$t('components.passwordInput.placeholder')}
    data-testid="password-field"
    bind:value={password}
    bind:this={input}
    {autocomplete}
    required />
  <Button
    type="button"
    variant="icon"
    text={passwordRevealed ? $t('components.passwordInput.hidePassword') : $t('components.passwordInput.showPassword')}
    class="!absolute inset-y-0 right-0"
    icon={passwordRevealed ? 'hide' : 'show'}
    on:click={toggleRevealed} />
</div>
