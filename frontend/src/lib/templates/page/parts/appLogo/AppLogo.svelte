<script lang="ts">
  import normalLogo from './svg/openvaa-logo-grey.svg';
  import inverseLogo from './svg/openvaa-logo-white.svg';
  import type {AppLogoProps} from './AppLogo.type';

  type $$Props = AppLogoProps;
  export let alt: $$Props['alt'];
  export let inverse: $$Props['inverse'] = false;
  export let size: $$Props['size'] = 'md';

  // Create class names
  let classes: string;

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

  // Merge classes into restProps
  $$restProps.class = `${classes} ${$$restProps.class ?? ''}`;

  // TODO: Use an if block that uses a media query to select the logo
  // file to show
  // TODO: Use logo files defined in Strapi.
  // TODO: Possibly allow passing props directly to the img elements
</script>

<!--
@component
A template part used to show the application's logo. The logo colour changes 
dynamically based on whether the light or dark mode is active.

### Properties

- `alt`: The `alt` text for the logo image.
- `inverse`: If `true`, the light and dark versions of the logo will be reversed.
  Set to `true` if using the logo on a dark background.
- `size`: The size of the logo as one of the predefined sizes 'sm', 'md' or 'lg'.
  For arbitrary values, you can supply a `class` attribute, such as 
  `class="h-[3.5rem]"`.
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

<div {...$$restProps}>
  <img src={normalLogo} {alt} class="h-full {inverse ? 'hidden dark:block' : 'dark:hidden'}" />
  <img src={inverseLogo} {alt} class="h-full {inverse ? 'dark:hidden' : 'hidden dark:block'}" />
</div>
