# Style guides

In general, Prettier formats the code in a nice way.

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

### Documentation

Follow Svelte's [guidelines for component documentation](https://svelte.dev/docs/faq#how-do-i-document-my-components). For an example, see [`IconBase`](../../frontend/src/lib/components/icon/base/IconBase.svelte) component and its associated [type definition](../../frontend/src/lib/components/icon/base/IconBase.type.ts).

It is not necessary to duplicate the documentation of the individual properties in the doc string of the `.svelte` file, because the properties should have their explanations directly in the interface definition in the `.type.ts` file (using [`/** ... */` JSDoc comments](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)). The component's possible slots should, however, be included in the doc string.