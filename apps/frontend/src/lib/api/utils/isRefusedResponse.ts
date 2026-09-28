/**
 * The one predicate the whole adapter stack uses to decide whether a response is a refusal.
 *
 * It is a named export rather than an inline `!response.ok` in two places so that `UniversalAdapter.fetch` and `parseResponse` cannot answer "is this response a refusal?" differently. Two notions of refusal inside one adapter reopen the hole at whichever of them is the laxer, and the hole is the fail-loudly class: a component that turns a failure into a value the caller cannot tell apart from success.
 *
 * `Response.ok` is the test rather than a status-range comparison of our own, because that is what the platform means by a refusal and what this adapter has always meant by it.
 * @param response - The response to test.
 * @returns `true` when the server refused the request — i.e. the status is outside the 2xx range.
 */
export function isRefusedResponse(response: Response): boolean {
  return !response.ok;
}
