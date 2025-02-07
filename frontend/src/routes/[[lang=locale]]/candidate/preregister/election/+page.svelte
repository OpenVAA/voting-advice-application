<script lang="ts">
  import { Button } from '$lib/components/button';
  import { browser } from '$app/environment';
  import { constants } from '$lib/utils/constants';
  import MainContent from '../../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';
  import { sanitizeHtml } from '$lib/utils/sanitize';
  import { goto } from '$app/navigation';
  import { DEFAULT_DATE_FORMAT } from '../../../../../../../packages/data/src/internal';

  export let data: { claims: { firstName: string; lastName: string } | null };

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, t, userData, constituenciesSelectable, locale, getRoute } = getCandidateContext(); // TODO: Redirect to (where) if there's user data.
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  const electionDate = new Date(); // TODO: Where does this come from?

  const nextRoute = $constituenciesSelectable ? 'CandAppPreregisterConstituency' : 'CandAppPreregisterEmail';

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
  <MainContent title={$t('candidateApp.preregister.electionSelect.title')}>
    <div class="mb-md text-center">
      {@html sanitizeHtml(
        $t('candidateApp.preregister.electionSelect.content', {
          date: electionDate.toLocaleDateString($locale, DEFAULT_DATE_FORMAT)
        })
      )}
    </div>
    <div class="mb-md text-center">TODO: Select component</div>
    <Button type="submit" text={$t('common.continue')} variant="main" on:click={() => goto($getRoute(nextRoute))} />
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
