# Security

By default, all content types inside Strapi are assumed to be safe to be publicly exposed. For reading, all the fields except any fields marked with the `private` keyword in their schema definition are returned per how Strapi works. For writing, the majority of the create, update, and delete endpoints are disabled by default unless explicitly used by the candidate application, and otherwise restricted to only resources that belong to the logged in candidate to prevent unauthorized modification of the data.

The restrictions are enforced using policies for each content type's route, usually found in the `backend/vaa-strapi/src/api/[schema]/routes/[schema].ts` file. To simplify this, there are a couple of helper functions available in [acl.ts](`../backend/vaa-strapi/src/util/acl.ts`) and [policies](`../backend/vaa-strapi/src/policies/`). Please see [Strapi's documentation on policies](https://docs.strapi.io/dev-docs/backend-customization/policies#usage) on how to use them.

The default permissions unauthenticated and authenticated users are managed in the [strapi-server.js](..backend/vaa-strapi/src/extensions/users-permissions/strapi-server.js) file, in the `defaultPermissions` array.

## filter-by-candidate

Enforces that all the returned content belongs to the currently authenticated candidate by filtering the `candidate` field. This is primarily meant only for the find and findOne endpoints so that they only return resources belonging to the authenticated candidate in case the content type shouldn't be public for everyone.

Example usage:
```ts
export default factories.createCoreRouter('...', {
  ...
  config: {
    find: {
      policies: [
        'global::filter-by-candidate',
      ],
    },
  },
});
```

## owned-by-candidate

Enforces that the request applies the `candidate` field to the currently authenticated candidate. This is primarily meant only for the create and update endpoints so that the created and updated resources body will always have the candidate set to the authenticated candidate to prevent impersonation.

Example usage:
```ts
export default factories.createCoreRouter('...', {
  ...
  config: {
    create: {
      policies: [
        'global::owned-by-candidate',
      ],
    },
  },
});
```

## restrictPopulate

Enforces that only the allowed populate fields are set to prevent leaking content types from relationships. Strapi does not implement a convenient way to restrict populates, so this would need to be enforced for every content type that is able to eventually return the content type even if there is no direct relationship. For example, if there were the `shop -> pizza -> ingredient` relationship where `ingredient` should not be exposed to the public, it is still possible to use populate to get `ingredient` through the `shop` endpoint using the `shop -> pizza` and `pizza -> ingredient` relationship.

Example usage:
```ts
export default factories.createCoreRouter('...', {
  ...
  config: {
    find: {
      policies: [
        restrictPopulate([
          'pizza', // ?populate[pizza]=true
          'pizza.populate.shop' // ?populate[pizza][populate][shop]=true
        ]),
      ],
    },
  },
});
```

## restrictFields

Enforces that only the allowed fields are returned from the content type. If no fields are explicitly provided (using the `?fields=...` syntax in the request), it will default to only providing the allowed fields. This is intended for all the request endpoints as they all return the content type the action is performed on. Note that you should use the `private` field in the content type schema first for increased security (making this redundant), but if that isn't possible then this is an alternative option. This also has same caveats as `restrictPopulate` where the fields will not apply to relationships returned, and the field that shouldn't be returned will still be returned through populate if not carefully restricted.

Example usage:
```ts
export default factories.createCoreRouter('...', {
  ...
  config: {
    find: {
      policies: [
        restrictFields(['id', 'name']), // will allow returning id, name, or a subset of those
      ],
    },
  },
});
```

## restrictBody

Enforces that only the allowed fields are allowed in the body. This is primarily meant only for the create and update endpoints to prevent modifying fields that should not be modified in the content type.

Example usage:
```ts
export default factories.createCoreRouter('...', {
  ...
  config: {
    update: {
      policies: [
        restrictBody(['name']), // will only setting the name field in the body
      ],
    },
  },
});
```

## restrictResourceOwnedByCandidate

Enforces that the accessed resource belongs to the currently authenticated user by verifying that the accessed resource has `candidate` relationship to the authenticated user. This is primarily meant only for the findOne, create, update, and delete endpoints to prevent modification to resources not owned by that candidate. Note that one needs to be careful and make sure that the currently authenticated user is unable to modify another user's resource and set their candidate field to be themselves before performing modifications.

Example usage:
```ts
export default factories.createCoreRouter('api::my-content', {
  ...
  config: {
    update: {
      policies: [
        restrictResourceOwnedByCandidate('api::my-content'), // the content type name is needed for the checks
      ],
    },
  },
});
```

# Preset

Here is a default preset one can use for new content-type that aims to be secure by default:
```ts
export default factories.createCoreRouter('...', {
  only: ['find', 'findOne', 'create', 'update', 'delete'],
  config: {
    find: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
    findOne: {
      policies: [
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
    create: {
      policies: [
        // Enforce ownership to always belong to the candidate
        'global::owned-by-candidate',
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
    update: {
      policies: [
        // Allow only updating candidate's own resource
        restrictResourceOwnedByCandidate('...'),
        // Enforce ownership to always belong to the candidate
        'global::owned-by-candidate',
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
    delete: {
      policies: [
        // Allow only deleting candidate's own resource
        restrictResourceOwnedByCandidate('api::answer.answer'),
        // Disable populate by default to avoid accidentally leaking data through relations
        restrictPopulate([]),
      ],
    },
  },
});
```
Note that if you do not need the create, update, and delete endpoints, one should disable them by removing them from the `only` array.
