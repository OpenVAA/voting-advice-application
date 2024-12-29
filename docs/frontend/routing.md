## Routing

Routing is based on either route or search parameters:

- Route parameters are used when the parameters are required, such as the `entityType` and `entityId` parameters on the route displaying individual `Entity`s.
- Search parameters are used when the parameters are always or sometimes optional, such as the `electionId` parameter which is optional if there data only has one `Election` or the `elections.disallowSelection` setting is `true`.

For a list of the parameters in use, see [params.ts](../../frontend/src/lib/utils/route/params.ts). Some of the parameters (`ArrayParam`s) support multiple values but always accept single values as well.

For implying optional parameters, the utilities in [impliedParams.ts](../../frontend/src/lib/utils/route/impliedParams.ts) are used.

### Building routes

Routes are constructed using the [`buildRoute`](../../frontend/src/lib/utils/route/buildRoute.ts) function, which takes as arguments the name of the [`Route`](../../frontend/src/lib/utils/route/route.ts), parameter values and values of the current route.

In most cases, the dynamic function contained in the [`getRoute`](../../frontend/src/lib/contexts/app/getRoute.ts) store of [`AppContext`](../../frontend/src/lib/contexts/app/appContext.type.ts) is used. It automatically supplies the current route to the route builder, so that already effective parameters need not be explicitly supplied.

Calling `$getRoute('Results')`, for example, will build a route to the Results page taking into account the currently selected `electionId`s, `constituencyId`s and `lang`. They can also be set explicitly, such as on the election selection page, with `$getRoute({ route: 'Results', electionId: ['e1', 'e2'] })`.

When passing parameters to [`buildRoute`](../../frontend/src/lib/utils/route/buildRoute.ts) or [`$getRoute`](../../frontend/src/lib/contexts/app/getRoute.ts), search and route parameters need not be treated differently. The function will take care of rendering them correctly.
