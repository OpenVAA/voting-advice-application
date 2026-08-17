# Authentication

Standard read calls require no authentication and are included in the default permissions, which are customized in the [Users’ permissions plugin](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/extensions/users-permissions/strapi-server.ts).

Furthermore, all API routes are configured

Write calls require authentication:

- For registered Candidates, this is handled by creating a user. Read more in the [Candidate App documentation](/developers-guide/candidate-user-management/creating-a-new-candidate).
- For pre-registration, an API token with the `users-permissions.candidate.preregister` priviledge is required, which must be saved in the `BACKEND_API_TOKEN` env variable. Read more on creating the token in the [Strapi documenation](https://docs.strapi.io/user-docs/settings/API-tokens#creating-a-new-api-token).

### Adding new content types

If you add new content types that should be accessible, make sure:

1. Edit the `CONTENT_API` list in [api.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/util/api.ts) to grant read rights to the public
2. Add the permission in the [Users’ permissions plugin](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/extensions/users-permissions/strapi-server.ts) so that registered users are granted access sa well
3. Also make sure that the route config includes the default restrictions:

```ts
// /src/api/<COLLECTION>/routes/<COLLECTION>.ts
export default factories.createCoreRouter('api::<COLLECTION>.<COLLECTION>', {
  only: ['find', 'findOne'], // Explicitly disabled create, update, delete
  config: {
    find: {
      policies: ['global::restrict-populate']
    },
    findOne: {
      policies: ['global::restrict-populate']
    }
  }
});
```
