# MultipleTextPart

The row list `Input` renders for its multi-text kinds: one text input per value, with add / remove / reorder controls. Absorbed from the former standalone `MultipleTextInput` component, which had no multilingual mode; each row now behaves much the same as a normal multilingual text item.

Internal to the `input` package — not exported from its barrel. See `./README.md`.

### Behaviour

- Empty rows are dropped on save (`onChange`); duplicates are preserved; array
  order equals on-screen row order.
- When `multilingual`, a row carries one text per locale and is dropped only when
  EVERY locale is empty, so a row written in a language the user is not currently viewing is never silently discarded. Emptiness is the same trim rule, applied per locale. Only the locales actually written are emitted.
- `minItems > 1` renders that many rows initially and disables per-row removal
  below the floor (`max(minItems ?? 1, 1)`). Reorder is allowed even at the floor.
- `maxItems` reached → the Add button is disabled.
- Values are opaque strings: no numeric coercion, no dedup, no sorting, no case
  folding, no Unicode normalization.

### Properties

See `MultipleTextPart.type.ts`.

### Callbacks

- `onChange`: triggered on every edit / add / remove / reorder with the filtered,
  order-preserving value array.

## Source

[apps/frontend/src/lib/components/input/parts/MultipleTextPart.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/input/parts/MultipleTextPart.svelte)

[apps/frontend/src/lib/components/input/parts/MultipleTextPart.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/input/parts/MultipleTextPart.type.ts)

## Additional Documentation

# `Input` parts

The four components here are the extracted complex markup branches of `Input.svelte`, one per branch:
`MultilingualTextPart` (per-locale text fields and textareas), `SelectMultiplePart` (the options
dropdown plus the selected-chips region), `ImagePart` (the file input with its preview) and
`MultipleTextPart` (the row list, absorbed from the former standalone `MultipleTextInput` component).
`Input`'s two single-element branches — the single-language textarea and the row of simple inputs —
stay inline: extracting them would add indirection without removing size.

**These parts are implementation detail and are deliberately NOT re-exported from the package barrel**
(`../index.ts`). The asymmetry with the sibling `questions/` package, whose barrel exports every
component, is intentional: those components are all public API, these are not. A consumer wanting a
multi-text row list asks for `<Input type="multiple-text">`, never for `MultipleTextPart`. Adding
these to the barrel would recreate the split that criterion 2 exists to close.

Each part has a co-located `<Part>.type.ts` prop contract in the house style — a documentation block
on every member, with a default marker on every optional one. The parts are imported by relative path
from `Input.svelte`, matching `questions/OpinionQuestionInput.svelte`'s treatment of its own extracted
siblings.
