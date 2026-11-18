# ReadFailure

The view shown in place of a page when the data of the signed-in user could not be read: the error message, a sentence saying that the user is still signed in, a button that tries again, the support block and logout. Trying again reruns every load of the page, and the user stays signed in throughout.

The view shows nothing of the failure itself: the load that met it logs it. It builds no route into the pages of an entity, so it can be rendered on a page whose URL names none.

### Dynamic component

Accesses `ContestantContext`.

### Properties

- `title`: The error message the view is headed with. Default: `t('error.default')`
- Any valid attributes of a `<div>` element.

### Accessibility

- While the loads rerun, the Try again button shows that it is loading and cannot be pressed again. When the rerun ends with the view still shown, focus is given back to the button if it was lost.

### Usage

```tsx
<ReadFailure />
<ReadFailure class="bg-base-300" />
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/readFailure/ReadFailure.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/readFailure/ReadFailure.svelte)
- Types: [apps/frontend/src/lib/contestant/components/readFailure/ReadFailure.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/readFailure/ReadFailure.type.ts)
