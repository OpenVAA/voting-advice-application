# App Settings

> This section deals with adding new App Settings. For information about existing ones, see the [Publishers' Guide](/publishers-guide/app-settings).

App settings are located in [`@openvaa/app-shared`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/) module. Settings are separated into static and dynamic settings.

Static settings can be changed only by modifying [staticSettings.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts).

Dynamic settings can be changed by modifying [dynamicSettings.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.ts). In addition, dynamic settings can also be changed in the backend and loaded via the Data API.

Because the settings files are imported from the `app-shared` module, make sure to [watch it for changes and reload the frontend](/developers-guide/development/running-the-development-environment) when developing.

Settings from `dynamicSettings.ts`, `staticSettings.ts` and from the DataProvider are merged together into [`settings` store](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/stores/stores.ts). Settings from `dynamicSettings.ts` are overwritten by dynamic settings from the DataProvider. Settings from `staticSettings.ts` are merged last to prevent overwriting them.

## Adding New Settings

In case of static settings:

1. Add the type and documentation for the new setting to the `StaticSettings` type in [staticSettings.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.type.ts).
2. Add the default value for the setting to [staticSettings.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts).

In case of dynamic settings:

1. Add the type and documentation for the new setting to the `DynamicSettings` type in [dynamicSettings.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.type.ts).
2. Add the default value for the setting to [dynamicSettings.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/dynamicSettings.ts).
3. Add the setting to the backend (database column or configuration).
4. Update the relevant `DataProvider` implementations to fetch and return the new setting.
