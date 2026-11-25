/**
 * The present time on the wall clock, kept as reactive state for a count that must come out right after the page's timers were held back, as while its tab was in the background, frozen or asleep.
 *
 * While started, the clock is read once a second and at once whenever the document says it is back: shown again (`visibilitychange` while visible), resumed (`resume`), restored from the back-forward cache (`pageshow`) or focused (`focus`).
 *
 * ```ts
 * const clock = new WallClock();
 * onMount(() => {
 *   clock.start();
 *   return () => clock.stop();
 * });
 * const secondsLeft = $derived(Math.max(0, Math.ceil((deadline - clock.now) / 1000)));
 * ```
 *
 * `now` is reactive: read it off the instance inside a tracking scope.
 */
export class WallClock {
  /** How often the clock is read while started, in milliseconds. */
  static readonly READ_INTERVAL_MS = 1_000;

  /** The present time as last read, in epoch milliseconds. */
  #now = $state(Date.now());
  readonly #onRead: ((now: number) => void) | undefined;
  #interval: ReturnType<typeof setInterval> | undefined;

  /**
   * @param onRead - Called after each reading made while the clock is started, with the time read. Not called by `start()`.
   */
  constructor(onRead?: (now: number) => void) {
    this.#onRead = onRead;
  }

  /** The present time as last read, in epoch milliseconds. */
  get now(): number {
    return this.#now;
  }

  /** Read the clock now, and then once a second and whenever the document is back. Has no effect on a clock that is already started. */
  start(): void {
    if (this.#interval !== undefined) return;
    this.#now = Date.now();
    this.#interval = setInterval(this.#read, WallClock.READ_INTERVAL_MS);
    document.addEventListener('visibilitychange', this.#readWhenVisible);
    document.addEventListener('resume', this.#read);
    window.addEventListener('pageshow', this.#read);
    window.addEventListener('focus', this.#read);
  }

  /** Stop reading the clock. `now` keeps the last reading. */
  stop(): void {
    if (this.#interval === undefined) return;
    clearInterval(this.#interval);
    this.#interval = undefined;
    document.removeEventListener('visibilitychange', this.#readWhenVisible);
    document.removeEventListener('resume', this.#read);
    window.removeEventListener('pageshow', this.#read);
    window.removeEventListener('focus', this.#read);
  }

  #readWhenVisible = (): void => {
    if (document.visibilityState === 'visible') this.#read();
  };

  #read = (): void => {
    this.#now = Date.now();
    this.#onRead?.(this.#now);
  };
}
