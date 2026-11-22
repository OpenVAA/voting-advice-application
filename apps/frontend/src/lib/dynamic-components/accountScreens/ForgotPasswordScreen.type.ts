import type { EntryLinkRefusal, EntryLinkRequest } from '$lib/auth/entryFlow';

export type ForgotPasswordScreenProps = {
  /**
   * The name of the app, shown above the heading.
   */
  appName: string;
  /**
   * The app's own way to ask for a mailed link, as its context's entry flow holds it. It resolves once the request has settled or its bound has passed, whatever it settled as, and to the wait when the request was refused over the per-caller limit.
   */
  sendEntryLink: (request: EntryLinkRequest) => Promise<EntryLinkRefusal | undefined>;
  /**
   * The address of the app's "email sent" page, opened when the request has settled and was not refused over the per-caller limit.
   */
  emailSentHref: string;
  /**
   * The address of the screen's way back.
   */
  returnHref: string;
  /**
   * The test id of the screen's root.
   */
  testId: string;
};
