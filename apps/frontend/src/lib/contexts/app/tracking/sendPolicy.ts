/**
 * The browser's analytics send policy: which sends are allowed and which prompts are shown.
 *
 * Every rule is a pure function of its input. Nothing here reads a global; the caller passes in the projection the server sent, the Global Privacy Control signal, the `trackEvents` setting and the visitor's stored consent choice.
 */
import { appOfRoute } from '$lib/analytics/appOfRoute';
import type { AnalyticsProjection } from '$lib/analytics/modes';
import type { ConsentPreferenceKey, ConsentStatus } from '../userPreferences.type';

/**
 * The member of `UserPreferences` holding the consent choice that applies on a route. The Contestant App keeps its own choice, made when accepting the terms of use, so that it never answers the voter app's consent prompt; every other route reads the choice made in the voter app.
 *
 * @param routeId - A SvelteKit route id, e.g. `page.route.id`, or `null` / `undefined` when no route matched.
 */
export function consentPreferenceKey(routeId: string | null | undefined): ConsentPreferenceKey {
  return routeId != null && appOfRoute(routeId) === 'contestant' ? 'contestantDataConsent' : 'dataCollection';
}

/** Everything the send policy decides on. */
export type SendPolicyInput = {
  /** What the server tells the browser about analytics. */
  projection: AnalyticsProjection;
  /** Whether the browser sends the Global Privacy Control signal. */
  globalPrivacyControl: boolean;
  /** The `trackEvents` application setting. */
  trackEvents: boolean;
  /** The visitor's stored consent choice for the app of the current route (`consentPreferenceKey`), or `undefined` when none is stored. */
  consent: ConsentStatus | undefined;
};

/**
 * True when the navigator-like object reports the Global Privacy Control signal. Only the boolean `true` counts; a browser without the property reports `undefined`.
 *
 * The parameter is any object, because the DOM's `Navigator` type does not declare `globalPrivacyControl`; the property is looked up with `in`.
 *
 * @param nav - The navigator, or any object that may carry the property.
 */
export function isGlobalPrivacyControlSet(nav?: object): boolean {
  return nav !== undefined && 'globalPrivacyControl' in nav && nav.globalPrivacyControl === true;
}

/** The relay is usable when a provider is configured and the visitor has not sent Global Privacy Control. */
export function relayUsable(input: Pick<SendPolicyInput, 'projection' | 'globalPrivacyControl'>): boolean {
  return input.projection.active && !input.globalPrivacyControl;
}

/** The pageview is sent whenever the relay is usable, whatever `trackEvents` and the consent choice are. */
export function maySendPageview(input: SendPolicyInput): boolean {
  return relayUsable(input);
}

/** Every other event needs a usable relay, `trackEvents`, and either consent-free mode or a granted consent. */
export function maySendEvents(input: SendPolicyInput): boolean {
  return (
    relayUsable(input) && input.trackEvents && (input.projection.consentMode === 'free' || input.consent === 'granted')
  );
}

/** The voter's consent prompt is shown when events could be sent in gated mode, the voter app is open and no choice has been made. */
export function shouldShowVoterPrompt(input: SendPolicyInput & { voterAppAccessible: boolean }): boolean {
  return (
    relayUsable(input) &&
    input.trackEvents &&
    input.projection.consentMode === 'gated' &&
    input.voterAppAccessible &&
    (input.consent === undefined || input.consent === 'indetermined')
  );
}

/** The contestant's opt-out is offered when events could be sent in gated mode. */
export function shouldShowContestantOptOut(input: SendPolicyInput): boolean {
  return relayUsable(input) && input.trackEvents && input.projection.consentMode === 'gated';
}

/** The visit id goes on an event only in visit-id mode `memory`, and in consent-free mode never on a sensitive event. */
export function mayAttachVisitId(input: { projection: AnalyticsProjection; sensitive: boolean }): boolean {
  return input.projection.visitIdMode === 'memory' && (input.projection.consentMode === 'gated' || !input.sensitive);
}

/** The survey link's visit id is filled only in visit-id mode `memory` and only when this visitor's events are sent. */
export function mayFillVisitId(input: SendPolicyInput): boolean {
  return input.projection.visitIdMode === 'memory' && maySendEvents(input);
}
