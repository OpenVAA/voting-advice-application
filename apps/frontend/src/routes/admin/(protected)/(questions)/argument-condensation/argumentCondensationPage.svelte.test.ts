/**
 * The Argument condensation page's guard against starting a second job.
 *
 * `jobs.activeJobsByFeature` is a getter over a `$derived` value that returns a new `Map` on every recompute, so the page must read it off the context; a destructure would keep the mount-time `Map`, and a job started after mount would leave the start button enabled. The test mounts the page, chooses an election so the button is enabled, then adds a running job.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeJob, FakeJobStates } from '$lib/testing/fakeJobStates.svelte';

let jobs!: FakeJobStates;

vi.mock('$lib/contexts/admin', () => ({
  getAdminContext: () => ({
    t: (key: string) => key,
    getRoute: { current: () => '/admin' },
    jobs,
    abortJob: vi.fn(async () => undefined),
    dataRoot: {
      elections: [{ id: 'el-1', name: 'Election' }],
      getElection: () => ({ id: 'el-1' }),
      findQuestions: () => []
    }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false, locale: 'en', locales: ['en'] })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
}));

// jsdom ships no `window.matchMedia`, and `svelte/motion` reads it when the `$layouts/main` barrel is imported. The stub answers "no preference".
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    })
  });
}

const Page = (await import('./+page.svelte')).default;

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

function render(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const stop = $effect.root(() => {
    jobs = new FakeJobStates();
  });
  const component = mount(Page, { target });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
    stop();
  });
  return target;
}

function submitButton(target: HTMLElement): HTMLButtonElement {
  const button = target.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!button) throw new Error('the page rendered no submit button');
  return button;
}

describe('Argument condensation page — the start button follows the job registry', () => {
  it('disables the start button and says a job is running once a job starts after mount', () => {
    const target = render();
    const select = target.querySelector<HTMLSelectElement>('[data-testid="admin-argument-condensation-election"]');
    if (!select) throw new Error('the page rendered no election select');
    select.value = 'el-1';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(submitButton(target).disabled, 'the button is enabled once an election is chosen').toBe(false);
    expect(target.textContent).not.toContain('adminApp.jobs.alreadyRunning');

    jobs.add(fakeJob('job-1', 'running', 'ArgumentCondensation'));
    flushSync();

    expect(submitButton(target).disabled).toBe(true);
    expect(target.textContent).toContain('adminApp.jobs.alreadyRunning');
  });
});
