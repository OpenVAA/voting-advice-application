<script lang="ts">
  import { TermsOfUseForm } from '$candidate/components/termsOfUse';
  import { Button } from '$lib/components/button';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // Phase 61-03 follow-up: idTokenClaims + preregistrationNominations are
  // reactive; access via candCtx.X.
  const candCtx = getCandidateContext();
  const { preregister, t, getRoute } = candCtx;

  ////////////////////////////////////////////////////////////////////
  // Handle submitting
  ////////////////////////////////////////////////////////////////////

  let form = $state<HTMLFormElement>();
  let email1 = $state('');
  let email2 = $state('');
  let status = $state<ActionStatus>('idle');
  let termsAccepted = $state(false);

  async function handleSubmit() {
    if (!form?.reportValidity() || !termsAccepted) return;
    status = 'loading';
    const templatePayload = {
      registrationUrl: `${window.location.origin}${$getRoute('CandAppRegister')}?registrationKey=<%= candidate.registrationKey %>`,
      firstName: candCtx.idTokenClaims?.firstName
    };
    await preregister({
      email: email1,
      nominations: candCtx.preregistrationNominations,
      extra: {
        emailTemplate: {
          subject: t('candidateApp.preregister.email.subject'),
          text: t('candidateApp.preregister.email.text', templatePayload),
          html: t('candidateApp.preregister.email.html', templatePayload)
        }
      }
    });
    status = 'idle';
  }
</script>

<MainContent title={t('candidateApp.preregister.emailVerification.title')}>
  <form class="flex flex-col flex-nowrap items-center" bind:this={form}>
    <div class="mb-md text-center">
      {@html sanitizeHtml(t('candidateApp.preregister.emailVerification.content'))}
    </div>
    <input
      type="email"
      name="email1"
      id="email1"
      autocomplete="email"
      class="input mb-md w-full max-w-md"
      placeholder={t('common.emailPlaceholder')}
      aria-label={t('common.emailPlaceholder')}
      bind:value={email1}
      data-testid="preregister-email-input"
      required />
    <input
      type="email"
      name="email2"
      id="email2"
      autocomplete="email"
      class="input mb-md w-full max-w-md"
      placeholder={t('common.emailPlaceholder')}
      aria-label={t('common.emailPlaceholder')}
      bind:value={email2}
      data-testid="preregister-email-confirm"
      required />
    <TermsOfUseForm bind:termsAccepted class="mt-md" />
  </form>

  {#snippet primaryActions()}
    <Button
      text={t('common.continue')}
      variant="main"
      disabled={!termsAccepted || !email1.trim() || !(email1.trim() === email2.trim())}
      loading={status === 'loading'}
      onclick={handleSubmit}
      data-testid="preregister-email-submit" />
  {/snippet}
</MainContent>
