<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';

  export let data: { claims: { firstName: string; lastName: string } | null };

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    appCustomization,
    darkMode,
    t,
    userData,
    getRoute,
    preregister,
    dataRoot,
    preselectedElections,
    preselectedConstituencies
  } = getCandidateContext(); // TODO: Redirect to (where) if there's user data.
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  const nextStep = 'CandAppPreregisterSuccess';

  let email1 = '';
  let email2 = '';
  let nominations = $dataRoot.elections
    .filter(({ id }) => $preselectedElections.includes(id))
    .map((e) => ({
      electionDocumentId: e.id,
      constituencyDocumentId: $preselectedConstituencies[e.id] ?? e.constituencyGroups[0].constituencies[0].id // Does this fallback makes sense?
    }));
  let termsAccepted = false;

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($appCustomization.candPoster?.urlDark ?? $appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
      : ($appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
  });

  async function onSubmit() {
    const response = await preregister({ email: email1, nominations }); // TODO
  }
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

{#if $userData}
  <MainContent title={$t('candidateApp.preregister.identification.start.title')}>
    <div class="mb-md text-center text-warning">
      {@html sanitizeHtml($t('candidateApp.preregister.identification.error.loggedIn.content'))}
    </div>
    <Button
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppHome'), { invalidateAll: true })} />
  </MainContent>
{:else if data.claims}
  <MainContent title={$t('candidateApp.preregister.emailVerification.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.emailVerification.content'))}
    </div>
    <input
      type="email"
      name="email1"
      id="email1"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.common.emailPlaceholder')}
      aria-label={$t('candidateApp.common.emailPlaceholder')}
      bind:value={email1}
      required />
    <input
      type="email"
      name="email2"
      id="email2"
      class="input mb-md w-full max-w-md"
      placeholder={$t('candidateApp.common.emailPlaceholder')}
      aria-label={$t('candidateApp.common.emailPlaceholder')}
      bind:value={email2}
      required />
    <label class="label mb-md cursor-pointer justify-start gap-sm !p-0">
      <input type="checkbox" class="checkbox" name="selected-elections" bind:group={termsAccepted} />
      <span class="label-text">{$t('candidateApp.preregister.emailVerification.termsCheckbox')}</span>
    </label>
    <Button
      type="submit"
      text={$t('common.continue')}
      variant="main"
      on:click={() => {
        onSubmit().then((_) => goto($getRoute(nextStep))); // TODO: Error handling.
      }}
      disabled={!termsAccepted || !email1 || !(email1 === email2)} />
    <Button type="reset" text={$t('common.cancel')} variant="secondary" />
  </MainContent>
{:else}
  <MainContent title={$t('candidateApp.preregister.identification.error.expired.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.identification.error.expired.content'))}
    </div>
    <Button
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppPreregister'), { invalidateAll: true })} />
  </MainContent>
{/if}
