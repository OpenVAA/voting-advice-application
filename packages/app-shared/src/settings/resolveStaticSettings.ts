import { z } from 'zod';
import { StaticSettingsSchema } from './staticSettings.schema';
import { isPlainObject } from '../data/utils/isPlainObject';
import { mergeSettings } from '../utils/mergeSettings';
import type { StaticSettings } from './staticSettings.type';

/**
 * Options of {@link resolveStaticSettings}.
 */
export type ResolveStaticSettingsOptions = {
  /**
   * The settings the overlay is merged over, normally the shipped `staticSettings`.
   */
  base: StaticSettings;
  /**
   * The overlay, as parsed from JSON and not yet checked.
   */
  overlay: unknown;
  /**
   * The label of the overlay in error messages. Defaults to `'instance/staticSettings.json'`.
   */
  source?: string;
};

/**
 * Merge an instance overlay over the static settings and validate the result.
 *
 * - The overlay must be a plain object, and it may not set `dataAdapter`: the hosted-settings guards read the data adapter from `staticSettings.ts` itself, so an overlaid value would leave them checking the wrong one.
 * - The overlay is merged with `mergeSettings`: objects are merged member by member, arrays such as `supportedLocales` are replaced whole, and `__proto__`, `constructor` and `prototype` keys are never merged.
 * - The merged settings are validated with {@link StaticSettingsSchema}, which is strict at every level, so a mistyped key fails.
 *
 * @param options - See {@link ResolveStaticSettingsOptions}.
 * @returns The merged and validated settings.
 * @throws An `Error` whose message starts with `source` when the overlay is not an object, sets `dataAdapter`, or produces settings the schema rejects, listing each offending path.
 */
export function resolveStaticSettings({
  base,
  overlay,
  source = 'instance/staticSettings.json'
}: ResolveStaticSettingsOptions): StaticSettings {
  if (!isPlainObject(overlay)) throw new Error(`${source} must hold a JSON object`);
  if ('dataAdapter' in overlay)
    throw new Error(
      `${source} sets dataAdapter, which is not instance-overlayable: the hosted-settings guards read it from staticSettings.ts`
    );
  const result = StaticSettingsSchema.safeParse(mergeSettings(base, overlay));
  if (!result.success)
    throw new Error(`${source} does not produce valid StaticSettings:\n${z.prettifyError(result.error)}`);
  return result.data;
}
