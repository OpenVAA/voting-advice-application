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
  const dispatch = createEventDispatcher();
  export function ButtonPressed() {
    dispatch('ButtonPressed');
  }
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

<PasswordSetComponent bind:password1={passwordOfContext1} bind:password2={passwordOfContext2} autocomplete1="autocomplete1" autocomplete2="autocomplete2" />
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

  <Button href={getRoute(Route.CandAppHelp)} text={$t('candidate.contact_support')} />
</form>
