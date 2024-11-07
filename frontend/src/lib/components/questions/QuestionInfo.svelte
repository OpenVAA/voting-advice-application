<script lang="ts">
  import { Expander } from '$lib/components/expander';
  import { t } from '$lib/i18n';
  import { startEvent } from '$lib/utils/analytics/track';
  import type { QuestionInfoProps } from './QuestionInfo.type';

  type $$Props = QuestionInfoProps;

  export let info: $$Props['info'];
</script>

<!--
@component
Display the question's expandable information content.

### Properties

- `info`: The info text of the question
- Any valid properties of an `<Expander>` component

### Tracking events

- `questionInfo_collapse`
- `questionInfo_expand`

### Usage

```tsx
<QuestionInfo {info}/>
```
-->

<Expander
  on:collapse={() => startEvent('questionInfo_collapse')}
  on:expand={() => startEvent('questionInfo_expand')}
  title={$t('common.readMore')}
  {...$$restProps}>
  {info}
</Expander>
