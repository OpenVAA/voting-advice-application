# NominationCard

A card of one nomination: its election as the heading, a list of labelled rows, and what the caller puts under them.

### Properties

- `title`: The card's heading: the name of the nomination's election.
- `titleTestId`: The test id of the card's heading.
- `rows`: The rows of the card, in order. Each has a `label`, a `value` rendered as text, the `testId` of the value and, optionally, a `line` with its own `testId`, shown under the value in the value's own element.
- `children`: What the card holds under its rows, such as its notes and its buttons.
- Any valid attributes of an `<article>` element.

### Accessibility

- The card is an `<article>` named by its heading.
- A label and its value are a `<dt>` and `<dd>` pair, the label above the value at every width, and a long value wraps at any character.

### Usage

```tsx
<NominationCard
  title={nomination.electionName}
  titleTestId="nomination-election"
  rows={[{ label: t('common.constituency'), value: nomination.constituencyName, testId: 'nomination-constituency' }]}
  data-testid="contestant-nomination">
  <p class="small-info mt-md">{t('contestantApp.nominations.state.pendingInfo')}</p>
</NominationCard>
```

## Source

- Component: [apps/frontend/src/lib/contestant/components/nominationCard/NominationCard.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/nominationCard/NominationCard.svelte)
- Types: [apps/frontend/src/lib/contestant/components/nominationCard/NominationCard.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contestant/components/nominationCard/NominationCard.type.ts)
