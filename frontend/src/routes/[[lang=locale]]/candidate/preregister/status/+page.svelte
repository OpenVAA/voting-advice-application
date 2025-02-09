<script lang="ts">
  import { Button } from '$lib/components/button';
  import MainContent from '../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, t, getRoute, clearIdToken } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  $: error = page.url.searchParams.get('error');

  $: content = !error
    ? ({
        title: $t('candidateApp.preregister.success.title'),
        content: $t('candidateApp.preregister.success.content'),
        route: 'CandAppRegister'
      } as const)
    : error === '401'
      ? ({
          title: $t('candidateApp.preregister.identification.error.expired.title'),
          content: $t('candidateApp.preregister.identification.error.expired.content'),
          route: 'CandAppPreregister'
        } as const)
      : error === '409'
        ? ({
            title: $t('candidateApp.preregister.identification.error.preregistered.title'),
            content: $t('candidateApp.preregister.identification.error.preregistered.content'),
            route: 'CandAppPreregister'
          } as const)
        : ({
            title: $t('candidateApp.preregister.identification.error.unknown.title'),
            content: $t('candidateApp.preregister.identification.error.unknown.content'),
            route: 'CandAppPreregister'
          } as const);

  clearIdToken();

  ///////////////////////////////////////////////////////////////////
  // Top bar and styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    imageSrc: $darkMode
      ? ($appCustomization.candPoster?.urlDark ?? $appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
      : ($appCustomization.candPoster?.url ?? '/images/hero-candidate.png')
  });
</script>

<svelte:head>
  <title>{$t('candidateApp.preregister.identification.start.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<MainContent title={content.title}>
  <div class={`mb-md text-center ${error ? 'text-warning' : ''}`}>
    {@html sanitizeHtml(content.content)}
  </div>
  <Button
    text={$t('common.continue')}
    variant="main"
    on:click={() => goto($getRoute(content.route), { invalidateAll: true })} />
</MainContent>
