import type { DynamicSettings, LocalizedString as SharedLocalizedString, StaticSettings } from '@openvaa/app-shared';
import type { MaybeWrappedEntity } from '@openvaa/core';
import type { AnyEntityVariant, Image, QuestionCategory } from '@openvaa/data';

export {};

declare global {
  /**
   * A reusable type for the `fetch` function passed to load functions.
   */
  type Fetch = typeof fetch;

  /**
   * A shorthand for the types of `Match` objects the frontend uses.
   */
  type EntityVariantMatch = Match<AnyEntityVariant, QuestionCategory>;

  /**
   * A shorthand for possibly wrapped `Entity`s that all components dealing with entities consume.
   */
  type MaybeWrappedEntityVariant = MaybeWrappedEntity<AnyEntityVariant>;

  /*
   * The format for JSON structure.
   */
  type JSONData = null | string | number | boolean | { [x: string]: JSONData } | Array<JSONData>;

  /**
   * Make specific properties of an interface required. Works the same way as
   * `Required<Type>` but only applies to keys listed.
   * Source: https://stackoverflow.com/questions/69327990/how-can-i-make-one-property-non-optional-in-a-typescript-type
   */
  type WithRequired<TType, TKey extends keyof TType> = TType & { [Prop in TKey]-?: TType[Prop] };

  /**
   * Get the type of the array items.
   */
  type ArrayItem<TArray> = TArray extends Array<infer TElement> ? TElement : never;

  /**
   * The format for localized strings.
   */
  type LocalizedString = SharedLocalizedString;

  /**
   * The status of a view with an action.
   */
  type ActionStatus = 'idle' | 'loading' | 'success' | 'error';

  /**
   * An `Image` object with an optional `file` property.
   */
  type ImageWithFile = Image & {
    file?: File;
  };

  /**
   * The application settings, combined from both local settings and those retrieved from the database.
   */
  type AppSettings = StaticSettings & DynamicSettings;

  /**
   * The possible values for a user's data collection consent
   */
  type UserDataCollectionConsent = 'denied' | 'granted' | 'indetermined';

  /**
   * The possible values for the status of asking for a user's feedback or filling out a survey.
   */
  type UserFeedbackStatus = 'received' | 'indetermined';

  /**
   * These are all the DaisyUI colors supported by the application.
   * These can be used in utility classes like ``fill-${color}``,
   * but be sure to check `tailwind.config.cjs` for the classes
   * that are safelisted for use.
   */
  type Color =
    | 'current'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'neutral'
    | 'base-100'
    | 'base-200'
    | 'base-300'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'base-content'
    | 'primary-content'
    | 'secondary-content'
    | 'accent-content'
    | 'info-content'
    | 'success-content'
    | 'warning-content'
    | 'error-content'
    | 'white';
}
