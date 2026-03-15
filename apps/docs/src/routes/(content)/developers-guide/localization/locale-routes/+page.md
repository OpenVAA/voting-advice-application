# Locale routes

All routes start with an optional `locale` route parameter. The parameter matches any supported locale defined in the [`StaticSettings`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts) and their soft matches (using [`$lib/i18n/utils/matchLocale`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/i18n/utils/matchLocale.ts)). Thus, if `en`, `fi` and `es-CO` are supported and `en` is marked as `isDefault`, routes behave as follows:

- `/foo` redirects to the default English version unless the user has a supported locale listed in `Request.accept-language`, in which case the user is redirected to `/fi/foo` (if `fi` is preferred)
- `/en/foo` shows the English version
- `/es-CO/foo` shows the Spanish version
- `/fi/foo` shows the Finnish version
- `/en-UK/foo` redirects to `/en/foo`, `/es/foo` to `/es-CO/foo` and so on for all soft locale matches

Switching between locales happens by only changing the language parameter in the route.

### The `getRoute` helper

To facilitate locale switching, a `getRoute` helper function is provided as a store by the [`I18nContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/contexts/i18n/i18nContext.type.ts). It is passed a `Route` name, possible parameters and optionally a `locale` from which it constructs the proper url to go to. It can also be used to just switch the locale of the current page, by calling `$getRoute({locale: 'foo'})`.
