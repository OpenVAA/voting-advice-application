# Static settings

Static settings are set by editing [`staticSettings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts) in `@openvaa/app-shared`. They are compiled into the package, so they cannot change while the app runs: after an edit, `@openvaa/app-shared` and the frontend must be rebuilt. During development, the package watcher that `yarn dev` starts rebuilds the package for you.

They contain:

- `admin.email`: the admin email address, which users may be asked to contact when errors occur.
- `appVersion`: the app version, the oldest version of saved user data that is still accepted (older data is reset), and the URL of the source code.
- `dataAdapter`: the data adapter, `supabase` or `local` (the client reads through the Supabase data provider in both cases; `local` also loads a server-side adapter for JSON files, see [Architecture](/developers-guide/architecture#data-flow)), whether it supports the Candidate and Admin apps, and `pageSize`, the number of rows the Supabase data provider requests per page. `pageSize` must equal the PostgREST `max_rows` setting: `max_rows` in `apps/supabase/supabase/config.toml` locally, or the API settings of a hosted project.
- `colors`: the colours of the light and dark themes. The build writes them into the frontend's DaisyUI `light` and `dark` themes: `primary` also sets `success`, `accent` also sets `info` and `warning` also sets `error`. The optional `*-content` keys (`primary-content`, `secondary-content`, `accent-content`, `neutral-content`, `base-content` and `warning-content`) set the text colour drawn on each colour; an unset one keeps the value the frontend ships. Each colour is a six-digit hex colour such as `#2546a8`.
- `font`: the main font's plain family name (letters, digits, spaces, `_` and `-`, unquoted), the URL of its stylesheet, which the root layout links, and its style (`sans` or `serif`), which decides the fallback fonts.
- `supportedLocales`: the locales the app supports, with one marked as the default. See [Supported locales](/developers-guide/localization/supported-locales).
- `logo`: optional, the static fallback logo, `url` for a light background and optionally `urlDark` for a dark one. The publisher logo uploaded in the Admin App takes precedence over it, and without either the OpenVAA logo is shown.

Analytics is not a static setting. The analytics provider is chosen by the server environment variable `ANALYTICS_PROVIDER` (`none`, `log` or `posthog`; `none` when unset), next to the other `ANALYTICS_` variables described in [Environment variables](/developers-guide/configuration/environmental-variables#analytics), so changing it needs a restart and no rebuild. Whether usage events other than the page-view count are collected is the dynamic setting `analytics.trackEvents`; see [App settings](/developers-guide/configuration/app-settings).

For every setting and its documentation, see the type, [`staticSettings.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.type.ts).

## Instance overlay

A deployment that keeps its own repository can leave `staticSettings.ts` untouched and add `instance/staticSettings.json` at the repository root instead. The file holds only the settings it changes and is deep-merged over `staticSettings.ts`: objects are merged key by key and arrays, such as `supportedLocales`, replace the shipped array whole. The build validates the merged settings strictly, so an unknown key, a colour that is not six-digit hex, a font name outside its character set or an asset URL that is neither a same-origin path nor `https:` fails the build, naming the key. `dataAdapter` cannot be overlaid.

In the same way, files under `instance/static/` replace or add to the frontend's static files, and `instance/messages/<locale>.json` overrides messages (see the [`messages` README](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/messages/README.md#instance-overrides)). After changing an overlay file, `@openvaa/app-shared` and the frontend must be rebuilt, which `yarn build` does, and a running `yarn dev` must be restarted, because the merged static directory and the message project are prepared when it starts.

The layout, the precedence of each layer, the validation rules and what cannot be overlaid are in [`instance/README.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/instance/README.md).
