<svelte:options runes />

<!--
@component
A `Drawer` that displays `EntityDetails`.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- Any valid properties of a `<Drawer>` component

### Usage

```tsx
<EntityDetailsDrawer {entity} onClose={() => console.info('Closed!')}/>
  ```
-->

<script lang="ts">
  import { Drawer } from '$lib/components/modal/drawer';
  import { concatClass } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import { EntityDetails } from '.';
  import type { EntityDetailsDrawerProps } from './EntityDetailsDrawer.type';

  let { entity, ...restProps }: EntityDetailsDrawerProps = $props();

  const { entity: nakedEntity } = unwrapEntity(entity);
</script>

<Drawer title={nakedEntity.name} {...concatClass(restProps, '!p-0')}>
  <EntityDetails {entity} class="min-h-full" />
</Drawer>
