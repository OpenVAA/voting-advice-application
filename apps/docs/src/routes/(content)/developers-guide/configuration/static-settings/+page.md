# Static settings

> Some of the static settings, especially fonts and colors, are planned to be moved to dynamic settings and it’s possible that the rest will be merged with `env` variables thereafter.

Statics settings are set by editing [staticSettings.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts) and they cannot be changed after initialisation. They contain:

- Admin settings, including admin email
- Settings related to the version of the app, handling of saved user data and linking to the source code
- Settings defining the data adapters to use, which may be a database interface or one using local files
- The main colors used by the application, defined separately for both the light and dark themes
- The main font used in the application
- The locales supported by the application
- Settings related to data collection and other research or analytics use
- Settings related to Candidate App pre-registration

For a full list of all the settings, see [staticSettings.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.type.ts).
