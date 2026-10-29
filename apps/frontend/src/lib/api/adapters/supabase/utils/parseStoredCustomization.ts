import { StoredCustomizationSchema } from '@openvaa/app-shared';
import { CUSTOMIZATION_PARSE_FAILURE_MESSAGE } from './parseFailureMessages';
import { parseWithPartialPreserve } from './parseOutcome';
import type { StoredCustomization } from '@openvaa/app-shared';
import type { Json } from '@openvaa/supabase-types';

/**
 * Validate the stored `app_settings.customization` value, keeping the members the schema accepts when others are malformed.
 *
 * Never throws. An absent value, or a malformed one with nothing to preserve, returns the empty customization. A failure is reported under {@link CUSTOMIZATION_PARSE_FAILURE_MESSAGE} with the issue paths and refused key names, never the stored values.
 * @param raw - The unvalidated JSONB value read from the column.
 * @returns The stored customization, with any members the schema rejected removed.
 */
export function parseStoredCustomization(raw: Json | undefined): StoredCustomization {
  const outcome = parseWithPartialPreserve<StoredCustomization>(
    StoredCustomizationSchema,
    raw,
    { column: 'app_settings.customization' },
    CUSTOMIZATION_PARSE_FAILURE_MESSAGE
  );
  return outcome.value ?? {};
}
