import {type ExtractEntity, type FilterableEntity, type MaybeWrapped} from '../../entity';
import {TextFilter} from './textFilter';

/**
 * A filter for entities with a name property.
 */
export class TextPropertyFilter<T extends MaybeWrapped<FilterableEntity>> extends TextFilter<T> {
  declare readonly options: {property: keyof ExtractEntity<T> & string; type: 'string'};

  constructor(property: keyof ExtractEntity<T> & string) {
    super({property, type: 'string'});
  }
}
