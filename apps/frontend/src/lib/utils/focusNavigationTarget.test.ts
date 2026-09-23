import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { focusNavigationTarget } from './focusNavigationTarget';

/**
 * Specification for the post-navigation focus reset. The case that matters is the third: a focus target that renders AFTER the first frame. The one-shot form this replaced focused nothing in that case and left focus on `<body>`, which is how `a11y-smoke`'s "focus lands on heading after Q→Q nav" went red on a loaded host.
 *
 * The first lookup's scheduler is injected, so "the frame ran before the heading rendered" is a controlled ordering here rather than a race.
 */

/** Runs the scheduled first lookup only when the test calls `runFrame()`, standing in for `requestAnimationFrame`. */
function manualFrame(): { schedule: (callback: () => void) => void; runFrame: () => void } {
  let pending: (() => void) | undefined;
  return {
    schedule: (callback) => {
      pending = callback;
    },
    runFrame: () => {
      const callback = pending;
      pending = undefined;
      callback?.();
    }
  };
}

/** Lets the MutationObserver deliver its records, which it does asynchronously. */
async function flushMutations(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function appendHeading(attributes: Record<string, string> = {}): HTMLElement {
  const heading = document.createElement('hgroup');
  heading.setAttribute('tabindex', '-1');
  for (const [name, value] of Object.entries(attributes)) heading.setAttribute(name, value);
  document.body.appendChild(heading);
  return heading;
}

beforeEach(() => {
  document.body.innerHTML = '';
  (document.activeElement as HTMLElement | null)?.blur?.();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('focusNavigationTarget', () => {
  it('focuses the [data-focus-on-nav] element present on the first frame, in preference to an <h1>', () => {
    const h1 = document.createElement('h1');
    h1.setAttribute('tabindex', '-1');
    document.body.appendChild(h1);
    const target = appendHeading({ 'data-focus-on-nav': '' });
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    expect(document.activeElement).toBe(target);
  });

  it('falls back to the first <h1> when no element carries data-focus-on-nav', () => {
    const h1 = document.createElement('h1');
    h1.setAttribute('tabindex', '-1');
    document.body.appendChild(h1);
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    expect(document.activeElement).toBe(h1);
  });

  it('focuses a target that renders AFTER the first frame -- the one-shot form left focus on <body> here', async () => {
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    expect(document.activeElement).toBe(document.body);
    const target = appendHeading({ 'data-focus-on-nav': '' });
    await flushMutations();
    expect(document.activeElement).toBe(target);
  });

  it('does not take focus back when focus moved while the target was still pending', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule });
    frame.runFrame();
    button.focus();
    appendHeading({ 'data-focus-on-nav': '' });
    await flushMutations();
    expect(document.activeElement).toBe(button);
  });

  it('does nothing once cancelled by a newer navigation, before or after the first frame', async () => {
    const early = manualFrame();
    focusNavigationTarget({ schedule: early.schedule })();
    appendHeading({ 'data-focus-on-nav': '' });
    early.runFrame();
    expect(document.activeElement).toBe(document.body);

    document.body.innerHTML = '';
    const late = manualFrame();
    const cancel = focusNavigationTarget({ schedule: late.schedule });
    late.runFrame();
    cancel();
    appendHeading({ 'data-focus-on-nav': '' });
    await flushMutations();
    expect(document.activeElement).toBe(document.body);
  });

  it('stops waiting after the timeout', async () => {
    vi.useFakeTimers();
    const frame = manualFrame();
    focusNavigationTarget({ schedule: frame.schedule, timeoutMs: 1000 });
    frame.runFrame();
    vi.advanceTimersByTime(1001);
    appendHeading({ 'data-focus-on-nav': '' });
    await flushMutations();
    expect(document.activeElement).toBe(document.body);
  });
});
