import { describe, expect, it } from 'vitest';
import {
  isGlobalPrivacyControlSet,
  mayAttachVisitId,
  mayFillSessionId,
  maySendEvents,
  maySendPageview,
  relayUsable,
  shouldShowContestantOptOut,
  shouldShowVoterPrompt
} from './gates';
import type { AnalyticsProjection, ConsentMode, VisitIdMode } from '$lib/analytics/modes';
import type { ConsentStatus } from '../userPreferences.type';
import type { GateInput } from './gates';

const ACTIVE = [true, false] as const;
const CONSENT_MODES: ReadonlyArray<ConsentMode> = ['gated', 'free'];
const VISIT_ID_MODES: ReadonlyArray<VisitIdMode> = ['memory', 'none'];
const SIGNALS = [false, true] as const;
const TRACK_EVENTS = [true, false] as const;
const CONSENTS: ReadonlyArray<ConsentStatus | undefined> = ['granted', 'denied', 'indetermined', undefined];
const VOTER_APP_ACCESSIBLE = [true, false] as const;

type Row = GateInput & { voterAppAccessible: boolean };

/** Every combination of the gate inputs: 2 × 2 × 2 × 2 × 2 × 4 × 2 = 256 rows. */
const ALL_ROWS: ReadonlyArray<Row> = ACTIVE.flatMap((active) =>
  CONSENT_MODES.flatMap((consentMode) =>
    VISIT_ID_MODES.flatMap((visitIdMode) =>
      SIGNALS.flatMap((globalPrivacyControl) =>
        TRACK_EVENTS.flatMap((trackEvents) =>
          CONSENTS.flatMap((consent) =>
            VOTER_APP_ACCESSIBLE.map((voterAppAccessible) => ({
              projection: { active, consentMode, visitIdMode },
              globalPrivacyControl,
              trackEvents,
              consent,
              voterAppAccessible
            }))
          )
        )
      )
    )
  )
);

function label(row: Row): string {
  const { projection: p } = row;
  return [
    p.active ? 'active' : 'inactive',
    p.consentMode,
    p.visitIdMode,
    row.globalPrivacyControl ? 'gpc' : 'no-gpc',
    row.trackEvents ? 'track' : 'no-track',
    `consent=${row.consent ?? 'none'}`,
    row.voterAppAccessible ? 'voter-open' : 'voter-closed'
  ].join(' ');
}

function projection(overrides: Partial<AnalyticsProjection> = {}): AnalyticsProjection {
  return { active: true, consentMode: 'gated', visitIdMode: 'memory', ...overrides };
}

function input(overrides: Partial<Row> = {}): Row {
  return {
    projection: projection(),
    globalPrivacyControl: false,
    trackEvents: true,
    consent: 'granted',
    voterAppAccessible: true,
    ...overrides
  };
}

describe('the gate truth table, written out', () => {
  // Each row states the expected value of every gate for one input, by hand.
  const TABLE: ReadonlyArray<
    [
      name: string,
      row: Row,
      expected: {
        relay: boolean;
        pageview: boolean;
        events: boolean;
        voterPrompt: boolean;
        optOut: boolean;
        sessionId: boolean;
      }
    ]
  > = [
    [
      'gated, granted',
      input(),
      { relay: true, pageview: true, events: true, voterPrompt: false, optOut: true, sessionId: true }
    ],
    [
      'gated, undecided',
      input({ consent: 'indetermined' }),
      { relay: true, pageview: true, events: false, voterPrompt: true, optOut: true, sessionId: false }
    ],
    [
      'gated, no stored choice',
      input({ consent: undefined }),
      { relay: true, pageview: true, events: false, voterPrompt: true, optOut: true, sessionId: false }
    ],
    [
      'gated, denied',
      input({ consent: 'denied' }),
      { relay: true, pageview: true, events: false, voterPrompt: false, optOut: true, sessionId: false }
    ],
    [
      'gated, undecided, voter app closed',
      input({ consent: undefined, voterAppAccessible: false }),
      { relay: true, pageview: true, events: false, voterPrompt: false, optOut: true, sessionId: false }
    ],
    [
      'gated, trackEvents off',
      input({ trackEvents: false, consent: undefined }),
      { relay: true, pageview: true, events: false, voterPrompt: false, optOut: false, sessionId: false }
    ],
    [
      'free, denied',
      input({ projection: projection({ consentMode: 'free' }), consent: 'denied' }),
      { relay: true, pageview: true, events: true, voterPrompt: false, optOut: false, sessionId: true }
    ],
    [
      'free, no stored choice, visit id none',
      input({ projection: projection({ consentMode: 'free', visitIdMode: 'none' }), consent: undefined }),
      { relay: true, pageview: true, events: true, voterPrompt: false, optOut: false, sessionId: false }
    ],
    [
      'free, trackEvents off',
      input({ projection: projection({ consentMode: 'free' }), trackEvents: false }),
      { relay: true, pageview: true, events: false, voterPrompt: false, optOut: false, sessionId: false }
    ],
    [
      'gated, granted, visit id none',
      input({ projection: projection({ visitIdMode: 'none' }) }),
      { relay: true, pageview: true, events: true, voterPrompt: false, optOut: true, sessionId: false }
    ],
    [
      'Global Privacy Control set',
      input({ globalPrivacyControl: true }),
      { relay: false, pageview: false, events: false, voterPrompt: false, optOut: false, sessionId: false }
    ],
    [
      'Global Privacy Control set, free mode, undecided',
      input({ globalPrivacyControl: true, projection: projection({ consentMode: 'free' }), consent: undefined }),
      { relay: false, pageview: false, events: false, voterPrompt: false, optOut: false, sessionId: false }
    ],
    [
      'no provider',
      input({ projection: projection({ active: false }), consent: undefined }),
      { relay: false, pageview: false, events: false, voterPrompt: false, optOut: false, sessionId: false }
    ],
    [
      'no provider, granted',
      input({ projection: projection({ active: false }) }),
      { relay: false, pageview: false, events: false, voterPrompt: false, optOut: false, sessionId: false }
    ]
  ];

  it.each(TABLE)('%s', (_name, row, expected) => {
    expect({
      relay: relayUsable(row),
      pageview: maySendPageview(row),
      events: maySendEvents(row),
      voterPrompt: shouldShowVoterPrompt(row),
      optOut: shouldShowContestantOptOut(row),
      sessionId: mayFillSessionId(row)
    }).toEqual(expected);
  });
});

describe('the gate truth table, over every combination of inputs', () => {
  it('covers 256 combinations', () => {
    expect(ALL_ROWS).toHaveLength(256);
  });

  it.each(ALL_ROWS.map((row) => [label(row), row] as const))('%s', (_label, row) => {
    const { active, consentMode, visitIdMode } = row.projection;
    const usable = active && !row.globalPrivacyControl;
    const undecided = row.consent === undefined || row.consent === 'indetermined';

    expect(relayUsable(row)).toBe(usable);
    // The pageview depends on nothing but a usable relay.
    expect(maySendPageview(row)).toBe(relayUsable(row));

    const events = maySendEvents(row);
    expect(events).toBe(usable && row.trackEvents && (consentMode === 'free' || row.consent === 'granted'));
    if (consentMode === 'gated' && row.consent !== 'granted') expect(events).toBe(false);

    expect(shouldShowVoterPrompt(row)).toBe(
      usable && row.trackEvents && consentMode === 'gated' && row.voterAppAccessible && undecided
    );
    expect(shouldShowContestantOptOut(row)).toBe(usable && row.trackEvents && consentMode === 'gated');
    expect(mayFillSessionId(row)).toBe(visitIdMode === 'memory' && events);
  });
});

describe('mayAttachVisitId', () => {
  const CASES: ReadonlyArray<[ConsentMode, VisitIdMode, boolean, boolean]> = [
    ['gated', 'memory', true, true],
    ['gated', 'memory', false, true],
    ['free', 'memory', true, false],
    ['free', 'memory', false, true],
    ['gated', 'none', true, false],
    ['gated', 'none', false, false],
    ['free', 'none', true, false],
    ['free', 'none', false, false]
  ];

  it.each(CASES)(
    'consent mode %s, visit-id mode %s, sensitive %s gives %s',
    (consentMode, visitIdMode, sensitive, expected) => {
      expect(mayAttachVisitId({ projection: projection({ consentMode, visitIdMode }), sensitive })).toBe(expected);
    }
  );
});

describe('isGlobalPrivacyControlSet', () => {
  it('is true only for the boolean true', () => {
    expect(isGlobalPrivacyControlSet({ globalPrivacyControl: true })).toBe(true);
    expect(isGlobalPrivacyControlSet({ globalPrivacyControl: false })).toBe(false);
    expect(isGlobalPrivacyControlSet({ globalPrivacyControl: undefined })).toBe(false);
    expect(isGlobalPrivacyControlSet({ globalPrivacyControl: '1' })).toBe(false);
    expect(isGlobalPrivacyControlSet({})).toBe(false);
    expect(isGlobalPrivacyControlSet()).toBe(false);
  });
});
