<script lang="ts">
  import { validatePassword } from '@openvaa/app-shared';
  import { goto } from '$app/navigation';
  import { resetPassword } from '$lib/api/candidate';
  import { PasswordSetter } from '$lib/candidate/components/passwordSetter';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { t } from '$lib/i18n';
  import { FrontPage } from '$lib/templates/frontPage';
  import { getRoute, ROUTE } from '$lib/utils/navigation';

  export let code: string;

  let password = '';
  let passwordConfirmation = '';
  let validPassword = false;
  let errorMessage = '';

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

<!--
  @component
  Component for setting a new password for a candidate.

  If the candidate has forgotten their password, they can request a password reset link, which will bring them to this page.
  In the page the candidate can set a new password, which is validated.
  When a valid password is given and the backend accepts the password, the candidate is redirected to `/candidate`.

  ### Properties
  - `code`: The code used to validate the password reset request

  ### Usage
  ```tsx
  <PasswordResetPage code={"123-123-123"} />
  ```
-->

<FrontPage title={$t('dynamic.appName')}>
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
</FrontPage>
