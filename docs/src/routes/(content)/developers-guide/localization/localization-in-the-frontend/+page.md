# Localization in the frontend

All localized strings are fetched using the same `$t('foo.bar', {numBar: 5})` provided by the [`I18nContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/contexts/i18n/i18nContext.type.ts) and, for convenience, all other contexts including it, such as the [`ComponentContext`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/contexts/component/componentContext.type.ts). This is agnostic to both:

1. Whether the translations are local (i.e. from `json` files) or fetched from the database. Local fallbacks are overwritten by those from the database.
2. Whether SSR or CSR rendering is used.

> Never import any stores directly from `$lib/i18n`. Use the imports provided by the contexts instead. You can safely use the utilities in [`$lib/i18n/utils`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/i18n/utils), however.

### Value interpolation

For value interpolation in already translated strings, such as those contained in database objects, the same [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation is provided with a `parse('Foo is {value}', {value: 'bar'})` function also provided by `$lib/i18n`.

Some commonly used values are automatically provided for interpolation. See [`updateDefaultPayload`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/i18n/init.ts).

> If any interpolated values are missing, the string will not be translated and its key will be displayed.

### Localized default values in components

When providing localized default values to component properties, be sure to assign these reactively or they won't be updated when the locale is changed, i.e.

```tsx
// This will NOT update
export let label = $t('someLabel');
// On the page
<label>{label}</label>;

// This will update
export let label = undefined;
// On the page
<label>{label ?? $t('someLabel')}</label>;
```

### Localized texts included in dynamically loaded data

Specific care must be taken with any localized content loaded dynamically so that language changes are propagated everywhere where the data is used.

The data loaded by the Data API (settings, app customization and anything contained in the [`dataRoot`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/contexts/data/dataContext.type.ts) store or its descendants) is always returned already translated. Therefore, if any such data is used in the frontend, it should be reactive.

This is usually automatically the case, because the contexts hold such data in stores, but when reading store values make sure not to use outdated local copies.
