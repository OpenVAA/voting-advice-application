import type { FilterOptions } from './filter.type';

/**
 * Cast a non-missing value to the correct data type.
 * @typeParam V The data type to cast to.
 * @param value The value to cast
 * @param type A filter value type
 * @param multiple Whether the value is an array of the type
 * @returns The value cast to the correct data type or an array of that type
 */
export function castValue<TValue>(value: unknown, type: FilterOptions['type'], multiple?: false): TValue;
export function castValue<TValue>(value: unknown, type: FilterOptions['type'], multiple: true): Array<TValue>;
export function castValue<TValue>(value: unknown, type: FilterOptions['type'], multiple = false) {
  if (multiple) {
    if (!Array.isArray(value)) throw new Error(`Value for type ${type} is not an array.`);
    return value.map((v) => castValue<TValue>(v, type));
  }
  switch (type) {
    case 'string':
      if (!['string', 'number'].includes(typeof value)) throw new Error(`Cannot cast from ${typeof value} to ${type}.`);
      return `${value}`;
    case 'number':
      if (!['string', 'number'].includes(typeof value)) throw new Error(`Cannot cast from ${typeof value} to ${type}.`);
      return Number(value);
    case 'boolean':
      if (!['boolean', 'string', 'number'].includes(typeof value))
        throw new Error(`Cannot cast from ${typeof value} to ${type}.`);
      return Boolean(value);
    default:
      throw new Error(`Unsupported value type: ${type}`);
  }
}
