# Routing

Routing is based on either route or search parameters:

- Route parameters are used when the parameters are required, such as the `entityType` and `entityId` parameters on the route displaying individual `Entity`s.
- Search parameters are used when the parameters are always or sometimes optional, such as the `electionId` parameter which is optional if the data only has one `Election` or the `elections.disallowSelection` setting is `true`.

For a list of the parameters in use, see [params.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/routes/params.ts). Some of the parameters (`ArrayParam`s) support multiple values but always accept single values as well.

For implying optional parameters, the utilities in [impliedParams.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/routes/impliedParams.ts) are used.

### Building routes

Routes are constructed using the [`buildRoute`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/routes/buildRoute.ts) function, which takes as arguments the name of the [`Route`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/routes/route.ts), parameter values and values of the current route.

In most cases, the [`getRoute`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/app/getRoute.svelte.ts) handle of [`AppContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/app/appContext.type.ts) is used. Its `current` property is the route builder bound to the current route, so parameters that are already in effect need not be supplied again.

Calling `getRoute.current('Results')`, for example, builds a route to the Results page that keeps the currently selected `electionId`s and `constituencyId`s. They can also be set explicitly, such as on the election selection page, with `getRoute.current({ route: 'Results', electionId: ['e1', 'e2'] })`.

The locale is not a route parameter. It is resolved by Paraglide's URL strategy, and the builder adds the locale prefix to the URL it returns.

When passing parameters to [`buildRoute`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/routes/buildRoute.ts) or `getRoute.current`, search and route parameters need not be treated differently. The function will take care of rendering them correctly.

### App Routes

See the [auto-generated route map](/developers-guide/frontend/routing/generated).
