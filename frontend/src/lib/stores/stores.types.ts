/*
 * More types used for application state management.
 */
import type {Id, SerializableValue} from '$lib/vaa-data';

/**
 * Contains all the application's settings. Ideally we would load these from
 * the database. Anyway, to resolution order for effective settings is:
 * let visibleSetttings: Settings = {
 *   ...DEFAULT_SETTINGS,
 *   ...settingsLoadedFromDBOrInitFile,
 *   ...userSettingsLoadedFromLocalStorage,
 *   ...sessionSpeficUserSettings
 * };
 * The idea is that all settings may be exposed for user selection in the UI.
 */
export interface Settings {
  electionsAllowSelectMultiple?: boolean;
  // More settings here
}

export const DEFAULT_SETTINGS: Settings = {
  electionsAllowSelectMultiple: false
} as const;

/**
 * Used for all temporary settings, that should not be valid between
 * sessions. Also, these should have no effect on the needs for SSR-
 * loaded data.
 *
 * TO DO: Change the name to something more appropriate.
 */
export interface TemporaryChoices {
  selectedElectionIds?: Id[];
  selectedQuestionCategoryIds?: Id[];
  currentQuestionId?: Id;
  currentPersonNominationId?: Id;
}

/**
 * Contains all the user related data that should persist across sessions.
 * These can be saved to localStorage or in a cookie if allowed.
 */
export interface UserData {
  /**
   * Used to target the user data only to one election group
   * TO DO: Implement this wrt to default election group, and
   * how to check that these match with the loaded values.
   * Maybe also check for app version.
   */
  electionGroupId?: Id;
  /**
   * Save the user's constituencyId for each const type
   */
  constituencyIds?: Id[];
  /**
   * Possibly save some persistent user settings
   */
  settings: Settings;
  customData: Record<string, SerializableValue>;
  // lang
  // consents.cookie
  // consents.dataCollection
  // flags.surveyShown
  // flags.onboardingShown …
  // answers
  // list: {entityType, entityId, election?}[]
  // etc.
}

/**
 * Contains all the session specific data that need not to persist across
 * sessions. They are still stored in localStorage, and need thus to be serializable.
 */
export interface SessionData {
  /**
   * User settings for the session only
   */
  settings: Settings;
  /**
   * Temporary choices
   */
  temporaryChoices: TemporaryChoices;
  // effective results filters
  // effective results orderers
  // etc.
  customData: Record<string, SerializableValue>;
}
