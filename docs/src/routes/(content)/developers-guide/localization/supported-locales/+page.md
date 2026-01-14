# Supported locales

Supported locales are defined app-wide in [`StaticSettings`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts).

### Adding new locales

1. Add the locale to [`locales`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/i18n/translations/index.ts)
2. Create versions of all the translation files in the new locale and place them in `frontend/src/lib/i18n/translations/<LOCALE>`
3. Copy the `dynamic.json` translation file to `../backend/vaa-strapi/src/util/translations/<LOCALE>/dynamic.json`
4. Make the locale available in [`StaticSettings`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts).
