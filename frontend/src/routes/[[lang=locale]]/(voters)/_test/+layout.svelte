<script lang="ts">
  import {browser} from '$app/environment';
  import {isValidResult} from '$lib/_api/utils/isValidResult';
  import {getGlobalContext} from '$lib/_contexts/global';

  export let data;

  const {vaaData} = getGlobalContext();

  let error = false;

  console.info('[debug] /_test/+layout.svelte: Module loaded', browser);

  data.candidatesData.then((result) => {
    if (!isValidResult(result)) {
      error = true;
      return;
    }
    console.info(
      `[debug] /_test/+layout.svelte: Providing ${result.length} candidate data objects to vaaData`
    );
    $vaaData.provideCandidateData(result);
  });
</script>

{#if !error}
  <slot />
{:else}
  <!-- Replace with an error component -->
  <h1>Error loading data</h1>
{/if}
