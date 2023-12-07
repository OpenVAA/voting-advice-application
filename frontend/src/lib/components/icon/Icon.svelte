<script lang="ts">
  import {onMount} from 'svelte';
  import type {IconProps} from './Icon.type';
  import {ICONS} from './icons';

  type $$Props = IconProps;
  export let name: $$Props['name'];
  export let size: $$Props['size'] = 'md';
  export let color: $$Props['color'] = 'current';

  // Validate name and split path
  // We need this part-wise approach because of Vite's dynamic import limitations
  // https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
  const [folder, filename] = name in ICONS ? ICONS[name] : ['custom', 'missing_icon'];

  // Load svg contents
  let svgElement: SVGElement;
  // The import happens inside onMount to make sure the SVG element is available
  onMount(() =>
    import(`./svg/${folder}/${filename}.ts`).then((svg) => {
      if (svgElement) {
        svgElement.innerHTML = svg.default;
      }
    })
  );

  // Create class names
  let classes = 'inline-block';

  // Predefined sizes
  switch (size) {
    case 'sm':
      classes += ' h-16 w-16';
      break;
    case 'lg':
      classes += ' h-32 w-32';
      break;
    default:
      classes += ' h-24 w-24';
  }

  // Set fill color
  if (color != null) {
    classes += ` fill-${color}`;
  }

  // Merge classes into $$restProps
  $$restProps.class = `${classes} ${$$restProps.class ?? ''}`;
</script>

<!--
@component
An icon component, where the `name` property defines which icon to use.

Use the other properties to set the size and color of the icon. The icon
is `aria-hidden` by default, but that can overriden. You can also pass 
any valid attributes of the `<svg>` element.

### Properties

- See `Icon.type.ts` or code completion info.

### Usage

```tsx
<Icon name="addToList"/>
<Icon name="opinion" color="primary" size="lg"
 aria-hidden="false" aria-label="Add candidate to your list"/>
```
-->

<svg
  bind:this={svgElement}
  role="img"
  aria-hidden="true"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  {...$$restProps} />
