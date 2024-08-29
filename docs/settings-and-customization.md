# App Settings

App settings are located in [`vaa-shared`](../shared/src/settings/) module. Settings are separated into static and dynamic settings.

Static settings can be changed only by modifying [staticSettings.ts](../shared/src/settings/staticSettings.ts).

Dynamic settings can be changed by modifying [dynamicSettings.ts](../shared/src/settings/dynamicSettings.ts). In addition, dynamic settings can also be changed in the backend. This has been currently implemented only in Strapi. Settings from `dynamicSettings.ts` are loaded into Strapi if the app settings collection is empty.

Settings from `dynamicSettings.ts`, `staticSettings.ts` and from the DataProvider are merged together into [`settings` store](../frontend/src/lib/stores/stores.ts). Settings from `dynamicSettings.ts` are overwritten by dynamic settings from the DataProvider. Settings from `staticSettings.ts` are merged last to prevent overwriting them.

# App Customization

App customization includes publisher logo, front page image, translations and frequently asked questions of the candidate app. App customization has been currently implemented only in Strapi.

Translations from `dynamic.json` are loaded into Strapi if the app customization collection is empty. In addition to changing the dynamic translations, any other translation can be overridden.