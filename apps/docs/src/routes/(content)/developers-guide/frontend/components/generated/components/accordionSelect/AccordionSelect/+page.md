# AccordionSelect

Show a select widget which is expanded when no selection is made and collapsed when an option is selected.

If there's only one option, it is automatically selected and no interactions are allowed.

### Properties

- `options`: The titles and other data related to the options.
- `activeIndex`: The index of the active option. Bind to this to change or read the active option.
- `labelGetter`: A callback used to get the label for each option. Default: `String`
- `onChange`: Callback for when the active option changes. The event `details` contains the active option as `option` as well as its `index`.
- Any valid attributes of a `<div>` element

### Usage

```tsx
<AccordionSelect bind:activeIndex options={['Basic Info', 'Opinions']} />
```

## Source

[frontend/src/lib/components/accordionSelect/AccordionSelect.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/accordionSelect/AccordionSelect.svelte)

[frontend/src/lib/components/accordionSelect/AccordionSelect.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/accordionSelect/AccordionSelect.type.ts)
