<script lang="ts">
  import type {LayoutServerData} from './$types';
  import {allParties} from '$lib/utils/stores';

  export let data: LayoutServerData;

  if (data?.parties) {
    $allParties = data.parties;
  } else {
    throw new Error('Could not load parties data!');
  }
</script>

<slot />
