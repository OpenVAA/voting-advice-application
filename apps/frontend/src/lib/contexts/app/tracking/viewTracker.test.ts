import { describe, expect, it } from 'vitest';
import { SAMPLE_ID, SAMPLE_OTHER_ID } from '$lib/analytics/events.fixtures';
import { ROUTE } from '$lib/routes/route';
import { createViewTracker } from './viewTracker';

/** A clock the test moves by hand. */
function stepClock(): { now: () => number; set: (ms: number) => void } {
  let current = 0;
  return {
    now: () => current,
    set: (ms) => {
      current = ms;
    }
  };
}

const RESULTS_PARAMS = {
  electionTab: SAMPLE_ID,
  entityTab: 'candidates',
  entity: 'candidate',
  id: SAMPLE_OTHER_ID
};

describe('createViewTracker', () => {
  it('returns one draft for a started view, with its route, locale, allowed parameters and visible time', () => {
    const clock = stepClock();
    const tracker = createViewTracker({ now: clock.now });
    clock.set(1_000);
    tracker.start({ routeId: ROUTE.Question, locale: 'fi', params: { questionId: SAMPLE_ID } }, true);
    clock.set(3_500);

    expect(tracker.takePageview()).toEqual({
      routeId: ROUTE.Question,
      locale: 'fi',
      params: { questionId: SAMPLE_ID },
      duration: 2_500
    });
    clock.set(9_000);
    expect(tracker.takePageview()).toBeUndefined();
  });

  it('returns exactly one draft over hidden, visible and a navigation, at the first take', () => {
    const clock = stepClock();
    const tracker = createViewTracker({ now: clock.now });
    const drafts = new Array<unknown>();
    function take() {
      const draft = tracker.takePageview();
      if (draft) drafts.push(draft);
      return draft;
    }

    tracker.start({ routeId: ROUTE.Home, locale: 'en', params: {} }, true);
    clock.set(2_000);
    // The page is hidden: the service flushes.
    tracker.setVisible(false);
    const first = take();
    clock.set(10_000);
    // The visitor returns to the tab, stays a while, then navigates away: the service flushes again.
    tracker.setVisible(true);
    clock.set(15_000);
    expect(take()).toBeUndefined();
    tracker.setVisible(false);
    expect(take()).toBeUndefined();

    expect(drafts).toHaveLength(1);
    expect(first).toEqual({ routeId: ROUTE.Home, locale: 'en', params: {}, duration: 2_000 });
  });

  it('leaves time spent hidden out of the duration', () => {
    const clock = stepClock();
    const tracker = createViewTracker({ now: clock.now });
    tracker.start({ routeId: ROUTE.Home, locale: 'en', params: {} }, true);
    clock.set(1_000);
    tracker.setVisible(false);
    clock.set(5_000);
    tracker.setVisible(true);
    clock.set(5_500);
    expect(tracker.takePageview()?.duration).toBe(1_500);
  });

  it('counts nothing before a view that starts hidden becomes visible', () => {
    const clock = stepClock();
    const tracker = createViewTracker({ now: clock.now });
    tracker.start({ routeId: ROUTE.Home, locale: 'en', params: {} }, false);
    clock.set(4_000);
    tracker.setVisible(true);
    clock.set(4_250);
    expect(tracker.takePageview()?.duration).toBe(250);
  });

  it('ignores repeated visibility reports of the same state', () => {
    const clock = stepClock();
    const tracker = createViewTracker({ now: clock.now });
    tracker.start({ routeId: ROUTE.Home, locale: 'en', params: {} }, true);
    clock.set(1_000);
    tracker.setVisible(true);
    clock.set(2_000);
    tracker.setVisible(false);
    clock.set(3_000);
    tracker.setVisible(false);
    expect(tracker.takePageview()?.duration).toBe(2_000);
  });

  it('reports the duration as whole milliseconds', () => {
    let current = 0.25;
    const tracker = createViewTracker({ now: () => current });
    tracker.start({ routeId: ROUTE.Home, locale: 'en', params: {} }, true);
    current = 1_234.9;
    const duration = tracker.takePageview()?.duration;
    expect(Number.isInteger(duration)).toBe(true);
    expect(duration).toBe(1_235);
  });

  it('leaves no view for a null route id', () => {
    const tracker = createViewTracker({ now: () => 0 });
    tracker.start({ routeId: null, locale: 'en', params: null }, true);
    expect(tracker.currentView()).toBeUndefined();
    expect(tracker.takePageview()).toBeUndefined();
  });

  it('leaves no view for a route id that is not listed, and drops the previous view', () => {
    const tracker = createViewTracker({ now: () => 0 });
    tracker.start({ routeId: ROUTE.Home, locale: 'en', params: {} }, true);
    tracker.start({ routeId: '/not-a-listed-route', locale: 'en', params: {} }, true);
    expect(tracker.currentView()).toBeUndefined();
    expect(tracker.takePageview()).toBeUndefined();
  });

  it('keeps only the allowed parameters: the entity id of the results route is absent', () => {
    const tracker = createViewTracker({ now: () => 0 });
    tracker.start({ routeId: ROUTE.ResultEntity, locale: 'sv', params: RESULTS_PARAMS }, true);
    const expected = { electionTab: SAMPLE_ID, entityTab: 'candidates', entity: 'candidate' };

    expect(tracker.currentView()).toEqual({ routeId: ROUTE.ResultEntity, locale: 'sv', params: expected });
    const draft = tracker.takePageview();
    expect(draft?.params).toEqual(expected);
    expect(JSON.stringify(draft)).not.toContain(SAMPLE_OTHER_ID);
    expect(JSON.stringify(tracker.currentView())).not.toContain(SAMPLE_OTHER_ID);
  });

  it('treats null parameters as none', () => {
    const tracker = createViewTracker({ now: () => 0 });
    tracker.start({ routeId: ROUTE.Question, locale: 'en', params: null }, true);
    expect(tracker.currentView()).toEqual({ routeId: ROUTE.Question, locale: 'en', params: {} });
  });

  it('keeps the view after its pageview is taken, so later events still have a route', () => {
    const tracker = createViewTracker({ now: () => 0 });
    tracker.start({ routeId: ROUTE.Home, locale: 'en', params: {} }, true);
    tracker.takePageview();
    expect(tracker.currentView()).toEqual({ routeId: ROUTE.Home, locale: 'en', params: {} });
  });

  it('starts a new view after a take, which can be taken once', () => {
    const clock = stepClock();
    const tracker = createViewTracker({ now: clock.now });
    tracker.start({ routeId: ROUTE.Home, locale: 'en', params: {} }, true);
    clock.set(500);
    expect(tracker.takePageview()?.routeId).toBe(ROUTE.Home);

    tracker.start({ routeId: ROUTE.Questions, locale: 'en', params: {} }, true);
    clock.set(800);
    expect(tracker.takePageview()).toEqual({ routeId: ROUTE.Questions, locale: 'en', params: {}, duration: 300 });
    expect(tracker.takePageview()).toBeUndefined();
  });

  it('does not let a caller change the stored view through a returned object', () => {
    const tracker = createViewTracker({ now: () => 0 });
    tracker.start({ routeId: ROUTE.Question, locale: 'en', params: { questionId: SAMPLE_ID } }, true);
    const view = tracker.currentView();
    if (view) view.params.questionId = 'changed';
    expect(tracker.currentView()?.params).toEqual({ questionId: SAMPLE_ID });
  });
});
