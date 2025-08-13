import { readFileSync } from 'fs';
import { join } from 'path';

// Use run-time read to avoid type errors with the json file
const questions = JSON.parse(
  readFileSync(join(__dirname, 'raw', 'questions-production.json'), 'utf8')
);

type QuestionText = {
  en: string;
  fi: string;
  sv: string;
};

type QuestionDefinition = {
  text: QuestionText;
  type: string;
  choices?: Array<{
    id: string;
    label: QuestionText;
    normalizableValue?: number;
  }>;
};

type QuestionMap = Record<string, QuestionDefinition>;

const questionMap: QuestionMap = {};

for (const question of questions) {
  if (question.documentId && question.text) {
    const definition: QuestionDefinition = {
      text: {
        en: question.text.en || '',
        fi: question.text.fi || '',
        sv: question.text.sv || ''
      },
      type: question.questionType?.settings?.type || 'text'
    };

    // Add choices if they exist
    if (question.questionType?.settings?.choices) {
      definition.choices = question.questionType.settings.choices.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (choice: any) => ({
          id: choice.id,
          label: {
            en: choice.label?.en || choice.label || choice.id,
            fi: choice.label?.fi || choice.label || choice.id,
            sv: choice.label?.sv || choice.label || choice.id
          },
          normalizableValue: choice.normalizableValue
        })
      );
    }

    questionMap[question.documentId] = definition;
  }
}

export const QUESTION_MAP = questionMap;
