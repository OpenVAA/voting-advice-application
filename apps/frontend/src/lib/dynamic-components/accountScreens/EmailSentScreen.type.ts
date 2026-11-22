import type { EntryHeldRequest, EntryLinkRefusal, EntryOrigin } from '$lib/auth/entryFlow';

export type EmailSentScreenProps = {
  /**
   * The name of the app, shown above the heading.
   */
  appName: string;
  /**
   * The one link request the app's entry flow holds. Without one the screen renders nothing.
   */
  request: EntryHeldRequest | undefined;
  /**
   * The app's own way to repeat the held request, as its context's entry flow holds it. It resolves to the wait when the request was refused over the per-caller limit.
   */
  resendEntryLink: () => Promise<EntryLinkRefusal | undefined>;
  /**
   * The address of the screen an address was typed on, by the origin of the request made there. An origin with no entry has no such screen, and the link back to it is not rendered.
   */
  addressScreenHrefs: Partial<Record<EntryOrigin, string>>;
  /**
   * The address of the screen's way back.
   */
  returnHref: string;
  /**
   * The test id of the screen's root.
   */
  testId: string;
};
