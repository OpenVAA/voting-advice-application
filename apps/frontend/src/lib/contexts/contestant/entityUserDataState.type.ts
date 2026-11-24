import type { LocalizedAnswer, ServedEntityType } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type {
  EditableEntityProperty,
  EditablePropsOf,
  EntityUserData,
  LocalizedEntityData,
  LocalizedEntityNames
} from '$lib/api/base/dataWriter.type';

/**
 * What `save()` resolves to, discriminated by `type`.
 * - `success`: everything unsaved was stored, and nothing is unsaved.
 * - `nameRefused`: the backend refused a changed name because the entity has been confirmed. The answers and the other properties of the same save were stored, the edited names were discarded, and nothing is unsaved.
 * - `failure`: the save could not be confirmed. Every unsaved answer and property is kept, so the save can be made again.
 */
export type SaveUserDataResult =
  | {
      type: 'success' | 'nameRefused';
      /**
       * Whether a property that the list of the user's entities shows was among those stored: a name, the short name, the image or the colour. When it is `true` that list no longer shows what is stored until it is read again.
       */
      listedPropertySaved: boolean;
    }
  | { type: 'failure' };

/**
 * An extended reactive object that holds all data owned by the user. When reading `current`, it returns a composite of the initial data and any unsaved `Answer`s and properties. Dedicated methods are provided for loading, saving, setting or resetting data.
 *
 * NB. Before using the object, its `init` method must be called with the initial `EntityUserData`.
 */
export type EntityUserDataState = {
  /**
   * The effective user data, including any unsaved edits. An unsaved image, colour, first name or last name is shown on `entity`. An unsaved name or short name of an organization is shown in `localizedNames`, by locale, while `entity.name` and `entity.shortName` stay the saved ones in one locale. The value is a plain copy, safe to hand to an input.
   */
  readonly current: EntityUserData<true> | undefined;
  /**
   * Initialize the store with the full `EntityUserData`. The unsaved answers shown are the ones the signed-in user left for the entity the data names: loading another entity brings up that entity's own draft and drops the unsaved properties, while loading the same entity again keeps both. The drafts any other user left in the browser are removed first, so an editor is never shown, and never saves, unsaved answers someone else typed.
   * @param data - The entity's data.
   * @param userId - The id of the signed-in user.
   */
  init: (data: EntityUserData<true>, userId: Id) => void;
  /**
   * Empty the store of the entity it holds: the saved data and the unsaved properties are dropped, and `current` becomes `undefined`. The entity's persisted unsaved answers are left in the browser, so a later `init` for the same entity shows them again. Call this when the user leaves the entity without logging out.
   */
  leaveEntity: () => void;
  /**
   * Reset all data, including saved data, and remove the persisted unsaved answers of every entity from the browser. Call this when the user logs out.
   */
  reset: () => void;
  /**
   * Reset all unsaved data of the loaded entity, its answers and its properties. Call this when exiting the view where set data has been modified but not saved.
   */
  resetUnsaved: () => void;

  ////////////////////////////////////////////////////////////
  // Synchronization with backend
  ////////////////////////////////////////////////////////////

  /**
   * Reload the data of the loaded entity from the backend into the store and return it. The entity asked for is the loaded one, by its own type and id. If another entity is loaded, or this one left, before the backend answers, the data is returned without being stored.
   * NB. This does not reload the `User` or `Nomination`s data, they must be included in the data passed to `init`.
   * @returns A `Promise` resolving to `LocalizedEntityData`.
   * @throws An error if no entity is loaded or the data cannot be loaded.
   */
  reloadEntityData: () => Promise<LocalizedEntityData>;
  /**
   * Save all unsaved data of the loaded entity: its unsaved answers first, then its unsaved properties, of which only those that differ from the saved ones are sent. The unsaved data is cleared when the save is stored, and kept when it fails or throws.
   * @returns A `Promise` resolving to a {@link SaveUserDataResult}.
   * @throws An error if no entity is loaded or a property cannot be saved for any reason other than a refused name.
   */
  save: () => Promise<SaveUserDataResult>;

  ////////////////////////////////////////////////////////////
  // Answers
  ////////////////////////////////////////////////////////////

  /**
   * Set an answer to a specific question.
   * @throws An error if no entity is loaded.
   */
  setAnswer: (questionId: Id, answer: LocalizedAnswer) => void;
  /**
   * Delete an unsaved answer to a specific question.
   * NB. This does not intend to delete the answer in the backend. Use `setAnswer(questionId, { value: null })` for that.
   */
  resetAnswer: (questionId: Id) => void;
  /**
   * Reset all unsaved answers.
   */
  resetAnswers: () => void;

  ////////////////////////////////////////////////////////////
  // Properties
  ////////////////////////////////////////////////////////////

  /**
   * Set an editable property of the loaded entity. The property is unsaved only while its value differs from the saved one: a name is compared with its entries trimmed and its blank entries left out, a colour by its hex colour, and a first or last name without surrounding whitespace, so setting a property to what is saved makes it saved again. The value is copied, and is held in memory alone: it does not survive a reload of the page.
   * @param type - The type of the loaded entity, which decides the properties it has. A type known only as either served type admits only the properties both have: the image.
   * @param property - The name of the property.
   * @param value - The value. `null` clears an organization's name, short name or colour, and removes the stored image when the data is saved; for an entity with no stored image it stages nothing and only drops an unsaved one.
   * @throws An error if no entity is loaded, or if the loaded entity is not of the given type.
   */
  setProperty: <TType extends ServedEntityType, TProperty extends keyof EditablePropsOf<TType>>(
    type: TType,
    property: TProperty,
    value: Exclude<EditablePropsOf<TType>[TProperty], undefined>
  ) => void;
  /**
   * Delete the unsaved value of one editable property.
   * NB. This does not intend to delete the property in the backend.
   */
  resetProperty: (property: EditableEntityProperty) => void;

  ////////////////////////////////////////////////////////////
  // Reactive values
  ////////////////////////////////////////////////////////////

  /**
   * An `Array` of question ids for which there are unsaved answers.
   */
  readonly unsavedQuestionIds: Array<Id>;
  /**
   * An `Array` of names of unsaved properties.
   */
  readonly unsavedProperties: Array<EditableEntityProperty>;
  /**
   * `true` if there are any unsaved data.
   */
  readonly hasUnsaved: boolean;
  /**
   * The saved data of the loaded entity, without unsaved edits.
   */
  readonly savedEntityData: LocalizedEntityData | undefined;
  /**
   * The saved name and short name of the loaded entity by locale, without unsaved edits. `undefined` while no entity is loaded and for an entity type whose names are not stored by locale.
   */
  readonly savedLocalizedNames: LocalizedEntityNames | undefined;
};
