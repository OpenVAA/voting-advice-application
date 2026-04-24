<!--
  Test-only harness that mounts a component which calls `getFilterContext()`
  WITHOUT first calling `initFilterContext`. Lets unit tests assert that the
  pre-init guard throws status-500.

  Props:
    - `onError`: callback invoked with the thrown error.
-->
<script lang="ts">
  import { getFilterContext } from '../filterContext.svelte';

  type Props = { onError?: (err: unknown) => void };
  const { onError }: Props = $props();

  try {
    getFilterContext();
  } catch (e) {
    onError?.(e);
  }
</script>
