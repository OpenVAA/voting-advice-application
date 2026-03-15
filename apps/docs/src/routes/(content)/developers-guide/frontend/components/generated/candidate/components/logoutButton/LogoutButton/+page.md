# LogoutButton

Allows user to log out. Displays modal notification if the user hasn't filled all the data.

### Dynamic component

Accesses `CandidateContext`.

### Properties

- `logoutModalTimer`: The duration in seconds a logout modal will wait before automatically logging the user out. Default: `30`
- `stayOnPage`: Whether pressing the button takes the user to the login page or not. Default: `false`
- Any valid properties of a `Button` component

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.

### Usage

```tsx
<LogoutButton />
```

## Source

[frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte)

[frontend/src/lib/candidate/components/logoutButton/LogoutButton.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/candidate/components/logoutButton/LogoutButton.type.ts)
