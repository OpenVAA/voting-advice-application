/**
 * The constants, types and arithmetic of the Contestant App's entry flow: the screens a visitor passes from asking for a mailed link to the "email sent" screen.
 *
 * The module keeps no state. It exports constants, types and functions of their arguments, so the server and every browser tab can import it and none can read another's request. Whoever holds a flow keeps it on its own instance.
 *
 * Times are epoch milliseconds, as `Date.now()` answers them, and each function that needs the present time takes it as an argument.
 *
 * Tested in `entryFlow.test.ts`.
 */

/**
 * How many seconds must pass, counted from the settlement of a link request, before another email may be asked for.
 *
 * The server sends one mail to an address in 60 seconds, and it answers a request before it takes that address's slot. A wait of exactly 60 seconds counted from the answer could therefore end before the slot does, and the next request would send nothing. The five seconds over the minute are the margin.
 */
export const RESEND_WAIT_SECONDS = 65;

/**
 * How many milliseconds after it was made a link request is treated as settled, whether or not it has answered.
 *
 * The bound keeps the screen that follows a request from opening later for one address than for another, and from never opening when the request hangs. The server answers a request before doing its work, in milliseconds, so ten seconds is far beyond a healthy answer and still short enough to wait out on a loading button.
 */
export const LINK_REQUEST_SETTLE_BOUND_MS = 10_000;

/** The screen a link request is made from: the sign-in form, the registration screen's email option, the screen that takes the address for a valid code, the screen that signs in the holder of a used code, or the forgot-password page. */
export type EntryOrigin = 'signIn' | 'register' | 'registerEmail' | 'registerSignIn' | 'forgotPassword';

/** Which of its three wordings the "email sent" screen shows: for a sign-in link, for a password-recovery link, or for a link mailed to the address a used code was registered with. */
export type EntryWording = 'signIn' | 'recovery' | 'code';

/** A request for a mailed link: where it is made from, and the address, the registration code or both that it is made with. */
export type EntryLinkRequest = {
  origin: EntryOrigin;
  email?: string;
  code?: string;
};

/** A registration code the flow holds between the screen that checked it and the screen that uses it, with the check's answer. */
export type EntryHeldCode = {
  code: string;
  status: 'valid' | 'used';
};

/** The one link request the "email sent" screen can repeat: the request, its wording, when it settled, and whether the same request had been made inside the wait before it. */
export type EntryHeldRequest = EntryLinkRequest & {
  wording: EntryWording;
  /** When the request settled, or was treated as settled, in epoch milliseconds. */
  settledAt: number;
  /** Whether a request for the same address, or with the same code, had settled less than the wait before this one. */
  askedAgain: boolean;
};

/** What the entry flow holds: a checked registration code, a link request that can be repeated, both or neither. */
export type EntryFlow = {
  code?: EntryHeldCode;
  request?: EntryHeldRequest;
};

/**
 * The wording the "email sent" screen shows for a request, decided by where the request was made and by nothing the server answered.
 * @param request - The request, of which the origin alone is read.
 * @returns `recovery` for the forgot-password page, `code` for the screen that signs in the holder of a used code, and `signIn` for every other origin.
 */
export function wordingOf(request: EntryLinkRequest): EntryWording {
  if (request.origin === 'forgotPassword') return 'recovery';
  if (request.origin === 'registerSignIn') return 'code';
  return 'signIn';
}

/**
 * How many whole seconds of the wait are left. The answer is computed from the two times alone, so it is right however long ago it was last asked for, as after a tab was in the background.
 * @param settledAt - When the request settled, in epoch milliseconds.
 * @param now - The present time, in epoch milliseconds.
 * @returns The remainder of the wait rounded up to a whole second: the whole wait at the settlement, 1 until the last millisecond, and 0 from then on. Never negative, and never more than the whole wait.
 */
export function secondsLeft(settledAt: number, now: number): number {
  const remaining = Math.ceil((RESEND_WAIT_SECONDS * 1000 - (now - settledAt)) / 1000);
  return Math.min(RESEND_WAIT_SECONDS, Math.max(0, remaining));
}

/**
 * Wait until a link request has settled or the settle bound has passed, whichever is first.
 *
 * A fulfilled and a rejected request count alike, and nothing of either is passed on, so what follows cannot depend on what the server answered. The function attaches its own handlers to the request: a rejection is handled here, also one that arrives after the bound.
 * @param request - The pending request.
 * @returns A promise that resolves to nothing and never rejects.
 */
export function settledOrBounded(request: PromiseLike<unknown>): Promise<void> {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, LINK_REQUEST_SETTLE_BOUND_MS);
    function settle(): void {
      clearTimeout(timer);
      resolve();
    }
    Promise.resolve(request).then(settle, settle);
  });
}

/**
 * Whether a request repeats, inside the wait, the request held before it: the server would then send no mail for it.
 *
 * It is judged on the caller's own clock and from the two requests alone, never from an answer of the server.
 * @param previous - The request held before, if any.
 * @param next - The request about to be made.
 * @param now - The present time, in epoch milliseconds.
 * @returns `true` only when a request is held, less than the wait has passed since it settled, and the two are for the same address or with the same code. Addresses and codes are compared trimmed and without regard to case, and an absent or blank one is the same as nothing.
 */
export function askedAgainTooSoon(
  previous: EntryHeldRequest | undefined,
  next: EntryLinkRequest,
  now: number
): boolean {
  if (!previous) return false;
  if (now - previous.settledAt >= RESEND_WAIT_SECONDS * 1000) return false;
  return sameText(previous.email, next.email) || sameText(previous.code, next.code);
}

/** Whether two optional texts are both present and equal once trimmed and lower-cased. */
function sameText(a: string | undefined, b: string | undefined): boolean {
  const left = a?.trim().toLowerCase();
  const right = b?.trim().toLowerCase();
  return !!left && left === right;
}
