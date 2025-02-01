<script lang="ts">
  import { validatePassword } from '@openvaa/app-shared';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PasswordSetter } from '$lib/candidate/components/passwordSetter';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { t } from '$lib/i18n';
  import { resetPassword } from '$lib/legacy-api/candidate';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../Layout.svelte';

  const codeParam = $page.url.searchParams.get('code');

  let code: string;
  let password = '';
  let passwordConfirmation = '';
  let validPassword = false;
  let errorMessage = '';

  async function checkParam() {
    if (!codeParam) {
      await goto($getRoute(ROUTE.CandAppHome));
      return;
    }
    code = codeParam;
  }

  async function onButtonPress() {
    if (password !== passwordConfirmation) {
      errorMessage = $t('candidateApp.setPassword.passwordsDontMatch');
      return;
    }

    // Additional check before backend validation
    if (!validatePassword(password)) {
      errorMessage = $t('candidateApp.setPassword.passwordNotValid');
      return;
    }

    const response = await resetPassword(code, password);
    if (!response.ok) {
      errorMessage = $t('candidateApp.resetPassword.failed');
      return;
    }

    errorMessage = '';
    await goto($getRoute(ROUTE.CandAppHome));
  }
</script>

{#await checkParam() then}
  <Layout title={$t('dynamic.appName')}>
    <HeadingGroup slot="heading">
      <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
      <h1 class="my-24 text-2xl font-normal">{$t('candidateApp.resetPassword.createNewPassword')}</h1>
    </HeadingGroup>
    <form class="flex-nowarp flex flex-col items-center">
      <PasswordSetter
        buttonPressed={onButtonPress}
        bind:validPassword
        bind:errorMessage
        bind:password
        bind:passwordConfirmation />
    </form>
  </Layout>
{/await}
