import { untrack } from 'svelte';
import { UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
import { toHexColor } from '$lib/utils/color/toHexColor';
import { normalizeLocalizedName, sameLocalizedName } from '$lib/utils/localizedText';
import { localStorageState, removePersistedByPrefix } from '../utils/persistedState.svelte';
import type { LocalizedAnswer } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { Colors, Image } from '@openvaa/data';
import type {
  ContestantUserData,
  EditableEntityColor,
  EditableEntityProps,
  LocalizedAnswers,
  LocalizedEntityData,
  LocalizedEntityNames,
  SetAnswersResult,
  UpdateEntityPropertiesResult
} from '$lib/api/base/dataWriter.type';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import type { PersistedState } from '../utils/persistedState.svelte';
import type { ContestantUserDataState, SaveUserDataResult } from './contestantUserDataState.type';

/**
 * The stem of the `localStorage` keys under which unsaved answers are persisted, one key for each signed-in user and entity.
 */
export const EDITED_ANSWERS_KEY_STEM = 'contestantContext-userData-editedAnswers';

/**
 * Build the `localStorage` key under which the unsaved answers one signed-in user typed for one entity are persisted. An entity can have several editors, who may share a browser, so the key names the user as well as the entity.
 * @param entity - The entity's type and id.
 * @param userId - The id of the signed-in user.
 */
export function editedAnswersKey({ type, id }: Pick<LocalizedEntityData, 'type' | 'id'>, userId: Id): string {
  return `${EDITED_ANSWERS_KEY_STEM}-${userId}-${type}-${id}`;
}

/**
 * The persisted unsaved answers of one entity, with the key they are stored under.
 */
type EntityDraft = {
  key: string;
  answers: PersistedState<LocalizedAnswers>;
};

/**
 * The editable properties that are names. The backend freezes them once the entity is confirmed, so `save()` writes them apart from the other properties.
 */
const NAME_PROPERTIES = ['name', 'shortName', 'firstName', 'lastName'] as const satisfies ReadonlyArray<
  keyof EditableEntityProps
>;

/**
 * The names of the properties an object of editable properties holds a value for.
 * @param properties - The editable properties.
 * @returns The names, in the order the object holds them.
 */
function givenProperties(properties: EditableEntityProps): Array<keyof EditableEntityProps> {
  return (Object.keys(properties) as Array<keyof EditableEntityProps>).filter(
    (property) => properties[property] !== undefined
  );
}

/**
 * Whether an editable property is one of the {@link NAME_PROPERTIES}.
 * @param property - The name of the property.
 */
function isNameProperty(property: keyof EditableEntityProps): boolean {
  return NAME_PROPERTIES.some((nameProperty) => nameProperty === property);
}

/**
 * The form two colours are compared in: the default-theme colour as lowercase `#rrggbb`, so that the letter case and the three-digit form of a hex colour make no difference. The colour of the dark theme is not part of it, and a colour with no default-theme colour is no colour.
 * @param color - A stored colour, a staged one, or nothing.
 * @returns The hex colour, the colour as written when it is not one, or `null` for no colour.
 */
function comparableColor(color: Colors | EditableEntityColor | null | undefined): string | null {
  const normal: unknown = color?.normal;
  if (typeof normal !== 'string' || normal === '') return null;
  return toHexColor(normal) ?? normal;
}

/**
 * The part of an edit that differs from the saved data, in the form it is saved in. A name is compared and held normalised, a colour is compared by its hex colour, a person's name is compared and held without surrounding whitespace, and the removal of an image differs only from a stored one. Every value returned is a new plain value, never the object that was handed in, except for an image, which is held as it is.
 * @param saved - The saved data of the loaded entity.
 * @param edit - The edited properties.
 * @returns The properties of the edit that differ from the saved ones. A property that is the same as the saved one is left out.
 */
function changedProperties(saved: ContestantUserData<true>, edit: EditableEntityProps): EditableEntityProps {
  const { entity, localizedNames } = saved;
  const changed: EditableEntityProps = {};
  if (edit.image !== undefined && (edit.image !== null || entity.image)) changed.image = edit.image;
  if (edit.name !== undefined) {
    const name = normalizeLocalizedName(edit.name);
    if (!sameLocalizedName(name, localizedNames?.name)) changed.name = name;
  }
  if (edit.shortName !== undefined) {
    const shortName = normalizeLocalizedName(edit.shortName);
    if (!sameLocalizedName(shortName, localizedNames?.shortName)) changed.shortName = shortName;
  }
  if (edit.color !== undefined && comparableColor(edit.color) !== comparableColor(entity.color))
    changed.color = edit.color === null ? null : { normal: edit.color.normal };
  if (edit.firstName !== undefined) {
    const firstName = edit.firstName.trim();
    if (firstName !== ('firstName' in entity ? entity.firstName : '').trim()) changed.firstName = firstName;
  }
  if (edit.lastName !== undefined) {
    const lastName = edit.lastName.trim();
    if (lastName !== ('lastName' in entity ? entity.lastName : '').trim()) changed.lastName = lastName;
  }
  return changed;
}

/**
 * A Svelte 5 class implementation of the composite user-data store of the entity the user edits.
 * Holds all data owned by the user; when reading `current`, it returns a composite of the initial data and any unsaved `Answer`s and properties. The edited `Answer`s are stored in `localStorage` for persistence, under a key that names the entity, so each entity keeps its own draft (the persistence + version bridge is INHERITED from `localStorageState`/`PersistedStateImpl` — this class does NOT own a `#version`; the `{ version, data }` payload lives in `persistedState.svelte.ts`). The edited properties are held in memory alone: a name staged in one session is never restored into a later one, where the entity may have been confirmed since.
 *
 * The public surface is the TYPE `ContestantUserDataState` that this class `implements`, which is why the class itself is named `ContestantUserDataStateImpl` (the same suffix as `AnswerStateImpl`) — a class sharing the type's name would clash with it — and the consumer entry point is the `contestantUserDataState(...)` factory.
 *
 * The public methods are ARROW-FUNCTION FIELDS so they survive being held as `userData.X` on the contestant context and called detached. The reactive members (`current`/`hasUnsaved`/`savedEntityData`/`savedLocalizedNames`/`unsavedQuestionIds`/ `unsavedProperties`) are prototype getters read in-place (this store is NOT spread by any consumer, so prototype getters are safe).
 *
 * @internal Construct via the `contestantUserDataState(...)` factory at component init. The constructor installs an `$effect` (reacting to `answersLocked` to clear unsaved edits), so constructing outside an effect context throws `effect_orphan`.
 */
class ContestantUserDataStateImpl implements ContestantUserDataState {
  #answersLocked: () => boolean;
  // A getter, not an instance: the store builds a writer for each backend call and holds none between them.
  #dataWriter: () => UniversalDataWriter;
  #locale: () => string;

  ////////////////////////////////////////////////////////////////////
  // Internals
  ////////////////////////////////////////////////////////////////////

  // An internal $state for holding the user data loaded from the backend
  #savedData = $state<ContestantUserData<true> | undefined>(undefined);

  // The persisted edited answers of the loaded entity. A handle's key is fixed when it is constructed, so loading another entity replaces the handle; it is held raw so that the derived values below follow the replacement.
  #draft = $state.raw<EntityDraft | undefined>(undefined);
  /** The signed-in user the loaded entity's draft belongs to. */
  #userId: Id | undefined;

  // The edited properties of the loaded entity that differ from the saved ones, each in the form it is saved in. Held raw and replaced whole on every change, so what it holds is plain values. It has no storage handle: the properties live in memory alone.
  #staged = $state.raw<EditableEntityProps>({});

  // A derived value holding the effective user data, including unsaved data
  #current = $derived.by(() => {
    const editedAnswers = this.#draft?.answers.current;
    const { name, shortName, ...stagedOnEntity } = this.#staged;
    if (!this.#savedData) return undefined;
    const {
      entity: { answers = {}, ...rest },
      localizedNames,
      nominations
    } = this.#savedData;
    // The staged image, colour and person names are shown on the entity. The staged names of an organization are shown by locale, beside it: the entity's own name is one locale's text.
    const entity = {
      ...rest,
      ...stagedOnEntity,
      answers: { ...answers, ...editedAnswers }
    };
    const hasNames = localizedNames !== undefined || name !== undefined || shortName !== undefined;
    // Return clone to prevent mutation of saved data.
    // Use JSON round-trip instead of structuredClone because Svelte 5's $state proxy objects cannot be structurally cloned.
    return JSON.parse(
      JSON.stringify({
        entity,
        localizedNames: hasNames
          ? {
              name: name !== undefined ? name : (localizedNames?.name ?? null),
              shortName: shortName !== undefined ? shortName : (localizedNames?.shortName ?? null)
            }
          : undefined,
        nominations
      })
    ) as ContestantUserData<true>;
  });

  constructor({
    answersLocked,
    dataWriter,
    locale
  }: {
    answersLocked: () => boolean;
    dataWriter: () => UniversalDataWriter;
    locale: () => string;
  }) {
    this.#answersLocked = answersLocked;
    this.#dataWriter = dataWriter;
    this.#locale = locale;

    // While answers are locked nothing unsaved is kept: the drafted answers of the loaded entity are emptied and its staged properties discarded. Each is written only when it holds something, because a write of an empty value over an empty one would still replace `current` with an equal copy.
    $effect(() => {
      if (!this.#answersLocked()) return;
      // The draft is read tracked, so this runs again when another entity is loaded and clears a draft stored for that entity before the lock. What is cleared is read and written untracked, so the effect depends on nothing it writes.
      const draft = this.#draft;
      untrack(() => {
        if (draft && Object.keys(draft.answers.current).length > 0) draft.answers.set({});
        if (givenProperties(this.#staged).length > 0) this.#staged = {};
      });
    });
  }

  /**
   * A utility for only updating the `entity` part of the user data, with its names by locale when they are given.
   */
  #updateEntityData(data: LocalizedEntityData, localizedNames?: LocalizedEntityNames): void {
    if (!this.#savedData) throw new Error('Cannot update entity data before user data is loaded');
    this.#savedData = {
      ...this.#savedData,
      entity: data,
      ...(localizedNames && { localizedNames })
    };
  }

  /**
   * A utility for merging the properties a write stored into the existing `entity` and into its names by locale, without replacing either. The property setter returns only what it wrote, so the entity's `id`, its other static fields and its answers are kept from the stored entity.
   */
  #mergeEntityProperties({
    properties,
    localizedNames
  }: Extract<UpdateEntityPropertiesResult, { type: 'saved' }>): void {
    if (!this.#savedData) throw new Error('Cannot update entity data before user data is loaded');
    const saved = this.#savedData;
    const hasNames = saved.localizedNames !== undefined || givenProperties(localizedNames).length > 0;
    this.#savedData = {
      ...saved,
      entity: { ...saved.entity, ...properties },
      ...(hasNames && {
        localizedNames: { name: null, shortName: null, ...saved.localizedNames, ...localizedNames }
      })
    };
  }

  /**
   * Replace the staged values of the properties in `edit` by the ones that differ from the saved data, so that a property handed in as it is saved is no longer staged.
   */
  #stage(edit: EditableEntityProps): void {
    // Read untracked: this writes the staged properties it reads, so an effect that stages a property must not depend on them.
    const saved = untrack(() => this.#savedData);
    if (!saved) throw new Error('Cannot set a property before user data is loaded');
    const staged = { ...untrack(() => this.#staged) };
    for (const property of givenProperties(edit)) delete staged[property];
    this.#staged = { ...staged, ...changedProperties(saved, edit) };
  }

  /**
   * Discard the staged values of the named properties.
   */
  #unstage(properties: ReadonlyArray<keyof EditableEntityProps>): void {
    const staged = { ...untrack(() => this.#staged) };
    for (const property of properties) delete staged[property];
    this.#staged = staged;
  }

  /**
   * A utility for merging updated `answers` into the existing `entity` without replacing the whole entity. This preserves the entity's `id` and all static fields (its name, `image`, etc.), which the answer setters do NOT return — they return only the updated `LocalizedAnswers`.
   */
  #mergeEntityAnswers(answers: LocalizedAnswers): void {
    if (!this.#savedData) throw new Error('Cannot update entity data before user data is loaded');
    const mergedAnswers = {
      ...(this.#savedData.entity.answers ?? {}),
      ...answers
      // `LocalizedEntityData.answers` resolves to `Answers & LocalizedAnswers` (the EntityData base intersected with the LocalizedAnswers override). The merge yields a valid `LocalizedAnswers`; cast to the field type.
    } as LocalizedEntityData['answers'];
    this.#updateEntityData({
      ...this.#savedData.entity,
      answers: mergedAnswers
    });
  }

  /**
   * Whether the entity whose draft is stored under `key` is the loaded one. Asked after an await: another entity may have been loaded, or this one left, while the backend call was in flight, and its result must not be written into another entity's data.
   */
  #isLoaded(key: string): boolean {
    return untrack(() => this.#draft)?.key === key;
  }

  ////////////////////////////////////////////////////////////////////
  // Exported reactive values
  ////////////////////////////////////////////////////////////////////

  #savedEntityData = $derived(this.#savedData?.entity);

  #savedLocalizedNames = $derived(this.#savedData?.localizedNames);

  #unsavedQuestionIds = $derived.by(() => {
    const editedAnswers = this.#draft?.answers.current;
    return editedAnswers ? Object.keys(editedAnswers) : [];
  });

  #unsavedProperties = $derived(givenProperties(this.#staged));

  #hasUnsaved = $derived(this.#unsavedQuestionIds.length > 0 || this.#unsavedProperties.length > 0);

  get current(): ContestantUserData<true> | undefined {
    return this.#current;
  }

  get hasUnsaved(): boolean {
    return this.#hasUnsaved;
  }

  get savedEntityData(): LocalizedEntityData | undefined {
    return this.#savedEntityData;
  }

  get savedLocalizedNames(): LocalizedEntityNames | undefined {
    return this.#savedLocalizedNames;
  }

  get unsavedQuestionIds(): Array<Id> {
    return this.#unsavedQuestionIds;
  }

  get unsavedProperties(): Array<keyof EditableEntityProps> {
    return this.#unsavedProperties;
  }

  ////////////////////////////////////////////////////////////////////
  // Exported methods
  ////////////////////////////////////////////////////////////////////

  init = (data: ContestantUserData<true>, userId: Id): void => {
    // The drafts another user left in this browser are removed before any is restored, and so is a draft under a key that names no user.
    removePersistedByPrefix('localStorage', `${EDITED_ANSWERS_KEY_STEM}-`, `${EDITED_ANSWERS_KEY_STEM}-${userId}-`);
    this.#userId = userId;
    const key = editedAnswersKey(data.entity, userId);
    // Read untracked: this writes the draft it compares against, so an effect that calls `init` must not depend on it.
    if (untrack(() => this.#draft)?.key !== key) {
      this.#draft = { key, answers: localStorageState(key, {} as LocalizedAnswers) };
      this.#staged = {};
    }
    this.#savedData = data;
  };

  leaveEntity = (): void => {
    this.#savedData = undefined;
    this.#staged = {};
    this.#draft = undefined;
  };

  reset = (): void => {
    this.leaveEntity();
    removePersistedByPrefix('localStorage', `${EDITED_ANSWERS_KEY_STEM}-`);
  };

  resetUnsaved = (): void => {
    this.resetAnswers();
    this.#staged = {};
  };

  setAnswer = (questionId: Id, answer: LocalizedAnswer | null): void => {
    const draft = this.#draft;
    if (!draft) throw new Error('Cannot set an answer before user data is loaded');
    draft.answers.update(({ ...answers }) => {
      answers[questionId] = answer;
      return answers;
    });
  };

  resetAnswer = (questionId: Id): void => {
    this.#draft?.answers.update(({ ...answers }) => {
      delete answers[questionId];
      return answers;
    });
  };

  resetAnswers = (): void => {
    this.#draft?.answers.set({});
  };

  setProperty = <TProperty extends keyof EditableEntityProps>(
    property: TProperty,
    value: Exclude<EditableEntityProps[TProperty], undefined>
  ): void => {
    const edit: EditableEntityProps = {};
    edit[property] = value;
    this.#stage(edit);
  };

  resetProperty = (property: keyof EditableEntityProps): void => {
    this.#unstage([property]);
  };

  setImage = (image: Image | null): void => {
    this.#stage({ image });
  };

  resetImage = (): void => {
    this.#unstage(['image']);
  };

  reloadEntityData = async (): Promise<LocalizedEntityData> => {
    // Read untracked: the reload writes the saved data when it settles, so an effect that starts a reload must not depend on it, or it would start another one on every result.
    const saved = untrack(() => this.#savedData);
    if (!saved) throw new Error('Cannot reload entity data before user data is loaded');
    const { type, id } = saved.entity;
    const key = editedAnswersKey(saved.entity, this.#userId ?? '');
    const dataWriter = this.#dataWriter();
    const userData = await dataWriter.getEntityUserData({
      type,
      id,
      loadNominations: false,
      locale: this.#locale()
    });
    if (!userData) throw new Error('Failed to load user data');
    // The names by locale are read with the entity and stored with it, so the two forms of a name do not part.
    if (this.#isLoaded(key)) this.#updateEntityData(userData.entity, userData.localizedNames);
    return userData.entity;
  };

  save = async (): Promise<SaveUserDataResult> => {
    // Get the initial data to get target entity
    if (!this.#savedData) throw new Error('Save called before user data loaded');

    const draft = this.#draft;
    const answers = draft?.answers.current;
    const staged = this.#staged;
    // The target is the loaded entity itself, by its own type and id.
    const { type, id } = this.#savedData.entity;
    const updateArgs = { target: { type, id } };
    const key = editedAnswersKey({ type, id }, this.#userId ?? '');

    const dataWriter = this.#dataWriter();

    // The answer setters return only the updated `LocalizedAnswers` map, while the property setter returns only the properties it wrote.
    // Neither is a whole entity, so each is MERGED into the stored one: a wholesale replace would drop its `id` and static fields.
    let updatedAnswers: SetAnswersResult | undefined;

    if (answers && Object.keys(answers).length > 0) {
      updatedAnswers = await dataWriter.updateAnswers({
        ...updateArgs,
        answers
      });
      // Guards the nullish answer and the unverified signal the writer returns when the write succeeded but its read-back could not be validated.
      //
      // A failure is returned, not thrown. A throw lands in the caller's `.catch`, which logs `e?.message` as a free-form interpolated string, while the one structured `error` record, carrying the column, the row id and the issue paths, was already emitted at the adapter. Both checked entrances branch on `result?.type !== 'success'`, so a returned failure reaches the same UI a throw would: the `contestantApp.error.saveFailed` message.
      //
      // The exit is positioned BEFORE the merge and before the resets below, and that position is the whole point: `resetAnswers()` on the strength of an unverified read-back would discard the editor's typing. Keeping the buffer is recoverable, clearing it is not.
      if (!updatedAnswers || updatedAnswers === UNVERIFIED_ANSWERS) return { type: 'failure' };
      // Merge the updated answers into the existing entity, preserving id + static fields.
      if (this.#isLoaded(key)) this.#mergeEntityAnswers(updatedAnswers);
    }

    // The names are written in a call of their own, after the other properties. The backend refuses a changed name of a confirmed entity, and it refuses the whole statement that carries one: sent apart, a refused name leaves the image and the colour of the same save stored.
    const nameProperties = { ...staged };
    const otherProperties = { ...staged };
    for (const property of givenProperties(staged))
      if (isNameProperty(property)) delete otherProperties[property];
      else delete nameProperties[property];
    const writes = [otherProperties, nameProperties];

    const savedProperties = new Array<keyof EditableEntityProps>();
    let nameRefused = false;
    for (const properties of writes) {
      const given = givenProperties(properties);
      if (given.length === 0) continue;
      const result = await dataWriter.updateEntityProperties({ ...updateArgs, properties, locale: this.#locale() });
      if (result.type === 'nameRefused') {
        // Only a write that carries a name can be refused for one.
        if (!given.some(isNameProperty)) throw new Error('save: a write that carries no name was refused for a name');
        nameRefused = true;
        break;
      }
      savedProperties.push(...given);
      // The property setter returns ONLY the properties it wrote — NOT the whole entity. They are merged into the existing entity so `id` and the other static fields (and any just-merged answers) survive; a wholesale replace here would drop `id` and break the next save's RPC call.
      // What is stored is unstaged at once, so that a later write of this save that rejects leaves only its own properties staged, and a retry does not upload a stored logo again.
      if (this.#isLoaded(key)) {
        this.#mergeEntityProperties(result);
        this.#unstage(given);
      }
    }

    // Reset only after a save that neither failed nor threw. BOTH resets are skipped on the unverified-answers path above — not just the answers one — because an unverified save leaves the property edits equally unconfirmed.
    if (this.#isLoaded(key)) {
      this.resetAnswers();
      // After a refused name the staged names are discarded with what was stored: they can never be saved, and keeping them would keep the entity unsaved for ever.
      if (nameRefused) this.#unstage([...savedProperties, ...NAME_PROPERTIES]);
      else this.#staged = {};
    } else {
      // The saved entity is no longer the loaded one: its own stored draft is cleared, and the loaded entity's draft and staged properties are left alone.
      draft?.answers.set({});
    }

    // Every property the store stages is one the list of the user's entities shows, so any stored property is a listed one.
    return { type: nameRefused ? 'nameRefused' : 'success', listedPropertySaved: savedProperties.length > 0 };
  };
}

/**
 * Create an extended reactive object that holds all data owned by the user. When reading `current`, it returns a composite of the initial data and any unsaved `Answer`s and properties. The edited `Answer`s are stored in `localStorage` for persistence, under a key that names the entity they belong to; the edited properties are held in memory alone.
 * The unsaved data is cleared if answers become locked.
 * Dedicated methods are provided for loading, saving, setting or resetting data.
 * @param answersLocked - A getter that indicates whether answers are locked.
 * @param dataWriter - A getter returning a `UniversalDataWriter` built for the call that is about to be made.
 * @param locale - The current locale string, used for translating some data when it's fetched.
 */
export function contestantUserDataState({
  answersLocked,
  dataWriter,
  locale
}: {
  answersLocked: () => boolean;
  dataWriter: () => UniversalDataWriter;
  locale: () => string;
}): ContestantUserDataState {
  return new ContestantUserDataStateImpl({ answersLocked, dataWriter, locale });
}
