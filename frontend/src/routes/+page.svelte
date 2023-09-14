<script lang="ts">
  import type {PageData} from './$types';
  export let data: PageData;

  const {appLabels, election} = data;
  const appTitle = appLabels?.appTitle || '';

  let electionDate = new Date(election?.electionDate);
  const electionDateString = electionDate.toLocaleDateString(election?.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const appDescription =
    appLabels?.viewTexts?.toolDescription.replace('{{0}}', electionDateString) || '';
  const startButtonText = appLabels?.actionLabels?.startButton || '';
  const electionInfoTextLink = appLabels?.actionLabels?.electionInfo || '';
  const aboutTextLink = appLabels?.actionLabels?.howItWorks || '';
</script>

{#if Object.keys(data).length > 0}
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
        <h1 class="text-center text-app-title">{appTitle}</h1>
        <h2 class="text-center">{election?.name}</h2>
        <p class="text-center">
          {appDescription}
        </p>
        <a href="/navigation" class="btn-primary btn">{startButtonText}</a>
        <a href="/information" class="btn-ghost btn">{electionInfoTextLink}</a>
        <a href="/about" class="btn-ghost btn">{aboutTextLink}</a>
      </div>
    </div>
  </div>
{/if}
