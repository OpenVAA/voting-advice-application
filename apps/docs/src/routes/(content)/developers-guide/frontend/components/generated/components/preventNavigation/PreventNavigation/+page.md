# PreventNavigation

Functional component used to block user navigation with a native question. Something that ends the page's state without navigating first, the logout modal, finds the same guard through `navigationGuards` and asks nothing. While `holdNavigationWhile` holds navigations, during a sign-out, the guard asks nothing and does not stop the tab from closing.

### Properties

- `active`: Whether the navigation should be prevented or not. This can also be callback to cater for changes that would required re-rendering the component.
- `onCancel`: A callback function that is called when the navigation is about to be cancelled, or when the user chose to stay in the logout modal.
- `onConfirm`: A callback function that is called when the navigation is about to be confirmed, or after the sign-out that an answer to the logout modal led to.

### Usage

```tsx
<PreventNavigation active={() => hasUnsaved} onConfirm={resetAnswers} />
```

## Source

- Component: [apps/frontend/src/lib/components/preventNavigation/PreventNavigation.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/preventNavigation/PreventNavigation.svelte)
- Types: [apps/frontend/src/lib/components/preventNavigation/PreventNavigation.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/preventNavigation/PreventNavigation.type.ts)
