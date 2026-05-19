# Toggle

Display a short list of options as toggleable text or icon buttons from which one can be selected. Semantically a `<fieldset>` with radio buttons.

### Properties

- `label`: The aria label for the toggle.
- `options`: The options for the toggle. Each must contain a `key` and a `label` property. If an `icon` property is provided, the option will be rendered as an icon button. The `label` is still required and will be used for a screen-reader-only label.
- Any valid attributes of a `<fieldset>` element.

### Bindable properties

- `selected`: The currently selected option `key` of the toggle. Bind to this to get the currently selected value.

### Usage

```tsx
<script lang="ts">
  // Text toggle
  const options = [
    {
      label: 'Text',
      key: 'text'
    },
    {
      label: 'Video',
      key: 'video'
    }
  ];
  let selected: string;
</script>
<Toggle bind:selected label="Switch between video and text display" {options}/>

<script lang="ts">
  // Icon toggle
  const iconOptions = [
    {
      label: 'Text',
      icon: 'text',
      key: 'text'
    },
    {
      label: 'Video',
      icon: 'video',
      key: 'video'
    }
  ];
  let selected: string;
</script>
<Toggle bind:selected label="Switch between video and text display" {options}/>
```

## Source

[frontend/src/lib/components/toggle/Toggle.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/toggle/Toggle.svelte)

[frontend/src/lib/components/toggle/Toggle.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/toggle/Toggle.type.ts)
