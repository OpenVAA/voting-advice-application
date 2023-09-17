<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {LayoutServerData} from './$types';

  export let data: LayoutServerData;

  if (!(data?.candidates && data?.questions)) {
    throw new Error('Could not load candidate or question data!');
  }
</script>

<slot />