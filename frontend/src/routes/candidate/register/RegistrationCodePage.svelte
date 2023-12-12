<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import Footer from '$lib/components/footer/Footer.svelte';
  import {goto} from '$app/navigation';
  import {candidateAppRoute} from '$candidate/placeholder.json';
  import {FrontPage} from '$lib/templates/frontPage';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {Button} from '$lib/components/button';

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

<FrontPage title={$_('candidateApp.registration.title')}>
  <img slot="hero" class="bg-white" src="/images/hero-candidate.png" alt="" />

  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
  </HeadingGroup>

  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onRegistration}>
    <p class="max-w-md text-center">
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
    <Button type="submit" text={$_('candidateApp.registration.registerButton')} variant="main" />
    <Button href="/help" text={$_('candidate.contact_support')} />
    <Button href="/" text={$_('candidate.election_compass_for_voters')} />
  </form>

  <Footer slot="footer" />
</FrontPage>
