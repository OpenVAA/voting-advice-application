import {type ExtractEntity, type FilterableEntity, type MaybeWrapped} from '../../entity';
import {MISSING_VALUE, type MaybeMissing} from '../../missingValue';
import {EnumeratedFilter} from './enumeratedFilter';

/**
 * A filter for properties which are objects with a string-index label and key for filtering, e.g. party objects of candidates.
 * TODO: This could be refactored to merge with `SingleChoiceQuestionFilter`.
 */

export class ObjectFilter<
  T extends MaybeWrapped<FilterableEntity>,
  O extends object = object
> extends EnumeratedFilter<T, string, O> {
  declare readonly options: {property: keyof ExtractEntity<T> & string; type: 'string'};

  constructor(
    property: keyof ExtractEntity<T> & string,
    public readonly objOptions: {
      keyProperty: keyof O & string;
      labelProperty: keyof O & string;
      objects: O[];
    },
    locale?: string
  ) {
    super({property, subProperty: objOptions.keyProperty, type: 'string'}, locale);
  }

  /**
   * Compare to values for sorting. Note that missing values are always sorted to the end.
   */
  compareValues(a: string, b: string) {
    const label = this.objOptions.labelProperty;
    return `${this.getOrg(a)[label]}`.localeCompare(`${this.getOrg(b)[label]}`, this.locale);
  }

  /**
   * Process a value and its count for display
   */
  processValueForDisplay(value: MaybeMissing<string>, count: number) {
    return {
      value,
      count,
      object: value === MISSING_VALUE ? undefined : this.getOrg(value as string)
    };
  }

  /**
   * Utility for getting a value's associated organisation
   */
  getOrg(value: string): O {
    const org = this.objOptions.objects.find((o) => o[this.objOptions.keyProperty] === value);
    if (!org)
      throw new Error(
        `Could not find organisation where ${this.objOptions.keyProperty} == '${value}'`
      );
    return org;
  }
}
