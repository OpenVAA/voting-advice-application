# EntityCardAction

A simple utility component for possibly wrapping content in an action handler.

TODO[Svelte 5]: Maybe convert into `$snippet`.

### Properties

- `action`: The action to take when the part or card is clicked.
- `shadeOnHover`: Whether to shade the element on hover. Use when applying to subcards or their parent card's header. Default: `false`
- Any valid attributes common to HTML elements. Note that these will only be applied if `<EntityCardAction>` is rendered.

### Slots

– default: The contents to wrap.

### Usage

```tsx
<EntityCardAction action={$getRoute({ route: 'ResultsCandidate', entityId: candidate.id })}>
  Content here
</EntityCardAction>
```

## Source

[frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte)

[frontend/src/lib/dynamic-components/entityCard/EntityCardAction.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.type.ts)
