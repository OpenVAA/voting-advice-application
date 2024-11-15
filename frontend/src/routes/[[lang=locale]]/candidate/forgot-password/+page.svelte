<script lang="ts">
  import { requestForgotPasswordLink } from '$lib/legacy-api/candidate';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { t } from '$lib/i18n';
  import { FrontPage } from '$lib/templates/frontPage';

  let statusMessage = ''; // Text to display when the send-button has been pressed: either email has been sent or internal error
  let email = '';

  async function onButtonPressed() {
    const response = await requestForgotPasswordLink(email); // Request email to be sent in the backend
    statusMessage = response.ok
      ? $t('candidateApp.resetPassword.emailSentText')
      : $t('candidateApp.resetPassword.error');
  }
</script>

<!-- Page for sending a reset email in case of a forgotten password. -->

<FrontPage title={$t('candidateApp.resetPassword.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1 class="my-24 text-2xl font-normal">{$t('candidateApp.resetPassword.title')}</h1>
  </HeadingGroup>

  <!-- If email hasn't been sent yet, show form where user can input their email address. -->
  {#if !statusMessage}
    <form on:submit|preventDefault={onButtonPressed}>
      <p>
        {$t('candidateApp.resetPassword.ingress')}
      </p>

      <input
        type="email"
        name="email"
        id="email"
        aria-label={$t('candidateApp.common.emailPlaceholder')}
        class="input mb-md w-full max-w-md"
        placeholder={$t('candidateApp.common.emailPlaceholder')}
        bind:value={email}
        required />

      <Button
        type="submit"
        variant="main"
        class="btn btn-primary mb-md w-full max-w-md"
        text={$t('candidateApp.resetPassword.sendLink')} />
    </form>
  {:else}
    <!-- If email has been sent, show info text instead of the form. -->
    <p class="text-center">
      {statusMessage}
    </p>
  {/if}
</FrontPage>
