# TrackingOptOut

A checkbox by which the user opts out of the collection of usage data. Ticked means opt out.

The component only holds the choice. Whether it is shown and what is done with the choice are decided by its caller.

### Dynamic component

Accesses `ComponentContext`.

### Properties

- `optOut`: Bindable: Whether the user opts out of the collection of usage data. Default: `false`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<script lang="ts">
  let optOut = $state(false);
</script>
<TrackingOptOut bind:optOut />
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.svelte)
- Types: [apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/termsOfUse/TrackingOptOut.type.ts)
