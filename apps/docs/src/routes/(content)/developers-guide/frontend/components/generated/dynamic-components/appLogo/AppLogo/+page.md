# AppLogo

A template part that is used to show the application's logo. The logo colour changes dynamically based on whether the light or dark mode is active.

Logo files for use on a light and a dark background can be defined. If the latter is not supplied an `invert` filter will be applied. If no logo files are supplied, the OpenVAA logo will be used.

### Dynamic component

- Access `AppContext` to get `appCustomization`.

### Properties

- `alt`: The `alt` text for the logo image. If missing, the publisher name or 'OpenVAA' will be used, depending on the logo shown.
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

## Source

[frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte)

[frontend/src/lib/dynamic-components/appLogo/AppLogo.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/appLogo/AppLogo.type.ts)
