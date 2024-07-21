<script lang="ts">
  import {initVoterContext} from '$lib/_contexts/voter';
  import {updateView} from '$lib/_utils/updateView';
  import {Loading} from '$lib/components/loading';
  import type {LayoutData} from './$types';
  import {isValidResult} from '$lib/_api/utils/isValidResult';

  export let data: LayoutData;

  const {election, electionId} = initVoterContext();

  let ready: boolean | undefined = undefined;
  let error: Error | undefined = undefined;

  $: $electionId = data.electionId;
  $: updateView([data.constituenciesData, $election], ([data, election]) => {
    if (!isValidResult(data)) throw new Error('Error loading constituency data');
    election.provideConstituencyData(data);
    return true;
  })
    .then((ok) => (ready = ok))
    .catch((e) => (error = e));
</script>

{#if error}
  <h1>Error: {error.message}</h1>
{:else if ready}
  <slot />
{:else}
  <Loading />
{/if}
