import { log } from '@openvaa/app-shared';
import { ResendCountdown } from '$contestant/components/emailSentPanel';
import { UNIVERSAL_API_ROUTES } from '$lib/api/base/universalApiRoutes';
import type { IdentityProviderRegistrationResult } from '$lib/server/contestant/identityProviderRegistration';

/**
 * Post one intent to the endpoint an identity-provider account saves its details through: `save`, `resend` or `acknowledge`, with what the intent carries.
 *
 * Never rejects: a failed request and an answer without a result are logged without their content and answered `undefined`.
 *
 * @param body - The intent and what it carries.
 * @returns The endpoint's result, or `undefined` when it gave none.
 */
export async function postIdentityProviderRegistration(
  body: Record<string, unknown>
): Promise<IdentityProviderRegistrationResult | undefined> {
  try {
    const response = await fetch(UNIVERSAL_API_ROUTES.identityProviderRegistration, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const reply: unknown = await response.json();
    const result = typeof reply === 'object' && reply !== null ? (reply as { result?: unknown }).result : undefined;
    return typeof result === 'string' ? (result as IdentityProviderRegistrationResult) : undefined;
  } catch (error) {
    log.error('The identity-provider registration request failed', { err: error });
    return undefined;
  }
}

/**
 * "Send again" for an address awaiting its confirmation link: the request that mails the link once more, and the count of {@link ResendCountdown} that follows it.
 *
 * A press while the count runs or while a request is in flight does nothing. Otherwise the status says at once that a new email was asked for, the endpoint is asked to mail the pending address's link again, and the count runs from the request's settlement. What the endpoint answers is not shown: the count follows every request, so a refused one reads the same as a sent one.
 *
 * One instance per screen, started and stopped with it:
 *
 * ```ts
 * const resend = new PendingAddressResend();
 * onMount(() => {
 *   resend.start();
 *   return () => resend.stop();
 * });
 * ```
 *
 * `secondsLeft`, `requesting`, `unavailable` and `status` are reactive: read them off the instance inside a tracking scope.
 *
 * Tested in `pendingAddressResend.svelte.test.ts`.
 */
export class PendingAddressResend {
  /** When the last request settled, in epoch milliseconds. */
  #settledAt = $state<number>();
  #requesting = $state(false);
  readonly #countdown = new ResendCountdown(() => this.#settledAt);

  /** How many whole seconds are left before the link can be asked for again. */
  get secondsLeft(): number {
    return this.#countdown.secondsLeft;
  }

  /** Whether a request is in flight. */
  get requesting(): boolean {
    return this.#requesting;
  }

  /** Whether a press does nothing now: seconds are left, or a request is in flight. */
  get unavailable(): boolean {
    return this.#requesting || this.#countdown.secondsLeft > 0;
  }

  /** What a status region says: nothing before the first press, then `requested` until the count ends, and `ready` after. */
  get status(): 'requested' | 'ready' | undefined {
    return this.#countdown.status;
  }

  /** Begin reading the clock. */
  start(): void {
    this.#countdown.start();
  }

  /** Stop reading the clock. */
  stop(): void {
    this.#countdown.stop();
  }

  /** Ask for the pending address's link again, unless the button is unavailable. */
  async resend(): Promise<void> {
    if (this.unavailable) return;
    this.#countdown.markRequested();
    this.#requesting = true;
    await postIdentityProviderRegistration({ intent: 'resend' });
    this.#settledAt = Date.now();
    this.#requesting = false;
  }
}
