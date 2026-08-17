/**
 * Pre-merge resolver for dev-seed Writer Pass-5.
 *
 * Walks a partial settings payload and replaces every `{ externalId: '<id>' }`
 * shape inside known cardContents paths with the plain UUID string from the
 * questions `external_id` → UUID map. Returns a NEW payload (does NOT mutate
 * the input).
 *
 * Currently handled paths:
 *   - results.cardContents.candidate[*].question
 *   - results.cardContents.organization[*].question
 *   - results.cardContents.alliance[*].question
 *
 * Forward-compatible: additional paths can be added as the cardContents
 * settings schema evolves (see phase 88 Plan 04 ADR follow-up TODO —
 * election-specific cardContents refactor).
 *
 * Companion helper {@link settingsContainsExternalIdRefs} returns `true`
 * if any `{ externalId }` shape is present at any handled path — used by the
 * Writer to gate the questions-table SELECT (payloads without externalId
 * references pay zero overhead).
 *
 * Pure / synchronous / SSR-safe. No Supabase dependency.
 *
 * Rationale: see phase 88 Plan 04 ADR at
 * (Option B).
 */

const CARD_CONTENTS_KEYS = ['candidate', 'organization', 'alliance'] as const;

type CardContentsKey = (typeof CARD_CONTENTS_KEYS)[number];

interface ExternalIdRef {
  externalId: string;
}

function isExternalIdRef(value: unknown): value is ExternalIdRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'externalId' in value &&
    typeof (value as Record<string, unknown>).externalId === 'string'
  );
}

function getCardContentsArray(settings: Record<string, unknown>, key: CardContentsKey): Array<unknown> | undefined {
  const results = settings.results;
  if (!results || typeof results !== 'object' || Array.isArray(results)) return undefined;
  const cardContents = (results as Record<string, unknown>).cardContents;
  if (!cardContents || typeof cardContents !== 'object' || Array.isArray(cardContents)) return undefined;
  const arr = (cardContents as Record<string, unknown>)[key];
  if (!Array.isArray(arr)) return undefined;
  return arr;
}

/**
 * Returns `true` when at least one `{ externalId: '<id>' }` shape is present
 * inside `results.cardContents.{candidate,organization,alliance}[*].question`.
 *
 * Cheap pre-walk used by the Writer to gate the questions-table SELECT —
 * payloads without externalId references pay zero overhead.
 */
export function settingsContainsExternalIdRefs(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return false;
  for (const key of CARD_CONTENTS_KEYS) {
    const arr = getCardContentsArray(settings as Record<string, unknown>, key);
    if (!arr) continue;
    for (const entry of arr) {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        const q = (entry as Record<string, unknown>).question;
        if (isExternalIdRef(q)) return true;
      }
    }
  }
  return false;
}

/**
 * Resolve every `{ externalId: '<id>' }` reference inside the settings payload
 * to its plain UUID string using the provided map.
 *
 * Returns a NEW payload. The input is NOT mutated (structural clone of the
 * affected sub-trees only).
 *
 * @throws Error when an `{ externalId }` shape references an id NOT present
 *   in `externalIdToUuid`. Error message includes the offending cardContents
 *   path + the missing id.
 */
export function resolveAppSettingsExternalIds(
  settings: Record<string, unknown>,
  externalIdToUuid: Map<string, string>
): Record<string, unknown> {
  if (!settingsContainsExternalIdRefs(settings)) return settings;

  const results = settings.results;
  if (!results || typeof results !== 'object' || Array.isArray(results)) return settings;
  const cardContents = (results as Record<string, unknown>).cardContents;
  if (!cardContents || typeof cardContents !== 'object' || Array.isArray(cardContents)) return settings;

  const newCardContents: Record<string, unknown> = { ...(cardContents as Record<string, unknown>) };
  for (const key of CARD_CONTENTS_KEYS) {
    const arr = (cardContents as Record<string, unknown>)[key];
    if (!Array.isArray(arr)) continue;
    const resolvedArr = arr.map((entry, idx) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return entry;
      const q = (entry as Record<string, unknown>).question;
      if (!isExternalIdRef(q)) return entry;
      const uuid = externalIdToUuid.get(q.externalId);
      if (!uuid) {
        throw new Error(
          `resolveAppSettingsExternalIds: results.cardContents.${key}[${idx}].question.externalId ` +
            `'${q.externalId}' not found in questions external_id → UUID map. ` +
            'Verify the question exists in the template and is loaded before app_settings (Writer Pass-5).'
        );
      }
      return { ...entry, question: uuid };
    });
    newCardContents[key] = resolvedArr;
  }

  return {
    ...settings,
    results: {
      ...(results as Record<string, unknown>),
      cardContents: newCardContents
    }
  };
}
