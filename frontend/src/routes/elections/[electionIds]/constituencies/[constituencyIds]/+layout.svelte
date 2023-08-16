<script lang="ts">
  import type {LayoutData} from './$types';
  import {
    questionTemplateData,
    questionCategoryData,
    questionData,
    userData
  } from '$lib/stores/stores';

  export let data: LayoutData;

  // Set store data that will be needed by subroutes
  if (data) {
    // We need to provide template data and categories before questions
    $questionTemplateData = data.questionTemplateData;
    $questionCategoryData = data.questionCategoryData;
    $questionData = data.questionData;
    $userData.constituencyIds = data.selectedConstituencyIds;
  } else {
    throw new Error('No data');
  }
</script>

<slot />
