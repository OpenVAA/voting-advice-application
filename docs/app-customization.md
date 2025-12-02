# App Customization

App customization includes publisher logo, front page image, translations and frequently asked questions of the candidate app. App customization has been currently implemented only in Strapi.

Translations from `dynamic.json` are loaded into Strapi if the app customization collection is empty. In addition to changing the dynamic translations, any other translation can be overridden.

## Adding New Customization Options

1. Add the new option to `AppCustomization` type in [global.d.ts](frontend/src/lib/types/global.d.ts).
2. Add the new option to the `App Customization` content type in Strapi.
3. If the new setting is a relation, media field or a component:
   1. Edit the populate restrictions for the [app-customization route](/backend/vaa-strapi/src/api/app-customization/routes/app-customization.ts).
   2. Add the necessary `populate` query params to the `getAppCustomization` method in [strapiDataProvider.ts](/frontend/src/lib/api/adapters/strapi/dataProvider/strapiDataProvider.ts).
4. Possibly edit how the data is preprocessed by the [app-customization route](/backend/vaa-strapi/src/api/app-customization/routes/app-customization.ts).
5. Update the Strapi data types for `StrapiAppCustomizationData` in [strapiData.type.ts](/frontend/src/lib/api/adapters/strapi/strapiData.type.ts)
