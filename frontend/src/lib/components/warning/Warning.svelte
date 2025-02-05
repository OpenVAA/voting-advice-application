<!--
@component
A simple warning component to be used with BasicPage

### Properties

- Any valid attributes of a `div` element.

### Usage

```tsx
<Warning>
  Caveat emptor!
</Warning>
```
-->

<script lang="ts">
  import { Icon } from '$lib/components/icon';
  import { concatClass } from '$lib/utils/components';
  import type { WarningProps } from './Warning.type';

  /* eslint-disable @typescript-eslint/no-unused-vars */
  type $$Props = WarningProps;
</script>

<div {...concatClass($$restProps, 'flex items-start gap-6 text-warning')}>
  <div>
    <Icon name="warning" />
  </div>
  <div class="flex-grow text-left">
    <slot />
  </div>
</div>
