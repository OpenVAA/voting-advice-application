# Term

Show a definition popup when hovering over a term.

### Properties

- `definition`: The text to show in the definition popup.
- `position`: Position of the tooltip relative to the term. Default: `'bottom'`
- `showUnderline`: Whether to show the underline styling. Default: `true`
- `forceShow`: Whether to force show the tooltip. Default: `false`
- Any valid attributes of a `span` element.

### Accessibility

The trigger is a focusable `button` (W3C APG tooltip pattern) whose accessible name is the term text; the definition popup uses the `tooltip` role and is linked via `aria-describedby` while shown.

### Usage

```tsx
<Term definition="Hovering is an act of levitation">Hover over me</Term>
```

## Source

[apps/frontend/src/lib/components/term/Term.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/term/Term.svelte)

[apps/frontend/src/lib/components/term/Term.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/term/Term.type.ts)
