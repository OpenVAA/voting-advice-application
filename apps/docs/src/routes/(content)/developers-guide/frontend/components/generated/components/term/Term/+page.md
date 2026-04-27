# Term

Show a definition popup when hovering over a term.

### Properties

- `definition`: The text to show in the definition popup.
- `position`: Position of the tooltip relative to the term. Default: `'bottom'`
- `showUnderline`: Whether to show the underline styling. Default: `true`
- `forceShow`: Whether to force show the tooltip. Default: `false`
- Any valid attributes of a `span` element.

### Accessibility

Uses the `term` and `definition` roles.

### Usage

```tsx
<Term definition="Hovering is an act of levitation">Hover over me</Term>
```

## Source

[frontend/src/lib/components/term/Term.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/term/Term.svelte)

[frontend/src/lib/components/term/Term.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/term/Term.type.ts)
