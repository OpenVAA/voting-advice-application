<script lang="ts">
  import {getContext} from 'svelte';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {FrontPage} from '$lib/templates/frontPage';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import type {CandidateContext} from '$lib/utils/candidateContext';
  import {customization} from '$lib/stores';
  import {darkMode} from '$lib/utils/darkMode';

  export let registrationCode = '';
  export let wrongCode = false;

  const {user} = getContext<CandidateContext>('candidate');

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

<FrontPage title={$t('candidateApp.register.title')}>
  <img
    slot="hero"
    class="bg-neutral-content"
    src={$darkMode
      ? ($customization.candPosterDark?.url ?? '/images/hero-candidate.png')
      : ($customization.candPoster?.url ?? '/images/hero-candidate.png')}
    alt="" />

  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election?.name}</h1>
  </HeadingGroup>
  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onRegistration}>
    <p class="max-w-md text-center">
      {$t('candidateApp.register.enterCode')}
    </p>
    {#if $user}
      <p class="text-center text-warning">{$t('candidateApp.register.loggedInWarning')}</p>
      <div class="center pb-10">
        <LogoutButton buttonVariant="main" stayOnPage={true} />
      </div>
    {/if}
    <input
      type="text"
      name="registration-code"
      id="registration-code"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.register.codePlaceholder')}
      bind:value={registrationCode}
      aria-label={$t('candidateApp.register.code')}
      required />
    {#if wrongCode}
      <p class="text-center text-error">
        {$t('candidateApp.register.wrongRegistrationCode')}
      </p>
    {/if}
    <Button type="submit" text={$t('candidateApp.register.register')} variant="main" />
    <Button href={$getRoute(Route.CandAppHelp)} text={$t('candidateApp.common.contactSupport')} />
    <Button href={$getRoute(Route.Home)} text={$t('candidateApp.common.voterApp')} />
  </form>
</FrontPage>
