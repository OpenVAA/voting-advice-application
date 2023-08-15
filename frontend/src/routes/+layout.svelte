<script lang="ts">
  import '../app.css';
  import type {LayoutData} from './$types';
  import {appLabels, appSettings, electionData} from '$lib/stores';

  export let data: LayoutData;

  // Update the global stores
  if (data) {
    $appLabels = data.appLabels;
    $appSettings = data.appSettings;
    $electionData = data.electionData;
  } else {
    throw new Error('No data');
  }
</script>

<main>
  {#if $appLabels}
    <slot />
  {:else}
    <!-- TO DO: Add a loading component that can be used on other pages and
      within components as well -->
    <h1>Loading...</h1>
  {/if}
</main>
