<!--@component
A compact view of an entity with its avatar, parent and possible matching score.

Used in `<ResultsPreview>` component.

### Properties

- `entity`: A possibly ranked nakedEntity, e.g. candidate or a party.
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<EntityChip content={candidate}/>
```
-->

<script lang="ts">
  import { type AnyEntityVariant, type AnyNominationVariant } from '@openvaa/data';
  import { Avatar } from '$lib/components/avatar';
  import { EntityTag } from '$lib/components/entityTag';
  import { MatchScore } from '$lib/components/matchScore';
  import { concatClass } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import type { EntityChipProps } from './EntityChip.type';

  type $$Props = EntityChipProps;

  export let entity: $$Props['entity'];

  ////////////////////////////////////////////////////////////////////
  // Parse entity
  ////////////////////////////////////////////////////////////////////

  let nakedEntity: AnyEntityVariant;
  let nomination: AnyNominationVariant | undefined;
  let match: EntityVariantMatch | undefined;

  $: ({ entity: nakedEntity, match, nomination } = unwrapEntity(entity));
</script>

<div
  {...concatClass(
    $$restProps,
    'grid content-start justify-items-center gap-xs tooltip tooltip-bottom min-w-[3rem] max-w-[3rem]'
  )}
  data-tip={nakedEntity.name}>
  <Avatar entity={nakedEntity} size="sm" />
  <!-- <div class="small-label text-center">{nakedEntity.shortName}</div> -->
  {#if nomination?.parentNomination}
    <EntityTag entity={nomination.parentNomination} variant="small" hideParent class="mt-xs" />
  {/if}
  <!-- {#if electionSymbol}
    <ElectionSymbol text={electionSymbol} />
  {/if} -->
  {#if match}
    <MatchScore size="sm" score={match.score} showLabel={false} />
  {/if}
  <slot />
</div>
