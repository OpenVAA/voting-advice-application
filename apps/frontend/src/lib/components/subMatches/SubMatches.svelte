<!--
@component
Display an entity's sub-matches.

### Properties

- `matches`: The `SubMatch`es of a `Match`.
- `variant`: Variant layout, controlling the spacing of gauges. @default `'tight'`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<SubMatches matches={ranking.subMatches}/>
```
-->

<svelte:options runes />

<script lang="ts">
  import { ScoreGauge } from '$lib/components/scoreGauge';
  import { concatClass } from '$lib/utils/components';
  import type { SubMatchesProps } from './SubMatches.type';

  let { matches, variant = 'tight', scoreGaugeProps = {}, ...restProps }: SubMatchesProps = $props();

  let gridStyle = $derived(`grid-template-columns: repeat(auto-fill, minmax(${variant === 'loose' ? 9 : 6}rem, 1fr));`);
</script>

<div {...concatClass(restProps, 'grid gap-x-md gap-y-sm')} style={gridStyle}>
  {#each matches as { score, questionGroup }}
    <ScoreGauge {score} label={questionGroup.name} color={questionGroup.color} variant="radial" {...scoreGaugeProps} />
  {/each}
</div>
