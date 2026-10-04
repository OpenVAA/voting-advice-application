# Routing

The frontend uses SvelteKit's file-based routing in [`apps/frontend/src/routes`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/routes). For the full tree, see the [auto-generated route map](/developers-guide/frontend/routing/generated).

## No locale segment

No route has a locale segment. The locale prefix in a URL, such as `/fi/elections`, is handled by Paraglide: the `reroute` hook in `src/hooks.ts` removes it with `deLocalizeUrl` before SvelteKit matches the route, and the route builder adds it back with `localizeHref`. See [Locale resolution](/developers-guide/localization/locale-resolution).

## The route tree

| Directory                | Contents                                                                                                                                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `(voters)/`              | The Voter App. The `(voters)` group adds no URL segment, so the Voter App's front page is `/`.                                                                                                             |
| `(voters)/(located)/`    | The Voter App pages that need selected elections and constituencies: the questions and the results. Its `+layout.ts` redirects to the selection pages when the selection is missing and cannot be implied. |
| `candidate/`             | The Candidate App: login, registration, pre-registration, password reset, help and privacy.                                                                                                                |
| `candidate/(protected)/` | The Candidate App pages that need a signed-in session: profile, questions, preview and settings.                                                                                                           |
| `admin/`                 | The Admin App's login page.                                                                                                                                                                                |
| `admin/(protected)/`     | The Admin App pages that need a signed-in session: the dashboard, jobs, question info and argument condensation.                                                                                           |
| `api/`                   | Server endpoints: the Admin App's job control, auth, the bank-authentication (OIDC) exchange, candidate pre-registration, `data/[collection]` and `feedback`.                                              |

The `(protected)` group is defined once, as `PROTECTED_GROUP` in `$lib/routes`. The request hook redirects a user without a session away from any route whose id contains it. See [Request hooks](/developers-guide/frontend/intro#request-hooks).

## `$lib/routes`

[`$lib/routes`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/routes) holds everything the app knows about its routes:

- `ROUTE` in `route.ts` maps a route key, such as `Results` or `CandAppProfile`, to a SvelteKit route id. `Route` is the type of the keys.
- `isCandidateRoute`, `isApiRoute` and `isProtectedRoute` in `route.ts`, and `isAdminRoute` in `appGates.ts`, decide membership from a route id, never from a URL path.
- `APP_GATES` and `resolveAppGate` in `appGates.ts` are the table the request hook uses to gate the Candidate App and the Admin App.
- `params.ts` lists the parameters, `parseParams.ts` reads them from the current page, and `impliedParams.ts` implies elections and constituencies that need not be selected.
- `buildRoute.ts` builds URLs.

`routeConsistency.test.ts` checks `ROUTE` against the route tree in `yarn test:unit`. When you add a route under a `(protected)` directory, also add a `ROUTE` entry for it. Two keys, `AdminAppJob` and `AdminAppFactorAnalysis`, have no page yet; the test lists them in `KNOWN_UNBUILT_PROTECTED_ROUTES`.

## Parameters

A route uses route parameters and search parameters:

- Route parameters are path segments, such as `questionId` in `/questions/[questionId]`, or `electionTab`, `entityTab`, `entity` and `id` in the results route. They are listed in `ROUTE_PARAMS`.
- Search parameters are in the query string. `electionId` and `constituencyId` are `PERSISTENT_SEARCH_PARAMS`: the route builder carries them over from the current page. They are also `ARRAY_PARAMS`, which accept several values and a single value alike. They can be left out when they can be implied, for example when there is only one election or the `elections.disallowSelection` setting is `true`.

The results route's `entityTab` and `entity` segments use the param matchers `etPl` and `etSg` in `src/params`, which accept only the plural and singular entity type names.

## Building routes

Routes are built with [`buildRoute`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/routes/buildRoute.ts). It takes a route key or an options object with the key, the parameter values and an optional `locale`, and optionally the current page. It combines the route's default parameters, the persistent search parameters of the current page and the ones you pass, puts each in the path or the query string, and adds the locale prefix with Paraglide's `localizeHref`. You never need to tell it which parameters are route parameters and which are search parameters.

In components, use the `getRoute` handle of the [`AppContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/app/appContext.type.ts) instead. Its `current` property is a route builder bound to the current page, so the parameters already in effect need not be passed again:

```ts
const appCtx = getAppContext();

// The Results page, keeping the current electionId and constituencyId
appCtx.getRoute.current('Results');

// The Results page for two elections
appCtx.getRoute.current({ route: 'Results', electionId: ['e1', 'e2'] });

// The current page in Finnish
appCtx.getRoute.current({ locale: 'fi' });
```

`getRoute` itself is a stable reference that you may destructure; `getRoute.current` is re-derived on every navigation. See [Contexts](/developers-guide/frontend/contexts).

## App routes

See the [auto-generated route map](/developers-guide/frontend/routing/generated).
