<!--
@component
A `Drawer` that displays the question's extended information.

### Properties

- `question`: The question whose expanded info to show.
- Any valid properties of a `<Drawer>` component

### Callback properties

- `onSectionCollapse`: A callback triggered when an info section is collapsed. Mostly used for tracking.
- `onSectionExpand`: A callback triggered when an info section is expanded.  Mostly used for tracking.

### Usage

```tsx
<QuestionExtendedInfoDrawer {question} onClose={() => console.info('Closed!')}/>
  ```
-->

<script lang="ts">
  import { Drawer } from '$lib/components/modal/drawer';
  import { QuestionExtendedInfo } from '$lib/components/questions';
  import type { QuestionExtendedInfoDrawerProps } from './QuestionExtendedInfoDrawer.type';

  type $$Props = QuestionExtendedInfoDrawerProps;

  export let question: $$Props['question'];
  export let onSectionCollapse: $$Props['onSectionCollapse'] = undefined;
  export let onSectionExpand: $$Props['onSectionExpand'] = undefined;
</script>

<Drawer title={question.text} autofocusId={false} {...$$restProps}>
  <QuestionExtendedInfo {question} {onSectionCollapse} {onSectionExpand} class="p-lg" />
</Drawer>
