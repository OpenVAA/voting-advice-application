<!--
@component
Used to display an `Entity` as small tag including an icon.

### Properties

- `entity`: A possibly wrapped entity, e.g. candidate or a party.
- `variant`: Whether to use an abbreviation or the full name. Default: `'default'`
- `hideParent`: Whether to hide the possible parent nomination. Default: `false`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<EntityTag entity={organization}/>
<EntityTag entity={nomination.parentNomination} variant="short"/>
```
-->

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { concatClass } from '$lib/utils/components';
  import { unwrapEntity } from '$lib/utils/entities';
  import type { AnyEntityVariant, EntityType } from '@openvaa/data';
  import type { IconName } from '$lib/components/icon';
  import type { EntityTagProps } from './EntityTag.type';

  type $$Props = EntityTagProps;

  export let entity: $$Props['entity'];
  export let variant: $$Props['variant'] = 'default';
  export let hideParent: $$Props['hideParent'] = undefined;

  let nakedEntity: AnyEntityVariant;
  $: ({ entity: nakedEntity, nomination } = unwrapEntity(entity));

  const ICONS: Record<EntityType, IconName> = {
    alliance: 'alliance',
    candidate: 'candidate',
    faction: 'candidates',
    organization: 'party'
  };
</script>

<div {...concatClass($$restProps, 'flex flex-row items-center gap-xs font-bold')}>
  <Icon
    name={ICONS[nakedEntity.type]}
    customColor={nakedEntity.color?.normal}
    customColorDark={nakedEntity.color?.dark} />
  <!--
    Entity names are author-supplied, so the text keeps `dir="auto"` to render its own script
    correctly. But the wrapped lines must align toward the adjacent icon, which follows the UI
    direction — so alignment is gated on the UI direction, not the text's auto direction. A plain
    `text-start`/`text-end` would resolve against the span's own auto direction and could point a
    Latin name away from the icon in an RTL UI. `rtl:text-right` keys off the root `dir="rtl"`,
    pinning the lines to the icon side under RTL while LTR keeps the default start alignment.
  -->
  <span dir="auto" class="text-start rtl:text-right">
    {#if variant === 'short'}
      {nakedEntity.shortName}
    {:else if variant === 'full' && nakedEntity.shortName !== nakedEntity.name}
      {nakedEntity.name} ({nakedEntity.shortName})
    {:else}
      {nakedEntity.name}
    {/if}
  </span>
  {#if !hideParent && nomination?.parentNomination}
    <svelte:self entity={nomination?.parentNomination} variant="short" />
  {/if}
</div>
