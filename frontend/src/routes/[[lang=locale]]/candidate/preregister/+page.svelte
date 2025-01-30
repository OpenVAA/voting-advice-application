<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/button';
  import { HeadingGroup, PreHeading } from '$lib/components/headingGroup';
  import { browser } from '$app/environment';
  import { constants } from '$lib/utils/constants';
  import MainContent from '../../MainContent.svelte';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { onDestroy } from 'svelte';

  // TODO: Use $t('candidateApp.preregister.identifyYourself')

  export let data: { userInfo: { firstName: string; lastName: string } | null };

  let electionIds: number[] = [];
  let constituencyId: number | undefined = undefined;
  let email1: string | undefined = undefined;
  let email2: string | undefined = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, t, userData } = getCandidateContext();
  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  async function authenticateWithOIDC() {
    if (browser) {
      const clientId = constants.PUBLIC_SIGNICAT_CLIENT_ID;
      const redirectUri = `${window.location.origin}${window.location.pathname}/signicat/oidc/callback`;
      window.location.href = `${constants.PUBLIC_SIGNICAT_AUTHORIZE_ENDPOINT}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid%20profile&prompt=login`;
    }
  }

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
  <title>{$t('candidateApp.register.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

<MainContent title={$t('candidateApp.register.title')}>
  <HeadingGroup slot="heading">
    <PreHeading class="text-2xl font-bold text-primary">{$t('dynamic.appName')}</PreHeading>
    <h1 class="text-3xl font-normal">{$page.data.election?.name}</h1>
  </HeadingGroup>
  {#if data.userInfo}
    <form class="flex flex-col flex-nowrap items-center" method="POST" action="?/register">
      <input
        name="firstName"
        id="firstName"
        class="input mb-md w-full max-w-md"
        placeholder={$t('common.firstName')}
        aria-label={$t('common.firstName')}
        value={data.userInfo.firstName}
        required
        disabled />
      <input
        name="lastName"
        id="lastName"
        class="input mb-md w-full max-w-md"
        placeholder={$t('common.lastName')}
        aria-label={$t('common.lastName')}
        value={data.userInfo.lastName}
        required
        disabled />
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
      <Button type="submit" text="Submit" variant="main" />
      <Button type="reset" text={$t('common.cancel')} variant="secondary" />
    </form>
  {:else}
    <Button type="submit" text="Identify yourself" variant="main" on:click={authenticateWithOIDC} />
  {/if}
</MainContent>
