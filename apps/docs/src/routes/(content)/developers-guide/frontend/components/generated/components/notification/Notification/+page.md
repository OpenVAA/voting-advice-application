# Notification

Show a notification popup to the user.

### Properties

- `data`: The data for the notification to show.
- Any valid properties of an `<Alert>` component.

### Usage

```tsx
<Notification data={$appSettings.notifications.voterApp} />
```

## Source

[frontend/src/lib/components/notification/Notification.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/notification/Notification.svelte)

[frontend/src/lib/components/notification/Notification.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/notification/Notification.type.ts)
