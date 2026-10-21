# LogoutButton

Allows user to log out. Before logging out, the button asks the tasks of the entity being edited whether anything is left that the user can do now: when the profile or the questions task is incomplete with unanswered questions to count, a modal says how many are left and lets the user go on entering data. The user is logged out at once when no entity is loaded, e.g. on a page whose URL names none, when answers are locked, when nothing is left, and when what is left is not the user's to do here or has nothing to count: a missing nomination, a task that is blocked, a profile that lacks only its name.

### Dynamic component

Accesses `ContestantContext`.

### Properties

- `logoutModalTimer`: The duration in seconds a logout modal will wait before automatically logging the user out. Default: `30`
- Any valid properties of a `Button` component

### Settings

- `entities.hideIfMissingAnswers`: Affects message shown. The key read is that of the selected entity's type.

### Usage

```tsx
<LogoutButton />
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte)
- Types: [apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.type.ts)
