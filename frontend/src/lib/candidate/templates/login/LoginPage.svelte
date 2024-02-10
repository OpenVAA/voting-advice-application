<script lang="ts">
  import {getContext} from 'svelte';
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import Footer from '$lib/templates/parts/footer/Footer.svelte';
  import type {AuthContext} from '$lib/utils/authenticationStore';
  import {FrontPage} from '$lib/templates/frontPage';
  import {Button} from '$lib/components/button';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {candidateAppRoute} from '$lib/utils/routes';
  import PasswordField from '$lib/candidate/components/PasswordField/PasswordField.svelte';

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

<FrontPage title={$_('candidate.sign_in_title')}>
  <img slot="hero" class="bg-white" src="/images/hero-candidate.png" alt="" />

  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
  </HeadingGroup>
  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onLogin}>
    <p class="max-w-md text-center">
      {$_('candidate.enter_email_and_password')}
    </p>
    <label for="email" class="hidden">{$_('candidate.email')}</label>
    <input
      type="email"
      name="email"
      id="email"
      class="input mb-md w-full max-w-md"
      placeholder={$_('candidate.email_placeholder')}
      bind:value={email}
      autocomplete="email"
      required />
    <div class="mb-md w-full max-w-md">
      <PasswordField bind:password autoComplete="current-password" />
    </div>
    {#if wrongCredentials}
      <p class="text-center text-error">{$_('candidate.wrong_email_or_password')}</p>
    {/if}
    <Button type="submit" text={$_('candidate.sign_in_button')} variant="main" />
    <Button href="{candidateAppRoute}/forgot-password" text={$_('candidate.forgot_password')} />
    <Button href="{candidateAppRoute}/help" text={$_('candidate.contact_support')} />
    <Button href="/" text={$_('candidate.election_compass_for_voters')} />
  </form>

  <Footer slot="footer" />
</FrontPage>
