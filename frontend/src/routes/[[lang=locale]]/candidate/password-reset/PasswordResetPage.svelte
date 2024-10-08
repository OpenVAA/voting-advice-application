<script lang="ts">
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {resetPassword} from '$lib/api/candidate';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {validatePassword} from 'vaa-shared';
  import {HeadingGroup, PreHeading} from '$lib/components/headingGroup';
  import {PasswordSetter} from '$lib/candidate/components/passwordSetter';
  import {FrontPage} from '$lib/templates/frontPage';

  export let code: string;

  let password = '';
  let passwordConfirmation = '';
  let validPassword = false;
  let errorMessage = '';

  const onButtonPress = async () => {
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
    await goto($getRoute(Route.CandAppHome));
  };
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
