<script lang="ts">
  import type {LayoutData} from './$types';
  import {questionCategoriesData, questionsData, userData} from '$lib/stores/stores';

  export let data: LayoutData;

  // Set store data that will be needed by subroutes
  if (data) {
    $questionCategoriesData = data.questionCategoriesData;
    $questionsData = data.questionsData;
    $userData.constituencyIds = data.selectedConstituencyIds;
  } else {
    throw new Error('No data');
  }
</script>

<slot />
