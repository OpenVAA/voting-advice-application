import { OBJECT_TYPE } from '../internal';
import type {
  AnyEntityVariant,
  AnyNominationVariant,
  AnyQuestionVariant,
  DataObject,
  MultipleChoiceCategoricalQuestion,
  ObjectType,
  ObjectTypeMap,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '../internal';

/**
 * Check if an object is a given type of `DataObject`. Use this instead of `instanceof`.
 */
export function isObjectType<TType extends ObjectType>(obj: unknown, type: TType): obj is ObjectTypeMap[TType] {
  return isDataObject(obj) && obj.objectType === type;
}

/**
 * Check if an object is a any subtype of `Question`.
 */
export function isQuestion(obj: unknown): obj is AnyQuestionVariant {
  return isDataObject(obj) && obj.objectType.endsWith('Question');
}

/**
 * Check if an object is a any subtype of `ChoiceQuestion`.
 */
export function isChoiceQuestion(
  obj: unknown
): obj is MultipleChoiceCategoricalQuestion | SingleChoiceCategoricalQuestion | SingleChoiceOrdinalQuestion {
  return (
    isDataObject(obj) &&
    (obj.objectType === OBJECT_TYPE.MultipleChoiceCategoricalQuestion ||
      obj.objectType === OBJECT_TYPE.SingleChoiceCategoricalQuestion ||
      obj.objectType === OBJECT_TYPE.SingleChoiceOrdinalQuestion)
  );
}

/**
 * Check if an object is a any subtype of `MultipleChoiceQuestion`.
 */
export function isMultipleChoiceQuestion(obj: unknown): obj is MultipleChoiceCategoricalQuestion {
  return isDataObject(obj) && obj.objectType === OBJECT_TYPE.MultipleChoiceCategoricalQuestion;
}

/**
 * Check if an object is a any subtype of `SingleChoiceQuestion`.
 */
export function isSingleChoiceQuestion(
  obj: unknown
): obj is SingleChoiceCategoricalQuestion | SingleChoiceOrdinalQuestion {
  return (
    isDataObject(obj) &&
    (obj.objectType === OBJECT_TYPE.SingleChoiceCategoricalQuestion ||
      obj.objectType === OBJECT_TYPE.SingleChoiceOrdinalQuestion)
  );
}

/**
 * Check if an object is a any subtype of `Entity`.
 */
export function isEntity(obj: unknown): obj is AnyEntityVariant {
  return (
    isDataObject(obj) &&
    (obj.objectType === OBJECT_TYPE.Alliance ||
      obj.objectType === OBJECT_TYPE.Candidate ||
      obj.objectType === OBJECT_TYPE.Faction ||
      obj.objectType === OBJECT_TYPE.Organization)
  );
}

/**
 * Check if an object is a any subtype of `Nomination`.
 */
export function isNomination(obj: unknown): obj is AnyNominationVariant {
  return isDataObject(obj) && obj.objectType.endsWith('Nomination');
}

/**
 * Check if an object is a any subtype of `DataObject`.
 */
export function isDataObject(obj: unknown): obj is DataObject {
  return (
    !!obj &&
    typeof obj === 'object' &&
    'objectType' in obj &&
    Object.values(OBJECT_TYPE).includes(obj.objectType as ObjectType)
  );
}
