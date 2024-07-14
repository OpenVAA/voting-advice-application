<script lang="ts">
  import type { MatchScoreProps } from './MatchScore.type';
  import { t } from '$lib/i18n';
  import { concatClass } from '$lib/utils/components';

  type $$Props = MatchScoreProps;

  export let score: $$Props['score'];
  export let label: $$Props['label'] = undefined;
  export let showLabel: $$Props['showLabel'] = true;
</script>

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

<div {...concatClass($$restProps, 'flex min-w-[3.125rem] flex-col items-center')}>
  <span class="text-lg font-bold">{$t('components.matchScore.score', { score })}</span>
  {#if showLabel && label !== ''}
    <span class="text-center text-xs text-secondary"
      >{label ?? $t('components.matchScore.label')}</span>
  {/if}
</div>
