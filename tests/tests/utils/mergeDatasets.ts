/**
 * Deep merge utility for composing base + overlay test datasets.
 *
 * Used by variant data-setup projects to create composite datasets
 * from the shared base (default-dataset.json + voter-dataset.json)
 * and per-variant overlay files.
 *
 * Merge semantics:
 * - Overlay arrays are appended to base arrays
 * - If an overlay entry has the same `externalId` as a base entry, the
 *   overlay entry replaces it (update semantics)
 * - If an overlay collection doesn't exist in the base, it's created
 * - Base collection key order is preserved
 */

type Dataset = Record<string, Array<Record<string, unknown>>>;

/**
 * Merge a base dataset with an overlay. Overlay entries are appended to
 * base collections. If an overlay entry has the same `externalId` as a
 * base entry in the same collection, the overlay entry replaces it.
 *
 * @param base - The base dataset (e.g., default-dataset.json)
 * @param overlay - The overlay dataset to merge on top
 * @returns A new merged dataset (neither base nor overlay is mutated)
 */
export function mergeDatasets(base: Dataset, overlay: Dataset): Dataset {
  const result: Dataset = {};

  // Copy all base collections
  for (const [key, entries] of Object.entries(base)) {
    result[key] = [...entries];
  }

  // Merge overlay collections
  for (const [key, overlayEntries] of Object.entries(overlay)) {
    if (!result[key]) {
      result[key] = [...overlayEntries];
      continue;
    }

    for (const overlayEntry of overlayEntries) {
      const eid = overlayEntry.externalId as string | undefined;
      if (eid) {
        const existingIndex = result[key].findIndex((e) => (e.externalId as string) === eid);
        if (existingIndex >= 0) {
          result[key][existingIndex] = overlayEntry; // Update
          continue;
        }
      }
      result[key].push(overlayEntry); // Append
    }
  }

  return result;
}
