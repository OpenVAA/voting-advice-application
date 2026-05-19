# EntityCard

A card for displaying a possibly wrapped `Entity`, i.e. a candidate or a party, nomination thereof, or a match, in a list or as part of an `Entity`'s details, possibly including a matching score, sub-matches, nested `EntityCard`s and answers to specified questions.

In nested cards, the layout and rendering of contents varies from that of a parent card to make the layout more compact.

- Some elements are smaller and the title is rendered as `<h4>` instead of `<h3>`.
- The election symbol is shown next to the title.
- Nested nakedEntity cards are not rendered.

### Dynamic component

This is a dynamic component, because it accesses the `dataRoot` and other properties of the `AppContext` as well as the `VoterContext` if used within the `voter` app.

### Properties

- `action`: Custom action to take when the card is clicked, defaults to a link to the entity's `ResultEntity` route. If the card has subentites, the action will only be triggered by clicking the content above them.
- `entity`: A possibly ranked entity, e.g. candidate or a party.
- `variant`: The context-dependend layout variant. Usually set automatically. Default: `'list'`
  - `'list'`: In a list of entities.
  - `'details'`: As part of the header of `EntityDetails`.
  - `'subcard'`: In a list of nested entity cards, e.g., the candidates for a party.
- `maxSubcards`: The maximum number of sub-entities to show. If there are more a button will be shown for displaying the remaining ones. Default: `3`
- `showElection`: Whether to show the possible nomination's election and constituency. Default: `false`
- Any valid attributes of an `<article>` element.

### Tracking events

- `entityCard_expandSubcards`: Fired when the list of sub-entities is expanded.

### Accessibility

- Currently, keyboard navigation is non-hierarchical even when subcards are present. In the future, this should be expanded into a more elaborate system where arrow keys or such can be used to navigate within a card with subcards.

### Usage

```tsx
<EntityCard action={$getRoute({route: 'ResultsCandidate', entityId: candidate.id})}
  content={candidate}>
<EntityCard content={party} variant="details">
```

## Source

[frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte)

[frontend/src/lib/dynamic-components/entityCard/EntityCard.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityCard/EntityCard.type.ts)
