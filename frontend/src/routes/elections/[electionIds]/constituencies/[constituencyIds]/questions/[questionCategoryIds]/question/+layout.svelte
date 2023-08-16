<script lang="ts">
  import type {LayoutData} from './$types';
  import {sessionData} from '$lib/stores/stores';

  export let data: LayoutData;

  // Set store data that will be needed by subroutes
  if (data) {
    $sessionData.temporaryChoices.selectedQuestionCategoryIds = data.selectedQuestionCategoryIds;
  } else {
    throw new Error('No data');
  }
</script>

<slot />
