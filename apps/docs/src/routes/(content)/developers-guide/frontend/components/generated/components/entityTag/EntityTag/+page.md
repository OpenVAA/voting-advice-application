# EntityTag

Used to display an `Entity` as small tag including an icon.

### Properties

- `entity`: A possibly wrapped entity, e.g. candidate or an organization.
- `variant`: Whether to use an abbreviation or the full name. Default: `'default'`
- `hideParent`: Whether to hide the possible parent nomination. Default: `false`
- Any valid attributes of a `<div>` element.

### Usage

```tsx
<EntityTag entity={organization}/>
<EntityTag entity={nomination.parentNomination} variant="short"/>
```

## Source

[apps/frontend/src/lib/components/entityTag/EntityTag.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/entityTag/EntityTag.svelte)

[apps/frontend/src/lib/components/entityTag/EntityTag.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/components/entityTag/EntityTag.type.ts)
