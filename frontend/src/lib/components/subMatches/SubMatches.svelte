<script lang="ts">
  import { ScoreGauge } from '$lib/components/scoreGauge';
  import { concatProps } from '$lib/utils/components';
  import type { SubMatchesProps } from './SubMatches.type';

  type $$Props = SubMatchesProps;

  export let matches: $$Props['matches'];
  export let variant: $$Props['variant'] = 'tight';
  export let scoreGaugeProps: $$Props['scoreGaugeProps'] = {};

  let style: string;
  $: style = `grid-template-columns: repeat(auto-fill, minmax(${variant === 'loose' ? 9 : 6}rem, 1fr));`;
</script>

<!--
@component
Display an entity's sub-matches.

### Properties

- `matches`: The sub-matches of a `RankingProps`.
- `variant`: Variant layout, controlling the spacing of gauges. @default `'tight'`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<SubMatches matches={ranking.subMatches}/>
```
-->

<div {...concatProps($$restProps, { class: 'grid gap-x-md gap-y-sm', style })}>
  {#each matches as { score, questionGroup }}
    <ScoreGauge
      {score}
      label={questionGroup.name ?? ''}
      color={questionGroup.color}
      colorDark={questionGroup.colorDark}
      variant="radial"
      {...scoreGaugeProps} />
  {/each}
</div>
