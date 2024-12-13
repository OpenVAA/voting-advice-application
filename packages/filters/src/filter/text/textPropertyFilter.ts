import { Entity, ExtractEntity, MaybeWrappedEntity } from '@openvaa/core';
import { TextFilter } from './textFilter';
import type { PropertyFilterOptions } from '../base';

export class TextPropertyFilter<TEntity extends MaybeWrappedEntity> extends TextFilter<TEntity> {
  /**
   * Create a filter for matching text to an entity's property.
   * @param property The property name
   * @param subProperty An optional sub-property name
   * @param name  Optional name for use when displaying the filter
   * @param locale The locale is used for case-insensitive matching
   */
  constructor(
    options: {
      property: keyof ExtractEntity<TEntity> & PropertyFilterOptions['property'];
      subProperty?: PropertyFilterOptions['subProperty'];
      name?: string;
      entityGetter?: (target: TEntity) => Entity;
      multipleValues?: boolean;
    },
    locale: string
  ) {
    super(options, locale);
  }
}
