/**
 * The admin jobs page's system-health tiles.
 *
 * REGRESSION (157 review, Lot C CR-03). The page nested-destructured `jobs: { activeJobsByFeature, pastJobs }` out of the admin context. Both are read-only PROTOTYPE GETTERS over `$derived`/`$derived.by` (`jobStates.svelte.ts`), which return a NEW collection on every recompute, so the destructure bound the initial empty `Map`/array at component init and every tile was frozen: `activeJobsCount` always `0`, and all three past-job tiles filtering a permanently empty array. The page renders perfectly while showing nothing, which is why nothing caught it.
 *
 * The test mounts the real page against a fake context with the same reactive shape and updates the registry AFTER mount.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_FEATURES } from '$lib/admin/features';
import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

function job(id: string, status: JobInfo['status'], jobType: AdminFeature = 'ArgumentCondensation'): JobInfo {
  return {
    id,
    jobType,
    author: 'admin@openvaa.test',
    status,
    progress: 1,
    startTime: '2026-08-31T00:00:00.000Z',
    endTime: status === 'running' || status === 'aborting' ? undefined : '2026-08-31T00:05:00.000Z',
    lastActivityTime: '2026-08-31T00:04:30.000Z',
    infoMessages: [],
    warningMessages: [],
    errorMessages: []
  };
}

function isActive(candidate: JobInfo): boolean {
  return candidate.status === 'running' || candidate.status === 'aborting';
}

/** The same reactive shape as `JobStatesProvider` — see the sibling `FeatureJobs.svelte.test.ts` for why the fake has to reproduce the fresh-collection-per-recompute part. */
class FakeJobStates {
  #jobs = $state<Array<JobInfo>>([]);
  #pastJobs = $derived(this.#jobs.filter((candidate) => !isActive(candidate)));
  #activeJobsByFeature = $derived.by(() => {
    const map = new Map<AdminFeature, JobInfo | undefined>();
    for (const feature of ADMIN_FEATURES) {
      const found = this.#jobs.find((candidate) => candidate.jobType === feature && isActive(candidate));
      if (found) map.set(feature, found);
    }
    return map;
  });
  #pastJobsByFeature = $derived.by(() => {
    const map = new Map<AdminFeature, Array<JobInfo>>();
    for (const feature of ADMIN_FEATURES) {
      map.set(
        feature,
        this.#pastJobs.filter((candidate) => candidate.jobType === feature)
      );
    }
    return map;
  });

  get activeJobsByFeature() {
    return this.#activeJobsByFeature;
  }
  get pastJobs() {
    return this.#pastJobs;
  }
  get pastJobsByFeature() {
    return this.#pastJobsByFeature;
  }

  add(next: JobInfo): void {
    this.#jobs = [...this.#jobs, next];
  }
}

let jobs!: FakeJobStates;

vi.mock('$lib/contexts/admin', () => ({
  getAdminContext: () => ({
    t: (key: string) => key,
    getRoute: { current: () => '/admin/argument-condensation' },
    jobs,
    abortJob: vi.fn(async () => undefined),
    abortAllJobs: vi.fn(async () => undefined)
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
}));

/**
 * jsdom ships no `window.matchMedia`, and `svelte/motion` reads it at module-evaluation time to honour `prefers-reduced-motion`. This page now reaches the layout components through the `$layouts/main` barrel, which loads `Header.svelte` and therefore the candidate logout button's `TimedModal` transitively, so without this the suite fails during import and never reaches a single assertion. The stub answers "no preference", which is the browser default the components are authored against. Same shape as `PasswordSetter.svelte.test.ts`.
 */
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

const JobsPage = (await import('./+page.svelte')).default;

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
  const component = mount(JobsPage, { target });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
    stop();
  });
  return target;
}

/** The four system-health tiles, in DOM order: active, completed, failed, aborted. */
function tiles(target: HTMLElement): Array<string> {
  return [...target.querySelectorAll('.stat-value')].map((node) => node.textContent?.trim() ?? '');
}

describe('admin jobs page — the system-health tiles track the job registry', () => {
  it('counts jobs that arrive AFTER mount', () => {
    const target = render();
    expect(tiles(target)).toEqual(['0', '0', '0', '0']);

    jobs.add(job('a', 'running'));
    jobs.add(job('b', 'completed'));
    jobs.add(job('c', 'failed'));
    jobs.add(job('d', 'aborted'));
    flushSync();

    expect(tiles(target)).toEqual(['1', '1', '1', '1']);
  });

  it('counts an active job of a second feature too, so the tile is not a single-feature read', () => {
    const target = render();

    jobs.add(job('a', 'running', 'ArgumentCondensation'));
    jobs.add(job('b', 'aborting', 'QuestionInfoGeneration'));
    flushSync();

    expect(tiles(target)[0]).toBe('2');
  });
});
