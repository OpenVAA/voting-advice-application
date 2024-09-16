import type {GetDataOptionsBase} from '../dataProvider.type';

/**
 * Convert get data methods' options to URLSearchParams. Nullish and `false` values are ignored. Boolean `true` values are converted to `'true'`.
 */
export function optionsToUrlParams(options: GetDataOptionsBase): URLSearchParams {
  const stringOptions: Record<string, string> = Object.fromEntries(
    Object.entries(options)
      .filter(([, value]) => value != null && value !== false)
      .map(([key, value]) => [key, `${value}`])
  );
  return new URLSearchParams(stringOptions);
}
