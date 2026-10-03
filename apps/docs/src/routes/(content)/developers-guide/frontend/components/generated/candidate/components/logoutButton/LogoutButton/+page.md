# LogoutButton

Allows user to log out. Displays modal notification if the user hasn't filled all the data.

### Dynamic component

Accesses `CandidateContext`.

### Properties

- `logoutModalTimer`: The duration in seconds a logout modal will wait before automatically logging the user out. Default: `30`
- Any valid properties of a `Button` component

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.

### Usage

```tsx
<LogoutButton />
```

## Source

- Component: [apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte)
- Types: [apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.type.ts)
