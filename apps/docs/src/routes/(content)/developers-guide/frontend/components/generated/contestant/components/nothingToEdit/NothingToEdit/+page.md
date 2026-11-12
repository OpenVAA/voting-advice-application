# NothingToEdit

A whole view for a signed-in user who has nothing to edit: a title, an explanation, the email address the user is signed in with, what to do next, and two actions, contacting support and logging out. It renders its own `MainContent`, so a page shows it with one tag and nothing around it.

The view offers no way into the pages of an entity and builds no route into them.

### Dynamic component

Accesses `ContestantContext`. The signed-in email is read from the context's `user`; when the user has no email, the label and the address are left out together.

### Properties

- `title`: The page title. Default: `t('contestantApp.nothingToEdit.title')`
- `children`: Replaces the default explanation, e.g. to give another reason the user has nothing to edit.

### Accessibility

- The address is a `<dd>` under its label, so it is announced with the label. It is never hyphenated or translated, and it wraps at any character rather than overflowing.

### Usage

```tsx
<NothingToEdit />
<NothingToEdit title="Your Email Is Not Confirmed">
  <p class="text-center">Confirm your email address to continue.</p>
</NothingToEdit>
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte)
- Types: [apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.type.ts)
