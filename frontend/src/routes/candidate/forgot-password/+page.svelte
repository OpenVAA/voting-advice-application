<script lang="ts">
  import {_} from 'svelte-i18n';
  import {page} from '$app/stores';
  import FrontPage from '$lib/templates/frontPage/FrontPage.svelte';
  import Footer from '$lib/components/footer/Footer.svelte';
  import Button from '$lib/components/button/Button.svelte';
  import HeadingGroup from '$lib/components/headingGroup/HeadingGroup.svelte';
  import PreHeading from '$lib/components/headingGroup/PreHeading.svelte';

  let emailSentText = ''; // Text to display when the reset email has been sent

  const onButtonPressed = async () => {
    //TODO: backend stuff, send email

    emailSentText = $_('candidateApp.resetPassword.emailSentText');
  };
</script>

<!-- Page for sending a reset email in case of a forgotten password. -->

<FrontPage title={$_('candidateApp.resetPassword.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
    <h1 class="my-24 text-2xl font-normal">{$_('candidateApp.resetPassword.title')}</h1>
  </HeadingGroup>

  <!-- If email hasn't been sent yet, show form where user can input their email address. -->
  {#if !emailSentText}
    <form on:submit|preventDefault={onButtonPressed}>
      <p>
        {$_('candidateApp.resetPassword.description')}
      </p>

      <input
        type="email"
        name="email"
        id="email"
        aria-label={$_('candidate.email_placeholder')}
        class="input mb-md w-full max-w-md"
        placeholder={$_('candidate.email_placeholder')}
        required />

      <Button
        type="submit"
        variant="main"
        class="btn btn-primary mb-md w-full max-w-md"
        text={$_('candidateApp.resetPassword.buttonText')} />
    </form>
  {:else}
    <!-- If email has been sent, show info text instead of the form. -->
    <p class="text-center">
      {emailSentText}
    </p>
  {/if}

  <svelte:fragment slot="footer"><Footer /></svelte:fragment>
</FrontPage>
