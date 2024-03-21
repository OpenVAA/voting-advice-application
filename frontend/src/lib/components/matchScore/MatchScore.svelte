<script lang="ts">
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import type {MatchScoreProps} from './MatchScore.type';

  type $$Props = MatchScoreProps;

  export let score: $$Props['score'];
  export let label: $$Props['label'] = undefined;
</script>

<!--
@component
Display an entity's match score.

### Properties

- `score`: The match score as a `string` or a `number`. Note that if the score is a percentabe, you must include a %-sign in the `string`.
- `label`: The label to display under the score. @default `$t('components.matchScore.label')`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<MatchScore score="25%"/>
```
-->

<div {...concatClass($$restProps, 'flex min-w-[3.125rem] flex-col items-center')}>
  <span class="text-lg font-bold">{score}</span>
  {#if label !== ''}
    <span class="text-center text-xs text-secondary"
      >{label ?? $t('components.matchScore.label')}</span>
  {/if}
</div>
