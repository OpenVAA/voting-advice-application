# Contributing

## Recommended IDE settings (Code)

Plugins:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Pretter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

We also recommend Git Graph for easier branch management:

- [Git Graph v3](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

Settings:

```json
"editor.defaultFormatter": "esbenp.prettier-vscode",
"editor.formatOnSave": true,
"editor.codeActionsOnSave": {
  "source.fixAll": "explicit",
},
```

## Issues

### Create a new issue

If you detect a problem with the application or have a new request, search first in the list of issues to see whether or
not a similar issue has already been reported by someone else. If the issue doesn't exist, you can open a new one by
following these steps.

1. Add a descriptive title.
2. Add a descriptive description.
3. Assign the issue to the Voting Advice Application project.
4. [Add labels](#issue-labels).

### Search for an issue

Scan through our [existing issues](https://github.com/OpenVAA/voting-advice-application/issues). You can
narrow down the search using `labels` as filters. See [Labels](#issue-labels) for more information.
If you find an issue to work on, you are welcome to open a PR with a fix.

### Issue labels

Labels can help you find an issue you'd like to help with. On the other hand, labels allow us to manage the project and categorize the information in a more meaningful way.

Currently, the labels divide into four categories:

- Category: [CATEGORY] => This category lets us know what category the issue belongs to. Fox example, if the issue contains only security related changes, the label will be `category: security`.
- Status: [STATE of ISSUE] => This category lets us know what state the issue is in right now.
- Type: [TYPE OF ISSUE] => This category lets us know what type of issue this is. For example, if the issue is a bug, the label will be `type: bug`, or if the issue is a new feature, the label will be `type: feature`.
- Scope: [SCOPE] => This category describes the scope of this issue. For example, suppose that the issue involves the voter side of the app. Then the appropriate label would be `scope: voter`.

Do not add more than one label from each category in each issue or pull request.

It is imperative to add labels to the new issues. If you are not sure which labels to add, you can always ask for help from the team.

Additionally, please use Milestones to indicate which release target and scope contribution belongs to (for example: Alpha version, Beta version, Post-launch bug fixing patch, etc.).

## Contribute

If you want to make changes to the project, you must follow the following steps.

1. Clone the repository
2. Create a new branch with a descriptive yet short name. For example, `fix-404-page` or `add-privacy-policy-page`.
3. Once you start adding changes, make sure you split your work into small, meaningful, manageable commits.

### Commit your update

Commit the changes once you are happy with them. Try to keep commits small and to not mix unrelated changes in one commit.

Don't add any editor config files, such as the `.vscode` folder, to your commit. These are not included in the project's `.gitignore` file but you can [add them to a global `.gitignore`](https://blog.martinhujer.cz/dont-put-idea-vscode-directories-to-projects-gitignore/) on your own machine.

The commit message should follow the [conventional commits conventions](https://www.conventionalcommits.org/en/v1.0.0/). Use the `refactor:` prefix for changes that only affect styling.

For commits that affect packages other than the frontend, add the package name (without the `@openvaa/` scope) to the commit prefix in brackets, e.g.:

- `refactor[data]: doo foo`
- `refactor[q-info]: doo bar` (you can use the abbreviations `q-info` and `arg-cond` for `question-info` and `argument-condensation`)

On top of that, the commit message should follow the following rules:

- Commit messages must have a subject line and may have a body. A blank line must separate the subject line and body.
- If possible, the subject line must not exceed 50 characters
- The subject line must not end in a period
- The body copy must be wrapped at 72 columns
- The body copy must only explain _what_ and _why_, never _how_. The latter belongs in documentation and implementation.

After you're satisfied with your commits, clean up the commit history so that the commits make sense for others. The best way to accomplish this is to use the [fixup workflow](https://dev.to/koffeinfrei/the-git-fixup-workflow-386d) so that the commit history will contain only one commit for some feature instead of multiple ones with cumulative fixes, i.e., your PR’s commit history should finally look like:

- `feat: NewComponent`

Instead of:

- `feat: NewComponent`
- `fix: something in NewComponent`
- `fix: something else in NewComponent`

Once your changes are ready, make sure you have followed all the steps in the [PR Review Checklist](#self-review).

## Workflows

The project uses GitHub Actions among other things to verify each commit passes unit tests, is able to build the app successfully and adheres to the [coding conventions used by the project](#code-style-guide). If a commit fails the verification, please check your changes from the logs and fix changes before submitting a review request.

## Pull Request

When you're done with the changes, create a pull request known as a PR.

- Make sure that your commits pass the validation workflows, are able to run the [tests](testing.md#testing), and build the application.
- Make sure you have followed all the steps in the [PR Review Checklist](#self-review).
- Fill in the pull requested template. Mark your PR as a draft if you're still working on it.
- Don't forget to [link PR to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) if you are solving one.
- When you're satisfied with the PR, mark it as ready for review, and a team member will review it. The team may ask questions or request changes to your PR. Either using [suggested changes](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/incorporating-feedback-in-your-pull-request) or pull request comments.
- As you update your PR and apply changes, mark each conversation as [resolved](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#resolving-conversations).
- While the review process is ongoing, do not force push changes to the branch but make the changes in new [fixup](https://dev.to/koffeinfrei/the-git-fixup-workflow-386d) commits. Only when the PR is otherwise approved, squash the commits and `push --force-with-lease`.

## Your PR is ready to be merged!

Once all the changes have been approved, the reviewers may still ask you to clean the git history before merging the changes into the main branch of the project.

## Self-review

You should always review your own PR first before asking someone to review it. Below you can find a checklist of things you should check before submitting your PR.

- [ ] Confirm that the changes solve the issues the PR is trying to solve partially or fully.
- [ ] Review the code in terms of the [OWASP top 10 security issues](https://owasp.org/Top10/).
- [ ] Verify that the code follows the [Code style guide](contributing.md#code-style-guide).
- [ ] Avoid using `any` at all costs. If there is no way to circumvent using it, document the reason carefully and consider using `@ts-expect-error` instead.
- [ ] There is no code that is repeated within the PR or elsewhere in the repo.
- [ ] All new components, functions and other entities are documented
- [ ] The repo documentation markdown files are updated if the changes touch upon those.
- [ ] If the change adds functions available to the user, tracking events are enabled with new ones defined if needed.
- [ ] Any new Svelte components that have been created, follow the [Svelte component guidelines](contributing.md#svelte-components).
- [ ] Errors are handled properly and logged in the code.
- [ ] Run the unit tests successfully.
- [ ] Run the e2e tests successfully.
- [ ] Troubleshoot any failing checks in the PR.
- [ ] Test the change thoroughly on your own device, including parts that may have been affected via shared code.
- [ ] Check that parts of the application that share dependencies with the PR but are not included in it are not unduly affected.
- [ ] Test the changes using the [WAVE extension](https://wave.webaim.org/extension/) for accessibility.
- [ ] The changes pass the [WGAC A and AA requirements for accessibility](https://usability.yale.edu/web-accessibility/articles/wcag2-checklist).
- [ ] Test the changes using keyboard navigation and screen-reading.
- [ ] Documentation is added wherever necessary.
- [ ] The commit history is clean and linear, and the commits follow the [commit guidelines](contributing.md#commit-your-update)

## Code style guide

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

See the [frontend styling guide](frontend.md#frontend) for information about using Tailwind classes.

### Svelte components

> The frontend currently uses Svelte 4. An update to Svelte 5 is scheduled for H1/2026.

#### File structure

Put each component in its own folder in `$lib/components`, or `$lib/dynamic-components` in case of [dynamic components](#dynamic-and-static-components). Multiple components that are integrally tied together may be included in the same folder (but see note below on exports). Separate the type definitions in a `.type.ts` file and provide an `index.ts` for easy imports. Thus, the `$lib/components/myComponent` folder would have the files:

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

However, if you want to concatenate values with properties in `$$restProps`, such as concatenating a default `class` string with one possibly defined in `$$restProps`, this should be added after `{...$$restProps}`. To make this easier, a `concatClass` helper function is provided in [`$lib/utils/components`](/frontend/src/lib/utils/components.ts). For example:

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

Follow Svelte's [guidelines for component documentation](https://svelte.dev/docs/faq#how-do-i-document-my-components). For an example, see [`IconBase`](/frontend/src/lib/components/icon/base/IconBase.svelte) component and its associated [type definition](/frontend/src/lib/components/icon/base/IconBase.type.ts).

Place the Svelte docstring at the top of the file, before the `<script>` block.

Add documentation for pages, layouts and other non-reusable components, detailing their main purpose. Include in their documentation under separate subheadings:

- `Settings` affecting the page
- Route and query `Params` affecting the behaviour
- `Tracking events` initiated by the page

It is not necessary to duplicate the documentation of the individual properties in the doc string of the `.svelte` file, because the properties should have their explanations directly in the interface definition in the `.type.ts` file (using [`/** ... */` TSDoc comments](https://tsdoc.org/)). The component's possible slots should, however, be included in the doc string.
