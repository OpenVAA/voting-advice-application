/**
 * A comparison of a presented secret with a configured one that takes constant time.
 *
 * Pure functions with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Functions and vitest.
 *
 * SHARED. The module lives in `functions/_shared/`, the directory for modules more than one function uses. Each function imports it by relative path (`../_shared/constantTimeEqual.ts`).
 *
 * WHY THE COMPARISON TAKES CONSTANT TIME. A comparison that stops at the first differing byte answers sooner the earlier the difference, which lets a caller recover the secret one byte at a time by timing. The comparison here reads every byte of the presented value whatever it finds, and its running time depends on the presented value's length alone.
 */

/**
 * Whether a presented string equals the expected one, byte for byte in UTF-8, in a time that depends on the presented string's length alone.
 *
 * @param presented - The value presented by the caller
 * @param expected - The configured value. The caller makes sure it is not empty: an empty expected value equals only an empty presented one
 * @returns True only when both encode to the same bytes
 */
export function constantTimeEqual(presented: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const presentedBytes = encoder.encode(presented);
  const expectedBytes = encoder.encode(expected);
  let difference = presentedBytes.length ^ expectedBytes.length;
  for (let index = 0; index < presentedBytes.length; index++) {
    difference |= presentedBytes[index] ^ (expectedBytes[index % expectedBytes.length] ?? 0);
  }
  return difference === 0;
}
