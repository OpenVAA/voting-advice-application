<!--@component
# Admin jobs layout

- Adds polling
-->

<script lang="ts">
  import WithPolling from '$lib/admin/components/jobs/WithPolling.svelte';
</script>

<WithPolling>
  <slot />
</WithPolling>
