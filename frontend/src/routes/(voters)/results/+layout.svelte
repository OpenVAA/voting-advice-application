<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {LayoutServerData} from './$types';
  import {candidates, questions} from '$lib/utils/stores';

  export let data: LayoutServerData;

  if (data?.candidates && data?.questions) {
    $candidates = data.candidates;
    $questions = data.questions;
  } else {
    throw new Error('Could not load candidate or question data!');
  }
</script>

<slot />