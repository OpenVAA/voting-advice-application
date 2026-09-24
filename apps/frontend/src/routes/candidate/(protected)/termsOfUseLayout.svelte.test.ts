/**
 * The candidate protected layout's terms-of-use submit — the one `save()` caller that ignored its result.
 *
 * **REGRESSION INTRODUCED BY THIS PHASE, not a pre-existing gap.** `157.1-06` made `candidateUserDataState.save()` return `{ type: 'failure' }` when the answers write-back could not be verified, and positioned that early return BEFORE the `updateEntityProperties` call that persists `termsOfUseAccepted`. `handleSubmit()` here awaited `save()` and then unconditionally set `status = 'success'` and `termsSubmitted = true`. Before `157.1-06` the answers branch returned a truthy `{}`, the guard passed, and the property write DID run — so the caller's missing check cost nothing. After it, a candidate with buffered answers whose read-back is malformed sees success, keeps their answer buffer (correct, ledger row 4) and has their terms acceptance silently NOT persisted.
 *
 * That is a silent success shipped by the phase whose stated goal is retiring silent success (criterion 2), which is why `157.1-08` owns it rather than deferring it. `157.1-06-SUMMARY.md` § "The third caller, deliberately unfixed" is where it was found.
 *
 * The fix is the SAME idiom the two already-checked entrances use — `result?.type !== 'success'` — routed to the SAME existing failure surface, `candidateApp.error.saveFailed`. Decision **B4(a)**: no new component, no new status value, no new translation key, and the failure is not converted to a throw.
 *
 * The component is mounted for real against a fake context, following `routes/admin/(protected)/jobs/jobsPage.svelte.test.ts`. Asserting on the DOM rather than on a spy is deliberate: what makes this a defect is that the CANDIDATE is told the save succeeded, so the assertion has to be about what the candidate is shown.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** What the fake `save()` resolves to. Reassigned per case. */
let saveResult: { type: 'success' | 'failure' };
let saveCalls: number;
let setTermsCalls: number;

vi.mock('$lib/contexts/candidate/candidateContext.svelte', () => ({
  getCandidateContext: () => ({
    t: (key: string) => key,
    setDataRoot: () => undefined,
    logout: async () => undefined,
    userData: {
      init: () => undefined,
      setTermsOfUseAccepted: () => {
        setTermsCalls += 1;
      },
      save: async () => {
        saveCalls += 1;
        return saveResult;
      }
    }
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

const ProtectedLayout = (await import('./+layout.svelte')).default;

/** Loader data that resolves `validity` and leaves the terms un-accepted, so the layout renders the form. */
function layoutData() {
  return {
    questionData: { categories: [], questions: [] },
    candidateUserData: {
      candidate: { id: 'c1', termsOfUseAccepted: null },
      nominations: { nominations: [], entities: [] }
    }
  };
}

let teardown: Array<() => void> = [];

beforeEach(() => {
  saveResult = { type: 'success' };
  saveCalls = 0;
  setTermsCalls = 0;
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

function render(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ProtectedLayout, {
    target,
    props: { data: layoutData() as never, children: undefined as never }
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Tick the acceptance checkbox and press Continue, exactly as a candidate does. */
async function acceptAndSubmit(target: HTMLElement): Promise<void> {
  const checkbox = target.querySelector<HTMLInputElement>('[data-testid="terms-checkbox"]');
  expect(checkbox, 'the terms checkbox should be rendered').not.toBeNull();
  checkbox!.checked = true;
  checkbox!.dispatchEvent(new Event('change', { bubbles: true }));
  checkbox!.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();

  const submit = target.querySelector<HTMLButtonElement>('[data-testid="terms-of-use-submit"]');
  expect(submit, 'the Continue button should be rendered').not.toBeNull();
  submit!.click();
  // `handleSubmit` awaits `save()`; one microtask turn is enough for a resolved promise.
  await Promise.resolve();
  await Promise.resolve();
  flushSync();
}

describe('candidate protected layout — the terms-of-use submit branches on save()’s result', () => {
  it('does NOT report success when the composite save returns a failure', async () => {
    saveResult = { type: 'failure' };
    const target = render();

    await acceptAndSubmit(target);

    expect(saveCalls, 'save() should have been called').toBe(1);
    // The candidate must be told the save did not happen.
    const alert = target.querySelector('[data-testid="tou-save-error"]');
    expect(alert, 'a failure return must surface the save-failed message').not.toBeNull();
    expect(alert?.textContent?.trim()).toBe('candidateApp.error.saveFailed');
    // And the form must still be on screen: `termsSubmitted` may not be set on a failure, or the layout advances to `ready` and the un-persisted acceptance is never asked for again.
    expect(target.querySelector('[data-testid="terms-of-use-submit"]')).not.toBeNull();
  });

  it('reports success and advances past the form when the save succeeds', async () => {
    saveResult = { type: 'success' };
    const target = render();

    await acceptAndSubmit(target);

    expect(saveCalls).toBe(1);
    expect(setTermsCalls).toBe(1);
    expect(target.querySelector('[data-testid="tou-save-error"]')).toBeNull();
    // `termsSubmitted` flips `layoutState` to `ready`, which unmounts the form.
    expect(target.querySelector('[data-testid="terms-of-use-submit"]')).toBeNull();
  });
});
