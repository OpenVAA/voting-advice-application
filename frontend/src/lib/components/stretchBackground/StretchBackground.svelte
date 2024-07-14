<script lang="ts">
  import type { StretchBackgroundProps } from './StretchBackground.type';
  import { concatClass } from '$lib/utils/components';

  type $$Props = StretchBackgroundProps;

  export let bgColor: $$Props['bgColor'] = undefined;
  export let padding: $$Props['padding'] = 'default';
  export let toBottom: $$Props['toBottom'] = false;

  let classes: string;
  let paddingClasses: string;

  $: {
    classes = 'w-screen flex flex-col items-center';
    paddingClasses = 'match-w-xl:px-0';
    switch (padding) {
      case 'none':
        break;
      case 'medium':
        paddingClasses += ' pl-safemdl pr-safemdr pt-md pb-safemdb';
        break;
      default:
        paddingClasses += ' pl-safelgl pr-safelgr pt-lg pb-safelgb';
    }
    if (bgColor != null) classes += ` bg-${bgColor}`;
    if (toBottom) classes += ' -mb-lg pb-lg';
  }
</script>

<!--
@component
Used to display a full-width background color while maintaining the usual maximum width for the contents.

### Properties

- `bgColor`: Optional named background color for the section.
- `padding`: The padding to apply to the contents with `default` matching the padding used on the basic page template. @default `'default'`
- Any valid attributes of a `<div>` element.

### Slots

- default: The contents on the background.

### Usage

```tsx
<StretchBackground bgColor="base-200">
  <h2>This text is on an edge-to-edge background.</h2>
</StretchBackground>
```
-->

<div {...concatClass($$restProps, classes)}>
  <div class="flex w-full max-w-xl flex-col items-stretch {paddingClasses}">
    <slot />
  </div>
</div>
