<script lang="ts">
  import {t} from '$lib/i18n';
  import {EntityList} from '$lib/components/entityList';
  import type {EntityCardProps} from '$lib/components/entityCard/EntityCard.type';

  export let subcards: EntityCardProps[];
</script>

<!--
@component
Used to show an entity's subentities in an `EntityDetails` component.

### Properties

- `subentities`: The subentities to show

### Usage

```tsx
<EntitySubentities subentities={partyCandidates} />
```
-->

{#if subcards?.length}
  <div class="-mb-[3.5rem] grow bg-base-300 px-md py-lg pb-safelgb">
    <EntityList cards={subcards} />
  </div>
{:else}
  <div class="grid place-content-center text-warning">{$t('error.default')}</div>
{/if}
