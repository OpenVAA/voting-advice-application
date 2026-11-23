<!--
@component A template part that is used to show the application's logo. The logo colour changes dynamically based on whether the light or dark mode is active.

The logo is the backend's publisher logo when one is set, otherwise `staticSettings.logo` (set by an instance overlay), otherwise the OpenVAA logo. Logo files for use on a light and a dark background can be defined. If the latter is not supplied an `invert` filter will be applied.

### Dynamic component

- Access `AppContext` to get `appCustomization`.
- Read `staticSettings` to get the static fallback `logo`.

### Properties

- `alt`: The `alt` text for the logo image. If missing, the publisher name is used; failing that, the application name for the static logo or 'OpenVAA' for the OpenVAA logo.
- `inverse`: If `true`, the light and dark versions of the logo will be reversed. Set to `true` if using the logo on a dark background. Default: `false`
- `size`: The size of the logo as one of the predefined sizes 'sm', 'md' or 'lg'. For arbitrary values, you can supply a `class` attribute, such as `class="h-[3.5rem]"`. Default: `'md'`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<AppLogo size="lg"/>
<div class="bg-primary">
  <AppLogo inverse/>
</div>
```
-->

<script lang="ts">
  import { staticSettings } from '@openvaa/app-shared';
  import { getAppContext } from '$lib/contexts/app';
  import { concatClass } from '$lib/utils/components';
  import type { AppLogoProps } from './AppLogo.type';

  let { alt, inverse = false, size = 'md', ...restProps }: AppLogoProps = $props();

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const { appCustomization, darkMode, t } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Get logo image
  ////////////////////////////////////////////////////////////////////

  // The backend's publisher logo, otherwise the static fallback logo
  const isStaticTier = $derived(!appCustomization.current.publisherLogo?.url && !!staticSettings.logo?.url);
  const logo = $derived(isStaticTier ? staticSettings.logo : appCustomization.current.publisherLogo);
  const logoSrc = $derived(logo?.url);
  const inverseSrc = $derived(logo?.urlDark ?? logo?.url);
  const effectiveAlt = $derived(
    alt ?? appCustomization.current.publisherName ?? (isStaticTier ? t('dynamic.appName') : undefined)
  );

  // Check dark mode and select logo file
  const src = $derived.by(() => {
    if (logoSrc) {
      if (inverseSrc) {
        // If we have both the normal and inverseSrc defined, select one of them
        return (darkMode.current && !inverse) || (!darkMode.current && inverse) ? inverseSrc : logoSrc;
      } else {
        // If we only have the normalSrc defined, we'll later add a filter
        return logoSrc;
      }
    }
    return undefined;
  });

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  // Create class names
  const classes = $derived.by(() => {
    let c: string;
    // Predefined sizes
    switch (size) {
      case 'sm':
        c = 'h-20';
        break;
      case 'lg':
        c = 'h-32';
        break;
      default:
        c = 'h-24';
    }
    // Use invert filter if we have a normal logo file but no inverse one
    if (logoSrc && !inverseSrc) c += inverse ? ' invert dark:invert-0' : ' dark:invert';
    return c;
  });
</script>

<div {...concatClass(restProps, classes)}>
  {#if src}
    <img {src} alt={effectiveAlt ?? ''} class="h-full" />
  {:else}
    {#await import('$lib/components/openVAALogo') then { OpenVAALogo }}
      <OpenVAALogo title={effectiveAlt ?? t('common.openVAA')} {size} color={inverse ? 'primary-content' : 'neutral'} />
    {/await}
  {/if}
</div>
