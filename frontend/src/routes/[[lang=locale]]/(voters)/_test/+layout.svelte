<script lang="ts">
  import {isValidResult} from '$lib/_api/utils/isValidResult';
  import {initAppContext} from '$lib/_contexts/app';
  import {initComponentsContext} from '$lib/_contexts/components';
  import {initI18nContext} from '$lib/_contexts/i18n';
  import {initVaaDataContext} from '$lib/_contexts/vaaData';
  import {awaitAll} from '$lib/_utils/awaitAll';
  import type {LayoutData} from './$types';
  import {Loading} from '$lib/components/loading';

  export let data: LayoutData;

  // Initialize globally used contexts in the outermost layout
  initI18nContext();
  initVaaDataContext();
  initComponentsContext();

  const {dataRoot} = initAppContext();

  let ready: boolean | undefined = undefined;
  let error: Error | undefined = undefined;

  $: awaitAll([data.electionsData], ([data]) => {
    if (!isValidResult(data)) throw new Error('Error loading election data');
    $dataRoot.provideElectionData(data);
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
