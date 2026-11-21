/**
 * The visit id: one UUIDv7 that the events of a visit may share.
 *
 * The id lives in a module variable for the life of the document and nowhere else. It is never written to, or read from, a cookie or a browser store, so a reload starts a new one and nothing on the device can link two visits. The analytics model relies on that property: the id joins the events of one page life and cannot become a persistent identifier.
 */
import { createUuidV7 } from '$lib/analytics/uuidv7';

/** The id of the current visit, created on first use. */
let visitId: string | undefined;

/**
 * The visit id of this document, created on the first call.
 *
 * @returns The same UUIDv7 on every call until the document is unloaded.
 */
export function getVisitId(): string {
  visitId ??= createUuidV7();
  return visitId;
}

/**
 * Forget the visit id, so that the next call of {@link getVisitId} creates a new one. For tests only.
 */
export function resetVisitIdForTests(): void {
  visitId = undefined;
}
