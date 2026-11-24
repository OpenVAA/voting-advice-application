# LogoutButton

Logs the user out, with the app's own sign-out passed in. Both apps' Log out is this button.

Before logging out it opens a modal when the app passes a `warning`, which says what is left undone, or when the page holds unsaved changes; otherwise the user is logged out at once. The Contestant App passes a warning while a counted task of the entity being edited is incomplete: the modal then says how many questions are left and lets the user go on entering data. A navigation closes the modal, so it never counts down on a page it was not opened on. While the modal is open its count is also kept in two cookies whose deadline the browser keeps, so a tab closed during the count is signed out at the browser's next request after its end; every close of the modal, and the start of a sign-out, removes them. With unsaved changes on the page the modal opens whatever is left, says they will be lost, and its count ends in a logout that discards them; Continue, its close button and Escape keep them. While the sign-out the modal's Log out or its count's end started runs, the close button and Escape do nothing, and the modal stays until the sign-out settles. A link followed while a sign-out it started runs asks nothing and waits: after a sign-out that worked the user is on the login page, and after one that failed the link is followed.

The app's `logout` navigates to its login itself, and the count's end hands it the reason `loggedOutAutomatically`. A sign-out that fails is logged and the page stays. A press while one runs does nothing.

### Dynamic component

Accesses the component context for its translations and the app context for its tracking, and nothing of the Contestant App's or the Admin App's context: the app's sign-out and what is left undone come in as props.

### Properties

- `logout`: The app's own sign-out, which navigates to the app's login after a sign-out that worked. It rejects when the sign-out failed.
- `warning`: What is left undone: the unanswered opinion and required info questions and whether the entity is hidden while opinion questions are unanswered. When it is set the modal opens before logging out.
- `logoutModalTimer`: The duration in seconds a logout modal will wait before automatically logging the user out. Default: `30`
- Any valid properties of a `Button` component

### Tracking events

- `logout_warned`: Sent when the modal is answered, with `proceeded` true when its Log out or the count's end starts the logout and false when Continue, its close button or Escape keeps the user in. A navigation that closes the modal sends nothing.

### Accessibility

With unsaved changes on the page the modal's dialog is named by the sentence saying they will be lost, while its visible title stays Log out, so a reader that speaks a dialog's name and not its description on entry says it; otherwise the dialog is named by its title. It is described by what else it says is at stake and by the sentence with its count at the count's full length, from a hidden copy that leaves out the sentence the name already says, so the description stays the same while the visible number runs. Focus goes to Continue when the modal opens.

### Usage

```tsx
<LogoutButton logout={contestantCtx.logout} warning={contestantLogoutWarning(contestantCtx)} />
<LogoutButton logout={adminCtx.logout} />
```

## Source

- Component: [apps/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.svelte)
- Types: [apps/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.type.ts)
