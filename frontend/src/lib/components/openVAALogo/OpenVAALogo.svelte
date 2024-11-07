<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { OpenVAALogoProps } from './OpenVAALogo.type';

  type $$Props = OpenVAALogoProps;
  export let title: $$Props['title'] = 'OpenVAA';
  export let color: $$Props['color'] = 'neutral';
  export let size: $$Props['size'] = 'md';

  // Create class names
  let classes: string;

  $: {
    // Predefined sizes
    switch (size) {
      case 'xs':
        classes = 'h-14 pt-1';
        break;
      case 'sm':
        classes = 'h-20 pt-2';
        break;
      case 'lg':
        classes = 'h-32 pt-6';
        break;
      default:
        classes = 'h-24 pt-4';
    }

    // Set fill color
    if (color != null) {
      classes += ` fill-${color} inline`;
    }
  }
</script>

<!--
@component
Display the OpenVAA logo. You can define the `color` and `size` of the logo using
predefined values.

The logo is rendered as a `<svg>` element, and you can also pass any valid 
attributes of one.

### Properties

- `title`: The `<title>` of the SVG logo. Functions much the same way as the `alt``
  attribute of an `<img>`.
- `color`: The color of the logo as one of the predefined colours.
  For arbitrary values, you can supply a `class` property, such as
   `fill-[#123456]`. @default `'neutral'`
- `size`: The size of the logo as one of the predefined sizes 'sm', 'md' or 'lg'.
  For arbitrary values, you can supply a `class` attribute, such as 
  `class="h-[3.5rem]"`. @default `'md'`
- Any valid attributes of a `<svg>` element

### Usage

```tsx
<OpenVAALogo/>
<OpenVAALogo color="secondary" size="sm"/>
```
-->

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 458.05 91.74" {...concatClass($$restProps, classes)}>
  {#if title}
    <title>{title}</title>
  {/if}
  <path
    d="m241.33,19.75c-3.93-.02-7.35.82-10.26,2.54-2.91,1.72-5.14,4.04-6.69,6.96l-.95-8.41-11.3-.06-.28,49.6,12.8.07.15-25.6c.03-4.53,1.2-8.06,3.51-10.58,2.31-2.52,5.27-3.77,8.87-3.75,3.67.02,6.36,1.17,8.08,3.45,1.72,2.28,2.57,5.55,2.54,9.82l-.15,26.8,12.8.07.16-28c.04-7.47-1.62-13.14-5-17.03-3.38-3.89-8.13-5.85-14.27-5.88Z" />
  <polygon points="317.44 1.01 297.21 57.8 277.74 .78 264.04 .71 289.24 70.85 304.93 70.94 330.94 1.09 317.44 1.01" />
  <path
    d="m349.69,1.21l-26,69.85,13.4.08,5.79-16.17,27.3.16,5.51,16.23,13.6.08L364.09,1.29l-14.4-.08Zm-3.25,43.78l10.27-29.04,10.03,29.16-20.3-.12Z" />
  <path
    d="m432.85,1.69l-14.4-.08-26,69.85,13.4.08,5.79-16.17,27.3.16,5.51,16.23,13.6.08L432.85,1.69Zm-17.65,43.7l10.27-29.04,10.03,29.16-20.3-.12Z" />
  <path
    d="m38.25,0C17.16,0,0,17.16,0,38.25s17.16,38.25,38.25,38.25,38.25-17.16,38.25-38.25S59.34,0,38.25,0Zm0,67c-15.85,0-28.75-12.9-28.75-28.75s12.9-28.75,28.75-28.75,28.75,12.9,28.75,28.75-12.9,28.75-28.75,28.75Z" />
  <circle cx="38.25" cy="38.25" r="17.37" transform="translate(-11.73 17.55) rotate(-22.5)" />
  <path
    d="m115.58,19.37c-6.1,0-11.7,2.1-16.13,5.62l-.93-4.85-11.4-.07-.41,71.6,12.8.07.15-25.82c4.4,3.41,9.92,5.45,15.92,5.45,14.36,0,26-11.64,26-26s-11.64-26-26-26Zm-2.05,40.45c-8.17,0-14.8-6.63-14.8-14.8s6.63-14.8,14.8-14.8,14.8,6.63,14.8,14.8-6.63,14.8-14.8,14.8Z" />
  <path
    d="m175.95,19.37c-14.36,0-26,11.64-26,26s11.64,26,26,26c11.06,0,20.51-6.91,24.26-16.65h-.58l-13-.07c-.88,1.86-2.2,3.37-3.98,4.53-1.77,1.16-3.96,1.73-6.56,1.71-3.47-.02-6.41-1.14-8.83-3.35-2.42-2.21-3.75-5.25-4-9.12l37.7.22h.77c.13-1.07.21-2.15.21-3.25,0-14.36-11.64-26-26-26Zm-12.44,21.04c.69-3.6,2.24-6.27,4.65-8.02,2.41-1.75,5.18-2.62,8.32-2.6,3.27.02,5.99,1,8.18,2.95,2.19,1.95,3.37,4.55,3.56,7.82l-24.7-.14Z" />
</svg>
