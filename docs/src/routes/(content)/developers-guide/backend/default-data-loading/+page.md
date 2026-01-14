# Default data loading

Some data is automatically loaded when Strapi is initialized. The data include:

- [Question Types](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/functions/loadDefaultData.ts)
- [App Settings](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/functions/loadDefaultAppSettings.ts)
- [Translation overrides](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/functions/loadDynamicTranslations.ts) (under the `dynamic` key)

API permissions are also set by defaul by [setDefaultApiPermissions.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/backend/vaa-strapi/src/functions/setDefaultApiPermissions.ts).

> Note that some of the defaults are **not** loaded if mock data generations is enabled.
