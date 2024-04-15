<script lang="ts">
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {FrontPage} from '$lib/templates/frontPage';
  import {Footer} from '$lib/templates/parts/footer';
  import {getContext} from 'svelte';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  export let registrationCode = '';
  export let wrongCode = false;

  const {userStore} = getContext<CandidateContext>('candidate');
  $: loggedIn = $userStore;

  const onRegistration = async () => {
    await goto($getRoute({route: Route.CandAppRegister, params: {registrationCode}}));
  };
</script>

<!--
@component
Page where user can input their registration code.
Adds the registration code to the URL on submit and redirects to where the registration code is checked.
In addition, shows a warning to the user if another user is already logged in.

### Properties
- `wrongCode` (optional): if true, error message is shown
- `registrationCode` (optional): value of the input field

### Usage
```tsx
<RegistrationCodePage wrongCode={true} registrationCode={"123-123-123"} />
```
-->

<FrontPage title={$t('candidateApp.registration.title')}>
  <img slot="hero" class="bg-white" src="/images/hero-candidate.png" alt="" />

  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
  </HeadingGroup>
  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onRegistration}>
    <p class="max-w-md text-center">
      {$t('candidateApp.registration.enterCode')}
    </p>
    {#if loggedIn}
      <p class="text-center text-warning">{$t('candidateApp.registration.loggedInWarning')}</p>
      <div class="center pb-10">
        <LogoutButton buttonVariant="main" stayOnPage={true} />
      </div>
    {/if}
    <input
      type="text"
      name="registration-code"
      id="registration-code"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.registration.submitPlaceholder')}
      bind:value={registrationCode}
      aria-label={$t('candidateApp.registration.registrationCode')}
      required />
    {#if wrongCode}
      <p class="text-center text-error">
        {$t('candidateApp.registration.wrongRegistrationCode')}
      </p>
    {/if}
    <Button type="submit" text={$t('candidateApp.registration.registerButton')} variant="main" />
    <Button href={$getRoute(Route.CandAppHelp)} text={$t('candidate.contact_support')} />
    <Button href={$getRoute(Route.Home)} text={$t('candidate.election_compass_for_voters')} />
  </form>

  <Footer slot="footer" />
</FrontPage>
