import { TextFilter } from './textFilter';
import { type ExtractEntity, type FilterableEntity, type MaybeWrapped } from '../../entity';
import type { PropertyFilterOptions } from '../base';

export class TextPropertyFilter<TEntity extends MaybeWrapped<FilterableEntity>> extends TextFilter<TEntity> {
  /**
   * Create a filter for matching text to an entity's property.
   * @param property The property name
   * @param subProperty An optional sub-property name
   * @param name  Optional name for use when displaying the filter
   * @param locale The locale is used for case-insensitive matching
   */
  constructor(
    {
      property,
      subProperty,
      name
    }: {
      property: keyof ExtractEntity<TEntity> & PropertyFilterOptions['property'];
      subProperty?: PropertyFilterOptions['subProperty'];
      name?: string;
    },
    locale: string
  ) {
    super({ property, subProperty, name }, locale);
  }
}
