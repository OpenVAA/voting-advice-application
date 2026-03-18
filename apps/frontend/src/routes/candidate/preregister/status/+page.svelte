<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getErrorTranslationKey } from '$candidate/utils/preregistrationError';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import MainContent from '../../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { clearIdToken, getRoute, t } = getCandidateContext();
  $: code = $page.url.searchParams.get('code');

  clearIdToken();
</script>

{#if code === 'success'}
  <MainContent title={t('candidateApp.preregister.status.success.title')}>
    <figure role="presentation" slot="hero">
      <HeroEmoji emoji={t('candidateApp.preregister.status.success.heroEmoji')} />
    </figure>
    <div class="mb-md text-center">
      {@html sanitizeHtml(t('candidateApp.preregister.status.success.content'))}
    </div>
    <Button
      slot="primaryActions"
      text={t('common.return')}
      href={$getRoute('CandAppLogin')}
      variant="main"
      data-testid="preregister-status-return" />
  </MainContent>
{:else}
  <MainContent title={t(getErrorTranslationKey(code).title)}>
    <figure role="presentation" slot="hero">
      <HeroEmoji emoji={t('dynamic.error.heroEmoji')} />
    </figure>
    <div class="mb-lg text-warning text-center">
      {@html sanitizeHtml(t(getErrorTranslationKey(code).content))}
    </div>

    <svelte:fragment slot="primaryActions">
      <Button
        class="mb-md"
        text={t('common.return')}
        variant="main"
        on:click={() => goto($getRoute('CandAppPreregister'), { invalidateAll: true })}
        data-testid="preregister-status-retry" />
      <Button
        href={$getRoute('CandAppHelp')}
        text={t('candidateApp.help.title')}
        data-testid="preregister-status-help-link" />
    </svelte:fragment>
  </MainContent>
{/if}
