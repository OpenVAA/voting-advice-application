<!-- @component

A temporary utility component within which jobs are being polled.

TODO[Svelte 5]: Count subscriptions to stores (or $states) and automatically start and stop polling.
-->

<script lang="ts">
  import { getAdminContext } from '$lib/contexts/admin';
  import { onDestroy } from 'svelte';

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  startPolling();
  onDestroy(() => stopPolling());
</script>

<slot />
