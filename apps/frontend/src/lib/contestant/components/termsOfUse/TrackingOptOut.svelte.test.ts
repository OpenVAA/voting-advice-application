/**
 * `TrackingOptOut`, mounted for real against a fake component context.
 *
 * What this file holds: the box is a native checkbox inside its label with the label text, it follows its `optOut` property, a click on it writes the property back to the caller, and nothing takes it out of the tab order or disables it.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { TrackingOptOut } = await import('.');

const BOX = 'input[data-testid="terms-tracking-opt-out"]';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount the component and return its container. */
function render(props: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(TrackingOptOut, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** The one opt-out box in a container. */
function boxIn(target: HTMLElement): HTMLInputElement {
  const boxes = target.querySelectorAll<HTMLInputElement>(BOX);
  expect(boxes).toHaveLength(1);
  return boxes[0];
}

describe('TrackingOptOut', () => {
  it('renders one native checkbox inside a label that carries the opt-out text', () => {
    const box = boxIn(render({}));

    expect(box.type).toBe('checkbox');
    expect(box.name).toBe('trackingOptOut');
    const label = box.closest('label');
    expect(label).not.toBeNull();
    expect(label!.textContent).toContain('privacy.trackingOptOut.label');
  });

  it('is unticked when it is given no value', () => {
    expect(boxIn(render({})).checked).toBe(false);
  });

  it('is ticked when it is given true', () => {
    expect(boxIn(render({ optOut: true })).checked).toBe(true);
  });

  it('writes a click back to the bound value, both ways', () => {
    let optOut = false;
    const box = boxIn(
      render({
        get optOut() {
          return optOut;
        },
        set optOut(value: boolean) {
          optOut = value;
        }
      })
    );

    box.click();
    flushSync();
    expect(optOut).toBe(true);
    expect(box.checked).toBe(true);

    box.click();
    flushSync();
    expect(optOut).toBe(false);
    expect(box.checked).toBe(false);
  });

  it('is neither taken out of the tab order nor disabled', () => {
    const box = boxIn(render({}));

    expect(box.hasAttribute('tabindex')).toBe(false);
    expect(box.disabled).toBe(false);
  });
});
