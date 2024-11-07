# Style guides

In general, Prettier formats the code in a nice way, but there are other requirements that you must take care of manually.

## Comments

Do not manually break comments into lines of a certain length unless separating paragraphs. This enables developers to use line-wrapping based on their own preference without adding unneccessary lines to the code.

## TypeScript

We follow the conventions of [TypeScript Style Guide](https://mkosir.github.io/typescript-style-guide/) with the following exception:

- [The naming conventions](https://mkosir.github.io/typescript-style-guide/#variables-1) for booleans are optional but if possible should be adhered to.

## CSS

See the [styling guide](../frontend/styling.md) for information about using Tailwind classes.

## Svelte components

### File structure

Put each component in its own folder in `$lib/components`. Multiple components that are integrally tied together may be included in the same folder (but see note below on exports). Separe the type definitions in a `.type.ts` file and provide an `index.ts` for easy imports. Thus, the `$lib/components/myComponent` folder would have the files:

- `MyComponent.svelte`: the component itself
- `MyComponent.type.ts`: the type definitions for the component's properties
- `index.ts`: provides shortcuts to imports:
  ```ts
  export {default as MyComponent} from './MyComponent.svelte;
  export * from './MyComponent.type;
  ```

**NB.** All components exported from the `index.ts` file, will be loaded even when only one of them imported in the application, so place multiple components in the same folder tree only when it's absolutely necessary.

### Component properties

Currently, most components use attribute forwarding with [Svelte's `$$restProps` variable](https://svelte.dev/docs/basic-markup#attributes-and-props). This means that any HTML or SVG attributes that the main element of the component accepts can be passed as the components properties – or, in case of a component derived from another Svelte component, the parent components properties. See the examples for details on how this is done.

#### Default values for properties included `$$restProps`

In most cases, default values for properties included in `$$restProps`, such as `aria-hidden` can be just added as attributes in the relevant element or component. The only thing to keep in mind is that they must precede `$$restProps`, otherwise they will override the values in it. For example:

```tsx
<div aria-label="Default label" {...$$restProps}>
  ...
</div>
```

However, if you want to concatenate values with properties in `$$restProps`, such as concatenating a default `class` string with one possibly defined in `$$restProps`, this should be added after `{...$$restProps}`. To make this easier, a `concatClass` helper function is provided in [`$lib/utils/components`](../../frontend/src/lib/utils/components.ts). For example:

```tsx
<div {...concatClass($$restProps, 'default-class')}>...</div>
```

#### Aria attributes and the `class` attribute

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

### Documentation

Follow Svelte's [guidelines for component documentation](https://svelte.dev/docs/faq#how-do-i-document-my-components). For an example, see [`IconBase`](../../frontend/src/lib/components/icon/base/IconBase.svelte) component and its associated [type definition](../../frontend/src/lib/components/icon/base/IconBase.type.ts).

It is not necessary to duplicate the documentation of the individual properties in the doc string of the `.svelte` file, because the properties should have their explanations directly in the interface definition in the `.type.ts` file (using [`/** ... */` JSDoc comments](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)). The component's possible slots should, however, be included in the doc string.
