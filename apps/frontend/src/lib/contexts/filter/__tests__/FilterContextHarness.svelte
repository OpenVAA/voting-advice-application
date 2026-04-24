<!--
  Test-only harness that mounts a component with init/get filter context
  semantics. Lets unit tests exercise `initFilterContext` / `getFilterContext`
  inside a real Svelte component scope (where `setContext` / `hasContext` are
  permitted).

  Props:
    - `init`: optional `InitFilterContextArgs`. When provided, calls
      `initFilterContext(init)` during component setup; otherwise calls
      `initFilterContext` with an empty-tree closure (rare — used by the
      double-init test which never reaches the second call's args).
    - `onReady`: callback invoked once with the resulting `FilterContext`,
      after init. Tests use this to capture the context object and run
      assertions inside their own `$effect.root` if desired.
    - `initSecond`: when truthy, calls `initFilterContext` a second time and
      reports the thrown error via `onSecondInitError`. Used to test the
      double-init guard.
-->
<script lang="ts">
  import { initFilterContext } from '../filterContext.svelte';
  import type { FilterContext, InitFilterContextArgs } from '../filterContext.type';
  import type { FilterTree } from '$lib/contexts/voter/filters/filterStore.svelte';

  type Props = {
    init?: InitFilterContextArgs;
    onReady?: (ctx: FilterContext) => void;
    initSecond?: boolean;
    onSecondInitError?: (err: unknown) => void;
  };

  const { init, onReady, initSecond, onSecondInitError }: Props = $props();

  // Test harness — props are read once during component init only. The
  // `state_referenced_locally` warnings are intentional: tests pass props
  // at mount time and do not reassign them.
  // svelte-ignore state_referenced_locally
  const args: InitFilterContextArgs = init ?? { entityFilters: () => ({}) as FilterTree };
  const ctx = initFilterContext(args);
  // svelte-ignore state_referenced_locally
  onReady?.(ctx);

  // svelte-ignore state_referenced_locally
  if (initSecond) {
    try {
      initFilterContext(args);
    } catch (e) {
      // svelte-ignore state_referenced_locally
      onSecondInitError?.(e);
    }
  }
</script>
