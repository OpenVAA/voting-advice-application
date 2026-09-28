# EntityDetailsDrawer

A `Drawer` that displays `EntityDetails`.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- Any valid properties of a `<Drawer>` component

### Usage

```tsx
<EntityDetailsDrawer {entity} onClose={() => console.info('Closed!')}/>
```

## Source

[apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetailsDrawer.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetailsDrawer.svelte)

[apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetailsDrawer.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetailsDrawer.type.ts)
