/**
 * Template placeholder substitution for transactional email.
 *
 * Pure functions extracted from the send-email Edge Function for testability. This module has no Deno imports, no URL imports and no reference to the Deno global, so it can be imported by both the Edge Function and vitest.
 *
 * Not duplicated: unlike `jwtSegment.ts` and `envConfig.ts` in this directory, this renderer is used by one function only, so there is no sibling copy to hold identical.
 */

/**
 * The placeholder pattern.
 *
 * THE CAPTURED KEY IS LOOKED UP FLAT, so a key containing a dot is one key whose text contains a dot -- not a path into a nested object. `public.resolve_email_variables` in `apps/supabase/supabase/schema/502-email-helpers.sql` is the producer, and it emits its keys already dotted (`candidate.first_name`, `organization.name`, `nomination.constituency.name`), built with `jsonb_build_object` into a single flat JSONB object with no nesting anywhere in it. Resolving the `(?:\.\w+)*` group as a traversal would therefore find nothing and break every placeholder in the product, which is why decision D-D4 rejected that option and kept the lookup flat.
 *
 * The only change from the expression this replaced is the `\s*` on each side of the capture, which is what lets a template write `{{ name }}` as well as `{{name}}` (REVIEW-EDGE-03). The capture itself is byte-identical to the previous one, so no existing template changes meaning. The `\s*` sits OUTSIDE the capture on purpose: `{{ candidate . first_name }}` is still not a placeholder, because the key must be contiguous.
 *
 * `\w+` requires at least one character, so `{{}}` and `{{ }}` are not placeholders and pass through untouched.
 */
const PLACEHOLDER_PATTERN = /\{\{\s*(\w+(?:\.\w+)*)\s*\}\}/g;

/**
 * Replace every `{{ key }}` placeholder in `text` with its value from `vars`.
 *
 * A key absent from `vars` leaves its placeholder in the output exactly as written, braces and all. That pass-through is deliberate rather than a gap: `resolve_email_variables` returns an empty variables object for a recipient who holds neither a candidate nor a party role, so a template rendered for such a recipient would otherwise silently lose its text.
 *
 * Substitution does not recurse. `String.prototype.replace` never re-scans what it inserted, so a value that itself looks like a placeholder is inserted as inert text -- which matters because values arrive from the database rather than from the template author.
 *
 * @param text - The template text, normally a subject line or a message body
 * @param vars - The flat variable map, normally one recipient's `variables` object
 * @returns The text with every known placeholder replaced and every unknown one left as written
 */
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(PLACEHOLDER_PATTERN, (matched, key: string) => vars[key] ?? matched);
}
