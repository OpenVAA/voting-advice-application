<!--
@component
A button that will display the question's extended information content in a `Drawer`.

### Properties

- `question`: The question whose expanded info to show.
- Any valid properties of a `<Button>` component

### Callback properties

- `onOpen`: A callback function to be executed when the drawer is opened, mostly for tracking.
- `onSectionCollapse`: A callback triggered when an info section is collapsed. Mostly used for tracking.
- `onSectionExpand`: A callback triggered when an info section is expanded.  Mostly used for tracking.

### Usage

```tsx
<QuestionExtendedInfoButton {question} />
```
-->

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { QuestionExtendedInfoDrawer } from '.';
  import type { QuestionExtendedInfoButtonProps } from './QuestionExtendedInfoButton.type';

  type $$Props = QuestionExtendedInfoButtonProps;

  export let question: $$Props['question'];
  export let onOpen: $$Props['onOpen'] = undefined;
  export let onSectionCollapse: $$Props['onSectionCollapse'] = undefined;
  export let onSectionExpand: $$Props['onSectionExpand'] = undefined;

  const { t } = getComponentContext();

  let showDrawer = false;

  function handleClick(): void {
    showDrawer = true;
    onOpen?.();
  }
</script>

{#if showDrawer}
  <QuestionExtendedInfoDrawer {question} onClose={() => (showDrawer = false)} {onSectionCollapse} {onSectionExpand} />
{/if}

<Button
  text={$t('components.questionExtendedInfo.title')}
  icon="info"
  iconPos="left"
  on:click={handleClick}
  {...$$restProps} />
