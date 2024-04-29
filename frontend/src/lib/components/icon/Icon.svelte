<script lang="ts">
  import {concatProps} from '$lib/utils/components';
  import type {IconProps} from './Icon.type';
  import {ICONS} from './icons';

  type $$Props = IconProps;
  export let name: $$Props['name'];
  export let size: $$Props['size'] = 'md';
  export let color: $$Props['color'] = 'current';
  export let customColor: $$Props['customColor'] = undefined;
  export let customColorDark: $$Props['customColorDark'] = undefined;

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

  // Create styles
  let classes: string;
  let styles: string;
  $: {
    classes = 'inline-block';
    styles = '';
    // Predefined sizes
    switch (size) {
      case 'sm':
        classes += ' h-16 w-16 min-h-16 min-w-16';
        break;
      case 'lg':
        classes += ' h-32 w-32 min-h-32 min-w-32';
        break;
      default:
        classes += ' h-24 w-24 min-h-24 min-w-24';
    }
    // Set fill color
    if (customColor) {
      styles += ` --icon-color: ${customColor};`;
      classes += ' fill-[var(--icon-color)]';
      if (!customColorDark) classes += ` dark:fill-${color}`;
    }
    if (customColorDark) {
      styles += ` --icon-color-dark: ${customColorDark};`;
      classes += ' dark:fill-[var(--icon-color-dark)]';
      if (!customColor) classes += ` fill-${color}`;
    }
    if (!customColor && !customColorDark) {
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

### Properties

- `name`: the name of the icon to use
- `size`: The size of the icon as one of the predefined sizes 'sm', 'md' or 'lg'. For arbitrary values, you can supply a `class` property, such as `h-[3.15rem] w-[3.15rem]`. @default 'md'
- `color`: The color of the icon as one of the predefined colours. For arbitrary values, use the `customColor` and `customColorDark` properties. @default 'current'
- `customColor`: A custom color string to use for the icon, e.g. in case of parties, which will override the `color` property. Make sure to define both `customColor` and `customColorDark` together.
- `customColorDark`: A custom color string to use for the icon in dark mode, which will override the `color` property.
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
  {...concatProps($$restProps, {
    class: classes,
    style: styles
  })} />
