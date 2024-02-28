<script lang="ts">
  import {getContext} from 'svelte';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import type {AuthContext} from '$lib/utils/authenticationStore';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import PasswordField from '$lib/candidate/components/PasswordField/PasswordField.svelte';
  import Footer from '$lib/templates/parts/footer/Footer.svelte';
  import {FrontPage} from '$lib/templates/frontPage';

  const authContext = getContext<AuthContext>('auth');

  let email = '';
  let password = '';
  let wrongCredentials = false;
  const onLogin = async () => {
    if (!(await authContext?.logIn(email, password))) {
      wrongCredentials = true;
    }
  };
</script>

<!--
@component
Candidate login page. This component also takes care of the login process.

### Usage

```tsx
<LoginPage />
```
-->

<FrontPage title={$t('candidateApp.login.title')}>
  <img slot="hero" class="bg-white" src="/images/hero-candidate.png" alt="" />

  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
  </HeadingGroup>
  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onLogin}>
    <p class="max-w-md text-center">
      {$t('candidateApp.enterEmailAndPassword')}
    </p>
    <label for="email" class="hidden">{$t('candidateApp.email')}</label>
    <input
      type="email"
      name="email"
      id="email"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.emailPlaceholder')}
      bind:value={email}
      autocomplete="email"
      required />
    <div class="mb-md w-full max-w-md">
      <PasswordField bind:password autocomplete="current-password" />
    </div>
    {#if wrongCredentials}
      <p class="text-center text-error">{$t('candidateApp.wrongEmailOrPassword')}</p>
    {/if}
    <Button type="submit" text={$t('candidateApp.login.button')} variant="main" />
    <Button href={getRoute(Route.CandAppForgotPassword)} text={$t('candidateApp.forgotPassword')} />
    <Button href={getRoute(Route.CandAppHelp)} text={$t('candidate.contact_support')} />
    <Button href={getRoute(Route.Home)} text={$t('candidate.election_compass_for_voters')} />
  </form>

  <Footer slot="footer" />
</FrontPage>
