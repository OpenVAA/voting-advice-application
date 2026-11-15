# ContestantNav

A template part that outputs the navigation menu for the Contestant App for use in `Layout`.

### Dynamic component

- Accesses the `ContestantContext`.

### What the menu shows

- Signed in: the home item, Help and Privacy on every page. The items of the entity being edited are shown only on a page whose URL names an entity the user edits, because their links are built from the entity in the URL. They are, in this order: nominations, profile, questions, preview and settings.
- The menu keeps one shape: an item whose page the entity cannot open is disabled, not removed, and no icon changes with the entity's state. What is closed is read from the context's task state. The profile and the questions items are closed while the entity has no nomination, and the preview item is closed until the state says the preview is open. The nominations and the settings items are never closed.
- A closed item has no link target and is not a tab stop. It is announced as an unavailable link and is dimmed, and it is described by the reason line: one sentence, the same as on the entity's home, in a list item of its own directly after the preview item. The line is rendered only while an item is closed for a known reason.
- Until the entity's question data is loaded the profile and the questions items are open and the preview item is closed with no reason line.
- The questions item is left out for an entity that is known to be asked no opinion question. It is rendered until that is known, so it does not disappear and come back for an entity that has questions. Its badge shows the number of unanswered opinion questions while there is one.
- On such a page the group of those items is titled with the type and the name of that entity, and marked `contestant-nav-entity-group`. Both come from the list of the entities the user edits, so the title is right before the entity's data has loaded.
- A user who edits several entities gets one more item on such a page, the last of that group: a link to the app root, where they choose another entity. It is absent on a page whose URL names no entity, where the home item leads to the same place.
- Signed out: the login item, one registration item, and the forgotten-password, Help and Privacy items. The registration item leads to the registration page and is shown exactly when the application settings list at least one registration mode, which is when that page is served.

### Properties

- Any valid properties of a `Navigation` component

### Usage

```tsx
<ContestantNav>
  <NavItem onclick={closeMenu} icon="close" text="Close" />
</ContestantNav>
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.type.ts)
