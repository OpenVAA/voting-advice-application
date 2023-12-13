<script lang="ts">
  import {concatClass} from '$lib/utils/components';
  import type {IconProps} from './Icon.type';
  import {ICONS} from './icons';

  type $$Props = IconProps;
  export let name: $$Props['name'];
  export let size: $$Props['size'] = 'md';
  export let color: $$Props['color'] = 'current';

  // Load svg contents
  let svgElement: SVGElement;
  // Pass svgElement and name explicitly to trigger correct reactivity
  $: loadSvg(svgElement, name);

  function loadSvg(svgElement: SVGElement, name: $$Props['name']) {
    if (!svgElement || !name) return;
    // Validate name and split path
    // We need this part-wise approach because of Vite's dynamic import limitations
    // https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
    const [folder, filename] = name in ICONS ? ICONS[name] : ['custom', 'missing_icon'];
    import(`./svg/${folder}/${filename}.ts`).then((svg) => (svgElement.innerHTML = svg.default));
  }

  // Create class names
  let classes: string;
  $: {
    classes = 'inline-block';
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
  }
</script>

<!--
@component
An icon component, where the `name` property defines which icon to use.

Use the other properties to set the size and color of the icon. The icon
is `aria-hidden` by default, but that can overriden. You can also pass 
any valid attributes of the `<svg>` element.

NB! The component does not currently support reactive updates to `name`,
`size` or `color`. Use within a `#key` block if you need to change these.

### Properties

- `name`: the name of the icon to use
- `size`: The size of the icon as one of the predefined sizes 'sm', 'md' or 'lg'.
   For arbitrary values, you can supply a `class` property, such as 
   `h-[3.15rem] w-[3.15rem]`. @default 'md'
- `color`: The color of the icon as one of the predefined colours.
   For arbitrary values, you can supply a `class` property, such as
   `fill-[#123456]`. @default 'current'
- `aria-hidden`: @default `true`
- `role`: Aria role @default `img`
- `class`: Additional class string to append to the element's default classes.
- Any valid attributes of a `<svg>` element

### Usage

```tsx
<Icon name="addToList"/>
<Icon name="opinion" color="primary" size="lg"
 aria-hidden="false" aria-label="Add candidate to your list"/>
```
-->

<svg
  bind:this={svgElement}
  aria-hidden="true"
  role="img"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  {...concatClass($$restProps, classes)} />
