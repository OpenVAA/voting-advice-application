# Instance overlay

This directory holds a deployment's customisation of OpenVAA. A deployment that keeps its own
repository on top of this one customises its instance by **adding files here only**: it never edits
an upstream file, so merging a new upstream release never conflicts with its changes.

Upstream ships this README alone, and with nothing else here the build is the plain OpenVAA build.
The README is also what keeps the directory present, so the production image's `COPY instance instance`
never fails.

## Layout

```text
instance/
├── staticSettings.json      # merged over packages/app-shared/src/settings/staticSettings.ts
├── static/                  # laid over apps/frontend/static/
│   ├── favicon.png
│   ├── fonts/my-font.css
│   └── images/logo.svg
└── messages/
    ├── en.json              # laid over apps/frontend/messages/en/*.json
    └── fi.json
```

Every part is optional. Add only the files and keys you change.

### `staticSettings.json`

```json
{
  "admin": { "email": "admin@example.org" },
  "colors": {
    "light": { "primary": "#123456", "primary-content": "#ffffff" }
  },
  "font": { "name": "My Font", "url": "/fonts/my-font.css" },
  "logo": { "url": "/images/logo.svg", "urlDark": "/images/logo-dark.svg" },
  "supportedLocales": [
    { "code": "fi", "name": "Suomi", "isDefault": true },
    { "code": "sv", "name": "Svenska" }
  ]
}
```

The file is deep-merged over the shipped `staticSettings.ts`: objects are merged key by key, arrays
(such as `supportedLocales`) replace the shipped array whole. The colours are written into the
frontend's DaisyUI light and dark themes at build time: `primary` also sets `success`, `accent` also
sets `info` and `warning` also sets `error`, and each of the optional `*-content` keys sets the text
colour drawn on its colour. `font.url` is the stylesheet the root layout links, and `logo` is the
static fallback logo.

### `static/`

A file at `instance/static/<path>` replaces `apps/frontend/static/<path>` and is served at
`/<path>`; a new path is added. Every base file you do not replace is kept. The example above
replaces the favicon and adds a font stylesheet and a logo, which `staticSettings.json` then points
at.

### `messages/<locale>.json`

One file per locale, holding only the keys it changes, nested as in the frontend catalogues:

```json
{ "common": { "closeDialog": "Sulje" } }
```

See [`apps/frontend/messages/README.md`](../apps/frontend/messages/README.md) for the catalogues
themselves.

## Precedence

| What             | Wins first                                            | Then                                     | Then                   |
| ---------------- | ----------------------------------------------------- | ---------------------------------------- | ---------------------- |
| A message's text | the backend's `appCustomization.translationOverrides` | `instance/messages/<locale>.json`        | the frontend catalogue |
| The logo         | the publisher logo uploaded in the Admin App          | `logo` in `instance/staticSettings.json` | the OpenVAA logo       |
| A setting        | `instance/staticSettings.json`                        | `staticSettings.ts`                      |                        |
| A static file    | `instance/static/<path>`                              | `apps/frontend/static/<path>`            |                        |

## Validation

The build checks the overlay and fails, naming the file and the offending key, when:

- `staticSettings.json` holds a key the settings do not have, at any level, or is not a JSON object;
- a colour is not a six-digit hex colour such as `#2546a8`;
- `font.name` is not a plain family name of letters, digits, spaces, `_` and `-`;
- a URL (`font.url`, `logo.url`, `logo.urlDark`) is neither a same-origin path starting with a single
  `/` (without `..`) nor an `https:` URL, or holds whitespace, quotes, angle brackets, parentheses or
  backslashes;
- `supportedLocales` is empty or marks more than one locale `isDefault`;
- a locale in `supportedLocales` has no compiled message catalogue;
- a message file is for a locale the frontend does not compile, overrides a key the base catalogue
  does not have, or changes a message's `{placeholder}` set or HTML tag set;
- `instance/static/`, anything under it, `instance/messages/` or a message file is a symbolic link.

An unset `*-content` colour keeps the value the frontend ships. Whichever you set, checking that text
on every colour meets the WCAG 2.1 AA contrast ratio is the deployment's responsibility: the build
checks the format of a colour, not its contrast.

## What cannot be overlaid

- **`dataAdapter`.** The build rejects it in `staticSettings.json`: the hosted-settings guards read the
  data adapter from `staticSettings.ts` itself.
- **Dynamic settings.** These are the database's `app_settings`, edited in the Admin App, not files.
- **The texts of the mails the Edge Functions send.** They live in
  `apps/supabase/supabase/functions/account-access/mailTemplates.ts` and are deployed with the
  functions, not with the frontend.

## Working with the overlay

- **Development.** Restart `yarn dev` after changing anything under `instance/`: the merged static
  directory and the generated message project are built when the Vite configuration loads.
- **Building.** `yarn build` rebuilds `@openvaa/app-shared` and the frontend when an overlay file
  changes; Turborepo hashes `instance/staticSettings.json`, `instance/static/**` and
  `instance/messages/**`.
- **The image.** The production image copies `instance/`. A deployment pipeline that builds from
  `git archive` of a commit sends only tracked files, so commit every overlay file.
- **Generated files.** The build writes the merged static directory and the generated message
  project into `apps/frontend/.instance/`, which is gitignored.

## Running the upstream suites

The upstream unit and E2E suites assert the shipped settings, assets and texts. Run them with the
overlay files removed, leaving this README, then restore the overlay for the deployment's own
checks.
