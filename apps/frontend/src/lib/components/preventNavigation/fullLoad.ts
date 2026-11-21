/**
 * Leave the page by a full load of the address. `location.assign` only starts the load, and an engine may fire `beforeunload` after it has returned, so whoever awaits this stands by until the document has gone.
 * @param address - Where to go.
 * @returns A `Promise` that never settles.
 */
export function leaveByFullLoad(address: string): Promise<void> {
  location.assign(address);
  return new Promise<void>(() => undefined);
}
