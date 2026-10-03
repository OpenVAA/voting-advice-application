# Configuration overview

An OpenVAA instance is configured in four layers. The first two are fixed when the app is built or started; the last two are data in the database and can change while the app runs.

- **[Environment variables](/developers-guide/configuration/environmental-variables)** come from the repo-root `.env` locally and from the hosting platform in production. They name the Supabase project and keys, the project the deployment serves (`PUBLIC_PROJECT_ID`), the identity provider for bank authentication, and other per-deployment values. The Edge Functions have an env file of their own.
- **[Static settings](/developers-guide/configuration/static-settings)** are TypeScript in `packages/app-shared/src/settings/staticSettings.ts`: the supported locales, theme colours, font, data adapter, analytics and the admin email. Changing them means rebuilding `@openvaa/app-shared` and the frontend.
- **[App settings](/developers-guide/configuration/app-settings)** are the dynamic settings: feature switches and options for the voter and candidate apps. They are stored per project in the `settings` column of the `app_settings` table and merged over the defaults in `@openvaa/app-shared`.
- **[App customization](/developers-guide/configuration/app-customization)** is the publisher's content: name, logo, front-page images, translation overrides and the Candidate app FAQ. It is stored per project in the `customization` column of the same table.
