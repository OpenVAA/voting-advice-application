# Components

For the conventions of writing a component, such as property typing and documentation, see the [Code style guide](/developers-guide/contributing/code-style-guide).

## The three component libraries

| Directory                                                                                                                                   | Import from                     | Contents                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [`src/lib/components`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/components)                     | `$lib/components/<dir>`         | Base components, such as `Button`, `Modal` or `Expander`. Most of them read no app context.                                     |
| [`src/lib/dynamic-components`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/dynamic-components)     | `$lib/dynamic-components/<dir>` | Components that read the app contexts and the data objects in them, such as `EntityCard`, `EntityDetails` or `QuestionHeading`. |
| [`src/lib/candidate/components`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/candidate/components) | `$candidate/components/<dir>`   | Components for the Candidate App, such as `PasswordSetter` or `TermsOfUse`.                                                     |

Each component has its own directory with an `index.ts` that exports it, so import the directory, for example `import { Button } from '$lib/components/button';`, never the `.svelte` file.

## Component conventions

All components are Svelte 5 components in runes mode (see [Frontend overview](/developers-guide/frontend/intro)). Taking [`Button`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/components/button) as the example:

- **Props** are read with a single destructuring of `$props()`, typed by a type file beside the component: `Button.svelte` imports `ButtonProps` from `Button.type.ts`. The props type extends the element's HTML attributes, so a caller can pass any valid attribute, and the component spreads the rest of the props onto its element.
- **Snippets** take the place of slots. Content and named regions are `Snippet` props, rendered with `{@render …}`.
- **Classes** passed by the caller are combined with the component's own with `concatClass(restProps, classes)` from `$lib/utils/components`. Where the two conflict, the caller's class wins.
- **State** uses `$state` and `$derived`. Components read data through the [contexts](/developers-guide/frontend/contexts), not through module-level state, and an ESLint rule bans importing `svelte/store`.
- **Documentation** is an `@component` comment at the top of the `.svelte` file. The component documentation generator reads it, so a component without one is missing from the generated list.

## Available components

See the [auto-generated component documentation](/developers-guide/frontend/components/generated).
