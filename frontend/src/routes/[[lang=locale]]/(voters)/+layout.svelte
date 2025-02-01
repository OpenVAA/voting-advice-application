<!--@component

# Voter app main layout

- Sets top bar settings

### Settings

- `header.showHelp`: Whether the help button is shown in the header.
- `header.showFeedback`: Whether the feedback button is shown in the header.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { initVoterContext } from '$lib/contexts/voter';
  import { logDebugError } from '$lib/utils/logger';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  ////////////////////////////////////////////////////////////////////
  // Init Voter Context
  ////////////////////////////////////////////////////////////////////

  initVoterContext();

  const { appSettings, appType, dataRoot } = getAppContext();
  $appType = 'voter';

  const { topBarSettings } = getLayoutContext(onDestroy);

  topBarSettings.push({
    actions: {
      feedback: $appSettings.header.showFeedback ? 'show' : 'hide',
      help: $appSettings.header.showHelp ? 'show' : 'hide'
    }
  });

  ////////////////////////////////////////////////////////////////////
  // Provide globally used data and check all loaded data
  ////////////////////////////////////////////////////////////////////

  // TODO[Svelte 5]: See if this and others like it can be handled in a centralized manner in the DataContext. I.e. by subscribing to individual parts of $page.data.
  let error: Error | undefined;
  let ready: boolean;
  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    Promise.all([data.electionData, data.constituencyData]).then((data) => {
      error = update(data);
    });
  }
  $: if (error) logDebugError(error.message);

  /**
   * Handle the update inside a function so that we don't track $dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  function update([electionData, constituencyData]: [
    DPDataType['elections'] | Error,
    DPDataType['constituencies'] | Error
  ]): Error | undefined {
    if (!isValidResult(electionData)) return new Error('Error loading election data');
    if (!isValidResult(constituencyData)) return new Error('Error loading constituency data');
    $dataRoot.provideElectionData(electionData);
    $dataRoot.provideConstituencyData(constituencyData);

    ready = true;
  }
</script>

{#if error}
  <ErrorMessage class="h-screen bg-base-300" />
{:else if !ready}
  <Loading class="h-screen bg-base-300" />
{:else}
  <slot />
{/if}
