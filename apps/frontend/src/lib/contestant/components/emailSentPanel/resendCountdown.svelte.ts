import { secondsLeft } from '$lib/contestant/entryFlow';
import type { EmailSentStatus } from './EmailSentPanel.type';

/**
 * The count of the "email sent" screen: how long until another email can be asked for, and what the screen's status region says about it.
 *
 * The count is computed from two times, the settlement of the last request and the present, and never by counting ticks. It is therefore right however long the page's timers were held back, as while its tab was in the background. The present time is read once a second while the count is started, and at once when the page becomes visible again.
 *
 * The status changes only at two moments: `markRequested()` sets it to `requested`, and the count reaching 0 sets it to `ready`. It does not change while the count runs, so a live region that shows it speaks at those two moments and not in between.
 *
 * Everything is held by the instance, so two screens, or two renders on the server, never share a count. The page that shows the count creates one instance and starts and stops it with itself:
 *
 * ```ts
 * const countdown = new ResendCountdown(() => contestantCtx.entryFlow?.request?.settledAt);
 * onMount(() => {
 *   countdown.start();
 *   return () => countdown.stop();
 * });
 * ```
 *
 * `secondsLeft`, `ready` and `status` are reactive: read them off the instance inside a tracking scope.
 *
 * Tested in `EmailSentPanel.svelte.test.ts`.
 */
export class ResendCountdown {
  /** Answers when the request the count runs from settled, in epoch milliseconds. */
  readonly #settledAt: () => number | undefined;
  /** The present time as last read, in epoch milliseconds. */
  #now = $state(Date.now());
  #status = $state<EmailSentStatus>();
  /** The count as it was when the clock was last read, to tell the moment it reaches 0. */
  #lastSeconds = 0;
  #interval: ReturnType<typeof setInterval> | undefined;

  /**
   * @param settledAt - A function answering when the request the count runs from settled, in epoch milliseconds, or `undefined` while there is none. It is called on every read, so a reactive value it reads is followed.
   */
  constructor(settledAt: () => number | undefined) {
    this.#settledAt = settledAt;
  }

  /** How many whole seconds are left before another email can be asked for. 0 while there is no settlement time. */
  get secondsLeft(): number {
    const settledAt = this.#settledAt();
    return settledAt === undefined ? 0 : secondsLeft(settledAt, this.#now);
  }

  /** Whether another email can be asked for. */
  get ready(): boolean {
    return this.secondsLeft === 0;
  }

  /** What the status region says: nothing until the first of the two moments, then the later of them. */
  get status(): EmailSentStatus | undefined {
    return this.#status;
  }

  /** Record that a new email was asked for. The status says so until the count that follows has ended. */
  markRequested(): void {
    this.#status = 'requested';
  }

  /** Begin reading the clock. Has no effect on a count that is already started. */
  start(): void {
    if (this.#interval !== undefined) return;
    this.#lastSeconds = this.secondsLeft;
    this.#interval = setInterval(this.#readClock, 1_000);
    document.addEventListener('visibilitychange', this.#readClock);
  }

  /** Stop reading the clock. */
  stop(): void {
    if (this.#interval === undefined) return;
    clearInterval(this.#interval);
    this.#interval = undefined;
    document.removeEventListener('visibilitychange', this.#readClock);
  }

  /** Read the present time, and mark the status `ready` when the count has reached 0 since the last reading. */
  #readClock = (): void => {
    this.#now = Date.now();
    const seconds = this.secondsLeft;
    if (this.#lastSeconds > 0 && seconds === 0) this.#status = 'ready';
    this.#lastSeconds = seconds;
  };
}
