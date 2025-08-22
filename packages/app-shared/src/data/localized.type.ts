import type { Answer, AnswerValue, Choice } from '@openvaa/data';
import type { Argument, QuestionArguments, QuestionInfoSection, TermDefinition, VideoContent } from './customData.type';

/**
 * Mapping between localized types and translated versions.
 */
export type TranslatedMap<TType extends Localized> = TType extends LocalizedString
  ? string
  : TType extends LocalizedObject<infer TValue>
    ? TValue
    : TType extends LocalizedChoice
      ? Choice
      : TType extends LocalizedAnswer<infer TValue>
        ? Answer<TValue>
        : TType extends LocalizedQuestionArguments
          ? QuestionArguments
          : TType extends LocalizedArgument
            ? Argument
            : TType extends LocalizedQuestionInfoSection
              ? QuestionInfoSection
              : TType extends LocalizedTermDefinition
                ? TermDefinition
                : TType extends LocalizedVideoContent
                  ? VideoContent
                  : never;

/**
 * Any localized type.
 */
export type Localized =
  | LocalizedString
  | LocalizedObject
  | LocalizedChoice
  | LocalizedAnswer
  | LocalizedQuestionArguments
  | LocalizedArgument
  | LocalizedQuestionInfoSection
  | LocalizedTermDefinition
  | LocalizedVideoContent;

/**
 * A string translated into different languages.
 */
export type LocalizedString = {
  [locale: string]: string;
};

/**
 * A generic object translated into different languages.
 */
export type LocalizedObject<TValue = unknown> = Record<string, TValue>;

/**
 * A localized `Choice` object.
 */
export type LocalizedChoice = Omit<Choice, 'label'> & {
  label: LocalizedString | string;
};

/**
 * A localized `Answer` object.
 */
export type LocalizedAnswer<TValue extends AnswerValue | unknown = unknown> = Omit<Answer<TValue>, 'info'> & {
  info?: LocalizedString | null;
};

/**
 * A localized `QuestionArguments` object.
 */
export type LocalizedQuestionArguments = Omit<QuestionArguments, 'arguments'> & {
  arguments: Array<LocalizedArgument>;
};

/**
 * A localized `Arguments` object.
 */
export type LocalizedArgument = Omit<Argument, 'content'> & {
  content: LocalizedString;
};

/**
 * A localized `QuestionInfoSection` object.
 */
export type LocalizedQuestionInfoSection = Omit<QuestionInfoSection, 'content' | 'title'> & {
  content: LocalizedString;
  title: LocalizedString;
};

/**
 * A localized `TermDefinition` object.
 */
export type LocalizedTermDefinition = Omit<TermDefinition, 'triggers' | 'content' | 'title'> & {
  triggers: LocalizedObject<Array<string>>;
  title?: LocalizedString;
  content: LocalizedString;
};

/**
 * A localized `VideoContent` object.
 */
export type LocalizedVideoContent = LocalizedObject<VideoContent>;
