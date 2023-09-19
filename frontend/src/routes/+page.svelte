<script lang="ts">
  import {locale} from 'svelte-i18n';
  import {goto} from '$app/navigation';
  import {page} from '$app/stores';
  import {resetLocalStorage} from '$lib/utils/stores';

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

<div class="min-h-screen bg-primary">
  <div class="hero bg-[#d4dbef]">
    <img
      class="max-h-72 w-full max-w-screen-md bg-white object-cover"
      src="/images/hero.png"
      alt=""
      srcset="" />
  </div>
  <div class="flex flex-col items-center">
    <div class="flex max-w-xl flex-col flex-nowrap items-center gap-y-3 p-6">
      <h1 class="text-center text-app-title">{$page.data.appLabels.appTitle}</h1>
      <h2 class="text-center">{$page.data.election.name}</h2>
      <p class="text-center">
        {appDescription}
      </p>
      <a href="/navigation" on:click={resetLocalStorage} class="btn-primary btn"
        >{$page.data.appLabels.actionLabels.startButton}</a>
      <a href="/information" class="btn-ghost btn"
        >{$page.data.appLabels.actionLabels.electionInfo}</a>
      <a href="/about" class="btn-ghost btn">{$page.data.appLabels.actionLabels.howItWorks}</a>
    </div>
  </div>
</div>
