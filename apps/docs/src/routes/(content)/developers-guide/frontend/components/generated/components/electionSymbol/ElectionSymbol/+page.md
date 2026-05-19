# ElectionSymbol

Display an entity's election symbol, which is usually a number but may also be an image, e.g. in Pakistan.

### Properties

- `text`: The text of the symbol, e.g. '15' or 'A'. If the symbol is an image, `text` will be used as its `alt` attribute.
- `image`: The `src` of an image election symbol.
- Any valid attributes of a `<span>` element

### Usage

```tsx
<ElectionSymbol>46</ElectionSymbol>
<ElectionSymbol><img src="arrow.png" alt="Arrow"/></ElectionSymbol>
```

## Source

[frontend/src/lib/components/electionSymbol/ElectionSymbol.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/electionSymbol/ElectionSymbol.svelte)

[frontend/src/lib/components/electionSymbol/ElectionSymbol.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/electionSymbol/ElectionSymbol.type.ts)
