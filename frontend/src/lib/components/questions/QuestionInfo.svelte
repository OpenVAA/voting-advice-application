<script lang="ts">
  import {t} from '$lib/i18n';
  import {Expander} from '$lib/components/expander';
  import type {QuestionInfoProps} from './QuestionInfo.type';

  type $$Props = QuestionInfoProps;

  export let info: $$Props['info'];
</script>

<!--
@component
Display the question's expandable information content.

### Properties

- `info`: The info text of the question
- Any valid properties of an `<Expander>` component

### Usage

```tsx
<QuestionInfo {info}/>
```
-->

<Expander title={$t('questions.readMore')} {...$$restProps}>
  {info}
</Expander>
