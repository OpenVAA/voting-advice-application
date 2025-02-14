<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { preregister, preregistrationNominations, t, getRoute } = getCandidateContext();

  let email1 = '';
  let email2 = '';
  let termsAccepted = false;

  async function onSubmit() {
    const registrationRoute = `${window.location.origin}${$getRoute('CandAppRegister')}?registrationKey=`;
    await preregister({
      email: email1,
      nominations: $preregistrationNominations,
      extra: {
        emailTemplate: {
          subject: $t('candidateApp.preregister.email.subject'),
          text: $t('candidateApp.preregister.email.text', { registrationRoute }),
          html: $t('candidateApp.preregister.email.html', { registrationRoute })
        }
      }
    });
  }
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<MainContent title={$t('candidateApp.preregister.emailVerification.title')}>
  <form class="flex flex-col flex-nowrap items-center" on:submit|preventDefault={onSubmit}>
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
    <label class="label mb-md cursor-pointer justify-start gap-sm !p-0">
      <input type="checkbox" class="checkbox" name="selected-elections" bind:checked={termsAccepted} />
      <span class="label-text">{$t('candidateApp.preregister.emailVerification.termsCheckbox')}</span>
    </label>
    <Button
      type="submit"
      text={$t('common.continue')}
      variant="main"
      disabled={!termsAccepted || !email1.trim() || !(email1.trim() === email2.trim())} />
  </form>
</MainContent>
