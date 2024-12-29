<!--
@component
Display an entity's match score.

### Properties

- `score`: The match score as a `string` or a `number`. Note that `$t('components.matchScore.label')` will be used display the score.
- `label`: The label to display under the score. @default `$t('components.matchScore.label')`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<MatchScore score="25%"/>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { MatchScoreProps } from './MatchScore.type';

  type $$Props = MatchScoreProps;

  export let score: $$Props['score'];
  export let label: $$Props['label'] = undefined;
  export let showLabel: $$Props['showLabel'] = true;

  const { t } = getComponentContext();
</script>

<div {...concatClass($$restProps, 'flex min-w-[3.125rem] flex-col items-center')}>
  <span class="text-lg font-bold">{$t('components.matchScore.score', { score })}</span>
  {#if showLabel && label !== ''}
    <span class="text-center text-xs text-secondary">{label ?? $t('components.matchScore.label')}</span>
  {/if}
</div>
