/*
 * More types used for application state management.
 */
import type {Election} from '$lib/api/dataObjects';
import {removeDuplicates} from './utils';

// Make sure that all serializable types conform to JSON serializability:
export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | SerializableValue[]
  | {[key: string]: SerializableValue};

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
  selectedElectionIds?: string[];
  selectedQuestionCategoryIds?: string[];
  currentQuestionId?: string;
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
  electionGroupId?: string;
  /**
   * Save the user's constituencyId for each const type
   */
  constituencyIds?: string[];
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

/**
 * Used in OrganizedContents
 */
export type ElectionArrayTuple<T> = [Election, T[]];

/**
 * Used in OrganizedContents
 */
export type ElectionsObjectTuple<T> = [Election[], T];

/**
 * Provides a way to organise DataObjects by Election so that they can be
 * easily iterated over with Svelte's #each directive.
 *
 * @param byElection An array of tuples of an Election and array of
 * DataObjects.
 */
export class OrganizedContents<T> {
  constructor(public readonly byElection: ElectionArrayTuple<T>[]) {}

  /**
   * Check whether this has any contents.
   */
  get nonEmpty(): boolean {
    return this.byElection.length > 0;
  }

  /**
   * Get an array of all the contained DataObjects with duplicates removed.
   */
  get all(): T[] {
    return removeDuplicates(this.byElection.map(([e, t]) => t).flat());
  }

  /**
   * Get an array of ElectionsObjectTuples: [Array<Election>, DataObject]
   * of all the contents with duplicate DataObjects removed. For each
   * object one or more relevant Elections are included in the first
   * element which is an array.
   */
  get allAsTuples(): ElectionsObjectTuple<T>[] {
    const objects: T[] = [];
    const tuples: ElectionsObjectTuple<T>[] = [];
    this.byElection.forEach(([e, tt]) =>
      tt.forEach((t) => {
        const index = objects.indexOf(t);
        if (index > -1) {
          tuples[index][0].push(e);
        } else {
          objects.push(t);
          tuples.push([[e], t]);
        }
      })
    );
    return tuples;
  }

  /**
   * Map over the contained DataObjects and create a new OrganizedContents
   * with the returned contents but organised by the same Elections.
   *
   * @param func The function to apply to each value
   * @returns A new OrganizedContents with values mapped by the function
   */
  mapContents<U>(func: (t: T[], e: Election) => U[]): OrganizedContents<U> {
    return new OrganizedContents(this.byElection.map(([e, t]) => [e, func(t, e)]));
  }
}
