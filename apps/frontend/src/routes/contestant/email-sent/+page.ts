/**
 * Answer a document request for the "email sent" screen with a redirect to the login screen, which sends a signed-in user on to the home. A client-side navigation to the screen is left to the page. See `emailSentLoad`.
 */

import { browser } from '$app/environment';
import { emailSentLoad } from '$lib/auth/entryFlow/emailSentLoad';

export const load = emailSentLoad({ loginRoute: 'ContestantAppLogin', inBrowser: () => browser });
