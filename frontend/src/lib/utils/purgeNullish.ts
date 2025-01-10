/**
 * A helper to remove any nullish properties from an object so that it can be sent as JSON.
 */
export function purgeNullish(data: Record<string, JSONData>) {
  const out: Record<string, JSONData> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      out[key] = purgeNullish(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}
