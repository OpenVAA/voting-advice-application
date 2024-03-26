import {type ExtractEntity, type FilterableEntity, type MaybeWrapped} from '../../entity';
import type {PropertyFilterOptions} from '../base';
import {TextFilter} from './textFilter';

export class TextPropertyFilter<T extends MaybeWrapped<FilterableEntity>> extends TextFilter<T> {
  /**
   * Create a filter for matching text to an entity's property.
   * @param property The property name
   * @param subProperty An optional sub-property name
   * @param locale The locale is used for case-insensitive matching
   */
  constructor(
    {
      property,
      subProperty
    }: {
      property: keyof ExtractEntity<T> & PropertyFilterOptions['property'];
      subProperty?: PropertyFilterOptions['subProperty'];
    },
    locale: string
  ) {
    super({property, subProperty}, locale);
  }
}
