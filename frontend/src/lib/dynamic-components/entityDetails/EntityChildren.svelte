<!--
@component
Used to show an entity's children in an `EntityDetails` component.

### Properties

- `entities`: An array of possibly ranked entities, e.g. a party’s candidates.
- `entityType`: The type of the entities being displayed. Used to pick correct translations
- `action`: An optional callback for building the card actions for the child possible entities. If nullish, the default action filled in by `EntityCard` will be used. If `false`, no actions will be added.

### Usage

```tsx
<EntityChildren entities={organizationNomination.nominatedCandidates} />
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { EntityList } from '$lib/dynamic-components/entityList';
  import { EntityListControls } from '../entityList';
  import type { EntityType } from '@openvaa/data';
  import type { CardAction, EntityCardProps } from '../entityCard';

  export let entities: Array<MaybeWrappedEntityVariant>;
  export let entityType: EntityType;
  export let action: ((entity: MaybeWrappedEntityVariant) => CardAction) | false | null | undefined = undefined;

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

<div class="-mb-[3.5rem] grow px-md py-lg pb-safelgb" class:bg-base-300={!!entities.length}>
  {#if entities.length}
    <h3 class="mx-10 mb-md mt-md">
      {$t(`results.${entityType}.numShown`, { numShown: filteredEntities.length })}
      {#if filteredEntities.length !== entities.length}
        <span class="font-normal text-secondary">{$t('results.numTotal', { numTotal: entities.length })}</span>
      {/if}
    </h3>
    {#if entities.length > 5}
      <EntityListControls {entities} onUpdate={(results) => (filteredEntities = results)} class="mx-10 mb-md" />
    {/if}
    <EntityList cards={filteredEntities.map(getCardProps)} class="mb-lg" />
  {:else}
    <h3 class="mx-10 mb-md mt-md text-center">
      {$t(`results.${entityType}.numShown`, { numShown: 0 })}
    </h3>
  {/if}
</div>
