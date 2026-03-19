import { getLocalized } from './getLocalized';

/**
 * Localize multiple fields on a database row in one pass.
 *
 * For each field in `fields`:
 * - Top-level fields (e.g. `"name"`) are resolved via `getLocalized`.
 * - Nested dot-notation fields (e.g. `"custom_data.fillingInfo"`) traverse into
 *   JSONB objects, shallow-cloning each intermediate level to avoid mutating
 *   the input row.
 *
 * Fields that are `null`, `undefined`, or point to non-object intermediates
 * are silently skipped.
 */
export function localizeRow(
  row: Record<string, unknown>,
  fields: string[],
  locale: string,
  defaultLocale: string = 'en'
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...row };

  for (const field of fields) {
    const dotIndex = field.indexOf('.');
    if (dotIndex === -1) {
      // Top-level field
      result[field] = getLocalized(
        result[field] as Record<string, string> | null | undefined,
        locale,
        defaultLocale
      );
    } else {
      // Nested dot-notation path (e.g. "custom_data.fillingInfo")
      const topKey = field.slice(0, dotIndex);
      const restPath = field.slice(dotIndex + 1);
      const topValue = result[topKey];

      if (topValue == null || typeof topValue !== 'object') {
        // Cannot traverse into null/undefined/primitive — skip silently
        continue;
      }

      // Shallow-clone the top-level object to avoid mutation
      result[topKey] = localizeNested(
        { ...(topValue as Record<string, unknown>) },
        restPath,
        locale,
        defaultLocale
      );
    }
  }

  return result;
}

/**
 * Recursively traverse and localize a nested path within an object.
 * The `obj` passed here is already a shallow clone at this level.
 */
function localizeNested(
  obj: Record<string, unknown>,
  path: string,
  locale: string,
  defaultLocale: string
): Record<string, unknown> {
  const dotIndex = path.indexOf('.');
  if (dotIndex === -1) {
    // Leaf key — localize it
    obj[path] = getLocalized(
      obj[path] as Record<string, string> | null | undefined,
      locale,
      defaultLocale
    );
    return obj;
  }

  // More nesting — clone the next level and recurse
  const key = path.slice(0, dotIndex);
  const rest = path.slice(dotIndex + 1);
  const nested = obj[key];

  if (nested == null || typeof nested !== 'object') {
    return obj;
  }

  obj[key] = localizeNested(
    { ...(nested as Record<string, unknown>) },
    rest,
    locale,
    defaultLocale
  );
  return obj;
}
