<script lang="ts">
  import {page} from '$app/stores';
  import PasswordSetPage from './PasswordSetPage.svelte';
  import RegistrationCodePage from './RegistrationCodePage.svelte';

  $: registrationCode = $page.url.searchParams.get('registrationCode');

  // TODO: replace with the real function to check the registration code
  const checkRegistrationCode = (registrationCode: string) => {
    return registrationCode === 'true';
  };
</script>

{#if registrationCode && checkRegistrationCode(registrationCode)}
  <PasswordSetPage userName={'B Arnabas'} />
{:else if registrationCode}
  <RegistrationCodePage wrongCode={true} {registrationCode} />
{:else}
  <RegistrationCodePage />
{/if}
