<!--
@component Opens `EntityDetails` for `entity` in the app's drawer host for as long as this component is mounted. Renders nothing in place.

The dialog itself is the app's `DrawerHost` (`$lib/components/modal/drawerHost`), mounted in the voter app's root layout, so this component hands the host a payload rather than rendering an overlay of its own: the content snippet and the accessible name. The host sits below the voter context, so the content resolves it itself.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.

### Callbacks

- `onClose`: Called when the user dismisses the drawer. A routed caller navigates back here; the resulting unmount closes the host.

### Usage

```tsx
{#if drawerVisible && drawerEntity}
  <EntityDrawerOpener entity={drawerEntity} onClose={handleDrawerClose} />
{/if}
```
-->

<script lang="ts">
  import { untrack } from 'svelte';
  import { drawerHost } from '$lib/components/modal/drawerHost';
  import { unwrapEntity } from '$lib/utils/entities';
  import { EntityDetails } from '.';
  import type { EntityDrawerOpenerProps } from './EntityDrawerOpener.type';

  let { entity, onClose }: EntityDrawerOpenerProps = $props();

  const key = drawerHost.newKey('entity');

  // ⚠ The host keeps rendering `content` through its close animation — i.e. AFTER this component is destroyed, when the `entity` prop already reads `undefined` (the parent's `{#if}` went false). Rendering straight from the prop crashes `EntityDetails` mid-flush, which aborts the host's close (spike 034). So the payload renders from the last defined entity, which outlives the prop.
  // svelte-ignore state_referenced_locally -- seeded once; kept current by the pre-effect below
  let shownEntity = $state.raw(entity);
  $effect.pre(() => {
    if (entity) shownEntity = entity;
  });

  // Opened once per mount; `content` and `title` read the entity reactively, so an A → B navigation that reuses this component just updates the content in the already-open drawer.
  $effect(() => {
    untrack(() =>
      drawerHost.open({
        key,
        title: () => unwrapEntity(shownEntity).entity.name,
        content,
        onDismiss: onClose,
        // Carried onto the host's dialog, reproducing what the per-route entity drawer used to carry at its call site in the results layout before 165-05 deleted it (the component name is deliberately not written here: a repository-wide search for it must return zero, which is how the deletion stays deleted).
        testId: 'voter-results-drawer'
      })
    );
    return () => drawerHost.close(key);
  });
</script>

{#snippet content()}
  <EntityDetails entity={shownEntity} class="min-h-full" />
{/snippet}
