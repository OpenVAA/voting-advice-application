/**
 * Test stub for `$app/state`.
 *
 * Provides a mutable `page` object whose `params`, `url`, and `route` fields tests can overwrite directly. The fields are intentionally non-reactive (plain JS) — tests that need to assert reactivity should use `vi.mock` with `vi.hoisted` to inject their own controllable shape.
 */
export const page = {
  params: {} as Record<string, string | undefined>,
  url: new URL('http://localhost/'),
  route: { id: null as string | null },
  status: 200,
  error: null as Error | null,
  data: {} as Record<string, unknown>,
  state: {} as Record<string, unknown>,
  form: undefined as unknown
};

/**
 * No navigation is in flight: every member is `null`, as each is in the real module while the app is idle. The object is frozen, because every test file that does not mock `$app/state` shares it and a member one case set would stay set for the cases after it. A test that needs a navigation in flight injects its own object with `vi.mock`, and resets it itself.
 */
export const navigating = Object.freeze({
  from: null as unknown,
  to: null as unknown,
  type: null as string | null,
  willUnload: null as boolean | null,
  delta: null as number | null,
  complete: null as Promise<void> | null
});
export const updated = { current: false };
