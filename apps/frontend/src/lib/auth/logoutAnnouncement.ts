/**
 * The two announcements a Log out makes to the browser's other tabs on a `BroadcastChannel`, `start` before its sign-out requests and `end` once they have settled, and whether a document heard them recently enough to name another tab as the cause of a sign-out it did not start. A listening tab's client reports the sign-out only after the announcing tab's requests have completed, so the window follows the Log out: a sign-out counts as another tab's while a `start` is outstanding, and for a short while after its `end`. The cap on an outstanding `start` stops a tab closed during its Log out, which never posts its `end`, from holding the window open. The channel delivers a message to every other channel object of its name, those of the same document included, and never to the object that posted it, so a document that announces on the object it listens on never hears itself. Outside the browser, and where the channel is missing or throws, nothing is announced, nothing is heard and nothing throws.
 */

/** The name of the channel a Log out is announced on. */
export const LOGOUT_ANNOUNCEMENT_CHANNEL = 'openvaa-logout';

/** The announcements a Log out posts on the channel: `start` before its sign-out requests, and `end` once they have settled, whether the sign-out worked or failed. */
export type LogoutAnnouncement = 'start' | 'end';

/** How long a heard `start` with no `end` since still counts a sign-out as the one announced, in milliseconds. */
export const LOGOUT_IN_FLIGHT_CAP_MS = 30_000;

/** How long after a heard `end` a sign-out still counts as the one announced, in milliseconds. */
export const LOGOUT_ANNOUNCEMENT_WINDOW_MS = 5_000;

/** The channel this document listens on, open while at least one listener has not stopped. */
let channel: BroadcastChannel | undefined;

/** How many listeners of this document have not stopped. */
let listeners = 0;

/** When this document heard the `start` no `end` has followed yet, by `Date.now()`. */
let outstandingStartAt: number | undefined;

/** When this document last heard an `end`, by `Date.now()`. */
let lastEndAt: number | undefined;

/**
 * Announce the start or the end of a Log out to the browser's other tabs: post the word `kind` on {@link LOGOUT_ANNOUNCEMENT_CHANNEL}, on the channel this document listens on when one is open, and otherwise on one opened for the message and closed at once, which still delivers it. Does nothing outside the browser or where `BroadcastChannel` is undefined, and throws nothing.
 */
export function announceLogout(kind: LogoutAnnouncement): void {
  if (!channelAvailable()) return;
  try {
    if (channel) {
      channel.postMessage(kind);
      return;
    }
    const once = new BroadcastChannel(LOGOUT_ANNOUNCEMENT_CHANNEL);
    try {
      once.postMessage(kind);
    } finally {
      once.close();
    }
  } catch {
    // A Log out does not fail on its announcement.
  }
}

/**
 * Listen for the announcements other documents make. A heard `start` records the time of the outstanding start; a heard `end` records the time of the last end and clears the outstanding start; a message of any other value changes nothing. The document's one channel is opened by its first listener and closed when its last one stops.
 * @returns The function that stops this listener. It does nothing when called again.
 */
export function listenForLogoutAnnouncements(): () => void {
  if (!channelAvailable()) return () => undefined;
  if (!channel) {
    try {
      channel = new BroadcastChannel(LOGOUT_ANNOUNCEMENT_CHANNEL);
    } catch {
      return () => undefined;
    }
    channel.onmessage = ({ data }: MessageEvent) => {
      if (data === 'start') {
        outstandingStartAt = Date.now();
      } else if (data === 'end') {
        lastEndAt = Date.now();
        outstandingStartAt = undefined;
      }
    };
  }
  listeners += 1;
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    listeners -= 1;
    if (listeners > 0 || !channel) return;
    const closing = channel;
    channel = undefined;
    try {
      closing.close();
    } catch {
      // A channel that cannot be closed is dropped all the same.
    }
  };
}

/**
 * Whether a sign-out this document did not start counts as another tab's Log out: this document heard a `start` with no `end` since, no more than {@link LOGOUT_IN_FLIGHT_CAP_MS} before now, or an `end` no more than {@link LOGOUT_ANNOUNCEMENT_WINDOW_MS} before now. A time later than now, from a clock set back, counts as neither.
 * @returns `true` when either holds, at the moment it is asked.
 */
export function heardLogoutAnnouncement(): boolean {
  const now = Date.now();
  return (
    within(outstandingStartAt, now, LOGOUT_IN_FLIGHT_CAP_MS) || within(lastEndAt, now, LOGOUT_ANNOUNCEMENT_WINDOW_MS)
  );
}

/**
 * Whether a recorded time is no more than `limit` milliseconds before `now`, and not after it.
 * @param at - The recorded time, if any.
 * @param now - The time it is asked at.
 * @param limit - How old the recorded time may be.
 */
function within(at: number | undefined, now: number, limit: number): boolean {
  if (at === undefined) return false;
  const elapsed = now - at;
  return elapsed >= 0 && elapsed <= limit;
}

/** Whether a channel can be opened here: in a browser that has `BroadcastChannel`. The server's Node has a global `BroadcastChannel` of its own, so the browser is tested first. */
function channelAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof BroadcastChannel !== 'undefined';
}
