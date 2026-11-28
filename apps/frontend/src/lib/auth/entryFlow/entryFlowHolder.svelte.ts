import { TooManyRequestsError } from '$lib/api/base/tooManyRequestsError';
import { askedAgainTooSoon, settledOrBounded, wordingOf } from './entryFlow';
import type { EntryFlow, EntryHeldCode, EntryHeldRequest, EntryLinkRefusal, EntryLinkRequest } from './entryFlow';

/**
 * The entry flow one app's context holds: a registration code with the status its check answered, and the one link request the "email sent" screen can repeat.
 *
 * Each app's context builds one holder with the function that makes its link requests, and forwards the holder's four functions as its own. The flow is a field of the instance and nothing else: the server builds one context for each render, so a holder is one visitor's alone, where a binding of the module would be every visitor's. It is gone when the tab reloads.
 *
 * `send` is the one way a screen asks for a link: it resolves alike for a request that succeeded, failed or never answered, and holds nothing of an answer, so no screen can show what the server did with an address. The one outcome it passes on is a refusal over the per-caller limit, as the wait it names: that refusal comes before the server reads the address, so it says nothing about it. A refused request is not held. `flow` is replaced whole on every write. The four functions are arrow fields, so they keep working when they are taken off the instance.
 *
 * Tested in `entryFlowHolder.svelte.test.ts`.
 */
export class EntryFlowHolder {
  #flow = $state.raw<EntryFlow | undefined>(undefined);
  readonly #request: (request: EntryLinkRequest) => unknown;

  /**
   * @param request - Makes the call a link request's origin decides. Its outcome is awaited through the bounded wait, and read only for a `TooManyRequestsError`.
   */
  constructor(request: (request: EntryLinkRequest) => unknown) {
    this.#request = request;
  }

  /** What the flow holds, if anything. A reactive accessor replaced whole on every write: read `holder.flow`, never keep it. */
  get flow(): EntryFlow | undefined {
    return this.#flow;
  }

  // Holds the checked code for the screen that uses it next. A request held before belongs to an earlier pass through the flow and goes.
  holdCode = (code: EntryHeldCode): void => {
    this.#flow = { code };
  };

  // The present time and the held request are read before the request is made, the request is awaited through the bounded wait, and only then is the state written, with the time of that moment. A refusal over the per-caller limit resolves to its wait and writes nothing; every other outcome resolves to nothing. Nothing of the request is logged.
  send = async (request: EntryLinkRequest): Promise<EntryLinkRefusal | undefined> => {
    const askedAgain = askedAgainTooSoon(this.#flow?.request, request, Date.now());
    let refusal: EntryLinkRefusal | undefined;
    await settledOrBounded(
      this.#call(request).catch((error: unknown) => {
        if (error instanceof TooManyRequestsError) refusal = { retryAfterSeconds: error.retryAfterSeconds };
      })
    );
    if (refusal) return refusal;
    const held: EntryHeldRequest = {
      origin: request.origin,
      wording: wordingOf(request),
      settledAt: Date.now(),
      askedAgain
    };
    if (request.email !== undefined) held.email = request.email;
    if (request.code !== undefined) held.code = request.code;
    // A request made with the held code keeps that code beside it. Any other request replaces the whole flow.
    const heldCode = this.#flow?.code;
    this.#flow = heldCode && heldCode.code === request.code ? { code: heldCode, request: held } : { request: held };
    return undefined;
  };

  // Repeats exactly the held request and holds it again with a new settlement time, or resolves to the wait of a refusal over the per-caller limit and keeps the held request as it was.
  resend = async (): Promise<EntryLinkRefusal | undefined> => {
    const held = this.#flow?.request;
    if (!held) return undefined;
    const request: EntryLinkRequest = { origin: held.origin };
    if (held.email !== undefined) request.email = held.email;
    if (held.code !== undefined) request.code = held.code;
    return this.send(request);
  };

  clear = (): void => {
    this.#flow = undefined;
  };

  /** The request, as a promise: a function that throws at the call answers with a rejected one, which the bounded wait takes as it takes any other outcome. */
  #call = async (request: EntryLinkRequest): Promise<unknown> => this.#request(request);
}
