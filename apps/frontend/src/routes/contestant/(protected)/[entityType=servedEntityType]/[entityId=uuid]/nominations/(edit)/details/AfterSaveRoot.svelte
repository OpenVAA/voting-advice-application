<!--@component

# Test harness: the layouts above the entity layout

Stands in for the root layout and renders `AfterSaveContestant` below it, for `afterSave.svelte.test.ts`. It initialises the data context and gives the data root the elections and the constituencies in an effect of its own, as the root layout does.
-->

<script lang="ts">
  import { initDataContext } from '$lib/contexts/data';
  import AfterSaveContestant from './AfterSaveContestant.svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';

  let {
    electionData,
    constituencyData,
    layoutData,
    pageData
  }: {
    electionData: DPDataType['elections'];
    constituencyData: DPDataType['constituencies'];
    /** The data of the entity layout. */
    layoutData: unknown;
    /** The data of the details page. */
    pageData: unknown;
  } = $props();

  const { setDataRoot } = initDataContext();

  // The data root is mutated through `setDataRoot(updater)`, which runs the updater untracked.
  $effect(() => {
    const snapshot = { electionData, constituencyData };
    setDataRoot((dr) => {
      dr.update(() => {
        dr.provideElectionData(snapshot.electionData);
        dr.provideConstituencyData(snapshot.constituencyData);
      });
    });
  });
</script>

<AfterSaveContestant {layoutData} {pageData} />
