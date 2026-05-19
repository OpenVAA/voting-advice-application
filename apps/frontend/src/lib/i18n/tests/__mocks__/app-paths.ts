/** Test stub for $app/paths */
export function resolveRoute(
  route: string,
  params?: Record<string, string>
): string {
  let result = route;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`[${key}]`, value);
    }
  }
  return result;
}

export const base = '';
export const assets = '';
