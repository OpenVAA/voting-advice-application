# Supported locales

Supported locales are defined app-wide in [`StaticSettings`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts).

### Adding new locales

1. Add the locale code to `locales` in [`apps/frontend/project.inlang/settings.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/project.inlang/settings.json).
2. Create `apps/frontend/messages/<LOCALE>/` with every file that `plugin.inlang.messageFormat.pathPattern` in the same settings file lists, each with the same keys as the base locale.
3. Add the locale's display name to `lang.json` in every locale directory.
4. Offer the locale via `supportedLocales` in [`StaticSettings`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts).
