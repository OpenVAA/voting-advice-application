# Static settings

Static settings are set by editing [`staticSettings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts) in `@openvaa/app-shared`. They are compiled into the package, so they cannot change while the app runs: after an edit, `@openvaa/app-shared` and the frontend must be rebuilt. During development, the package watcher that `yarn dev` starts rebuilds the package for you.

They contain:

- `admin.email`: the admin email address, which users may be asked to contact when errors occur.
- `appVersion`: the app version, the oldest version of saved user data that is still accepted (older data is reset), and the URL of the source code.
- `dataAdapter`: the data adapter, `supabase` or `local` (the client reads through the Supabase data provider in both cases; `local` also loads a server-side adapter for JSON files, see [Architecture](/developers-guide/architecture#data-flow)), whether it supports the Candidate and Admin apps, and `pageSize`, the number of rows the Supabase data provider requests per page. `pageSize` must equal the PostgREST `max_rows` setting: `max_rows` in `apps/supabase/supabase/config.toml` locally, or the API settings of a hosted project.
- `colors`: the main DaisyUI theme colours, set separately for the light and dark themes.
- `font`: the main font's name, download URL and style (`sans` or `serif`), which decides the fallback fonts.
- `supportedLocales`: the locales the app supports, with one marked as the default. See [Supported locales](/developers-guide/localization/supported-locales).
- `analytics`: an optional analytics platform (Umami is the one supported) and whether to track UI events.

For every setting and its documentation, see the type, [`staticSettings.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.type.ts).
