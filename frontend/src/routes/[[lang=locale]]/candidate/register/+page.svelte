<!--@component

# Candidate app register page

- In the invite-based flow (Supabase), users arrive via an invite link that goes through the auth callback.
- This page redirects to the password-setting page if the user is not logged in.
- If already logged in, shows a warning with a logout button.

## Params

- `username`: The name with which to greet the user (optional, from auth callback redirect)
- `email`: The email of the user (optional, from auth callback redirect)
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, getRoute, t, userData } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Handle invite-based registration flow
  ////////////////////////////////////////////////////////////////////

  const username = $page.url.searchParams.get('username') || '';
  const email = $page.url.searchParams.get('email') || '';

  // If user is not logged in and we have an email, redirect to password page
  if (!$userData && email) {
    goto(
      $getRoute({
        route: 'CandAppSetPassword',
        username,
        email
      })
    );
  }
</script>

<MainContent
  title={$appSettings.preRegistration?.enabled
    ? $t('candidateApp.register.titleWithPreregistration')
    : $t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.candidateAppName')}</PreHeading>
  </HeadingGroup>
  <div class="flex flex-col flex-nowrap items-center">
    {#if $userData}
      <p class="text-center text-warning">{$t('candidateApp.register.loggedInWarning')}</p>
      <div class="center pb-10">
        <LogoutButton buttonVariant="main" stayOnPage={true} />
      </div>
    {:else}
      <p class="max-w-md text-center">
        {$t('candidateApp.register.enterCode')}
      </p>
    {/if}
  </div>
  <svelte:fragment slot="primaryActions">
    <Button href={$getRoute('CandAppLogin')} text={$t('candidateApp.register.didYouAlreadyRegister')} data-testid="register-login-link" />
    <Button href={$getRoute('CandAppHelp')} text={$t('candidateApp.help.title')} data-testid="register-help-link" />
  </svelte:fragment>
</MainContent>
