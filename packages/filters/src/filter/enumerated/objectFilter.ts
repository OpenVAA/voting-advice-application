import { EnumeratedFilter } from './enumeratedFilter';
import { type ExtractEntity, type FilterableEntity, type MaybeWrapped } from '../../entity';
import { type MaybeMissing, MISSING_VALUE } from '../../missingValue';
import type { PropertyFilterOptions } from '../base';

/**
 * A filter for properties which are objects with a string-index label and key for filtering, e.g. party objects of candidates.
 * TODO: This could be refactored to merge with `SingleChoiceQuestionFilter`.
 */
export class ObjectFilter<
  TEntity extends MaybeWrapped<FilterableEntity>,
  TObject extends object = object
> extends EnumeratedFilter<TEntity, string, TObject> {
  /** Options specific to the objects */
  objOptions: ObjOptions<TObject>;

  /**
   * Create a filter for properties which are objects with a string-index label and key for filtering, e.g. party objects of candidates.
   * @param property The property of the entity, e.g. candidate, in which the object is stored, e.g. party
   * @param keyProperty The key property of the object, usually id
   * @param labelProperty The label property of the object, usually name
   * @param objects A list of all the possible objects, e.g. parties
   * @param name Optional name for use when displaying the filter
   * @param locale The locale is used for value sorting
   */
  constructor(
    {
      property,
      keyProperty,
      labelProperty,
      objects,
      name
    }: {
      property: keyof ExtractEntity<TEntity> & PropertyFilterOptions['property'];
      name?: string;
    } & ObjOptions<TObject>,
    public locale: string
  ) {
    super({ property, subProperty: keyProperty, name, type: 'string' });
    this.objOptions = { keyProperty, labelProperty, objects };
  }

  /**
   * Compare to values for sorting. Note that missing values are always sorted to the end.
   */
  compareValues(a: string, b: string) {
    const label = this.objOptions.labelProperty;
    return `${this.getObject(a)[label]}`.localeCompare(`${this.getObject(b)[label]}`, this.locale);
  }

  /**
   * Process a value and its count for display
   */
  processValueForDisplay(value: MaybeMissing<string>, count: number) {
    return {
      value,
      count,
      object: value === MISSING_VALUE ? undefined : this.getObject(value as string)
    };
  }

  /**
   * Utility for getting a value's associated organisation
   */
  getObject(value: string): TObject {
    const org = this.objOptions.objects.find((o) => o[this.objOptions.keyProperty] === value);
    if (!org) throw new Error(`Could not find organisation where ${this.objOptions.keyProperty} == '${value}'`);
    return org;
  }
}

type ObjOptions<TObject> = {
  keyProperty: keyof TObject & string;
  labelProperty: keyof TObject & string;
  objects: Array<TObject>;
};
