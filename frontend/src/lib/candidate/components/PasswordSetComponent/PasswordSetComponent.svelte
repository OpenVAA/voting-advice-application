<script lang="ts">
  import {t} from '$lib/i18n';
  import {Button} from '$lib/components/button';
  import PasswordField from '../PasswordField/PasswordField.svelte';
  import {getRoute, Route} from '$lib/utils/navigation';
  import PasswordValidator from '../passwordValidator/PasswordValidator.svelte';
  import {createEventDispatcher} from 'svelte';
  export let password1 = '';
  export let password2 = '';
  export let autocomplete1 = '';
  export let autocomplete2 = '';
  export let errorMessage = '';
  export let validPassword = false;

  $: disableSetButton = validPassword && password2.length > 0;
  //dispatcher used for a function that calls the submit button's function in parent component
  const dispatch = createEventDispatcher();
  export function ButtonPressed() {
    dispatch('ButtonPressed');
  }
</script>

<!--
@component
PasswordSetComponent is a component used by PasswordSetPage and PasswordResetPage, that contains a password input field,
a second confirmation password input field, a button for submitting the password, a button to contact support and informatory text

### Properties

- `password1` : variable the first password input box uses for its value
- `password2` : variable the second password input box uses for its value
- `autoComplete1` : variable used for first field's password autocomplete value
- `autoComplete2` : variable used for second field's password autocomplete value
- `errorMessage` : message showing error if one exists
- `validPassword` : variable used to determine if the password combination is valid

### Usage

```tsx

<PasswordSetComponent
bind:password1={passwordOfContext1}
bind:password2={passwordOfContext2}
autocomplete1="autocomplete1"
autocomplete2="autocomplete2"
on:ButtonPressed={onSetButtonPressed}
bind:validPassword={validPasswordOfContext}
bind:errorMessage={errorMessageOfContext} />
```
-->

<form
  class="m-0 flex flex w-full flex-col flex-nowrap items-center"
  on:submit|preventDefault={ButtonPressed}>
  <p class="m-0 text-center">
    {$t('candidateApp.setPassword.description')}
  </p>
  <PasswordValidator bind:validPassword password={password1} />
  <div class="mb-md flex w-full max-w-md flex-col gap-6">
    <label for="password1" class="hidden">{$t('candidate.password')}</label>
    <PasswordField bind:password={password1} autocomplete="autocomplete1" />
    <label for="password2" class="hidden">{$t('candidate.password')}</label>
    <PasswordField bind:password={password2} autocomplete="autocomplete2" />
  </div>

  {#if errorMessage}
    <p class="text-center text-error">
      {errorMessage}
    </p>
  {/if}
  <Button
    type="submit"
    disabled={!disableSetButton}
    variant="main"
    text={$t('candidateApp.setPassword.setPassword')} />
  <Button href={$getRoute(Route.CandAppHelp)} text={$t('candidate.contact_support')} />
</form>
