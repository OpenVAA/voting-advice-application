<script lang="ts">
  import {concatClass} from '$lib/utils/components';
  import type {QuestionOpenAnswerProps} from './QuestionOpenAnswer.type';

  type $$Props = QuestionOpenAnswerProps;
</script>

<!--
@component
Display a Candidate's or Party's open answer to a question.

### Properties

- Any valid properties of an `<Expander>` component

### Slots

- default: The open answer

### Usage

```tsx
<QuestionOpenAnswer>{openAnswer}</QuestionOpenAnswer>
```
-->

<div
  {...concatClass(
    $$restProps,
    'mt-16 rounded-md bg-base-200 p-md text-center before:content-[open-quote] after:content-[close-quote]'
  )}>
  <slot />
</div>
