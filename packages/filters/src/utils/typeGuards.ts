import { FILTER_TYPE } from '../filter';
import type { MaybeWrappedEntity } from '@openvaa/core';
import type {
  ChoiceQuestionFilter,
  Filter,
  FilterType,
  FilterTypeMap,
  NumberQuestionFilter,
  ObjectFilter,
  TextFilter,
  TextPropertyFilter,
  TextQuestionFilter
} from '../filter';

/**
 * Check if an object is a given type of filter. Use this instead of `instanceof`.
 */
export function isFilterType<TType extends FilterType>(obj: unknown, type: TType): obj is FilterTypeMap[TType] {
  return isFilter(obj) && obj.filterType === type;
}

/**
 * Check if an object is any subtype of filter. The type params are used to specify the expected type params.
 */
export function isFilter<TTarget extends MaybeWrappedEntity = MaybeWrappedEntity, TValue = unknown>(
  obj: unknown
): obj is Filter<TTarget, TValue> {
  return (
    !!obj &&
    typeof obj === 'object' &&
    'filterType' in obj &&
    Object.values(FILTER_TYPE).includes(obj.filterType as FilterType)
  );
}

/**
 * Check if an object is any subtype of `EnumeratedFilter`. The type params are used to specify the expected type params.
 */
export function isEnumeratedFilter<
  TEntity extends MaybeWrappedEntity = MaybeWrappedEntity,
  TObject extends object = object
>(obj: unknown): obj is ChoiceQuestionFilter<TEntity> | ObjectFilter<TEntity, TObject> {
  return (
    isFilter(obj) &&
    (obj.filterType === FILTER_TYPE.ChoiceQuestionFilter || obj.filterType === FILTER_TYPE.ObjectFilter)
  );
}

/**
 * Check if an object is a `NumberQuestionFilter`. The type params are used to specify the expected type params.
 */
export function isNumberFilter<TEntity extends MaybeWrappedEntity = MaybeWrappedEntity>(
  obj: unknown
): obj is NumberQuestionFilter<TEntity> {
  return isFilter(obj) && obj.filterType === FILTER_TYPE.NumberQuestionFilter;
}

/**
 * Check if an object is any subtype of text filter. The type params are used to specify the expected type params.
 */
export function isTextFilter<TEntity extends MaybeWrappedEntity = MaybeWrappedEntity>(
  obj: unknown
): obj is TextQuestionFilter<TEntity> | TextPropertyFilter<TEntity> | TextFilter<TEntity> {
  return (
    isFilter(obj) &&
    (obj.filterType === FILTER_TYPE.TextQuestionFilter ||
      obj.filterType === FILTER_TYPE.TextPropertyFilter ||
      obj.filterType === FILTER_TYPE.TextFilter)
  );
}
