<!--
@component
Used to show an entity's children in an `EntityDetails` component.

### Properties

- `entities`: An array of possibly ranked entities, e.g. a party's candidates.
- `entityType`: The type of the entities being displayed. Used to pick correct translations.
- `action`: An optional callback for building the card actions for the child possible entities. If nullish, the default action filled in by `EntityCard` will be used. If `false`, no actions will be added.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<EntityChildren entities={organizationNomination.nominatedCandidates} />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { EntityList } from '$lib/dynamic-components/entityList';
  import { EntityListControls } from '../entityList';
  import type { EntityCardProps } from '../entityCard';
  import type { EntityChildrenProps } from './EntityChildren.type';

  type $$Props = EntityChildrenProps;

  export let entities: $$Props['entities'];
  export let entityType: $$Props['entityType'];
  export let action: $$Props['action'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Filters
  ////////////////////////////////////////////////////////////////////

  // This will hold the filtered entities returned by EntityListControls
  let filteredEntities = entities;

  ////////////////////////////////////////////////////////////////////
  // Create card props
  ////////////////////////////////////////////////////////////////////

  /**
   * Create `EntityCard` properties for an `Entity`.
   */
  function getCardProps(entity: MaybeWrappedEntityVariant): EntityCardProps {
    return {
      entity,
      action: action != null ? (action === false ? false : action(entity)) : undefined
    };
  }
</script>

<div class="grow px-md py-lg pb-safelgb" class:bg-base-300={!!entities.length}>
  {#if entities.length}
    <h3 class="m-md">
      {$t(`results.${entityType}.numShown`, { numShown: filteredEntities.length })}
    </h3>
    {#if entities.length > 5}
      <EntityListControls {entities} onUpdate={(results) => (filteredEntities = results)} class="mx-10 mb-md" />
    {/if}
    <EntityList cards={filteredEntities.map(getCardProps)} class="mb-lg" scrollIntoView={false} />
  {:else}
    <h3 class="mx-10 mb-md mt-md text-center">
      {$t(`results.${entityType}.numShown`, { numShown: 0 })}
    </h3>
  {/if}
</div>
