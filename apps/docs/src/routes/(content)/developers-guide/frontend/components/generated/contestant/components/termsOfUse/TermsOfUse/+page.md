# TermsOfUse

A utility component for displaying contestant app terms of use and privacy statement.

After the two dynamic texts it shows a section on usage data, `privacy.usageData.title` and `privacy.usageData.content`, when `analytics.trackEvents` is on and an analytics provider is configured (`projection.active` of the app context's `analyticsGate`). The keys are not dynamic, so an override of the dynamic texts does not remove the section. The visitor's own Global Privacy Control signal does not hide it: the terms are the same for every user.

### Dynamic component

Accesses `AppContext`: `appSettings` and `analyticsGate`.

### Usage

```tsx
<TermsOfUse />
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUse.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUse.svelte)
