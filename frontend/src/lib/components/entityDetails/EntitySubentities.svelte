<script lang="ts">
  import type { EntityCardProps } from '$lib/components/entityCard/EntityCard.type';
  import { EntityList } from '$lib/components/entityList';
  import { t } from '$lib/i18n';

  export let subcards: Array<EntityCardProps>;
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
