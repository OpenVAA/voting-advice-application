<script lang="ts">
  import type {LayoutServerData} from './$types';
  import {parties} from '$lib/utils/stores';

  export let data: LayoutServerData;

  if (data?.parties) {
    $parties = data.parties;
  } else {
    throw new Error('Could not load parties data!');
  }
</script>

<slot />
