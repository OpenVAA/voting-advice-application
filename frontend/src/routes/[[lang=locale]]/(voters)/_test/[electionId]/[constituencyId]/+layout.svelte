<script lang="ts">
  import {isValidResult} from '$lib/_api/utils/isValidResult';
  import {getVoterContext} from '$lib/_contexts/voter';
  import type {LayoutData} from './$types';
  import {updateView} from '$lib/_utils/updateView';
  import {Loading} from '$lib/components/loading';

  export let data: LayoutData;

  const {constituency, constituencyId, dataRoot} = getVoterContext();

  let ready: boolean | undefined = undefined;
  let error: Error | undefined = undefined;

  $: $constituencyId = data.constituencyId;
  $: updateView([data.nominationsData, $constituency], ([nominationsData, constituency]) => {
    const {nominations, candidates} = nominationsData;
    if (!isValidResult(candidates, {allowEmpty: true}))
      throw new Error('Error loading candidate data');
    if (!isValidResult(nominations, {allowEmpty: true}))
      throw new Error('Error loading nomination data');
    $dataRoot.provideCandidateData(candidates);
    constituency.provideNominationData(nominations);
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
