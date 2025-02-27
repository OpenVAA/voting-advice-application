<!--
@component
A template part that is used to show the application's logo. The logo colour changes dynamically based on whether the light or dark mode is active.

Logo files for use on a light and a dark background can be defined. If the latter is not supplied an `invert` filter will be applied. If no logo files are supplied, the OpenVAA logo will be used.

### Dynamic component

- Access `AppContext` to get `appCustomization`.

### Properties

- `alt`: The `alt` text for the logo image.
- `inverse`: If `true`, the light and dark versions of the logo will be reversed. Set to `true` if using the logo on a dark background. @default `false`
- `size`: The size of the logo as one of the predefined sizes 'sm', 'md' or 'lg'. For arbitrary values, you can supply a `class` attribute, such as `class="h-[3.5rem]"`. @default `'md'`
- `class`: Additional class string to append to the element's default classes.
- Any valid attributes of the `<div>` element wrapping the light and dark `<img>` elements

### Usage

```tsx
<AppLogo size="lg"/>
<div class="bg-primary">
  <AppLogo inverse/>
</div>
```
-->

<script lang="ts">
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import type { AppLogoProps } from './AppLogo.type';

  type $$Props = AppLogoProps;

  export let alt: $$Props['alt'] = undefined;
  export let inverse: $$Props['inverse'] = false;
  export let size: $$Props['size'] = 'md';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, t } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Get logo image
  ////////////////////////////////////////////////////////////////////

  // Retrieve app logo from settings
  let logoSrc: string | undefined;
  let inverseSrc: string | undefined;
  $: if ($appCustomization.publisherLogo) {
    logoSrc = $appCustomization.publisherLogo.url;
    inverseSrc = $appCustomization.publisherLogo.urlDark ?? $appCustomization.publisherLogo.url;
    alt ??= $appCustomization.publisherName;
  }

  // Check dark mode and select logo file
  let src: string | undefined;
  $: if (logoSrc) {
    if (inverseSrc) {
      // If we have both the normal and inverseSrc defined, select one of them
      src = ($darkMode && !inverse) || (!$darkMode && inverse) ? inverseSrc : logoSrc;
    } else {
      // If we only have the normalSrc defined, we'll later add a filter
      src = logoSrc;
    }
  } else {
    src = undefined;
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  // Create class names
  let classes: string;
  $: {
    // Predefined sizes
    switch (size) {
      case 'sm':
        classes = 'h-20';
        break;
      case 'lg':
        classes = 'h-32';
        break;
      default:
        classes = 'h-24';
    }
    // Use invert filter if we have a normal logo file but no inverse one
    if (logoSrc && !inverseSrc) classes += inverse ? ' invert dark:invert-0' : ' dark:invert';
  }
</script>

<div {...concatClass($$restProps, classes)}>
  {#if src}
    <img {src} alt={alt ?? $appCustomization.publisherName ?? ''} class="h-full" />
  {:else}
    {#await import('$lib/components/openVAALogo') then { OpenVAALogo }}
      <svelte:component
        this={OpenVAALogo}
        title={alt ?? $t('common.openVAA')}
        {size}
        color={inverse ? 'primary-content' : 'neutral'} />
    {/await}
  {/if}
</div>
