# Button

A component for buttons that mostly contain text and an icon. Use the `variant` prop to specify the button type. When using an `icon`, use `iconPos` to set the position of the icon relative to the text.

- `main`: A large, prominent button that is used for the main action of the page. In general, there should only be one of these on a page.
- `prominent`: A large, quite prominent button.
- `floating-icon`: A button with a large icon and no text. This is usually used for a floating action button.
- `icon`: A button containing only an icon. Note that you still need to provide the `text` property, which will be used as the `aria-label` and `title` of the button.
- `responsive-icon`: A button rendered as icon only on small screens but which exposes the text label on large screens. Set the `iconPos` to `left` or `right` to control its location in the expanded view.
- `secondary`: A button with a smaller (uppercase) text and possibly an icon.
- `normal`: The default button type, which usually consists of an icon and text.

Only `main` buttons have a backround color. The other variants use DaisyUI's `btn-ghost` class, i.e. they do not have a background color.

The button is rendered as an `<a>` element if `href` is supplied. Otherwise a `<button>` element will be used. Be sure to provide an `on:click` event handler or other way of making the item interactive.

### Properties

- `text`: The required text of the button. If `variant` is `icon`, the text will be used as the `aria-label` and `title` for the button. You can override both by providing them as attributes, e.g. `aria-label="Another text"`.
- `icon`: The name of the icon to use in the button or `null` if no icon should be used. Default: `'next'` if `variant='main'`, otherwise `null`
- `color`: The color of the button or text. Default: `'primary'`
- `disabled`: Whether the button is disabled. This can also be used with buttons rendered as `<a>` elements.
- `variant`: Type of the button, which defines it's appearance. Default: `'normal'`
- `iconPos`: Position of the icon in the button. Only relevant if `icon` is not `null` and `variant` is not `icon` or `floating-icon`. Note that `top` and `bottom` are not supported if `variant='main'`. Default: `'right'` if `variant='main'`, otherwise `'left'`
- `loading`: Set to `true` to show a loading spinner instead of the possible icon and disable the button. Default: `false`
- `loadingText`: The text shown when `loading` is `true`. Default: `$t('common.loading')`
- `href`: The URL to navigate to. If this is not supplied be sure to provide an `on:click` event handler or other way of making the item interactive.
- Any valid attributes of either an `<a>` or `<button>` element depending whether `href` was defined or not, respectively.

### Slots

- `badge`: A slot for adding a badge to the button.

### Reactivity

Reactivity is not supported for the properties: `variant`, `iconPos`.

### Usage

```tsx
<Button on:click={next} variant="main" icon="next"
text="Continue"/>
<Button on:click={skip} icon="skip" iconPos="top" color="secondary"
text="Skip this question"/>
<Button on:click={addToList} variant="icon" icon="addToList"
text="Add to list">
 <InfoBadge text="5" slot="badge"/>
</Button>
```

## Source

[frontend/src/lib/components/button/Button.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/button/Button.svelte)

[frontend/src/lib/components/button/Button.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/button/Button.type.ts)
