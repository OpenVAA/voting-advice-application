<!--
@component
Used to display a loading spinner with an optionally visible text label.

### Properties

- `inline`: Whether to show an inline version of the spinner. By default the spinner tries to center itself in the available area. Default: `false`
- `label`: The label text. Default: `t('common.loading')`
- `showLabel`: Whether to show the text label. The label will always be shown to screen readers. Default: `false`
- `size`: The size of the loading spinner. Default: `'lg'`
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

  let { inline = false, label, showLabel = false, size, ...restProps }: LoadingProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { t } = getComponentContext();

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  const classes = $derived(
    'text-secondary ' +
      (inline
        ? 'inline-flex flex-row align-bottom gap-sm'
        : 'flex flex-col items-center justify-center h-full w-full gap-md')
  );
  const spinnerClass = $derived.by(() => {
    let cls = 'loading loading-spinner ';
    switch (size) {
      case 'xs':
        cls += 'loading-xs';
        break;
      case 'sm':
        cls += 'loading-sm';
        break;
      case 'md':
        cls += 'loading-md';
        break;
      case 'lg':
      default:
        cls += 'loading-lg';
    }
    return cls;
  });
</script>

<div data-testid="loading-indicator" {...concatClass(restProps, classes)}>
  <span class={spinnerClass}></span>
  <span class="text-center" class:sr-only={!showLabel}>{label ?? t('common.loading')}</span>
</div>
