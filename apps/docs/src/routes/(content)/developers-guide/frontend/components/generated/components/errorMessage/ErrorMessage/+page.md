# ErrorMessage

Used to display an error message. Also logs the error to the console.

### Properties

- `inline`: Whether to show an inline version of the message. By default the message tries to center itself in the available area and displays a large emoji. Default: `false`
- `message`: The message to display. Default: `$t('error.default')`
- `logMessage`: The message to log in the console in development mode. Default: value of `message`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<ErrorMessage />
```

## Source

[frontend/src/lib/components/errorMessage/ErrorMessage.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/errorMessage/ErrorMessage.svelte)

[frontend/src/lib/components/errorMessage/ErrorMessage.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/errorMessage/ErrorMessage.type.ts)
