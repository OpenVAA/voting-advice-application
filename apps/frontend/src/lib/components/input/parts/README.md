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

**A part owns its element references.** `Input` returns focus to its first field after the
translations toggle is pressed and after a selected option is deleted. The three parts that render
such a field — `MultilingualTextPart`, `SelectMultiplePart` and `MultipleTextPart` — each keep their
own `bind:this` references and export `focus()`; `Input` holds the rendered part through `bind:this`
and calls that method. No element reference is passed to a part as a prop: a part that writes into a
`$state` object its parent owns is reported by a dev build of Svelte as `ownership_invalid_mutation`.
`Input.focusReturn.svelte.test.ts` holds both the focus return and the absence of that warning.

**A part describes its controls.** `Input` renders the info line and the inline error under every
kind, and hands each part their ids — after any `aria-describedby` its caller passed — as the
`describedBy` prop. A part sets it as the `aria-describedby` of each control it renders.
`Input.described.svelte.test.ts` holds that for every kind.
