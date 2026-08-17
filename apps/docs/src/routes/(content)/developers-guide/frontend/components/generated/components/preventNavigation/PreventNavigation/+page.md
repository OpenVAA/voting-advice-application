# PreventNavigation

Functional component used to block user nagivation.

### Properties

- `active`: Whether the navigation should be prevented or not. This can also be callback to cater for changes that would required re-rendering the component.
- `onCancel`: A callback function that is called when the navigation is about to be cancelled.
- `onConfirm`: A callback function that is called when the navigation is about to be confirmed.

### Usage

```tsx
<PreventNavigation active={true} onCancel={resetAnswers} />
```

## Source

[frontend/src/lib/components/preventNavigation/PreventNavigation.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/preventNavigation/PreventNavigation.svelte)

[frontend/src/lib/components/preventNavigation/PreventNavigation.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/preventNavigation/PreventNavigation.type.ts)
