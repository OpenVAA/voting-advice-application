<script lang="ts">
  import {onMount} from 'svelte';
  import {goto} from '$app/navigation';
  import {logDebugError} from '$lib/utils/logger';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {resultsAvailable} from '$lib/utils/stores';

  // This has to be done onMount, because goto may otherwise be called on the server
  onMount(() => {
    if (!$resultsAvailable) {
      logDebugError('No candidate rankings found. Redirecting to questions');
      goto($getRoute(Route.Questions));
    }
  });
</script>

<slot />
