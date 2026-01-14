# ProgressBar

Reusable progress bar component for displaying task progress.

### Properties

- `progress`: Progress value between 0 and 1.
- `label`: Label for the progress bar. Default: `t('adminApp.jobs.progress')`
- `showPercentage`: Whether to show the percentage. Default: `true`
- `color`: Color theme for the progress bar. Default: `'primary'`
- `size`: Size of the progress bar. Default: `'md'`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<ProgressBar progress={0.75} label="Processing" />
```

## Source

[frontend/src/lib/components/controller/ProgressBar.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/controller/ProgressBar.svelte)

[frontend/src/lib/components/controller/ProgressBar.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/controller/ProgressBar.type.ts)
