<script lang="ts">
  import type {IconProps} from './Icon.type';

  type $$Props = IconProps;
  export let size: $$Props['size'] = 'md';
  export let fill: $$Props['fill'] = 'current';
  export let stroke: $$Props['stroke'] = undefined;
  export let desc: $$Props['desc'] = undefined;
  export let title: $$Props['title'] = undefined;

  // Create class names
  let classes = 'inline w-auto';

  // Predefined sizes
  switch (size) {
    case 'sm':
      classes += ' h-16';
      break;
    case 'lg':
      classes += ' h-32';
      break;
    default:
      classes += ' h-24';
  }

  // Colors
  // NB. We need to spell these out because otherwise Tailwind won't compile them
  const fills = {
    current: 'fill-current',
    primary: 'fill-primary',
    secondary: 'fill-secondary',
    accent: 'fill-accent',
    neutral: 'fill-neutral',
    'base-100': 'fill-base-100',
    'base-200': 'fill-base-200',
    'base-300': 'fill-base-300',
    info: 'fill-info',
    success: 'fill-success',
    warning: 'fill-warning',
    error: 'fill-error',
    'base-content': 'fill-base-content',
    'primary-content': 'fill-primary-content',
    'secondary-content': 'fill-secondary-content',
    'accent-content': 'fill-accent-content',
    'info-content': 'fill-info-content',
    'success-content': 'fill-success-content',
    'warning-content': 'fill-warning-content',
    'error-content': 'fill-error-content'
  };
  const strokes = {
    current: 'stroke-current',
    primary: 'stroke-primary',
    secondary: 'stroke-secondary',
    accent: 'stroke-accent',
    neutral: 'stroke-neutral',
    'base-100': 'stroke-base-100',
    'base-200': 'stroke-base-200',
    'base-300': 'stroke-base-300',
    info: 'stroke-info',
    success: 'stroke-success',
    warning: 'stroke-warning',
    error: 'stroke-error',
    'base-content': 'stroke-base-content',
    'primary-content': 'stroke-primary-content',
    'secondary-content': 'stroke-secondary-content',
    'accent-content': 'stroke-accent-content',
    'info-content': 'stroke-info-content',
    'success-content': 'stroke-success-content',
    'warning-content': 'stroke-warning-content',
    'error-content': 'stroke-error-content'
  };

  if (fill != null) {
    classes += ` ${fills[fill]}`;
  }
  if (stroke != null) {
    classes += ` ${strokes[stroke]}`;
  }

  // Merge classes into $$restProps
  $$restProps.class = `${classes} ${$$restProps.class ?? ''}`;
</script>

<!--
@component
An abstract template for creating SVG icon components. See 
`$lib/components/icons` for examples.

The content of the component becomes the content of the `svg` element.

Use the properties to set the size of the icon, the fill and stroke colors and
the `desc` and `title` of the icon. You can also pass any valid attributes to 
the `svg` element.

### Properties

- See `Icon.type.ts` or code completion info.

### Slots

- default: content for the `svg` element (in addition to `desc` and `title`).

### Usage

```tsx
  <Icon size="lg" fill="primary" aria-hidden="true">
    <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
  </Icon>
```
-->

<svg viewBox="0 0 24 24" {...$$restProps}>
  {#if desc}<desc>{desc}</desc>{/if}
  {#if title}<title>{title}</title>{/if}
  <slot />
</svg>
