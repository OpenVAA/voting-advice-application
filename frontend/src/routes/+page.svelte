<script lang="ts">
  import {locale} from 'svelte-i18n';
  import {page} from '$app/stores';
  import {resetLocalStorage} from '$lib/utils/stores';
  import {FrontPage} from '$lib/components/frontPage';

  // TODO: Maybe change the locale here to appLabels.locale so it matches the rest of the string
  // We also need to include the locale property in the appLabels store
  const electionDateString = new Date($page.data.election.electionDate).toLocaleDateString(
    $page.data.election.locale ?? $locale ?? undefined,
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );
  const appDescription = $page.data.appLabels.viewTexts.toolDescription.replace(
    '{{0}}',
    electionDateString
  );
</script>

<FrontPage
  title={$page.data.election.name}
  headerClass="bg-transparent absolute"
  class="bg-base-300">
  <svelte:fragment slot="heading">
    <p class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</p>
    <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
  </svelte:fragment>

  <img
    slot="hero"
    class="h-[30vh] w-full max-w-lg bg-white object-cover"
    src="/images/hero.png"
    alt="" />

  <p class="text-center">
    {appDescription}
  </p>
  <a href="/intro" on:click={resetLocalStorage} class="btn-primary btn mb-md w-full max-w-md"
    >{$page.data.appLabels.actionLabels.startButton}</a>
  <a href="/information" class="btn-ghost btn w-full max-w-md"
    >{$page.data.appLabels.actionLabels.electionInfo}</a>
  <a href="/about" class="btn-ghost btn w-full max-w-md"
    >{$page.data.appLabels.actionLabels.howItWorks}</a>

  <svelte:fragment slot="footer">
    {$page.data.appLabels.viewTexts.publishedBy.replace('{{0}}', '')}
    <img class="inline w-14" src={'/icons/publisher.svg'} alt="governmental" srcset="" />
    Institution • {$page.data.appLabels.viewTexts.madeWith.replace('{{0}}', '')}
    <img class="inline w-14" src="/icons/vote.svg" alt="" srcset="" /> OpenVAA
  </svelte:fragment>
</FrontPage>
