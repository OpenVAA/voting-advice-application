<script lang="ts">
  import {Button} from '$lib/components/button';
  import {_} from 'svelte-i18n';
  export let password = '';
  export let autoComplete = '';
  export let passwordId = '';
  /** variable that determines whether the password is revealed or hidden*/
  let passwordRevealed = false;
  /** variable the input box uses to determine its type*/
  let inputbox: HTMLInputElement;
  /** function that hides and reveals the password and changes the icon of the button*/
  const changeRevealed = () => {
    passwordRevealed = !passwordRevealed;
    if (passwordRevealed) {
      inputbox.type = 'text';
    } else {
      inputbox.type = 'password';
    }
  };
</script>

<!--
@component
PasswordField is an input box for password that comes with a button
to reveal and hide the password

### Properties

- `autoComplete` : variable used for field's password auto-fill value
- `passwordId` : variable the password input box uses for its id value
- `password` : variable the password input box uses for its value

### Usage

```tsx

<PasswordField bind:password={passwordOfContext} autoComplete="password to autofill the input box with" passwordId="an ID for the input box" />
```
-->
<div class="relative">
  <label for="password" class="hidden">{$_('candidate.password')}</label>
  <input
    type="password"
    name="password"
    id={passwordId}
    class="input w-full"
    placeholder={$_('candidate.password_placeholder')}
    bind:value={password}
    bind:this={inputbox}
    autocomplete={autoComplete}
    required />
  <Button
    type="button"
    variant="icon"
    text={passwordRevealed ? 'hide the password' : 'reveal the password'}
    class="absolute inset-y-0 right-0"
    icon={passwordRevealed ? 'hide' : 'show'}
    on:click={() => changeRevealed()} />
</div>
