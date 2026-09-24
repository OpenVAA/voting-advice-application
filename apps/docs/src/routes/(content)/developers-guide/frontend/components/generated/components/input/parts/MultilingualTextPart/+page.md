# MultilingualTextPart

The per-locale field stack `Input` renders for its multilingual text kinds. One field per supported locale: the displayed locale is always shown, the rest appear when translations are revealed.

Internal to the `input` package — not exported from its barrel. See `./README.md`.

### Properties

See `MultilingualTextPart.type.ts`.

### Callbacks

- `onChange`: triggered when a locale's field changes, with the originating event and that locale.

## Source

[apps/frontend/src/lib/components/input/parts/MultilingualTextPart.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/input/parts/MultilingualTextPart.svelte)

[apps/frontend/src/lib/components/input/parts/MultilingualTextPart.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/input/parts/MultilingualTextPart.type.ts)

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
