# OpenVAALogo

Display the OpenVAA logo. You can define the `color` and `size` of the logo using
predefined values.

The logo is rendered as a `<svg>` element, and you can also pass any valid
attributes of one.

### Properties

- `title`: The `<title>` of the SVG logo. Functions much the same way as the `alt` attribute of an `<img>`. Default: `'OpenVAA'`
- `size`: The size of the logo as one of the predefined sizes 'sm', 'md' or 'lg'. For arbitrary values, you can supply a `class` property, such as `h-[3.15rem] w-[3.15rem]`. Default: `'md'`
- `color`: The color of the logo as one of the predefined colours. For arbitrary values, you can supply a `class` property, such as `fill-[#123456]`. Default: `'neutral'`
- Any valid attributes of a `<svg>` element.

### Usage

```tsx
<OpenVAALogo/>
<OpenVAALogo color="secondary" size="sm"/>
```

## Source

[frontend/src/lib/components/openVAALogo/OpenVAALogo.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/openVAALogo/OpenVAALogo.svelte)

[frontend/src/lib/components/openVAALogo/OpenVAALogo.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/openVAALogo/OpenVAALogo.type.ts)
