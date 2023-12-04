<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import Footer from '$lib/components/footer/Footer.svelte';
  import {goto} from '$app/navigation';
  import {candidateAppRoute} from '$candidate/placeholder.json';

  export let registrationCode = '';
  export let wrongCode = false;

  const onRegistration = async () => {
    await goto(candidateAppRoute + '/register?registrationCode=' + registrationCode);
  };
</script>

<!--
@component
Page where user can input their registration code.

### Properties
wrongCode
- If this is `true` the page will display error message.
- Default value is `false`.

registrationCode
- This is used as value of the input field.
- Default value is empty string.

### Usage
```tsx
<RegistrationCodePage wrongCode={true} registrationCode={"123-123-123"} />
```
-->

<div class="flex w-full flex-grow flex-col items-center bg-base-300">
  <figure class="hero bg-[#d4dbef]">
    <img
      class="h-[30vh] w-full max-w-lg bg-white object-cover"
      src="/images/hero-candidate.png"
      alt=""
      srcset="" />
  </figure>

  <main class="flex-grow">
    <div class="flex max-w-xl flex-col items-center p-lg pl-safelgl pr-safelgr">
      <div class="flex flex-col flex-nowrap items-center">
        <hgroup class="py-lg">
          <p class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</p>
          <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
        </hgroup>
        <form
          class="flex flex-col flex-nowrap items-center"
          on:submit|preventDefault={onRegistration}>
          <p class="text-center">
            {$_('candidateApp.registration.enterCode')}
          </p>
          <input
            type="text"
            name="registration-code"
            id="registration-code"
            class="input mb-md w-full max-w-md"
            placeholder={$_('candidateApp.registration.submitPlaceholder')}
            bind:value={registrationCode}
            aria-label={$_('candidateApp.registation.registrationCode')}
            required />
          {#if wrongCode}
            <p class="text-center text-error">
              {$_('candidateApp.registration.wrongRegistrationCode')}
            </p>
          {/if}
          <button type="submit" class="btn btn-primary mb-md w-full max-w-md"
            >{$_('candidateApp.registration.registerButton')}</button>
          <a href="/help" class="btn btn-ghost w-full max-w-md"
            >{$_('candidate.contact_support')}</a>
          <a href="/" class="btn btn-ghost w-full max-w-md"
            >{$_('candidate.election_compass_for_voters')}</a>
        </form>
      </div>
    </div>
  </main>

  <Footer />
</div>
