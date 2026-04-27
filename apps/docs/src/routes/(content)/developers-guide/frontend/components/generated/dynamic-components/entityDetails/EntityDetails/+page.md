# EntityDetails

Used to show an entity's details, possibly including their answers to `info` questions, `opinion` questions and their child nominations. You can supply either a naked entity or a ranking containing an entity.

If the provided entity is a (possibly matched) nomination, the questions to include will be those applicable to the election and constiuency of the nomination.

If `AppContext.$appType` is `voter`, the voter’s possible answers will included in the `opinions` tab.

### Dynamic component

This is a dynamic component, because it accesses the `dataRoot` and other properties of the `AppContext` as well as the `VoterContext` if used within the `voter` app.

### Properties

- `entity`: A possibly ranked entity, e.g. candidate or a party.
- Any valid attributes of an `<article>` element.

### Tracking events

- `entityDetails_changeTab`: Fired when the user changes the active tab. Has a `section` property with the name of the tab.

### Usage

```tsx
<EntityDetails
  entity={matchedCandidate}/>
<EntityDetails
  entity={matchedOrganization}
  tabs={$appSettings.entityDetails.contents.organization}/>
```

## Source

[frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte)

[frontend/src/lib/dynamic-components/entityDetails/EntityDetails.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.type.ts)
