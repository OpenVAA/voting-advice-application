<!-- @component

A temporary utility component within which jobs are being polled.

TODO[Svelte 5]: Count subscriptions to stores (or $states) and automatically start and stop polling.
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  startPolling();
  onDestroy(() => stopPolling());
</script>

<slot />
