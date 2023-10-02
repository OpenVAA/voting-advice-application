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

<div class="flex w-full flex-grow flex-col items-center bg-base-300">
  <figure class="hero bg-[#d4dbef]">
    <img
      class="max-h-[30vh] w-full max-w-lg bg-white object-cover"
      src="/images/hero.png"
      alt=""
      srcset="" />
  </figure>

  <main class="flex-grow">
    <div class="flex max-w-xl flex-col items-center p-lg pl-safelgl pr-safelgr">
      <div class="flex flex-col flex-nowrap items-center">
        <hgroup class="py-lg">
          <p class="text-2xl font-bold text-primary">{$page.data.appLabels.appTitle}</p>
          <h1 class="text-3xl font-normal">{$page.data.election.name}</h1>
        </hgroup>
        <p class="text-center">
          {appDescription}
        </p>
        <a
          href="/navigation"
          on:click={resetLocalStorage}
          class="btn-primary btn mb-md w-full max-w-md"
          >{$page.data.appLabels.actionLabels.startButton}</a>
        <a href="/information" class="btn-ghost btn w-full max-w-md"
          >{$page.data.appLabels.actionLabels.electionInfo}</a>
        <a href="/about" class="btn-ghost btn w-full max-w-md"
          >{$page.data.appLabels.actionLabels.howItWorks}</a>
      </div>
    </div>
  </main>

  <footer class="p-lg text-center text-sm text-secondary">
    {$page.data.appLabels.viewTexts.publishedBy.replace('{{0}}', '')}
    <img class="inline w-14" src={'/icons/publisher.svg'} alt="governmental" srcset="" />
    Institution • {$page.data.appLabels.viewTexts.madeWith.replace('{{0}}', '')}
    <img class="inline w-14" src="/icons/vote.svg" alt="" srcset="" /> OpenVAA
  </footer>
</div>
