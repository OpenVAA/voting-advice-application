<script lang="ts">
  import {getContext} from 'svelte';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import PasswordField from '$lib/candidate/components/PasswordField/PasswordField.svelte';
  import Footer from '$lib/templates/parts/footer/Footer.svelte';
  import {FrontPage} from '$lib/templates/frontPage';
  import type {CandidateContext} from '$lib/utils/candidateStore';

  const {logIn, emailOfNewUser} = getContext<CandidateContext>('candidate');

  let email = '';
  let password = '';
  let wrongCredentials = false;
  const onLogin = async () => {
    if (!(await logIn(email, password))) {
      wrongCredentials = true;
    } else {
      emailOfNewUser.set(null);
    }
  };
  if ($emailOfNewUser != null) {
    email = $emailOfNewUser;
  }
</script>

<!--
@component
Candidate login page. This component also takes care of the login process.

### Usage

```tsx
<LoginPage />
```
-->

<FrontPage title={$t('candidate.sign_in_title')}>
  <img slot="hero" class="bg-white" src="/images/hero-candidate.png" alt="" />

  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
  </HeadingGroup>
  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onLogin}>
    {#if $emailOfNewUser !== null}
      <p class="text-3xl font-normal">
        {$t('candidateApp.setPassword.passwordSetSuccesfully')}
      </p>
    {/if}
    <p class="max-w-md text-center">
      {$t('candidate.enter_email_and_password')}
    </p>
    <label for="email" class="hidden">{$t('candidate.email')}</label>
    <input
      type="email"
      name="email"
      id="email"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidate.email_placeholder')}
      bind:value={email}
      autocomplete="email"
      required />
    <div class="mb-md w-full max-w-md">
      <PasswordField bind:password autocomplete="current-password" />
    </div>
    {#if wrongCredentials}
      <p class="text-center text-error">{$t('candidate.wrong_email_or_password')}</p>
    {/if}
    <Button type="submit" text={$t('candidate.sign_in_button')} variant="main" />
    <Button href={$getRoute(Route.CandAppForgotPassword)} text={$t('candidate.forgot_password')} />
    <Button href={$getRoute(Route.CandAppHelp)} text={$t('candidate.contact_support')} />
    <Button href={$getRoute(Route.Home)} text={$t('candidate.election_compass_for_voters')} />
  </form>

  <Footer slot="footer" />
</FrontPage>
