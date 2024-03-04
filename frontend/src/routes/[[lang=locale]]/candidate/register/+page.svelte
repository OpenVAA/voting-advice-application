<script lang="ts">
  import {page} from '$app/stores';
  import {checkRegistrationKey} from '$lib/api/candidate';
  import PasswordSetPage from './PasswordSetPage.svelte';
  import RegistrationCodePage from './RegistrationCodePage.svelte';

  let userName = '';
  let email = '';
  let validRegistrationCode = false;
  let loading = false;
  $: registrationCode = $page.url.searchParams.get('registrationCode');
  $: onRegistrationCodeChange(registrationCode);

  const onRegistrationCodeChange = (registrationCode: string | null) => {
    if (!registrationCode) return;

    loading = true;
    checkRegistrationKey(registrationCode)
      .then(async (response) => {
        if (response.ok) {
          validRegistrationCode = true;
          const data = await response.json();
          userName = data.candidate.firstName;
          email = data.candidate.email;
        } else {
          validRegistrationCode = false;
          userName = '';
          email = '';
        }
      })
      .finally(() => {
        loading = false;
      });
  };
</script>

{#if registrationCode && validRegistrationCode && !loading}
  <PasswordSetPage {userName} {registrationCode} {email} />
{:else if registrationCode}
  <RegistrationCodePage wrongCode={!loading && !validRegistrationCode} {registrationCode} />
{:else}
  <RegistrationCodePage />
{/if}
