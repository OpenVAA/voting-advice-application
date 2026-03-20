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

<svelte:options runes />

<script lang="ts">
  import { Button } from '$lib/components/button';
  import { getComponentContext } from '$lib/contexts/component';
  import { QuestionExtendedInfoDrawer } from '.';
  import type { QuestionExtendedInfoButtonProps } from './QuestionExtendedInfoButton.type';

  let {
    question,
    onOpen = undefined,
    onSectionCollapse = undefined,
    onSectionExpand = undefined,
    ...restProps
  }: QuestionExtendedInfoButtonProps = $props();

  const { t } = getComponentContext();

  let showDrawer = $state(false);

  function handleClick(): void {
    showDrawer = true;
    onOpen?.();
  }
</script>

{#if showDrawer}
  <QuestionExtendedInfoDrawer {question} onClose={() => (showDrawer = false)} {onSectionCollapse} {onSectionExpand} />
{/if}

<Button
  text={t('components.questionExtendedInfo.title')}
  icon="info"
  iconPos="left"
  onclick={handleClick}
  {...restProps} />
