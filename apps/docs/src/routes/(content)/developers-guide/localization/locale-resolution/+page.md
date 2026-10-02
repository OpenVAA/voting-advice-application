# Locale resolution

The locale of a request is resolved by Paraglide. The options are in [`apps/frontend/paraglide.options.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/paraglide.options.ts), which the Vite plugin and `paraglide:compile` share:

```ts
strategy: ['url', 'cookie', 'baseLocale'];
```

Paraglide tries the strategies in this order:

1. **`url`**: the locale prefix of the URL. The base locale, `en`, has no prefix; the other locales do, for example `/fi/results`.
2. **`cookie`**: the locale stored in Paraglide's locale cookie.
3. **`baseLocale`**: the `baseLocale` in `project.inlang/settings.json`, which is `en`.

The browser's `Accept-Language` header is not one of the strategies, so it does not choose the locale.

## No locale route segment

The locale is not part of any route. Two hooks handle the prefix:

- `reroute` in [`src/hooks.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/hooks.ts) removes the prefix with Paraglide's `deLocalizeUrl` before SvelteKit matches the route, so `/fi/results` is served by the same route as `/results`.
- `paraglideHandle` in [`src/hooks.server.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/hooks.server.ts) runs Paraglide's `paraglideMiddleware` on every request. It resolves the locale, stores it in `event.locals.currentLocale`, and writes it into the `lang` attribute of the `<html>` element through the `%lang%` placeholder in `app.html`.

After that, code reads the locale with `getLocale()` from `$lib/paraglide/runtime`, or from the `locale` member of the contexts. The root `+layout.ts` passes it to the data provider, so the data is read in the same locale.

## Building localized links

`buildRoute` and the `getRoute` handle of the `AppContext` add the prefix of the current locale with Paraglide's `localizeHref`, so links keep the locale. Pass `locale` to build a link in another locale:

```ts
appCtx.getRoute.current({ locale: 'fi' });
```

For an in-app path that is not a route key, use `localizeAppPath` from `$lib/routes`. See [Routing](/developers-guide/frontend/routing).

## Switching the locale

The language menu, `LanguageSelection` in `$lib/dynamic-components/navigation/languages`, lists the offered locales when there is more than one. Each item links to the current path localized with `localizeHref`, and the link has `data-sveltekit-reload`, so switching the locale reloads the page. The `locale` in the contexts therefore stays the same for the life of a page.

## Matching locales in data

When `translate` from `$lib/i18n` picks a translation from a multi-locale value, it falls back to a soft match with `matchLocale` from `$lib/i18n/utils` if the value has no exact match for the locale. See [Multi-locale data](/developers-guide/localization/storing-multi-locale-data).
