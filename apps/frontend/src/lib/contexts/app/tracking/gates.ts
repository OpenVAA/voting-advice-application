/**
 * The browser's tracking gates: which sends are allowed and which prompts are shown.
 *
 * Every gate is a pure function of its input. Nothing here reads a global; the caller passes in the projection the server sent, the Global Privacy Control signal, the `trackEvents` setting and the visitor's stored consent choice.
 */
import type { AnalyticsProjection } from '$lib/analytics/modes';
import type { ConsentStatus } from '../userPreferences.type';

/** Everything the gates decide on. */
export type GateInput = {
  /** What the server tells the browser about analytics. */
  projection: AnalyticsProjection;
  /** Whether the browser sends the Global Privacy Control signal. */
  globalPrivacyControl: boolean;
  /** The `trackEvents` application setting. */
  trackEvents: boolean;
  /** The visitor's stored consent choice, or `undefined` when none is stored. */
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
export function relayUsable(input: Pick<GateInput, 'projection' | 'globalPrivacyControl'>): boolean {
  return input.projection.active && !input.globalPrivacyControl;
}

/** The pageview is sent whenever the relay is usable, whatever `trackEvents` and the consent choice are. */
export function maySendPageview(input: GateInput): boolean {
  return relayUsable(input);
}

/** Every other event needs a usable relay, `trackEvents`, and either consent-free mode or a granted consent. */
export function maySendEvents(input: GateInput): boolean {
  return (
    relayUsable(input) && input.trackEvents && (input.projection.consentMode === 'free' || input.consent === 'granted')
  );
}

/** The voter's consent prompt is shown when events could be sent in gated mode, the voter app is open and no choice has been made. */
export function shouldShowVoterPrompt(input: GateInput & { voterAppAccessible: boolean }): boolean {
  return (
    relayUsable(input) &&
    input.trackEvents &&
    input.projection.consentMode === 'gated' &&
    input.voterAppAccessible &&
    (input.consent === undefined || input.consent === 'indetermined')
  );
}

/** The contestant's opt-out is offered when events could be sent in gated mode. */
export function shouldShowContestantOptOut(input: GateInput): boolean {
  return relayUsable(input) && input.trackEvents && input.projection.consentMode === 'gated';
}

/** The visit id goes on an event only in visit-id mode `memory`, and in consent-free mode never on a sensitive event. */
export function mayAttachVisitId(input: { projection: AnalyticsProjection; sensitive: boolean }): boolean {
  return input.projection.visitIdMode === 'memory' && (input.projection.consentMode === 'gated' || !input.sensitive);
}

/** The survey link's session id is filled only in visit-id mode `memory` and only when this visitor's events are sent. */
export function mayFillSessionId(input: GateInput): boolean {
  return input.projection.visitIdMode === 'memory' && maySendEvents(input);
}
