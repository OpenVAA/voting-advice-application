<script lang="ts">
  import type { PartyTagProps } from './PartyTag.type';
  import { Icon } from '$lib/components/icon';
  import { concatClass } from '$lib/utils/components';

  type $$Props = PartyTagProps;

  export let party: $$Props['party'];
  export let variant: $$Props['variant'] = 'default';
</script>

<!--
@component
Used to display a party tag with an icon.

### Properties

- `party`: The Party object.
- `variant`: Whether to use an abbreviation or the full name. @default `'default'`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<PartyTag party={candidate.party}/>
<PartyTag party={candidate.party} variant="short"/>
```
-->

<div {...concatClass($$restProps, 'flex flex-row items-center gap-xs font-bold')}>
  <Icon
    name="party"
    customColor={party.color || undefined}
    customColorDark={party.colorDark || undefined} />
  <span>
    {#if variant === 'short'}
      {party.shortName}
    {:else if variant === 'full'}
      {party.name} ({party.shortName})
    {:else}
      {party.name}
    {/if}
  </span>
</div>
