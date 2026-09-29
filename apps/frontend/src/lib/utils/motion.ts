/**
 * Whether the user has asked the operating system to minimise non-essential motion.
 *
 * The JS half of the reduced-motion gate: CSS transitions are switched off with the `motion-reduce:` variant, and code that waits for such a transition to finish must skip the wait when this returns `true`. Always `false` on the server.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
