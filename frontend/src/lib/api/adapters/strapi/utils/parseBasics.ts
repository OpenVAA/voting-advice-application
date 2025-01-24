import { formatId } from '$lib/api/utils/formatId';
import { translate } from '$lib/i18n';
import type { Id } from '@openvaa/core';

/**
 * Parses the `documentId`, `name`, `shortName` and `info` properties that all `DataObject`s share from a Strapi object.
 * The complicated typing ensures that if the `name` property is known to be present in the data, it's also defined in the returned object.
 * @param data - The Strapi object containing the data.
 * @param locale - The locale to use for translations.
 */
export function parseBasics<TName extends LocalizedString | undefined>(
  data: {
    documentId: string;
    customData?: object | null;
    info?: LocalizedString;
    order?: number | null;
    shortName?: LocalizedString;
  } & (
    | {
        name: TName;
        text?: LocalizedString;
      }
    | {
        name?: undefined;
        text: LocalizedString;
      }
  ),
  locale: string | null
): BasicData<TName extends LocalizedString ? true : false> {
  const { documentId, customData, info, name, order, shortName, text } = data;
  return {
    id: formatId(documentId),
    // `translate` returns the empty string for a missing value, so we convert those to `undefined`
    name: translate(name || text, locale) || undefined,
    shortName: translate(shortName, locale) || undefined,
    info: translate(info, locale) || undefined,
    order,
    customData
  } as BasicData<TName extends LocalizedString ? true : false>;
}

type BasicData<TNameRequired extends boolean = false> = {
  customData?: object | null;
  id: Id;
  name: TNameRequired extends true ? string : string | undefined;
  order?: number | null;
  shortName?: string;
  info?: string;
};
