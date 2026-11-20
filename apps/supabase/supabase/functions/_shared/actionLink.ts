/**
 * The token of an action link the auth service generated.
 *
 * Pure functions with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Functions and vitest.
 *
 * SHARED. The module lives in `functions/_shared/`, the directory for modules more than one function uses. Each function imports it by relative path (`../_shared/actionLink.ts`).
 */

/**
 * The `token` parameter of an action link the auth service answered.
 *
 * @param actionLink - The `action_link` of a generated link, of any type
 * @returns The parameter's value, or an empty string when the value is not a URL or carries none
 */
export function actionLinkToken(actionLink: unknown): string {
  if (typeof actionLink !== 'string') return '';
  try {
    return new URL(actionLink).searchParams.get('token') ?? '';
  } catch {
    return '';
  }
}
