# ScoreGauge

Show a radial or a linear score gauge for a sub-match.

### Properties

- `score`: The score of the gauge in the range from 0 to `max`, usually 100.
- `max`: The maximum value of the gauge. @default 100
- `label`: The text label for the gauge, e.g. the name of the category.
- `variant`: The format of the gauge. @default 'linear'
- `showScore`: Whether to also show the score as numbers. @default true
- `unit`: The string to add to the score if it's shown, e.g. '%'. @default ''
- `colors`: The colors of the gauge. @default 'oklch(var(--n))' i.e. the `neutral` color.
- Any valid attributes of a `<div>` element

```tsx
<ScoreGauge score={23} label={category.name}
  color={category.color} colorDark={category.colorDark}
  variant="radial"/>
<ScoreGauge score={23} label={category.name}/>
```

## Source

[frontend/src/lib/components/scoreGauge/ScoreGauge.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/scoreGauge/ScoreGauge.svelte)

[frontend/src/lib/components/scoreGauge/ScoreGauge.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/scoreGauge/ScoreGauge.type.ts)
