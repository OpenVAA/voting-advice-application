/**
 * The hover shading of a clickable `EntityCard` action.
 *
 * A subcard, and a card header whose card has subcards, shade on hover; a plain list card lifts with a shadow instead and must not shade. The shading is a set of Tailwind classes on the action element, so the card is mounted against a fake context and the classes are read off the rendered link. Removing the classes, or applying them regardless of the card's variant, fails this test.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    appType: { current: 'candidate' },
    getRoute: { current: () => '/results/candidate/c1' },
    startEvent: () => undefined,
    t: (key: string) => key,
    appSettings: { results: { cardContents: {} } },
    dataRoot: {}
  })
}));

vi.mock('$lib/contexts/voter', () => ({
  getVoterContext: () => undefined
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { default: EntityCard } = await import('../EntityCard.svelte');

/** The classes that draw the hover shading. */
const HOVER_SHADE_CLASSES = ['rounded-md', 'hover:bg-base-content/20', 'hover:ring-4', 'hover:ring-base-content/20'];

/** A naked candidate: neither a match nor a nomination, so the card renders it directly. */
const CANDIDATE = { id: 'c1', type: 'candidate', name: 'Test Candidate', answers: {} };

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount a card of `variant` and return its action element. */
function renderAction(variant: 'list' | 'subcard'): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(EntityCard, {
    target,
    props: { entity: CANDIDATE as never, variant }
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  const action = target.querySelector<HTMLElement>('[data-testid="entity-card-action"]');
  expect(action, `the ${variant} card should render its action link`).not.toBeNull();
  return action!;
}

describe('EntityCard hover shading', () => {
  it('shades a clickable subcard on hover', () => {
    const action = renderAction('subcard');
    for (const cls of HOVER_SHADE_CLASSES) expect(action.classList, cls).toContain(cls);
  });

  it('does not shade a clickable list card', () => {
    const action = renderAction('list');
    for (const cls of HOVER_SHADE_CLASSES) expect(action.classList, cls).not.toContain(cls);
  });
});
