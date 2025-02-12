<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getErrorTranslationKey } from '$candidate/utils/preregistrationError';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appSettings, t, getRoute, clearIdToken } = getCandidateContext();
  $: code = $page.url.searchParams.get('code');

  clearIdToken();
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

{#if code === 'success'}
  <MainContent title={$t('candidateApp.preregister.status.success.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml($t('candidateApp.preregister.status.success.content'))}
    </div>
    <Button
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppRegister'), { invalidateAll: true })} />
  </MainContent>
{:else}
  <MainContent title={$t(getErrorTranslationKey(code).title)}>
    <div class="mb-md text-center text-warning">
      {@html sanitizeHtml($t(getErrorTranslationKey(code).content))}
    </div>
    <Button
      class="mb-md"
      text={$t('common.continue')}
      variant="main"
      on:click={() => goto($getRoute('CandAppPreregister'), { invalidateAll: true })} />
    <Button href="mailto:{$appSettings.admin.email}" text={$t('candidateApp.common.contactSupport')} />
  </MainContent>
{/if}
