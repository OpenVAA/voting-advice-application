<script lang="ts">
  import { TermsOfUseForm } from '$contestant/components/termsOfUse';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  // idTokenClaims + preregistrationNominations are reactive; access via contestantCtx.X.
  const contestantCtx = getContestantContext();
  const { preregister, t, getRoute } = contestantCtx;

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
      registrationUrl: `${window.location.origin}${getRoute.current('ContestantAppRegister')}?registrationKey=<%= candidate.registrationKey %>`,
      firstName: contestantCtx.idTokenClaims?.firstName
    };
    await preregister({
      email: email1,
      nominations: contestantCtx.preregistrationNominations,
      extra: {
        emailTemplate: {
          subject: t('contestantApp.preregister.email.subject'),
          text: t('contestantApp.preregister.email.text', templatePayload),
          html: t('contestantApp.preregister.email.html', templatePayload)
        }
      }
    });
    status = 'idle';
  }
</script>

<MainContent title={t('contestantApp.preregister.emailVerification.title')}>
  <form class="flex flex-col flex-nowrap items-center" bind:this={form}>
    <div class="mb-md text-center">
      {@html sanitizeHtml(t('contestantApp.preregister.emailVerification.content'))}
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
