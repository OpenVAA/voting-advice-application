<script lang="ts">
  import {t} from '$lib/i18n';
  import {Button} from '$lib/components/button';
  export let id = 'password';
  export let password = '';
  export let autocomplete = '';
  export let externalLabel = false;

  let passwordRevealed = false;
  /** variable used to refer to the input box in code to change its type*/
  let inputbox: HTMLInputElement;
  /** function that hides and reveals the password and changes the icon of the button*/
  const changeRevealed = () => {
    passwordRevealed = !passwordRevealed;
    inputbox.type = passwordRevealed ? 'text' : 'password';
  };
</script>

<!--
@component
PasswordField is an input box for password that comes with a button
to reveal and hide the password

### Properties
- `id` : id for the input
- `password` : value of the password, bindable
- `autoComplete` : autocomplete value for password input
- `externalLabel` : whether the label is outside the component and should not be rendered inside

### Usage
```tsx
<PasswordField bind:password={passwordOfContext} autocomplete="autocomplete" />
```
-->

<div class="relative">
  {#if !externalLabel}
    <label for={id} class="hidden">{$t('candidate.password')}</label>
  {/if}

  <input
    {id}
    type="password"
    name="password"
    class="input w-full"
    placeholder={$t('candidate.password_placeholder')}
    bind:value={password}
    bind:this={inputbox}
    {autocomplete}
    required />
  <Button
    type="button"
    variant="icon"
    text={passwordRevealed
      ? $t('candidateApp.passwordButton.hidePassword')
      : $t('candidateApp.passwordButton.revealPassword')}
    class="absolute inset-y-0 right-0"
    icon={passwordRevealed ? 'hide' : 'show'}
    on:click={() => changeRevealed()} />
</div>
