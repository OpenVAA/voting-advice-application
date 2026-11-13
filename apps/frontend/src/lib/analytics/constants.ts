/**
 * The same-origin path the browser sends usage events to and the relay serves.
 *
 * The path is a plain descriptive name chosen to stay outside the usual blocker patterns. A content blocker may still block it, and nothing works around that, so every count the relay produces is a lower bound.
 */
export const RELAY_PATH = '/api/usage';

/** The most events one batch may hold. */
export const MAX_BATCH_EVENTS = 50;

/** The most bytes the browser puts in one batch, kept well under the 64 KiB a `keepalive` request may carry. */
export const MAX_BATCH_BYTES = 16 * 1024;

/** The most bytes the relay reads from one request body; a larger body is refused. */
export const MAX_BODY_BYTES = 32 * 1024;

/** The oldest an event may be when it reaches the relay; an older event is dropped. */
export const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;

/** How far the time stamped in a visit id may lie from the relay's clock before the id is removed. */
export const MAX_VISIT_ID_SKEW_MS = 24 * 60 * 60 * 1000;

/** The longest pageview duration recorded; a longer one is capped. */
export const MAX_PAGEVIEW_DURATION_MS = 6 * 60 * 60 * 1000;

/** The step a pageview duration is rounded to, so the recorded value is coarser than the clock. */
export const PAGEVIEW_DURATION_ROUNDING_MS = 100;

/** The form an identifier attribute must have: one to 64 letters, digits, underscores or hyphens. It admits a uuid and the first-question placeholder, and no free text. */
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
