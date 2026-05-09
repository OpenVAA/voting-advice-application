<!--
@component
A temporary utility component within which jobs are being polled.

TODO[Svelte 5]: Count subscriptions to stores (or $states) and automatically start and stop polling.

### Usage

```tsx
<WithPolling>
  <FeatureJobs feature={ADMIN_FEATURE.FactorAnalysis} />
</WithPolling>
```
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  onMount(() => {
    startPolling();
    return () => stopPolling();
  });
</script>

{@render children?.()}
