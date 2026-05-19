# Loading

Used to display a loading spinner with an optionally visible text label.

### Properties

- `inline`: Whether to show an inline version of the spinner. By default the spinner tries to center itself in the available area. Default: `false`
- `label`: The label text. Default: `$t('common.loading')`
- `showLabel`: Whether to show the text label. The label will always be shown to screen readers. Default: `false`
- `size`: The size of the loading spinner. Default: `'lg'`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<Loading/>
<Loading size="md"/>
<Loading showLabel label="Loading custom stuff…"/>
```

## Source

[frontend/src/lib/components/loading/Loading.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/loading/Loading.svelte)

[frontend/src/lib/components/loading/Loading.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/loading/Loading.type.ts)
