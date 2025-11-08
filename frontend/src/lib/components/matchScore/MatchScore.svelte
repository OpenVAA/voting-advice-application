<!--
@component
Display an entity's match score.

### Properties

- `score`: The match score as a `string` or a `number`. Note that `$t('components.matchScore.label')` will be used display the score.
- `label`: The label to display under the score. @default `$t('components.matchScore.label')`
- `size`: The size of the score. @default `'lg'`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<MatchScore score="25%"/>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import { slide } from 'svelte/transition';
  import type { MatchScoreProps } from './MatchScore.type';
  import { DELAY } from '$lib/utils/timing';

  type $$Props = MatchScoreProps;

  export let score: $$Props['score'];
  export let label: $$Props['label'] = undefined;
  export let showLabel: $$Props['showLabel'] = true;
  export let size: $$Props['size'] = undefined;

  const { t } = getComponentContext();
</script>

<div {...concatClass($$restProps, `flex ${size === 'sm' ? '' : 'min-w-[3.125rem]'} flex-col items-center`)}>
  {#key score}
    <span class="font-bold" class:text-lg={size !== 'sm'} transition:slide={{ duration: DELAY.sm }}
      >{$t('components.matchScore.score', { score })}</span>
  {/key}
  {#if showLabel && label !== ''}
    <span class="text-secondary text-center text-xs">{label ?? $t('components.matchScore.label')}</span>
  {/if}
</div>
