# ElectionTag

Used to display an election tag with the election's color.

Used when the application has multiple elections and question may apply to only some of them.

### Properties

- `election`: The `Election` object.
- `variant`: Whether to use an abbreviation or the full name. Default: `'short'`
- `onShadedBg`: Set to `true` if using the component on a dark (`base-300`) background. Default: `false`
- Any valid attributes of a `<span>` element.

### Usage

```tsx
<ElectionTag {election}/>
```

## Source

[frontend/src/lib/components/electionTag/ElectionTag.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/electionTag/ElectionTag.svelte)

[frontend/src/lib/components/electionTag/ElectionTag.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/electionTag/ElectionTag.type.ts)
