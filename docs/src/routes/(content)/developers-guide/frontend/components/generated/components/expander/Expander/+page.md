# Expander

A component for expanders that contain a title and some content. Use the
`variant` prop to specify the expander type.

- `read-more`: the default style of the expander. Used, for example, for getting
  more information about a question.
- `question`: a more prominent style of the expander. Used in question listings
  to display a question that can be expanded to reveal further information.
- `category`: the most prominent style of the expander. Used for collapsible
  categories of items, such as questions.
- `question-help`: used to display questions and answers in the style of the help page.

### Properties

- `title`: Title is seen as the text in the expander's visible part, and it is mandatory. Title will also be used as a 'aria-label' for a checkbow on which the expander operates on.
- `iconColor`: The color of the next-icon that is used in the expander. Default: `'primary'`
- `iconPos`: The position of the next-icon that is used in the expander. Default: `'text'`
- `titleClass`: Variable with which to configure the expanders title if no variants are in use.
- `contentClass`: Variable with which to configure the expanders content if no variants are in use.
- `defaultExpanded`: Variable used to define if the expander is expanded or not by default.
- `variant`: Variable used to define a variant for the expander.
- Any valid attributes of a `<div>` element.

You should not try to use a variant and customize at the same time.

### Events

- `expand`: Fired when the expander is expanded.
- `collapse`: Fired when the expander is collapsed.

### Usage

```tsx
<Expander title="Example title">
  <p>Example content<p/>
</Expander>

<Expander title="Example title" variant="category"  iconColor="primary"
  titleClass="bg-base-100 text-primary" contentClass="bg-base-300 text-info font-bold">
  <p>Example content<p/>
</Expander>
```

## Source

[frontend/src/lib/components/expander/Expander.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/expander/Expander.svelte)

[frontend/src/lib/components/expander/Expander.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/expander/Expander.type.ts)
