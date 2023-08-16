<script lang="ts">
  import type {LayoutData} from './$types';
  import {answerData, nominationData, organizationData, personData} from '$lib/stores/stores';

  export let data: LayoutData;

  // Set store data that will be needed by subroutes
  if (data) {
    // NB! We need to set the Entity data before Nomination and Answer data
    $organizationData = data.organizationData;
    $personData = data.personData;
    $nominationData = data.nominationData;
    $answerData = data.answerData;
  } else {
    throw new Error('No data');
  }
</script>

<slot />
