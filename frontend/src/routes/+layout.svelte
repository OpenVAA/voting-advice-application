<script lang="ts">
  import '../app.css';
  import {onMount} from 'svelte';
  import type {LayoutServerData} from './$types';
  import {appLabels, election} from '$lib/utils/stores';

  export let data: LayoutServerData;

  // Strangely enough, we cannot check for data?.appLabels here in the global layout file,
  // unless we wait for onMount. In the sublayout this seems to be fine, but would demand
  // a bit of investigation.
  // TODO: Investigate what'd be the proper way to handle data updates.
  onMount(() => {
    if (data.appLabels && data.election) {
      $appLabels = data.appLabels;
      $election = data.election;
    } else {
      throw new Error('appLabels not found');
    }
  });
</script>

{#if $appLabels}
  <main>
    <slot />
  </main>
{/if}
