# LogoutButton

Allows user to log out.

### Dynamic component

Accesses `AuthContext` and `AppContext`.

### Properties

- `redirectTo`: The route to redirect to after logging out. Default: `'Home'`
- Any valid properties of a `<Button>` component.

### Usage

```tsx
<LogoutButton />
```

## Source

[frontend/src/lib/dynamic-components/logoutButton/LogoutButton.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.svelte)

[frontend/src/lib/dynamic-components/logoutButton/LogoutButton.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.type.ts)
