<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { getErrorTranslationKey } from '$candidate/utils/preregistrationError';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { sanitizeHtml } from '$lib/utils/sanitize';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { clearIdToken, getRoute, t } = getCandidateContext();
  let code = $derived(page.url.searchParams.get('code'));

  // onMount, NOT the `<script>` body. `clearIdToken` builds a writer through `prepareDataWriter`, whose `assertBrowser` throws outright off the browser -- and the script body runs during SERVER render, so a direct navigation or a fresh `yarn dev` load of this page crashed the SSR render and took the dev process with it (`Error: Writer methods in contexts can only be called in a browser environment`). `onMount` runs only in the browser, which is the invariant that assertion is stating.
  //
  // A one-shot queue rather than a `$effect`, matching the candidate layout's own note: this is a side effect that must happen exactly once per visit, and a reactive effect would re-run it on every dependency change.
  //
  // `void` marks the fire-and-forget deliberately. The write's own failure is already logged inside `clearIdToken`; there is nothing this page can do about it and nothing it should show, because the token is being discarded either way.
  onMount(() => {
    void clearIdToken();
  });
</script>

{#if code === 'success'}
  <MainContent title={t('candidateApp.preregister.status.success.title')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('candidateApp.preregister.status.success.heroEmoji')} />
      </figure>
    {/snippet}
    <div class="mb-md text-center">
      {@html sanitizeHtml(t('candidateApp.preregister.status.success.content'))}
    </div>
    {#snippet primaryActions()}
      <Button
        text={t('common.return')}
        href={getRoute.current('CandAppLogin')}
        variant="main"
        data-testid="preregister-status-return" />
    {/snippet}
  </MainContent>
{:else}
  <MainContent title={t(getErrorTranslationKey(code).title)}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.error.heroEmoji')} />
      </figure>
    {/snippet}
    <div class="mb-lg text-warning text-center">
      {@html sanitizeHtml(t(getErrorTranslationKey(code).content))}
    </div>

    {#snippet primaryActions()}
      <Button
        class="mb-md"
        text={t('common.return')}
        variant="main"
        onclick={() => goto(getRoute.current('CandAppPreregister'), { invalidateAll: true })}
        data-testid="preregister-status-retry" />
      <Button
        href={getRoute.current('CandAppHelp')}
        text={t('candidateApp.help.title')}
        data-testid="preregister-status-help-link" />
    {/snippet}
  </MainContent>
{/if}
