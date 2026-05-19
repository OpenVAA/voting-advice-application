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

Do not manually break comments into lines of a certain length unless separating paragraphs. This enables developers to use line-wrapping based on their own preference without adding unneccessary lines to the code.

#### TSDoc

In Typescript, use [TSDoc comments](https://tsdoc.org/) for all documentation unless you're only adding remarks concering the program flow, e.g.:

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
  // Do smthx
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

> The frontend currently uses Svelte 4. An update to Svelte 5 is scheduled for H1/2026.

#### File structure

Put each component in its own folder in `$lib/components`, or `$lib/dynamic-components` in case of [dynamic components](/developers-guide/frontend/components). Multiple components that are integrally tied together may be included in the same folder (but see note below on exports). Separate the type definitions in a `.type.ts` file and provide an `index.ts` for easy imports. Thus, the `$lib/components/myComponent` folder would have the files:

- `MyComponent.svelte`: the component itself
- `MyComponent.type.ts`: the type definitions for the component's properties
- `index.ts`: provides shortcuts to imports:
  ```ts
  export {default as MyComponent} from './MyComponent.svelte;
  export * from './MyComponent.type;
  ```

**NB.** All components exported from the `index.ts` file, will be loaded even when only one of them imported in the application, so place multiple components in the same folder tree only when it's absolutely necessary.

#### Component properties

Currently, most components use attribute forwarding with [Svelte's `$$restProps` variable](https://svelte.dev/docs/basic-markup#attributes-and-props). This means that any HTML or SVG attributes that the main element of the component accepts can be passed as the components properties – or, in case of a component derived from another Svelte component, the parent components properties. This is most commonly used for passing extra classes to the element.

For example, in the `HeroEmoji` component additional CSS classes as well as any arbitraty properties of the `<div>` element can be passed to the `<div>` surrounding the emoji.

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

```tsx
// HeroEmoji.svelte
<script lang="ts">
  import { concatClass } from '$lib/utils/components';
  import type { HeroEmojiProps } from './HeroEmoji.type';

  type $$Props = HeroEmojiProps;

  export let emoji: $$Props['emoji'] = undefined;
</script>

{#if emoji}
  <div
    aria-hidden="true"
    role="img"
    style="font-variant-emoji: emoji;"
    {...concatClass(
      $$restProps,
      'whitespace-nowrap truncate text-clip text-center font-emoji text-[6.5rem] leading-[1.1]'
    )}>
    {emoji}
  </div>
{/if}
```

Also see the other existing components for more details on how this is done.

##### Default values for properties included `$$restProps`

In most cases, default values for properties included in `$$restProps`, such as `aria-hidden` can be just added as attributes in the relevant element or component. The only thing to keep in mind is that they must precede `$$restProps`, otherwise they will override the values in it. For example:

```tsx
<div aria-label="Default label" {...$$restProps}>
  ...
</div>
```

However, if you want to concatenate values with properties in `$$restProps`, such as concatenating a default `class` string with one possibly defined in `$$restProps`, this should be added after `{...$$restProps}`. To make this easier, a `concatClass` helper function is provided in [`$lib/utils/components`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/utils/components.ts). For example:

```tsx
<div {...concatClass($$restProps, 'default-class')}>...</div>
```

##### Aria attributes and the `class` attribute

Note that you most Aria attributes cannot be exposed with `let export foo` because their names contain dashes, which also applies to the HTML `class` attribute. In order to access these, either use the `$restProps` object or specify them in the properties type the component uses, i.e., the one assigned to `type $$Props` and access them via `$$props`. For example:

```tsx
// Foo.type.ts
export type FooProps = SvelteHTMLElements['p'] & {
  'aria-roledescription'?: string | null;
  class?: string | null;
};

// Foo.svelte: <script>
type $$Props = FooProps;
let ariaDesc: $$Props['aria-roledescription'] = $$props['aria-roledescription'];
let className: $$Props['class'] = $$props['class'];
```

#### Component documentation

Follow Svelte's [guidelines for component documentation](https://svelte.dev/docs/faq#how-do-i-document-my-components). For an example, see [`IconBase`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/icon/base/IconBase.svelte) component and its associated [type definition](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/icon/base/IconBase.type.ts).

Place the Svelte docstring at the top of the file, before the `<script>` block. The documentation must consist of:

- general description
- 'Properties' (see below)
- 'Slots' detailing all slots and their uses (if applicable)
- 'Usage' showing a concise code block of the component’s use

The type file defining the properties is the prime source of truth for the properties’ descriptions. Make sure the "Properties" section of the component doc string matches that.

Add documentation for pages, layouts and other non-reusable components, detailing their main purpose. Include in their documentation under separate subheadings:

- `Settings` affecting the page
- Route and query `Params` affecting the behaviour
- `Tracking events` initiated by the page

It is not necessary to duplicate the documentation of the individual properties in the doc string of the `.svelte` file, because the properties should have their explanations directly in the interface definition in the `.type.ts` file (using [`/** ... */` TSDoc comments](https://tsdoc.org/)). The component's possible slots should, however, be included in the doc string.
