# Code style guide

In general, Prettier formats the code on the surface in a nice way, but there are other requirements that you must take care of manually.

### Principles

#### Don't Repeat Yourself

Check that no code is repeated if the same functionality is already implemented elsewhere. Be careful to check at least the following paths and modules for possible general use components, classes and utilities:

- `$lib/api`
- `$lib/components`
- `$lib/dynamic-components`
- `$lib/contexts`
- `$lib/utils`
- `@openvaa/app-shared`
- `@openvaa/core`
- `@openvaa/data`
- `@openvaa/filters`
- `@openvaa/matching`

If some existing code doesn’t do exactly the thing you want, consider extending the existing code instead of copy-pasting more than a few lines of code.

#### Top-Down Organization

Check that files with hierarchical functions are organized top-down such that the main (exported) function is first and its subfunctions come after. Preferably even split the functions into their own files and import them into the main function.

Thus, a complex file should read like this (or with `foo` and `bar` imported from their own files):

```ts
export function longProcess() {
  const result = foo();
  if (!result) return undefined;
  return bar(result);
}

function foo() {
  // Code here
}

function bar(result) {
  // Code here
}
```

### Comments

Add comments to all exported variables as well as the properties of exported object, methods of classes and items of union types.

Try to make the code understandable by itself, but if you suspect the program logic might be unclear to others, rather add comments than leave them out.

A comment describes the code as it is now. Keep comments concise and leave out:

- **The history of the code** — what it used to do, what was replaced, or how a bug was found. The git history records that.
- **Planning references** — if one is unavoidable, use the short form `see phase 55` or `see spike 66`, never a path to a planning file.
- **Notes addressed to the reviewer** — explain the change in the PR instead. If such a comment is unavoidable, tag it `[PR review]` and remove it before the PR is merged.

Do not manually break comments into lines of a certain length unless separating paragraphs. This enables developers to use line-wrapping based on their own preference without adding unnecessary lines to the code.

#### TSDoc

In Typescript, use [TSDoc comments](https://tsdoc.org/) for all documentation unless you're only adding remarks concerning the program flow, e.g.:

```ts
/**
 * Sum the inputs.
 * @param a - The first addend.
 * @param b - The second addend.
 * @returns the sum of the addends.
 */
export function sum(a: number, b: number): number {
  // Add the numbers together
  return a + b;
}
```

### TypeScript

We follow the conventions of [TypeScript Style Guide](https://mkosir.github.io/typescript-style-guide/) with the following exception:

- [The naming conventions](https://mkosir.github.io/typescript-style-guide/#variables-1) for booleans are optional but if possible should be adhered to.

Common errors, which will be flagged, include:

- `Array<Foo>` must be used instead of `Foo[]`
- Type parameters cannot be single letters: `type Foo<TBar> = ...` instead of `type Foo<T>`.

#### `any` and `unknown`

Avoid using `any` at all costs. If there is no way to circumvent using it, document the reason carefully and consider using `@ts-expect-error` instead.

Also avoid `unknown` unless it is genuinely appropriate for the context like, e.g., in callback functions whose return values have no effect on the caller.

#### Function parameters

> This requirement is not flagged by automatic checks.

To avoid bugs, try to always use named parameters to functions and methods, when there is any risk of confusion, i.e., in most cases where the functions expects more than one parameter.

```ts
// NOT like this
function confused(foo: string, bar: string, baz = 'BAZ') {
  // Do smth
}
// YES like this
function unConfused({ foo, bar, baz = 'BAZ' }: { foo: string; bar: string; baz?: string }) {
  // Do smth
}
```

To make things smooth, try to use the same names for parameter across the board, so they can be destructured and passed as is, e.g.

```typescript
const { foo } = getFoo();
const { bar } = getBar();
foobar({ foo, bar }); // Instead of foobar({ foo: foo, bar: bar })
function foobar({ foo, bar }: { foo: string; bar: string }) {
  // Do smth
}
```

#### File organization

Try to separate pure type files from the functional ones and keep them next to each other, as well as tests. Do not usually collect these into separate folders. E.g.

- `foo.ts`: The file to compile
- `foo.type.ts`: Related types and types only
- `foo.test.ts`: The unit tests

### CSS

Use Tailwind for styling.

See the [frontend styling guide](/developers-guide/frontend/styling) for information about using Tailwind classes.

### Svelte components

The frontend uses Svelte 5 with runes: `apps/frontend/svelte.config.js` turns runes mode on for every file outside `node_modules`. Components take their properties with `$props()`, keep state in `$state` and `$derived`, and receive content as snippets. Do not use the pre-runes syntax for properties, slots or reactive statements. Do not import `svelte/store` in `apps/frontend/src` either; ESLint rejects it there.

#### File structure

Put each component in its own folder in `$lib/components`, in `$lib/dynamic-components` for [dynamic components](/developers-guide/frontend/components), or in `$candidate/components` for components used only by the Candidate App. Multiple components that are integrally tied together may be included in the same folder (but see the note below on exports). Put the property type in a `.type.ts` file next to the component and provide an `index.ts` for easy imports. Thus, the `$lib/components/myComponent` folder would have the files:

- `MyComponent.svelte`: the component itself
- `MyComponent.type.ts`: the type of the component's properties
- `index.ts`: provides shortcuts to imports:
  ```ts
  export { default as MyComponent } from './MyComponent.svelte';
  export * from './MyComponent.type';
  ```

**NB.** All components exported from the `index.ts` file will be loaded even when only one of them is imported in the application, so place multiple components in the same folder tree only when it's absolutely necessary.

#### Component properties

Declare the properties as a type in the `.type.ts` file and read them with a single destructuring of `$props()`. The type usually extends the attributes of the component's main element, so any HTML or SVG attribute that element accepts can be passed to the component. Collect those with a rest property and spread them onto the element. This is most commonly used for passing extra classes to the element.

For example, the [`HeroEmoji`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/heroEmoji/HeroEmoji.svelte) component passes additional CSS classes and any other attributes of a `<div>` element to the `<div>` surrounding the emoji:

```ts
// HeroEmoji.type.ts
import type { SvelteHTMLElements } from 'svelte/elements';

export type HeroEmojiProps = SvelteHTMLElements['div'] & {
  /**
   * The emoji to use. Note that all non-emoji characters will be removed. If `undefined` the component will not be rendered at all. @default `undefined`
   */
  emoji?: string;
};
```

```svelte
<!-- HeroEmoji.svelte -->
<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { HeroEmojiProps } from './HeroEmoji.type';

  let { emoji, ...restProps }: HeroEmojiProps = $props();
</script>

{#if emoji != null && emoji !== ''}
  <div
    aria-hidden="true"
    role="img"
    style="font-variant-emoji: emoji;"
    {...concatClass(
      restProps,
      'whitespace-nowrap truncate text-clip text-center font-emoji text-[6.5rem] leading-[1.1]'
    )}>
    {emoji}
  </div>
{/if}
```

Give optional properties their defaults in the destructuring, e.g. `let { variant = 'normal', ...restProps }: ButtonProps = $props();`. Values computed from properties go in `$derived`, so they follow the properties when these change; do not reassign a property.

Also see the other existing components for more details on how this is done.

##### Default attributes and classes

Default values for attributes that are passed in the rest properties, such as `aria-hidden`, can be added as attributes on the element. They must come before the spread, otherwise they override the caller's values:

```svelte
<div aria-label="Default label" {...restProps}>...</div>
```

To combine the component's own classes with a `class` the caller passes, spread the rest properties through the `concatClass` helper in [`$lib/utils/components`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/utils/components.ts) instead of setting `class` yourself:

```svelte
<div {...concatClass(restProps, 'default-class')}>...</div>
```

`concatClass` merges the two with `tailwind-merge`, and the caller's classes come last, so where the two conflict (for example `h-16` and `h-32`), the caller's class wins.

##### Aria attributes and the `class` attribute

Attributes whose names contain dashes, such as most Aria attributes, are read from `$props()` by renaming them in the destructuring. Declare them in the property type if the element's attribute type does not already include them:

```ts
// Foo.type.ts
export type FooProps = SvelteHTMLElements['p'] & {
  'aria-roledescription'?: string | null;
};
```

```svelte
<!-- Foo.svelte -->
<script lang="ts">
  import type { FooProps } from './Foo.type';

  let { 'aria-roledescription': ariaDesc, class: className, ...restProps }: FooProps = $props();
</script>
```

##### Snippets

Content a component renders, whether its children or a named region, is a property of type `Snippet` and is rendered with `{@render}`. For example, [`Button`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/button/Button.svelte) declares an optional `badge?: Snippet` in [`Button.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/button/Button.type.ts) and renders it with `{@render badge?.()}`. A caller passes it like this:

```svelte
<Button onclick={addToList} variant="icon" icon="addToList" text="Add to list">
  {#snippet badge()}<InfoBadge text="5" />{/snippet}
</Button>
```

#### Component documentation

Follow Svelte's [guidelines for component documentation](https://svelte.dev/docs/svelte/faq#How-do-I-document-my-components). For an example, see the [`Button`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/button/Button.svelte) component and its [type definition](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/button/Button.type.ts).

Place the `@component` docstring at the top of the file, before the `<script>` block. The [component documentation generator](/developers-guide/about-these-docs) publishes it on this site, so a component without one is missing from the [component pages](/developers-guide/frontend/components/generated). The documentation must consist of:

- a general description
- `Properties` (see below)
- `Snippet Props` detailing the snippets the component renders and their uses (if applicable)
- `Usage` showing a concise code block of the component's use

The type file defining the properties is the prime source of truth for the properties' descriptions. Make sure the "Properties" section of the component docstring matches it.

Add documentation for pages, layouts and other non-reusable components, detailing their main purpose. Include in their documentation under separate subheadings:

- `Settings` affecting the page
- Route and query `Params` affecting the behaviour
- `Tracking events` initiated by the page

It is not necessary to duplicate the documentation of the individual properties in the docstring of the `.svelte` file, because the properties should have their explanations directly in the type definition in the `.type.ts` file (using [`/** ... */` TSDoc comments](https://tsdoc.org/)). The component's snippets should, however, be included in the docstring.
