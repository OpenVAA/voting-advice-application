<!--@component

# Test harness: the Contestant App's layout

Stands in for the Contestant App's layout, for `afterSave.svelte.test.ts`. It initialises the contestant context, with its user-data store, and renders the entity layout around the details step of the nomination editor.
-->

<script lang="ts">
  import { initContestantContext } from '$lib/contexts/contestant';
  import DetailsPage from './+page.svelte';
  import EntityLayout from '../../../+layout.svelte';

  let {
    layoutData,
    pageData
  }: {
    /** The data of the entity layout. */
    layoutData: unknown;
    /** The data of the details page. */
    pageData: unknown;
  } = $props();

  initContestantContext();
</script>

<EntityLayout data={layoutData as never}>
  <DetailsPage data={pageData as never} />
</EntityLayout>
