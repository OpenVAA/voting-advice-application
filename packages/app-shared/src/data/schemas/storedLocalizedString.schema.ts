import { z } from 'zod';

/**
 * A localised string as it is stored: an object keyed by locale. Mirrors `LocalizedString` in `../localized.type`.
 */
export const StoredLocalizedStringSchema = z.record(z.string(), z.string());
