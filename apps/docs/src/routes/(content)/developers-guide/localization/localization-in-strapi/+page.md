# Localization in Strapi

Strapi's built-in i18n plugin is not used because it creates objects with different ids for each locale. Thus, a proprietary `json`-based format is used for translated strings instead of regular text fields. (This format is defined in [`@openvaa/app-shared`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/data/localized.type.ts) as `LocalizedString`.) The example below also demonstrates the use of [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation.

```json
{
  "en": "You have {testValue, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}",
  "fi": "Sinulla {testValue, plural, =0 {ei ole valokuvia.} =1 {on yksi valokuva.} other {on # valokuvaa.}}",
  "es-CO": "Tienes {testValue, plural, =0 {no photos.} =1 {un photo.} other {# photos.}}"
}
```

The methods offered by [`DataProvider`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/api/base/dataProvider.type.ts) handle the translations based on an optional `locale` parameter accepted by all of them. This defaults to the current locale. The functions pick the requested language (or the best match) from the `json` fields and return them as regular `string`s.
