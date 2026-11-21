/**
 * Test stub for `$app/forms`.
 *
 * SvelteKit's `$app/forms` is a virtual module provided by the SvelteKit Vite plugin, which is not active under the bare vitest config. A test that mounts a page with an enhanced form needs this resolvable stub so vite's import-analysis does not fail at transform time. The stub's `enhance` attaches nothing, so a submit of the form is not intercepted: a test that drives a submit injects its own `enhance` with `vi.mock('$app/forms', …)`.
 */
export async function applyAction() {}
export function deserialize() {}
export function enhance() {
  return { destroy() {} };
}
