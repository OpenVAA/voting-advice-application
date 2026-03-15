# MatchScore

Display an entity's match score.

### Properties

- `score`: The match score as a `string` or a `number`. Note that `$t('components.matchScore.label')` will be used display the score.
- `label`: The label to display under the score. Default: `$t('components.matchScore.label')`
- `showLabel`: Whether to show the label. Default: `true`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<MatchScore score="25%" />
```

## Source

[frontend/src/lib/components/matchScore/MatchScore.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/matchScore/MatchScore.svelte)

[frontend/src/lib/components/matchScore/MatchScore.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/matchScore/MatchScore.type.ts)
