<script lang="ts">
  import {_} from 'svelte-i18n';
  import {Button} from '$lib/components/button';
  export let password = '';
  export let autocomplete = '';
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

- `autoComplete` : variable used for field's password autocomplete value
- `password` : variable the password input box uses for its value

### Usage

```tsx

<PasswordField bind:password={passwordOfContext} autocomplete="autocomplete" />
```
-->

<div class="relative">
  <label for="password" class="hidden">{$_('candidate.password')}</label>
  <input
    id="password"
    type="password"
    name="password"
    class="input w-full"
    placeholder={$_('candidate.password_placeholder')}
    bind:value={password}
    bind:this={inputbox}
    {autocomplete}
    required />
  <Button
    type="button"
    variant="icon"
    text={passwordRevealed
      ? $_('candidateApp.passwordButton.hidePassword')
      : $_('candidateApp.passwordButton.revealPassword')}
    class="absolute inset-y-0 right-0"
    icon={passwordRevealed ? 'hide' : 'show'}
    on:click={() => changeRevealed()} />
</div>
