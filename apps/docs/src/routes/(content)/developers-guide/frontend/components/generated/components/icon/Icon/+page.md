# Icon

An icon component, where the `name` property defines which icon to use.

Use the other properties to set the size and color of the icon. The icon
is `aria-hidden` by default, but that can overriden. You can also pass
any valid attributes of the `<svg>` element.

### Properties

- `name`: The name of the icon to use.
- `size`: The size of the icon as one of the predefined sizes 'sm', 'md' or 'lg'. For arbitrary values, you can supply a `class` property, such as `h-[3.15rem] w-[3.15rem]`. Default: `'md'`
- `color`: The color of the icon as one of the predefined colours. For arbitrary values, use the `customColor` and `customColorDark` properties. Default: `'current'`
- `customColor`: A custom color string to use for the icon, e.g. in case of parties, which will override the `color` property. Make sure to define both `customColor` and `customColorDark` together.
- `customColorDark`: A custom color string to use for the icon in dark mode, which will override the `color` property.
- Any valid attributes of a `<svg>` element.

### Usage

```tsx
<Icon name="addToList"/>
<Icon name="opinion" color="primary" size="lg"
 aria-hidden="false" aria-label="Add candidate to your list"/>
```

## Source

[frontend/src/lib/components/icon/Icon.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/icon/Icon.svelte)

[frontend/src/lib/components/icon/Icon.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/icon/Icon.type.ts)
