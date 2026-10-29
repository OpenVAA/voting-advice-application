# Input

Display any data input, its associated label and possible info. The HTML element used to for the input is defined by the `type` property.

The input itself is wrapped in multiple container elements, the outermost of which can be passed the `containerProps` prop.

Multilingual features are only available if the `locales` store contains more than one locale.

### Properties

- `type`: The type of input element to use. This also defines the type of the `value` prop, which of the other properties are allowed or required, and the HTML element rendered.
  - `boolean`: A boolean toggle.
  - `color`: A colour as a hex code: a text field for the code, and the platform colour picker over a round swatch. The value is lowercase `#rrggbb` or nothing; an entry that is not a hex colour stays in the field, shows an error and leaves the value as it was.
  - `date`: A date input.
  - `image`: An image file input.
  - `multiple-text`: A row list of plain text inputs, one per value.
  - `multiple-text-multilingual`: A row list whose every row is a multilingual text input.
  - `number`: A numeric input.
  - `select`: A select dropdown.
  - `select-multiple`: A select dropdown from which multiple options can be selected. See also the `ordered` prop.
  - `text`: A single-line text input.
  - `text-multilingual`: A multilingual single-line text input.
  - `textarea`: A multi-line text input.
  - `textarea-multilingual`: A multilingual multi-line text input.
- `label`: The label to show for the input or group of inputs if `multilingual`.
- `containerProps`: Any additional props to be passed to the container element of the input.
- `id`: The id of the input. If not provided, a unique id will be generated.
- `info`: Additional info displayed below the input.
- `disabled`: Works the same way as a normal `input`'s `disabled` attribute.
- `locked`: If `locked` the input will be disabled and a lock icon is displayed.
- `autocomplete`: The `autocomplete` token of the control, for an input that collects a value the browser can fill in, such as the user's own name. @default undefined
- `required`: If `true`, a badge will be displayed next to the input when its value is empty, and the control of a kind that renders one control is marked `aria-required`. @default false
- `requiredLocale`: The locale whose entry must not be blank, for the `text-multilingual` and `textarea-multilingual` kinds. On a `required` input, `required` is then judged on that entry instead of on the whole value, that locale's field is shown even while the translations are hidden, and the required language is named in the info line. A locale that is not a supported one is ignored. @default undefined
- `value`: Bindable: the value of the input. Depends on the `type` prop.
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. @default false
- `options`: The options to show for a `select` or `select-multiple` input.
- `ordered`: If `true`, enables ordering of the values of a `select-multiple` input. @default false
- `minItems`: The minimum number of rows for a `multiple-text` input. @default 1
- `maxItems`: The maximum number of rows for a `multiple-text` input.
- `maxFilesize`: The maximum file size for `image` inputs. @default `20 * 1024**2` (20MB)
- `multilingualInfo`: Additional info displayed below the input for multilingual input together with possible `info`. @default t('components.input.multilingualInfo')
- Any valid attributes of the HTML element (`input`, `select` or `textarea`) used for the input, except in the case of `image` whose input is hidden.

### Accessibility

- The info line has the id `{id}-info` and the inline error the id `{id}-error`. Every control of the input names the ones that are rendered in its `aria-describedby`, after any `aria-describedby` the caller passed.
- The inline error has `role="alert"`, and the control is `aria-invalid` while it is shown.
- Each locale's field of a multilingual kind, and its language label, carries `lang`.

### Callbacks

- `onChange`: Event handler triggered when the value changes with the new `value`.

### Usage

```tsx
<Input type="text" label="Name" placeholder="Enter your name" onChange={(v) => console.info(v)} />

<Input type="select-multiple" label="Favourite colours" ordered value={['c3', 'c1']} options={[
    { id: 'c1', label: 'Red' },
    { id: 'c2', label: 'Blue' },
    { id: 'c3', label: 'Green' },
  ]}
  onChange={(v) => console.info(v)}
  info="Select any number of colours in the order you prefer them." />
```

## Source

- Component: [apps/frontend/src/lib/components/input/Input.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/input/Input.svelte)
- Types: [apps/frontend/src/lib/components/input/Input.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/input/Input.type.ts)
