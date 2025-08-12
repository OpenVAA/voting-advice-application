import { Candidate, DataRoot } from '@openvaa/data';
import { QUESTION_MAP } from '../../data/question-map';
import type {
  Answer,
  AnyEntityVariant,
  AnyQuestionVariant,
  AnyQuestionVariantData,
  QuestionCategoryData
} from '@openvaa/data';
import type { RawCandidateData, RawCandidatesData, SimpleQuestionData } from '../../types/adHoc/rawJsonData';

/**
 * Parser for converting raw JSON candidate data into OpenVAA data objects
 */
export class CandidateDataParser {
  private dataRoot: DataRoot;

  constructor() {
    this.dataRoot = new DataRoot();
  }

  /**
   * Parse raw candidates data and return entities and questions
   */
  parse(rawData: RawCandidatesData): {
    entities: Array<AnyEntityVariant>;
    questions: Array<AnyQuestionVariant>;
  } {
    // First pass: collect all unique question IDs and infer their types
    const questionIds = new Set<string>();
    const questionTypes = new Map<
      string,
      {
        type: string;
        sampleValues: Set<unknown>;
        hasChoices: boolean;
      }
    >();

    for (const candidate of rawData) {
      for (const [questionId, answer] of Object.entries(candidate.answers)) {
        questionIds.add(questionId);

        if (!questionTypes.has(questionId)) {
          questionTypes.set(questionId, {
            type: 'unknown',
            sampleValues: new Set(),
            hasChoices: false
          });
        }

        const qType = questionTypes.get(questionId)!;
        if (answer.value !== null && answer.value !== undefined) {
          qType.sampleValues.add(answer.value);
        }
      }
    }

    // Infer question types from sample values
    const inferredQuestions = this.inferQuestionTypes(questionTypes);

    const categoryData: Array<QuestionCategoryData> = [
      {
        id: 'default-category',
        name: 'General Questions',
        info: 'General candidate questionnaire'
      }
    ];

    const questionsData: Array<AnyQuestionVariantData> = [];
    for (const [questionId, questionInfo] of inferredQuestions) {
      const qData = this.createQuestionData(questionId, questionInfo);
      if (qData) {
        questionsData.push(qData);
      }
    }

    this.dataRoot.provideQuestionData({
      categories: categoryData,
      questions: questionsData
    });

    // Create entities
    const entities: Array<AnyEntityVariant> = [];
    for (const candidateData of rawData) {
      const entity = this.createCandidate(candidateData);
      if (entity) {
        entities.push(entity);
      }
    }

    return { entities, questions: this.dataRoot.questions };
  }

  /**
   * Infer question types from sample values
   */
  private inferQuestionTypes(
    questionTypes: Map<
      string,
      {
        type: string;
        sampleValues: Set<unknown>;
        hasChoices: boolean;
      }
    >
  ): Map<string, SimpleQuestionData> {
    const result = new Map<string, SimpleQuestionData>();

    for (const [questionId, typeInfo] of questionTypes) {
      const sampleValues = Array.from(typeInfo.sampleValues);
      let questionType: SimpleQuestionData['type'] = 'text';
      let ordinalChoices: SimpleQuestionData['ordinalChoices'];
      let categoricalChoices: SimpleQuestionData['categoricalChoices'];

      // Check if all values are numbers
      if (sampleValues.every((v) => typeof v === 'number')) {
        // Check if it's a scale (common VAA pattern)
        const numValues = sampleValues as Array<number>;
        const min = Math.min(...numValues);
        const max = Math.max(...numValues);

        if (min >= 1 && max <= 5 && numValues.every((v) => Number.isInteger(v))) {
          // Looks like a 1-5 scale
          questionType = 'singleChoiceOrdinal';
          ordinalChoices = [];
          for (let i = min; i <= max; i++) {
            ordinalChoices.push({
              id: i.toString(),
              label: i.toString(),
              normalizableValue: i
            });
          }
        } else {
          questionType = 'number';
        }
      }
      // Check if all values are booleans
      else if (sampleValues.every((v) => typeof v === 'boolean')) {
        questionType = 'boolean';
      }
      // Check if all values are arrays (multiple choice)
      else if (sampleValues.every((v) => Array.isArray(v))) {
        questionType = 'multipleChoiceCategorical';
        const allChoices = new Set<string>();
        sampleValues.forEach((arr) => {
          if (Array.isArray(arr)) {
            arr.forEach((item) => allChoices.add(String(item)));
          }
        });
        categoricalChoices = Array.from(allChoices).map((choice) => ({
          id: choice,
          label: choice
        }));
      }
      // Check if it's a string that looks like a choice ID
      else if (sampleValues.every((v) => typeof v === 'string')) {
        const stringValues = sampleValues as Array<string>;
        // If values look like numbers but are strings, might be choice IDs
        if (stringValues.every((v) => /^\d+$/.test(v))) {
          questionType = 'singleChoiceCategorical';
          const questionDef = QUESTION_MAP[questionId];
          if (questionDef?.choices) {
            // Map choice IDs to their actual labels
            categoricalChoices = stringValues.map((choiceId) => {
              const choice = questionDef.choices?.find((c: { id: string }) => c.id === choiceId);
              return {
                id: choiceId,
                label: choice?.label.en || choice?.label.fi || choice?.label.sv || `Option ${choiceId}`
              };
            });
          } else {
            // Fallback to generic labels if no choice definitions found
            categoricalChoices = stringValues.map((choice) => ({
              id: choice,
              label: `Option ${choice}`
            }));
          }
        } else {
          questionType = 'text';
        }
      }
      // Check if it's a localized object
      else if (sampleValues.some((v) => typeof v === 'object' && v !== null && !Array.isArray(v))) {
        questionType = 'text'; // Treat localized text as text
      }

      result.set(questionId, {
        id: questionId,
        name: QUESTION_MAP[questionId]?.text.en || `Question ${questionId}`,
        type: questionType,
        categoryId: 'default-category',
        categoryName: 'General Questions',
        ordinalChoices,
        categoricalChoices
      });
    }

    return result;
  }

  /**
   * Create question data based on inferred type
   */
  private createQuestionData(questionId: string, questionData: SimpleQuestionData): AnyQuestionVariantData | null {
    const baseData = {
      id: questionId,
      name: questionData.name,
      categoryId: questionData.categoryId
    };

    try {
      switch (questionData.type) {
        case 'text':
          return { ...baseData, type: 'text' };

        case 'number':
          return { ...baseData, type: 'number' };

        case 'boolean':
          return { ...baseData, type: 'boolean' };

        case 'singleChoiceOrdinal':
          return {
            ...baseData,
            type: 'singleChoiceOrdinal',
            choices: questionData.ordinalChoices || []
          };

        case 'singleChoiceCategorical':
          return {
            ...baseData,
            type: 'singleChoiceCategorical',
            choices: questionData.categoricalChoices || []
          };

        case 'multipleChoiceCategorical':
          return {
            ...baseData,
            type: 'multipleChoiceCategorical',
            choices: questionData.categoricalChoices || []
          };

        default:
          console.warn(`Unknown question type: ${questionData.type}`);
          return null;
      }
    } catch (error) {
      console.error(`Error creating question data ${questionId}:`, error);
      return null;
    }
  }

  /**
   * Create a candidate entity from raw data
   */
  private createCandidate(rawData: RawCandidateData): Candidate | null {
    try {
      // Convert raw answers to the expected format
      const answers: Record<string, { value: unknown; info?: string | null }> = {};

      // Helper function to extract first available language from a localization map
      function normalizeLocalized(v: unknown): string {
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          const localized = v as Record<string, string>;
          return localized.en || Object.values(localized)[0] || '';
        }
        return String(v || '');
      }

      for (const [questionId, rawAnswer] of Object.entries(rawData.answers)) {
        if (rawAnswer.value !== null && rawAnswer.value !== undefined) {
          let value = rawAnswer.value;
          let info: string | undefined;

          // Handle localized values by extracting the first available language
          if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            value = normalizeLocalized(value);
          }

          // Handle localized info/comments the same way
          if (typeof rawAnswer.info === 'object' && rawAnswer.info !== null && !Array.isArray(rawAnswer.info)) {
            info = normalizeLocalized(rawAnswer.info);
          } else if (typeof rawAnswer.info === 'string') {
            info = rawAnswer.info;
          } else {
            info = undefined;
          }

          answers[questionId] = {
            value,
            info: info || undefined
          } as Answer<unknown>;
        }
      }

      return new Candidate({
        data: {
          id: rawData.id.toString(),
          firstName: rawData.firstName,
          lastName: rawData.lastName,
          type: 'candidate',
          answers
        },
        root: this.dataRoot
      });
    } catch (error) {
      console.error(`Error creating candidate ${rawData.id}:`, error);
      return null;
    }
  }

  /**
   * Get the data root (useful for accessing formatters)
   */
  getDataRoot(): DataRoot {
    return this.dataRoot;
  }
}

/**
 * Convenience function to parse candidate data from JSON
 */
export function parseRawCandidateData(rawData: RawCandidatesData): {
  entities: Array<AnyEntityVariant>;
  questions: Array<AnyQuestionVariant>;
  dataRoot: DataRoot;
} {
  const parser = new CandidateDataParser();
  const result = parser.parse(rawData);
  return {
    ...result,
    dataRoot: parser.getDataRoot()
  };
}
