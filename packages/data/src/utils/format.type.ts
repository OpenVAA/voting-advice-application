/**
 * The type for `DataObject` property formatters.
 * @param object - The `DataObject` whose property should be formatted.
 * @param locale - The optional locale to use. If not defined, the default locale will be used.
 * @returns A formatted string.
 */
export type Formatter<TObject extends object> = ({ locale, object }: { locale?: string; object: TObject }) => string;
