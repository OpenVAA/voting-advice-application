# App Settings

App settings are located in [`@openvaa/app-shared`](../packages/app-shared/src/settings/) module. Settings are separated into static and dynamic settings.

Static settings can be changed only by modifying [staticSettings.ts](../packages/app-shared/src/settings/staticSettings.ts).

Dynamic settings can be changed by modifying [dynamicSettings.ts](../packages/app-shared/src/settings/dynamicSettings.ts). In addition, dynamic settings can also be changed in the backend. This has been currently implemented only in Strapi. Settings from `dynamicSettings.ts` are loaded into Strapi if the app settings collection is empty.

Settings from `dynamicSettings.ts`, `staticSettings.ts` and from the DataProvider are merged together into [`settings` store](../frontend/src/lib/stores/stores.ts). Settings from `dynamicSettings.ts` are overwritten by dynamic settings from the DataProvider. Settings from `staticSettings.ts` are merged last to prevent overwriting them.

## Adding New Settings

In case of static settings:

1. Add the type and documentation for the new setting to the `StaticSettings` type in [staticSettings.type.ts](../packages/app-shared/src/settings/staticSettings.type.ts).
2. Add the default value for the setting to [staticSettings.ts](../packages/app-shared/src/settings/staticSettings.ts).

In case of dynamic settings:

1. Add the type and documentation for the new setting to the `DynamicSettings` type in [dynamicSettings.type.ts](../packages/app-shared/src/settings/dynamicSettings.type.ts).
2. Add the default value for the setting to [dynamicSettings.ts](../packages/app-shared/src/settings/dynamicSettings.ts).
3. Edit the settings components in Strapi:
   1. If the new setting is a top-level one, create a new component for the setting and add it to the `App Settings` content-type.
   2. If the new setting is a subsetting of a top-level item, edit that setting.
4. Possibly update the [`app-settings` route controller](../backend/vaa-strapi/src/api/app-setting/controllers/app-setting.ts) or the utilities it uses, e.g., for [`cardContents`](../backend/vaa-strapi/src/functions/utils/appSettings.ts).
5. Add the necessary `populate` query params to the `getAppSettings` method in [strapiDataProvider.ts](../frontend/src/lib/api/adapters/strapi/dataProvider/strapiDataProvider.ts), because components need to be explicitly populated. Note that if the components have subcomponents, you need to explicitly populate all the way down.
6. If the data type for the setting does not match the one in the `DynamicSettings` type:
   1. Update the Strapi data types for `StrapiAppSettingsData` in [strapiData.type.ts](../frontend/src/lib/api/adapters/strapi/strapiData.type.ts).
   2. Edit the `getAppSettings` method in [strapiDataProvider.ts](../frontend/src/lib/api/adapters/strapi/dataProvider/strapiDataProvider.ts) so that it returns the setting in the correct format.
   3. Edit the [loadDefaultAppSettings](../backend/vaa-strapi/src/functions/loadDefaultAppSettings.ts) utility so that it converts the default settings to a format suitable for Strapi.
7. Repeat applicable steps for all other `DataProvider` implementations that support `getAppSettings`.

# App Customization

App customization includes publisher logo, front page image, translations and frequently asked questions of the candidate app. App customization has been currently implemented only in Strapi.

Translations from `dynamic.json` are loaded into Strapi if the app customization collection is empty. In addition to changing the dynamic translations, any other translation can be overridden.

## Adding New Customization Options

1. Add the new option to `AppCustomization` type in [global.d.ts](frontend/src/lib/types/global.d.ts).
2. Add the new option to the `App Customization` content type in Strapi.
3. If the new setting is a relation, media field or a component:
   1. Edit the populate restrictions for the [app-customization route](backend/vaa-strapi/src/api/app-customization/routes/app-customization.ts).
   2. Add the necessary `populate` query params to the `getAppCustomization` method in [strapiDataProvider.ts](../frontend/src/lib/api/adapters/strapi/dataProvider/strapiDataProvider.ts).
4. Possibly edit how the data is preprocessed by the [app-customization route](backend/vaa-strapi/src/api/app-customization/routes/app-customization.ts).
5. Update the Strapi data types for `StrapiAppCustomizationData` in [strapiData.type.ts](../frontend/src/lib/api/adapters/strapi/strapiData.type.ts)
