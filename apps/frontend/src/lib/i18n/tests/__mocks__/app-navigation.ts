/**
 * Test stub for `$app/navigation`.
 *
 * SvelteKit's `$app/navigation` is a virtual module provided by the SvelteKit
 * Vite plugin, which is not active under the bare vitest config. Tests that
 * import a module transitively depending on `$app/navigation` (e.g. the candidate
 * context) need this resolvable stub so vite's import-analysis does not fail at
 * transform time. Individual tests may still `vi.mock('$app/navigation', …)` to
 * inject controllable spies; this stub is the resolvable fallback.
 */
export const goto = async () => {};
export const invalidate = async () => {};
export const invalidateAll = async () => {};
export const beforeNavigate = () => {};
export const afterNavigate = () => {};
export const onNavigate = () => {};
export const preloadData = async () => {};
export const preloadCode = async () => {};
export const pushState = () => {};
export const replaceState = () => {};
export const disableScrollHandling = () => {};
