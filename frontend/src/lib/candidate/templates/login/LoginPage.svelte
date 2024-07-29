<script lang="ts">
  import {getContext} from 'svelte';
  import {page} from '$app/stores';
  import {t} from '$lib/i18n';
  import {goto} from '$app/navigation';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {PasswordField} from '$lib/candidate/components/passwordField';
  import {FrontPage} from '$lib/templates/frontPage';
  import type {CandidateContext} from '$lib/utils/candidateContext';

  const {user, logIn, newUserEmail} = getContext<CandidateContext>('candidate');

  let email = '';
  let password = '';
  let wrongCredentials = false;
  let showPasswordSetMessage = false;

  // Variable for the user's chosen app language
  let appLanguageCode = '';
  user.subscribe((user) => {
    appLanguageCode = user?.candidate?.appLanguage?.localisationCode ?? '';
  });

  const onLogin = async () => {
    if (!(await logIn(email, password))) {
      wrongCredentials = true;
    } else {
      // If user has chosen an app language, change to that language
      if (appLanguageCode) {
        await goto($getRoute({locale: appLanguageCode}));
      }
    }
  };
  if ($newUserEmail != null) {
    email = $newUserEmail;
    showPasswordSetMessage = true;
    $newUserEmail = null;
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

<FrontPage title={$t('candidateApp.common.logInTitle')}>
  <img slot="hero" class="bg-white" src="/images/hero-candidate.png" alt="" />

  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('viewTexts.appTitle')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election?.name}</h1>
  </HeadingGroup>
  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onLogin}>
    {#if showPasswordSetMessage}
      <p class="max-w-md text-center text-2xl font-bold">
        {$t('candidateApp.setPassword.passwordSetSuccesfully')}
      </p>
    {/if}
    <p class="max-w-md text-center">
      {$t('candidateApp.common.enterEmailAndPassword')}
    </p>
    <label for="email" class="hidden">{$t('candidateApp.common.email')}</label>
    <input
      type="email"
      name="email"
      id="email"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.common.emailPlaceholder')}
      bind:value={email}
      autocomplete="email"
      required />
    <div class="mb-md w-full max-w-md">
      <PasswordField bind:password autocomplete="current-password" id="password" />
    </div>
    {#if wrongCredentials}
      <p class="text-center text-error">{$t('candidateApp.common.wrongEmailOrPassword')}</p>
    {/if}
    <Button type="submit" text={$t('candidateApp.common.logIn')} variant="main" />
    <Button
      href={$getRoute(Route.CandAppForgotPassword)}
      text={$t('candidateApp.common.forgotPassword')} />
    <Button href={$getRoute(Route.CandAppHelp)} text={$t('candidateApp.common.contactSupport')} />
    <Button href={$getRoute(Route.Home)} text={$t('candidateApp.common.voterApp')} />
  </form>
</FrontPage>
