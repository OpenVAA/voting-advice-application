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
export async function goto() {}
export async function invalidate() {}
export async function invalidateAll() {}
export function beforeNavigate() {}
export function afterNavigate() {}
export function onNavigate() {}
export async function preloadData() {}
export async function preloadCode() {}
export function pushState() {}
export function replaceState() {}
export function disableScrollHandling() {}
