/**
 * Send the browser to an address outside the application, as a full navigation that leaves the page.
 *
 * A module of its own so that a component test can replace it: the document's `location` cannot be replaced in a test environment.
 * @param url - The absolute address to leave for.
 */
export function leaveFor(url: string): void {
  window.location.assign(url);
}
