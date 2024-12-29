<!--
@component
Used to display a loading spinner with an optionally visible text label.

### Properties

- `inline`: Whether to show an inline version of the spinner. By default the spinner tries to center itself in the available area. @default `false`
- `label`: he label text. @default `$t('common.loading')`
- `showLabel`: Whether to show the text label. The label will always be shown to screen readers. @default `false`
- `size`: The size of the loading spinner. @default `'lg'`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<Loading/>
<Loading size="md"/>
<Loading showLabel label="Loading custom stuff…"/>
```
-->

<script lang="ts">
  import { getComponentContext } from '$lib/contexts/component';
  import { concatClass } from '$lib/utils/components';
  import type { LoadingProps } from './Loading.type';

  type $$Props = LoadingProps;

  export let inline: $$Props['inline'] = false;
  export let label: $$Props['label'] = undefined;
  export let showLabel: $$Props['showLabel'] = false;
  export let size: $$Props['size'] = undefined;

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  let classes = 'text-secondary ';
  classes += inline
    ? 'inline-flex flex-row align-bottom gap-sm'
    : 'flex flex-col items-center justify-center h-full w-full gap-md';
  let spinnerClass = 'loading loading-spinner ';
  switch (size) {
    case 'xs':
      spinnerClass += 'loading-xs';
      break;
    case 'sm':
      spinnerClass += 'loading-sm';
      break;
    case 'md':
      spinnerClass += 'loading-md';
      break;
    case 'lg':
    default:
      spinnerClass += 'loading-lg';
  }
</script>

<div {...concatClass($$restProps, classes)}>
  <span class={spinnerClass} />
  <span class="text-center" class:sr-only={!showLabel}>{label ?? $t('common.loading')}</span>
</div>
