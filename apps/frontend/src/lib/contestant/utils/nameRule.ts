import { defaultLocale } from '$lib/i18n';
import { isBlankText, missingRequiredLocale } from '$lib/utils/localizedText';
import type { UserEntity } from '$lib/api/base/dataWriter.type';
import type { IdentityFieldDescriptor } from './entityDescriptor';

/**
 * Why a name field is or is not editable: `editable`, `locked-confirmed` for a confirmed entity, and `locked-answers` for an unconfirmed entity while answers are locked and for an entity that is not known.
 */
export type NameState = 'editable' | 'locked-confirmed' | 'locked-answers';

/**
 * Whether the name fields of an entity can be edited: only for an entity known to be unconfirmed, while answers are not locked. This decides what a page offers; the database refuses a changed name of a confirmed entity whatever the page showed.
 * @param entity - The listed entity, or `undefined` when it is not known.
 * @param answersLocked - Whether answers are locked.
 * @returns `true` when the name fields are editable.
 */
export function isNameEditable(entity: Pick<UserEntity, 'confirmed'> | undefined, answersLocked: boolean): boolean {
  return nameState(entity, answersLocked) === 'editable';
}

/**
 * The state of every name field of an entity: its first name, last name, name and short name alike. Confirmation wins over the answers lock, so a confirmed entity is `locked-confirmed` whether answers are locked or not.
 * @param entity - The listed entity, or `undefined` when it is not known.
 * @param answersLocked - Whether answers are locked.
 * @returns The name state.
 */
export function nameState(entity: Pick<UserEntity, 'confirmed'> | undefined, answersLocked: boolean): NameState {
  if (entity?.confirmed) return 'locked-confirmed';
  if (entity === undefined || answersLocked) return 'locked-answers';
  return 'editable';
}

/**
 * The values of an entity's name fields, by the property each field edits: those held as one text, and those held as an entry for each locale.
 */
export type NameFieldValues = {
  text: Partial<Record<IdentityFieldDescriptor['property'], unknown>>;
  byLocale: Partial<Record<IdentityFieldDescriptor['property'], LocalizedString | null>>;
};

/**
 * Whether a name field lacks the value its rule requires: a blank text for a field that is always required, no entry in the required locale for a field that requires that locale alone. A field that is never required lacks nothing. Whether the rule applies at all is the caller's to decide: a locked name is never required.
 * @param field - The field's property and its rule.
 * @param values - The values of the entity's name fields.
 * @returns `true` when the field's required value is missing.
 */
export function isRequiredNameMissing(
  { property, required }: Pick<IdentityFieldDescriptor, 'property' | 'required'>,
  values: NameFieldValues
): boolean {
  switch (required) {
    case 'always':
      return isBlankText(values.text[property]);
    case 'requiredLocale':
      return missingRequiredLocale(values.byLocale[property], requiredNameLocale());
    case 'never':
      return false;
  }
}

/**
 * The locale a required locale-keyed name must have an entry in: the default locale of the frontend.
 * @returns The locale code.
 */
export function requiredNameLocale(): string {
  return defaultLocale;
}
