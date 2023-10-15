<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {AppLogoProps} from './AppLogo.type';

  type $$Props = AppLogoProps;
  export let inverse: $$Props['inverse'] = false;

  // TODO: Use logo files defined in Strapi.
  // TODO: Add a size = 'sm' | 'md' | 'lg' ... prop.
  // TODO: Possibly apply restProps to the imgs instead of the div.
</script>

<!--
@component
Used to show the application's logo.

### Properties

- `inverse` Optional boolean. If `true`, the light and dark versions of the 
  logo will be reversed. Set to `true` if using the logo on a dark background.
- Any valid attributes of a `div` element.

### Usage

```tsx
<AppLogo/>
```
-->

<div {...$$restProps}>
  <img
    src="/images/openvaa-logo-grey.svg"
    alt={$_('header.logoAlt')}
    class="mt-4 h-20 {inverse ? 'hidden dark:block' : 'dark:hidden'}" />
  <img
    src="/images/openvaa-logo-white.svg"
    alt={$_('header.logoAlt')}
    class="mt-4 h-20 {inverse ? 'dark:hidden' : 'hidden dark:block'}" />
</div>
