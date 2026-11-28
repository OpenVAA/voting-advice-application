<!--
@component Used to show an entity's children in an `EntityDetails` component.

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
  import { EntityList, EntityListControls } from '../entityList';
  import type { EntityCardProps } from '../entityCard';
  import type { EntityChildrenProps } from './EntityChildren.type';

  let { entities, entityType, action }: EntityChildrenProps = $props();

  const { t } = getComponentContext();

  function getCardProps(entity: MaybeWrappedEntityVariant): EntityCardProps {
    return {
      entity,
      action: action != null ? (action === false ? false : action(entity)) : undefined
    };
  }
</script>

{#snippet list(shown: Array<MaybeWrappedEntityVariant>)}
  <h3 class="m-md">
    {t(`results.${entityType}.numShown`, { numShown: shown.length })}
  </h3>
  <EntityList cards={shown.map(getCardProps)} class="mb-lg" scrollIntoView={false} />
{/snippet}

<div class="px-md py-lg pb-safelgb grow" class:bg-base-300={!!entities.length}>
  {#if entities.length}
    {#if entities.length > 5}
      <EntityListControls {entities} class="mb-md mx-10">
        {#snippet children(filtered)}
          {@render list(filtered)}
        {/snippet}
      </EntityListControls>
    {:else}
      {@render list(entities)}
    {/if}
  {:else}
    <h3 class="mb-md mt-md mx-10 text-center">
      {t(`results.${entityType}.numShown`, { numShown: 0 })}
    </h3>
  {/if}
</div>
