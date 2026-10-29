/**
 * Compile-time controls for the tracking vocabulary.
 *
 * This file is checked by the typecheck, not by the test run. Each call that sits under an expect-error directive must fail to compile; if one of them starts to compile, its directive becomes unused and the typecheck fails. An unused expect-error directive is therefore the failure signal. The calls that sit under no directive must compile. None of the calls is ever executed.
 */
import { describe, expect, it } from 'vitest';
import type { TrackingService } from './trackingService.type';

/**
 * The calls checked against the vocabulary. Type-checked only, never run.
 *
 * @param tracking - Any value of the consumer-facing tracking service type.
 */
function vocabularyControls(tracking: TrackingService): void {
  const { startEvent, track } = tracking;

  // Calls that must not compile.

  // @ts-expect-error -- a name outside the vocabulary
  startEvent('not_an_event');
  // @ts-expect-error -- a former template name in its expanded form
  startEvent('results_ranked_candidate', { entityType: 'candidate', entityId: 'c1', score: 50 });
  // @ts-expect-error -- free text is not an attribute of the feedback events
  startEvent('feedback_sent', { rating: 5, description: 'typed text' });
  // @ts-expect-error -- the filter names are not an attribute of filters_active
  startEvent('filters_active', { count: 2, activeFilters: 'a,b' });
  // @ts-expect-error -- the required attributes are missing
  startEvent('results_ranked_entity');
  // @ts-expect-error -- the pageview is built by the service, never started at a call site
  startEvent('pageview', { params: {}, duration: 0 });

  // Calls that must compile.

  startEvent('menu_open');
  startEvent('answer', { questionId: 'q1', value: 3 });
  track('maintenance_shown');
}

describe('tracking vocabulary controls', () => {
  it('are checked by the typecheck', () => {
    expect(typeof vocabularyControls).toBe('function');
  });
});
