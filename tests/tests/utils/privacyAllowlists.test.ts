/**
 * Unit tests for the pure cores of the two privacy assertions: what may be stored on the device, and which origins the browser may talk to.
 *
 * Run: yarn test:unit:tests privacyAllowlists
 */
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_DEVICE_STATE,
  ALLOWED_PREFERENCE_MEMBERS,
  findThirdPartyRequests,
  findUnexpectedDeviceState,
  findUnexpectedPreferenceMembers
} from './privacyAllowlists';
import type { DeviceState, ObservedRequest } from './privacyAllowlists';

const APP_ORIGIN = 'http://localhost:5173';
const SUPABASE_ORIGIN = 'http://127.0.0.1:54321';
const ALLOWED_ORIGINS = [APP_ORIGIN, SUPABASE_ORIGIN];

/** A device state holding nothing. */
function emptyState(): DeviceState {
  return { localStorage: [], sessionStorage: [], cookies: [], indexedDB: [] };
}

/** A device state holding, in every store, the keys the application writes for purposes other than analytics. */
function allowedState(): DeviceState {
  return {
    localStorage: [
      'appContext-userPreferences',
      'VoterContext-answerStore',
      'contestantContext-isPreregistered',
      'contestantContext-userData-editedAnswers-candidate-3f2a8c1e'
    ],
    sessionStorage: [
      'voterContext-firstQuestionId',
      'contestantContext-preselectedElectionIds',
      'contestantContext-preselectedConstituencyIds',
      'sveltekit:snapshot',
      'sveltekit:scroll',
      'sveltekit:states'
    ],
    cookies: [
      'PARAGLIDE_LOCALE',
      'sb-127-auth-token',
      'sb-127-auth-token.0',
      'sb-127-auth-token.1',
      'sb-127-auth-token-code-verifier',
      'sb-my-project-auth-token',
      'id_token',
      'oidc_state',
      'oidc_nonce',
      'oidc_code_verifier'
    ],
    indexedDB: []
  };
}

describe('findUnexpectedDeviceState', () => {
  it('accepts an empty device', () => {
    expect(findUnexpectedDeviceState(emptyState())).toStrictEqual([]);
  });

  it('accepts every key the application writes for a purpose other than analytics', () => {
    expect(findUnexpectedDeviceState(allowedState())).toStrictEqual([]);
  });

  it('reports the tracking session id in sessionStorage, naming the key and its store', () => {
    const state = allowedState();
    state.sessionStorage.push('appContext-sessionId');
    expect(findUnexpectedDeviceState(state)).toStrictEqual(['sessionStorage: appContext-sessionId']);
  });

  it('does not allow the tracking session id in any store', () => {
    for (const store of Object.keys(ALLOWED_DEVICE_STATE) as Array<keyof DeviceState>) {
      const state = emptyState();
      state[store].push('appContext-sessionId');
      expect(findUnexpectedDeviceState(state)).toStrictEqual([`${store}: appContext-sessionId`]);
    }
  });

  it('reports an unknown cookie, an unknown localStorage key and every IndexedDB database, each by name', () => {
    const state = allowedState();
    state.cookies.push('_ga');
    state.localStorage.push('analytics.disabled');
    state.indexedDB.push('keyval-store', 'localforage');
    expect(findUnexpectedDeviceState(state)).toStrictEqual([
      'localStorage: analytics.disabled',
      'cookies: _ga',
      'indexedDB: keyval-store',
      'indexedDB: localforage'
    ]);
  });

  it('matches exact names exactly, not as prefixes', () => {
    const state = emptyState();
    state.localStorage.push('appContext-userPreferences-copy', 'VoterContext-answerStor');
    state.cookies.push('PARAGLIDE_LOCALE_2', 'id_token_extra');
    expect(findUnexpectedDeviceState(state)).toStrictEqual([
      'localStorage: appContext-userPreferences-copy',
      'localStorage: VoterContext-answerStor',
      'cookies: PARAGLIDE_LOCALE_2',
      'cookies: id_token_extra'
    ]);
  });

  it('allows only cookies of the Supabase auth shape, not any cookie starting with sb-', () => {
    const state = emptyState();
    state.cookies.push('sb-tracker', 'sb-127-auth-token-extra', 'sb--auth-token');
    expect(findUnexpectedDeviceState(state)).toStrictEqual([
      'cookies: sb-tracker',
      'cookies: sb-127-auth-token-extra',
      'cookies: sb--auth-token'
    ]);
  });

  it('allows a prefix only with something after it', () => {
    const state = emptyState();
    state.localStorage.push('contestantContext-userData-editedAnswers-');
    expect(findUnexpectedDeviceState(state)).toStrictEqual(['localStorage: contestantContext-userData-editedAnswers-']);
  });

  it('allows no IndexedDB database', () => {
    expect(ALLOWED_DEVICE_STATE.indexedDB).toStrictEqual({ exact: [], prefixes: [], patterns: [] });
  });
});

describe('findUnexpectedPreferenceMembers', () => {
  /** The stored form of the preferences: a versioned envelope around the data. */
  function envelope(data: unknown): string {
    return JSON.stringify({ version: 1, data });
  }

  it('lists the three members the preferences may hold', () => {
    expect([...ALLOWED_PREFERENCE_MEMBERS]).toStrictEqual(['dataCollection', 'feedback', 'survey']);
  });

  it('accepts preferences holding only the allowed members', () => {
    const raw = envelope({
      dataCollection: { consent: 'granted', date: '2026-10-19T00:00:00.000Z' },
      feedback: { status: 'received', date: '2026-10-19T00:00:00.000Z' },
      survey: { status: 'dismissed', date: '2026-10-19T00:00:00.000Z' }
    });
    expect(findUnexpectedPreferenceMembers(raw)).toStrictEqual([]);
  });

  it('accepts empty preferences', () => {
    expect(findUnexpectedPreferenceMembers(envelope({}))).toStrictEqual([]);
  });

  it('reports every other member by name', () => {
    const raw = envelope({ dataCollection: { consent: 'denied' }, visitorId: 'abc', theme: 'dark' });
    expect(findUnexpectedPreferenceMembers(raw)).toStrictEqual(['visitorId', 'theme']);
  });

  it('reports data that is not an object', () => {
    expect(findUnexpectedPreferenceMembers(envelope('abc'))).toStrictEqual(['data is not an object']);
    expect(findUnexpectedPreferenceMembers(envelope(['dataCollection']))).toStrictEqual(['data is not an object']);
  });

  it('reports a stored value without the envelope', () => {
    expect(findUnexpectedPreferenceMembers(JSON.stringify({ dataCollection: {} }))).toStrictEqual([
      'data is not an object'
    ]);
  });
});

describe('findThirdPartyRequests', () => {
  it('accepts requests to the two allowed origins with every script from the app', () => {
    const requests: Array<ObservedRequest> = [
      { url: `${APP_ORIGIN}/en/`, resourceType: 'document' },
      { url: `${APP_ORIGIN}/src/routes/+layout.svelte`, resourceType: 'script' },
      { url: `${APP_ORIGIN}/api/usage`, resourceType: 'fetch' },
      { url: `${SUPABASE_ORIGIN}/rest/v1/rpc/get_app_settings`, resourceType: 'fetch' },
      { url: `${SUPABASE_ORIGIN}/storage/v1/object/public/logo.png`, resourceType: 'image' }
    ];
    expect(findThirdPartyRequests(requests, ALLOWED_ORIGINS, APP_ORIGIN)).toStrictEqual([]);
  });

  it('reports a script from a third-party origin', () => {
    const requests: Array<ObservedRequest> = [
      { url: `${APP_ORIGIN}/en/`, resourceType: 'document' },
      { url: 'https://cloud.example-analytics.invalid/script.js', resourceType: 'script' }
    ];
    expect(findThirdPartyRequests(requests, ALLOWED_ORIGINS, APP_ORIGIN)).toStrictEqual([
      'script https://cloud.example-analytics.invalid/script.js: origin https://cloud.example-analytics.invalid is not allowed'
    ]);
  });

  it('reports a script from the Supabase origin, because scripts must be same-origin', () => {
    const requests: Array<ObservedRequest> = [
      { url: `${SUPABASE_ORIGIN}/storage/v1/object/public/widget.js`, resourceType: 'script' }
    ];
    expect(findThirdPartyRequests(requests, ALLOWED_ORIGINS, APP_ORIGIN)).toStrictEqual([
      `script ${SUPABASE_ORIGIN}/storage/v1/object/public/widget.js: a script from ${SUPABASE_ORIGIN}, not from the app's origin`
    ]);
  });

  it('reports a request of any type to another origin', () => {
    const requests: Array<ObservedRequest> = [
      { url: 'https://fonts.example.invalid/font.woff2', resourceType: 'font' },
      { url: 'https://collect.example.invalid/api/send', resourceType: 'fetch' }
    ];
    expect(findThirdPartyRequests(requests, ALLOWED_ORIGINS, APP_ORIGIN)).toStrictEqual([
      'font https://fonts.example.invalid/font.woff2: origin https://fonts.example.invalid is not allowed',
      'fetch https://collect.example.invalid/api/send: origin https://collect.example.invalid is not allowed'
    ]);
  });

  it('compares whole origins, so another port or scheme on the same host is another origin', () => {
    const requests: Array<ObservedRequest> = [
      { url: 'http://localhost:5174/x', resourceType: 'fetch' },
      { url: 'https://localhost:5173/x', resourceType: 'fetch' }
    ];
    expect(findThirdPartyRequests(requests, ALLOWED_ORIGINS, APP_ORIGIN)).toStrictEqual([
      'fetch http://localhost:5174/x: origin http://localhost:5174 is not allowed',
      'fetch https://localhost:5173/x: origin https://localhost:5173 is not allowed'
    ]);
  });

  it('reports a repeated request once', () => {
    const request: ObservedRequest = {
      url: 'https://cloud.example-analytics.invalid/script.js',
      resourceType: 'script'
    };
    expect(findThirdPartyRequests([request, request], ALLOWED_ORIGINS, APP_ORIGIN)).toHaveLength(1);
  });

  it('passes data: and blob: URLs, which have no network origin', () => {
    const requests: Array<ObservedRequest> = [
      { url: 'data:image/svg+xml;base64,PHN2Zy8+', resourceType: 'image' },
      { url: `blob:${APP_ORIGIN}/0b4d-4e6f`, resourceType: 'script' }
    ];
    expect(findThirdPartyRequests(requests, ALLOWED_ORIGINS, APP_ORIGIN)).toStrictEqual([]);
  });

  it('reports a URL it cannot parse instead of passing it', () => {
    const requests: Array<ObservedRequest> = [{ url: 'not a url', resourceType: 'fetch' }];
    expect(findThirdPartyRequests(requests, ALLOWED_ORIGINS, APP_ORIGIN)).toStrictEqual([
      'fetch not a url: the URL cannot be parsed'
    ]);
  });
});
