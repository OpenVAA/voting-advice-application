<script lang="ts">
  import {concatClass} from '$lib/utils/components';
  import normalLogo from './svg/openvaa-logo-grey.svg';
  import inverseLogo from './svg/openvaa-logo-white.svg';
  import type {AppLogoProps} from './AppLogo.type';

  type $$Props = AppLogoProps;
  export let alt: $$Props['alt'];
  export let inverse: $$Props['inverse'] = false;
  export let size: $$Props['size'] = 'md';

  // Create class names
  let classes: string;
  $: {
    // Predefined sizes
    switch (size) {
      case 'sm':
        classes = 'h-20 pt-2';
        break;
      case 'lg':
        classes = 'h-32 pt-6';
        break;
      default:
        classes = 'h-24 pt-4';
    }
  }

  // TODO: Use logo files defined in Strapi.
  // TODO: Render only one image, see issue #279
</script>

<!--
@component
A template part that is used to show the application's logo. The logo 
colour changes dynamically based on whether the light or dark mode is active.

### Properties

- `alt`: The `alt` text for the logo image.
- `inverse`: If `true`, the light and dark versions of the logo will be reversed.
  Set to `true` if using the logo on a dark background. @default `false`
- `size`: The size of the logo as one of the predefined sizes 'sm', 'md' or 'lg'.
  For arbitrary values, you can supply a `class` attribute, such as 
  `class="h-[3.5rem]"`. @default `'md'`
- `class`: Additional class string to append to the element's default classes.
- Any valid attributes of the `<div>` element wrapping the light and dark
  `<img>` elements

### Usage

```tsx
<AppLogo size="lg"/>
<div class="bg-primary">
  <AppLogo inverse/>
</div>
```
-->

<div {...concatClass($$restProps, classes)}>
  <img src={normalLogo} {alt} class="h-full {inverse ? 'hidden dark:block' : 'dark:hidden'}" />
  <img src={inverseLogo} {alt} class="h-full {inverse ? 'dark:hidden' : 'hidden dark:block'}" />
</div>
