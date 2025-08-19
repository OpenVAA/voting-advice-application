<script lang="ts">
  import { TermsOfUseForm } from '$candidate/components/termsOfUse';
  import { Button } from '$lib/components/button';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { idTokenClaims, preregister, preregistrationNominations, t, getRoute } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Handle submitting
  ////////////////////////////////////////////////////////////////////

  let form: HTMLFormElement;
  let email1 = '';
  let email2 = '';
  let status: ActionStatus = 'idle';
  let termsAccepted = false;

  async function handleSubmit() {
    if (!form.reportValidity() || !termsAccepted) return;
    status = 'loading';
    const templatePayload = {
      registrationUrl: `${window.location.origin}${$getRoute('CandAppRegister')}?registrationKey=<%= candidate.registrationKey %>`,
      firstName: $idTokenClaims?.firstName
    };
    await preregister({
      email: email1,
      nominations: $preregistrationNominations,
      extra: {
        emailTemplate: {
          subject: $t('candidateApp.preregister.email.subject'),
          text: $t('candidateApp.preregister.email.text', templatePayload),
          html: $t('candidateApp.preregister.email.html', templatePayload)
        }
      }
    });
    status = 'idle';
  }
</script>

<MainContent title={$t('candidateApp.preregister.emailVerification.title')}>
  <form class="flex flex-col flex-nowrap items-center" bind:this={form}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.emailVerification.content'))}
    </div>
    <input
      type="email"
      name="email1"
      id="email1"
      autocomplete="email"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.common.emailPlaceholder')}
      aria-label={$t('candidateApp.common.emailPlaceholder')}
      bind:value={email1}
      required />
    <input
      type="email"
      name="email2"
      id="email2"
      autocomplete="email"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.common.emailPlaceholder')}
      aria-label={$t('candidateApp.common.emailPlaceholder')}
      bind:value={email2}
      required />
    <TermsOfUseForm bind:termsAccepted class="mt-md" />
  </form>

  <Button
    slot="primaryActions"
    text={$t('common.continue')}
    variant="main"
    disabled={!termsAccepted || !email1.trim() || !(email1.trim() === email2.trim())}
    loading={status === 'loading'}
    on:click={handleSubmit} />
</MainContent>
