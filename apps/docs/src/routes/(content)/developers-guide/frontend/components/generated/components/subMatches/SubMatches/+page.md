# SubMatches

Display an entity's sub-matches.

### Properties

- `matches`: The `SubMatch`es of a `Match`.
- `variant`: Variant layout, controlling the spacing of gauges. @default `'tight'`
- Any valid attributes of a `<div>` element

### Usage

```tsx
<SubMatches matches={ranking.subMatches} />
```

## Source

[frontend/src/lib/components/subMatches/SubMatches.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/subMatches/SubMatches.svelte)

[frontend/src/lib/components/subMatches/SubMatches.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/subMatches/SubMatches.type.ts)
