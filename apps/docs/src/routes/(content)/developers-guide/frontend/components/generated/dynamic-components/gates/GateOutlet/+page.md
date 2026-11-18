# GateOutlet

Render the view of the gate a protected layout's server load reported in place of the page, or the page when no gate applies. Both apps' protected layouts render it, each with its own record of views.

### Dynamic component

Reads SvelteKit's navigation state, to tell a view replaced by a rerun load from one replaced by a navigation.

### Properties

- `gate`: The id of the gate the server load reported, or `null` or `undefined` when no gate applies.
- `views`: The view of each gate of the app, keyed by its id.
- `children`: The page, rendered when no gate applies.

### Accessibility

- Moves focus to the navigation target of the view it renders when that view replaced another without a navigation, as when a gate is passed. On first render and while a navigation is in flight it requests nothing.

### Usage

```tsx
<GateOutlet gate={data.gate} views={GATE_VIEWS}>
  {@render children?.()}
</GateOutlet>
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/gates/GateOutlet.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/gates/GateOutlet.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/gates/GateOutlet.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/gates/GateOutlet.type.ts)
