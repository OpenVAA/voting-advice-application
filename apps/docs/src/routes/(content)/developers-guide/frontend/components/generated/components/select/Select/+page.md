# Select

# Select component with list autocomplete support

Displays a select input with optional autocomplete support.

If there’s only one option available, the selected value will be set automatically and a non-interactive 'input' will be displayed.

### Properties

- `label`: The `aria-label` and `placeholder` text for the select input.
- `options`: The list of selectable options. You can provide an array of objects with `id` and `label` properties, or an array of strings in which case the ids will be the same as the labels.
- `selected`: A bindable value for the id of the selected option. @default the only option if there’s only one, `undefined` otherwise.
- `onChange`: A callback function triggered when the selection changes.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default `false`
- `autocomplete`: Controls autocomplete behavior; supported values: `on` or `off`. @default `off`
- Any valid attributes of a `<select>` element (although when `autocomplete` is set to `on`, the props will be passed to a similarly styled `<input>` element).

### Accessiblity

In the `autocomplete` mode, the input can be controlled using the keyboard:

- Move between options using the `Up` and `Down` arrow keys. If `Shift` is pressed, the focus moves by 10. The focused option is scrolled into view and outlined.
- Select an option using the `Enter` key
- The focused option is automatically selected when defocusing the input by `Tab`
- Defocus without selecting with `Esc`

The component follows the [WGAI Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/).

### Usage

```tsx
<Select label="Select option" options={[{ id: '1', label: 'Label' }]} bind:selected autocomplete="on" />
```

## Source

[frontend/src/lib/components/select/Select.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/select/Select.svelte)

[frontend/src/lib/components/select/Select.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/select/Select.type.ts)
