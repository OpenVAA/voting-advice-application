# App customization

App customization is the publisher's own content, as opposed to settings that change how the app works:

- the publisher's name and logo
- the front-page poster images of the voter app and the Candidate app
- translation overrides
- the frequently asked questions shown in the Candidate app

## Where it is stored

Each project's customization is one JSON value in the `customization` column of its `app_settings` row (defined in [`106-app-settings.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/106-app-settings.sql)). The column defaults to an empty object, and every field in it is optional.

The stored shape is `StoredCustomizationSchema` in [`storedCustomization.schema.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/data/schemas/storedCustomization.schema.ts):

- `publisherName`: a localized string, an object keyed by locale.
- `publisherLogo`, `poster`, `candPoster`: images, stored as paths in the `public-assets` storage bucket.
- `translationOverrides`: an object from translation key to localized string.
- `candidateAppFAQ`: a list of `{ question, answer }` entries, each a localized string.

## How the app reads it

The Supabase data provider reads the column for the configured project, validates it against the schema and keeps only the members that pass. It then picks each localized string in the current locale and turns each image path into a public URL in the `public-assets` bucket. The result has the frontend type `AppCustomization` ([`appCustomization.type.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/contexts/app/appCustomization.type.ts)).

The root layout loads the customization before anything else, because its translation overrides replace the matching built-in translations. [Translations and overrides](/developers-guide/localization/translations-and-overrides) covers the overrides.

## Editing it

The Admin app has no customization editor. Write the `customization` column of the project's `app_settings` row directly, for example in Supabase Studio, or include it in an `app_settings` row loaded through [data import](/developers-guide/backend/data-import-and-deletion). Upload the images to the `public-assets` bucket and store their paths.

## Adding a customization option

1. Add the field to `StoredCustomizationSchema` in `@openvaa/app-shared`.
2. Add the field to `AppCustomization` in the frontend.
3. Derive the application value from the stored one in the Supabase data provider's `_getAppCustomization` (for example, localize a string or turn a path into a URL).
