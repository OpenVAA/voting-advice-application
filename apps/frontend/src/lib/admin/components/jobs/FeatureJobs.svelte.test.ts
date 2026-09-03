/**
 * `FeatureJobs.svelte` — the per-feature job panel.
 *
 * REGRESSION (157 review, Lot C CR-03). The component nested-destructured `jobs: { activeJobsByFeature, pastJobsByFeature }` out of the admin context. Those are read-only PROTOTYPE GETTERS over `$derived.by` (`jobStates.svelte.ts`, exposed that way per its own JSDoc so that reads via `instance.X` re-invoke the getter inside the tracking scope), and `$derived.by` returns a NEW `Map` on every recompute. Destructuring invoked each getter once at component init and bound the initial empty `Map` to a local, so polling updated the registry and nothing downstream ever saw it — the CLAUDE.md § Context Destructuring Rule, violated. The file carried a TODO calling the symptom "not showing past jobs"; this is that bug.
 *
 * The test mounts the real component against a fake context whose projections have the same shape as the real ones (prototype getters over `$derived.by`, returning a fresh `Map` per recompute), then updates the registry AFTER mount. A destructured read is frozen at its init value and fails; a `ctx.jobs.X` read inside the tracking scope passes.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_FEATURES } from '$lib/admin/features';
import type { AdminFeature } from '$lib/admin/features';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';

const FEATURE: AdminFeature = 'ArgumentCondensation';

function job(id: string, status: JobInfo['status']): JobInfo {
  return {
    id,
    jobType: FEATURE,
    author: 'admin@openvaa.test',
    status,
    progress: status === 'running' ? 0.5 : 1,
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

/**
 * The same reactive shape as `JobStatesProvider`: a private `$state` registry behind read-only prototype getters over `$derived`/`$derived.by`, each of which returns a NEW collection per recompute. That last part is what makes a destructured read go stale, so the fake has to reproduce it rather than hand out a `$state` proxy.
 */
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

  /** Stand in for a polling tick: replace the registry with a new array, exactly as `#fetchAndUpdateJobs` does. */
  add(next: JobInfo): void {
    this.#jobs = [...this.#jobs, next];
  }
}

let jobs!: FakeJobStates;

const abortJob = vi.fn(async () => undefined);
const abortAllJobs = vi.fn(async () => undefined);

vi.mock('$lib/contexts/admin', () => ({
  getAdminContext: () => ({
    t: (key: string) => key,
    getRoute: { current: () => '/admin/argument-condensation' },
    jobs,
    abortJob,
    abortAllJobs
  })
}));

// `Button`, rendered once the past-jobs section has content, reads the component context for its own `t`.
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const FeatureJobs = (await import('./FeatureJobs.svelte')).default;

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/**
 * Mount the component inside an `$effect.root` so the fake's `$derived` fields settle the way the real provider's do.
 */
function render(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const stop = $effect.root(() => {
    jobs = new FakeJobStates();
  });
  const component = mount(FeatureJobs, { target, props: { feature: FEATURE, showFeatureLink: false } });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
    stop();
  });
  return target;
}

describe('FeatureJobs.svelte reads the job projections reactively', () => {
  it('shows a past job that arrives AFTER mount', () => {
    const target = render();
    // Nothing yet: the empty-state placeholder is rendered.
    expect(target.textContent).toContain('adminApp.jobs.noPastJobs');

    jobs.add(job('past-1', 'completed'));
    flushSync();

    // The placeholder is gone and the count badge is rendered — the whole point of the section.
    expect(target.textContent).not.toContain('adminApp.jobs.noPastJobs');
    expect(target.textContent).toContain('adminApp.jobs.pastJobs');
    expect(target.querySelector('.badge')?.textContent?.trim()).toBe('1');
  });

  it('clears the no-active-jobs placeholder when an active job arrives AFTER mount', () => {
    const target = render();
    expect(target.textContent).toContain('adminApp.jobs.noActiveJobs');

    jobs.add(job('active-1', 'running'));
    flushSync();

    expect(target.textContent).not.toContain('adminApp.jobs.noActiveJobs');
  });
});
