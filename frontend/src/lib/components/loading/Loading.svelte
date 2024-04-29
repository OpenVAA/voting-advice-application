<script lang="ts">
  import {t} from '$lib/i18n';
  import {concatClass} from '$lib/utils/components';
  import type {LoadingProps} from './Loading.type';

  type $$Props = LoadingProps;

  export let inline: $$Props['inline'] = false;
  export let label: $$Props['label'] = undefined;
  export let showLabel: $$Props['showLabel'] = false;
  export let size: $$Props['size'] = undefined;

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

<div {...concatClass($$restProps, classes)}>
  <span class={spinnerClass} />
  <span class="text-center" class:sr-only={!showLabel}>{label ?? $t('common.loading')}</span>
</div>
