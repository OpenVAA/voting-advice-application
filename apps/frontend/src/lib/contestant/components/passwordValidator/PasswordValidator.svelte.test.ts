/**
 * `PasswordValidator.svelte` — the progress value the animated bar tracks.
 *
 * Phase 159, criterion 1 (D-H1). The component computed its progress inside an `$effect` that wrote a local `$state` and then pushed that value into a `tweened` handle. Everything up to the push is a pure function of `validationRules`, so that part is a `$derived` wearing an effect's clothes — but the push is NOT: a derived produces a value, it does not drive an animation. A conversion that folded the WHOLE body into a `$derived` would have silently dropped `progress.set(...)`, and the bar would have sat frozen at 0 for every password while the rule list above it updated correctly. Neither the compiler, nor the type checker, nor the suite as it stood would have said a word about it.
 *
 * This test locks the OBSERVABLE contract on both sides of that conversion: the ratio the component computes, and the fact that the ratio is PUSHED into the tweened handle on every recomputation. Its cases are byte-identical before and after the conversion commit — that identity is the evidence the conversion is behaviour-preserving, so it must not be "adapted" to whatever the new implementation happens to do.
 *
 * `tweened` is replaced by a recording store rather than driven through real time. The claim under test is about the target values the component pushes, not about the easing curve `svelte/motion` applies between them; asserting on an animated intermediate would make the test a clock test.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Hoisted so the `svelte/motion` factory below can close over it. `vi.mock` factories are lifted above the module body, so a plain top-level `const` would be in its temporal dead zone at factory-definition time.
 */
const { progressTargets } = vi.hoisted(() => ({ progressTargets: [] as Array<number> }));

/**
 * A minimal store with the surface `PasswordValidator` uses from `tweened`: `subscribe` (for the `$progress` auto-subscription in the markup) and `set` (the push under test). Every `set` target is recorded in order, which is the whole observation this file makes.
 */
vi.mock('svelte/motion', () => ({
  tweened(initial: number) {
    let value = initial;
    const subscribers = new Set<(next: number) => void>();
    return {
      subscribe(run: (next: number) => void) {
        subscribers.add(run);
        run(value);
        return () => subscribers.delete(run);
      },
      set(next: number) {
        progressTargets.push(next);
        value = next;
        for (const notify of subscribers) notify(value);
        return Promise.resolve();
      },
      update(fn: (current: number) => number) {
        return this.set(fn(value));
      }
    };
  }
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const PasswordValidator = (await import('./PasswordValidator.svelte')).default;

/** The five positive (non-negative) rules `passwordValidation.ts` declares: length, uppercase, lowercase, number, symbol. `validationRules` is exactly this set, and it is the denominator of the ratio. */
const POSITIVE_RULE_COUNT = 5;

/** The component validates on a 200 ms debounce, so nothing recomputes until this much fake time has passed. */
const DEBOUNCE_MS = 200;

let teardown: Array<() => void> = [];

beforeEach(() => {
  progressTargets.length = 0;
  // Only the timer functions the debounce uses are faked. Leaving the microtask queue and `requestAnimationFrame` real keeps `flushSync()` behaving as it does in production.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  for (const stop of teardown.reverse()) stop();
  teardown = [];
  vi.useRealTimers();
});

/**
 * Mount the component against a reactive props object so a test can change the password AFTER mount and observe the recomputation, which is the only way to assert "on every recomputation" rather than "once at mount".
 */
function render(password: string, username = ''): { password: string; username: string } {
  const props = $state({ password, username });
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(PasswordValidator, { target, props });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return props;
}

/** Advance past the debounce and settle the reactive graph, so the pushed target reflects the new password. */
function settle(): void {
  vi.advanceTimersByTime(DEBOUNCE_MS);
  flushSync();
}

describe('PasswordValidator progress', () => {
  it('pushes 0 when no positive rule is satisfied', () => {
    render('');
    settle();

    expect(progressTargets.at(-1)).toBe(0);
  });

  it('pushes 1 when every positive rule is satisfied', () => {
    render('Abcdef1!');
    settle();

    expect(progressTargets.at(-1)).toBe(1);
  });

  it('pushes the completed-rule ratio for a partially satisfied password', () => {
    // `Abcdefgh` satisfies length, uppercase and lowercase; it has no digit and no symbol.
    render('Abcdefgh');
    settle();

    expect(progressTargets.at(-1)).toBeCloseTo(3 / POSITIVE_RULE_COUNT);
  });

  it('pushes a fresh target into the tweened handle on every recomputation', () => {
    const props = render('');
    settle();
    expect(progressTargets.at(-1)).toBe(0);

    const pushesBefore = progressTargets.length;
    props.password = 'Abcdefgh';
    flushSync();
    settle();

    // A conversion that dropped the push would leave the count unmoved here while the rule list above the bar updated — the exact silent failure this file exists to catch.
    expect(progressTargets.length).toBeGreaterThan(pushesBefore);
    expect(progressTargets.at(-1)).toBeCloseTo(3 / POSITIVE_RULE_COUNT);
  });
});
