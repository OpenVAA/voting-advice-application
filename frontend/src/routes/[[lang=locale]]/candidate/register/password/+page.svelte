<script lang="ts">
  import { validatePassword } from '@openvaa/app-shared';
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
  import { PasswordSetter } from '$lib/candidate/components/passwordSetter';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { t } from '$lib/i18n';
  import { logout, register } from '$lib/legacy-api/candidate';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../../Layout.svelte';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  const registrationCode = $page.url.searchParams.get('registrationCode') || '';
  const username = $page.url.searchParams.get('username') || '';
  const email = $page.url.searchParams.get('email') || '';

  if (registrationCode === '' || username === '' || email === '') {
    goto($getRoute(ROUTE.CandAppRegister));
  }

  let password = '';
  let passwordConfirmation = '';
  const { newUserEmail, user } = getContext<CandidateContext>('candidate');

  let validPassword = false;
  let errorMessage = '';

  async function onSetButtonPressed() {
    if (password !== passwordConfirmation) {
      errorMessage = $t('candidateApp.setPassword.passwordsDontMatch');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password, username)) {
      errorMessage = $t('candidateApp.setPassword.passwordNotValid');
      return;
    }

    const response = await register(registrationCode, password);
    if (!response.ok) {
      errorMessage = $t('candidateApp.setPassword.registrationError');
      return;
    }

    const data = await response.json();
    if (!data.success) {
      errorMessage = $t('candidateApp.setPassword.registrationError');
      return;
    }
    if ($user) {
      await logout();
    }
    newUserEmail.set(email);
    errorMessage = '';
    await goto($getRoute(ROUTE.CandAppLogin));
  }
</script>

<Layout title={$t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1 class="my-24 text-2xl font-normal">
      {$t('candidateApp.common.greeting', { username })}
    </h1>
  </HeadingGroup>
  {#if $user}
    <p class="text-center text-warning">{$t('candidateApp.register.loggedInWarning')}</p>
    <div class="center pb-10">
      <LogoutButton stayOnPage={true} buttonVariant="main" />
    </div>
  {/if}
  <form class="flex flex-col flex-nowrap items-center">
    <PasswordSetter
      buttonPressed={onSetButtonPressed}
      bind:validPassword
      bind:errorMessage
      bind:password
      bind:passwordConfirmation />
  </form>
</Layout>
