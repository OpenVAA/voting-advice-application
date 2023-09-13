<script lang="ts">
  import {locale} from 'svelte-i18n';
  import {appLabels, election} from '$lib/utils/stores';

  let electionDateString = '';
  let appDescription = '';
  $: if ($appLabels && $election) {
    electionDateString = new Date($election.electionDate).toLocaleDateString(
      $election.locale ?? $locale ?? undefined,
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    );
    appDescription = $appLabels.viewTexts.toolDescription.replace('{{0}}', electionDateString);
  }
</script>

{#if $appLabels && $election}
  <div class="min-h-screen bg-secondary">
    <div class="hero bg-[#d4dbef]">
      <img
        class="max-h-72 w-full max-w-screen-md bg-white object-cover"
        src="/images/hero.png"
        alt=""
        srcset="" />
    </div>
    <div class="flex flex-col items-center">
      <div class="flex max-w-xl flex-col flex-nowrap items-center gap-y-3 p-6">
        <h1 class="text-center text-app-title">{$appLabels.appTitle}</h1>
        <h2 class="text-center">{$election.name}</h2>
        <p class="text-center">
          {appDescription}
        </p>
        <a href="/navigation" class="btn-primary btn">{$appLabels.actionLabels.startButton}</a>
        <a href="/information" class="btn-ghost btn">{$appLabels.actionLabels.electionInfo}</a>
        <a href="/about" class="btn-ghost btn">{$appLabels.actionLabels.howItWorks}</a>
      </div>
    </div>
  </div>
{/if}