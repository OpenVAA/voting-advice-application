<script lang="ts">
  import type {LayoutData} from './$types';
  import {constituencyCategoriesData, sessionData} from '$lib/stores/stores';

  export let data: LayoutData;

  // Set store data that will be needed by subroutes
  if (data) {
    $constituencyCategoriesData = data.constituencyCategoriesData;
    $sessionData.temporaryChoices.selectedElectionIds = data.selectedElectionIds;
  } else {
    throw new Error('No data');
  }
</script>

<slot />
