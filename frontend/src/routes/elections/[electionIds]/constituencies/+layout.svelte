<script lang="ts">
  import type {LayoutData} from './$types';
  import {constituencyCategoryData, sessionData} from '$lib/stores/stores';

  export let data: LayoutData;

  // Set store data that will be needed by subroutes
  if (data) {
    $constituencyCategoryData = data.constituencyCategoryData;
    $sessionData.temporaryChoices.selectedElectionIds = data.selectedElectionIds;
  } else {
    throw new Error('No data');
  }
</script>

<slot />
