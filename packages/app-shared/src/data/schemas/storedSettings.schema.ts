import { z } from 'zod';

/**
 * A localised string as it is stored: an object keyed by locale. Mirrors `LocalizedString` in `../localized.type`.
 */
const LocalizedStringSchema = z.record(z.string(), z.string());

/**
 * The stored form of `NotificationData`.
 *
 * `title` and `content` are LOCALE OBJECTS here. The declared `NotificationData` in `../../settings/dynamicSettings.type` types them as `LocalizedString` too, so the schema and the type agree on the STORED side; the divergence is on the OUTPUT side, where `SupabaseDataProvider._getAppSettings` replaces both with a plain string resolved for the active locale before returning. A reader who mistakes the provider's return value for `Partial<DynamicSettings>` will get these two fields wrong in the other direction.
 *
 * `title` and `content` are OPTIONAL here while `NotificationData` declares them required, and that is the schema's third deliberate divergence from the application type rather than an oversight. A notification that is switched OFF is stored as `{ "show": false }` and carries no copy at all — the shape 23 of the `@openvaa/dev-seed` perm templates write through `MINIMAL_BASE_APP_SETTINGS`, and the shape any operator produces by disabling a notification without also authoring text for it. Requiring the two fields made that ordinary value fail the parse, and because `SupabaseDataProvider._getAppSettings` degrades a failed parse to `{}` rather than throwing, ONE absent notification title silently discarded EVERY OTHER SETTING in the column — `questions.questionsIntro.show`, `matching.minimumAnswers` and the rest — leaving the app running on shipped defaults with no user-visible signal. Measured, not reasoned: it is what took `perm-1e1cg1co` to the category-selection page instead of the first question, and the accompanying degradation record names the four paths. That record was emitted at the `warn` level when this comment was written; decision **C5(b)** moved it to `error` in `157.1-03`, because a JSONB column that does not match its schema is a data defect a production operator has to act on. The `warn` tier is now empty tree-wide, and deliberately so — see `157.1-OVER-DISCLOSURE-AUDIT.md` § "The empty `warn` tier is the intended end state". `getLocalized` already accepts `null | undefined` and returns `null`, so the provider's localisation pass needs no guard beyond the one it has.
 */
const StoredNotificationSchema = z.strictObject({
  show: z.boolean().optional(),
  title: LocalizedStringSchema.optional(),
  content: LocalizedStringSchema.optional(),
  icon: z.string().optional()
});

/**
 * The value of `entityDetails.contents` for a given entity type, and of `results.cardContents`, are open unions whose members the settings TYPE enumerates. They are kept as plain strings plus the `QuestionInCardContent` object here rather than as `z.enum`s, because a settings blob written against a newer app version must not be rejected wholesale by an older reader — the reader's own switch already ignores a content key it does not implement.
 */
const CardContentSchema = z.union([
  z.string(),
  z.strictObject({
    question: z.string(),
    hideLabel: z.boolean().optional(),
    format: z.string().optional()
  })
]);

/**
 * The stored shape of the `app_settings.settings` JSONB column.
 *
 * ## Stored, not application
 *
 * The APPLICATION type is `DynamicSettings` (`../../settings/dynamicSettings.type`), which stays hand-written because it is the published contract; this schema describes the STORED variant of it and is deliberately NOT the source of that type. The two differ in exactly two ways:
 *
 * 1. **Every field is optional here.** The column is `NOT NULL DEFAULT '{}'::jsonb` (`apps/supabase/supabase/schema/106-app-settings.sql:9`) and `SupabaseDataProvider._getAppSettings` returns `{}` on `PGRST116`, so `{}` MUST parse. The provider merges the parsed value over the shipped `dynamicSettings` defaults, which is where the required members come from.
 *
 *    The claim is load-bearing rather than decorative, so it is stated as a rule the schema is checked against: a required INNER member reopens the same failure mode as a missing top-level one, because the provider degrades a failed parse of any depth to `{}` and takes every sibling setting down with it. `analytics.platform.{name,code,infoUrl}` and `survey.{linkTemplate,showIn}` were required and are no longer; `storedSettings.schema.test.ts` pins a partial payload for each, asserting on a SIBLING setting. The one member that stays required is `CardContentSchema`'s `question`, which is not a settings field but the identifier of that union arm — optional there would make the arm match `{}`.
 *
 *    A member being optional does NOT mean an unknown member is tolerated; see the strictness note below. Optionality is about members this schema KNOWS and a writer may omit.
 * 2. **`notifications.*.title` and `.content` stay locale objects.** See {@link StoredNotificationSchema}.
 *
 * ## Strict at EVERY level
 *
 * Strictness is a PER-OBJECT setting and does not descend — measured at this tree's zod (4.3.6) and recorded verbatim at `packages/dev-seed/src/template/schema.ts:35-41`. This column is three levels deep at `settings` -> `notifications` -> `candidateApp`, so a top-level-only strict schema would parse an unknown key at either inner level with SUCCESS and silently strip it. `storedSettings.schema.test.ts` holds one rejection case per level.
 */
export const StoredSettingsSchema = z.strictObject({
  survey: z
    .strictObject({
      linkTemplate: z.string().optional(),
      showIn: z.array(z.string()).optional()
    })
    .optional(),
  entityDetails: z
    .strictObject({
      contents: z
        .strictObject({
          candidate: z.array(z.string()).optional(),
          organization: z.array(z.string()).optional(),
          alliance: z.array(z.string()).optional()
        })
        .optional(),
      showMissingElectionSymbol: z.record(z.string(), z.boolean()).optional(),
      showMissingAnswers: z.record(z.string(), z.boolean()).optional()
    })
    .optional(),
  header: z
    .strictObject({
      showFeedback: z.boolean().optional(),
      showHelp: z.boolean().optional()
    })
    .optional(),
  headerStyle: z
    .strictObject({
      dark: z.strictObject({ bgColor: z.string().optional(), overImgBgColor: z.string().optional() }).optional(),
      light: z.strictObject({ bgColor: z.string().optional(), overImgBgColor: z.string().optional() }).optional(),
      imgSize: z.string().optional(),
      imgPosition: z.string().optional()
    })
    .optional(),
  entities: z
    .strictObject({
      hideIfMissingAnswers: z.strictObject({ candidate: z.boolean().optional() }).optional(),
      showAllNominations: z.boolean().optional()
    })
    .optional(),
  matching: z
    .strictObject({
      minimumAnswers: z.number().optional(),
      organizationMatching: z.string().optional()
    })
    .optional(),
  questions: z
    .strictObject({
      categoryIntros: z.strictObject({ allowSkip: z.boolean().optional(), show: z.boolean().optional() }).optional(),
      interactiveInfo: z.strictObject({ enabled: z.boolean().optional() }).optional(),
      questionsIntro: z
        .strictObject({ allowCategorySelection: z.boolean().optional(), show: z.boolean().optional() })
        .optional(),
      showCategoryTags: z.boolean().optional(),
      showResultsLink: z.boolean().optional()
    })
    .optional(),
  results: z
    .strictObject({
      cardContents: z
        .strictObject({
          candidate: z.array(CardContentSchema).optional(),
          organization: z.array(CardContentSchema).optional(),
          alliance: z.array(CardContentSchema).optional()
        })
        .optional(),
      sections: z.array(z.string()).optional(),
      showFeedbackPopup: z.number().optional(),
      showSurveyPopup: z.number().optional()
    })
    .optional(),
  elections: z
    .strictObject({
      disallowSelection: z.boolean().optional(),
      showElectionTags: z.boolean().optional(),
      startFromConstituencyGroup: z.string().optional()
    })
    .optional(),
  access: z
    .strictObject({
      candidateApp: z.boolean().optional(),
      voterApp: z.boolean().optional(),
      adminApp: z.boolean().optional(),
      underMaintenance: z.boolean().optional(),
      answersLocked: z.boolean().optional()
    })
    .optional(),
  notifications: z
    .strictObject({
      candidateApp: StoredNotificationSchema.nullable().optional(),
      voterApp: StoredNotificationSchema.nullable().optional()
    })
    .optional(),
  candidateApp: z
    .strictObject({
      questions: z.strictObject({ hideVideo: z.boolean().optional(), hideHero: z.boolean().optional() }).optional()
    })
    .optional(),
  preRegistration: z.strictObject({ enabled: z.boolean().optional() }).optional(),
  /**
   * `analytics` is declared on `StaticSettings` rather than on `DynamicSettings`, and it is nonetheless a REAL member of this column: the stored blob is merged over the shipped settings, so an operator overrides `trackEvents` — and supplies the `platform` object that makes the frontend mount its analytics integration at all — by writing this key here. `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` documents both fields as settings that change behaviour, `trackingService.svelte.ts` reads `appSettings.current.analytics.trackEvents` in its consent gate, and `DataConsent.svelte` reads `appSettings.analytics.platform`.
   *
   * It was absent from this strict schema until `157-18`, which meant every stored blob carrying it was rejected WHOLESALE — and, because the provider degrades a failed parse to `{}`, silently stripped of every unrelated setting too. That is 23 `@openvaa/dev-seed` perm templates via `MINIMAL_BASE_APP_SETTINGS`, plus `perm-analytics-tracking`, plus any real deployment that has ever turned tracking on.
   *
   * `platform.name` is `z.string()` rather than `z.literal('umami')` deliberately, for the reason `CardContentSchema` above gives: a blob written against a newer app version that supports a second platform must not be rejected wholesale by an older reader, whose own switch already ignores a platform it does not implement.
   */
  analytics: z
    .strictObject({
      platform: z
        .strictObject({
          name: z.string().optional(),
          code: z.string().optional(),
          // Absent whenever an operator arms tracking without authoring a privacy URL, which is an ordinary act: `DataConsent.svelte` and `DataConsentInfoButton.svelte` both read this through `?.`, so the frontend tolerates its absence and this schema must too.
          infoUrl: z.string().optional()
        })
        .optional(),
      trackEvents: z.boolean().optional()
    })
    .optional()
});

/**
 * The stored shape of the `app_settings.settings` JSONB column. NOT a substitute for `DynamicSettings`, which is the application-side contract.
 */
export type StoredSettings = z.infer<typeof StoredSettingsSchema>;
