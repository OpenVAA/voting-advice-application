import { type DynamicSettings, dynamicSettings, QuestionInCardContent } from '@openvaa/app-shared';
import { API } from './api';

/**
 * Gets `results.cardContents` from `dynamicSettings.ts` and returns them in format used in Strapi
 */
export function getCardContentsFromFile(): {
  candidateCardContents: Array<
    | {
        content: 'submatches';
      }
    | {
        content: 'question';
        question_id: QuestionInCardContent['question'];
        question_hideLabel?: QuestionInCardContent['hideLabel'];
        question_format?: QuestionInCardContent['format'];
      }
  >;
  organizationCardContents: Array<
    | {
        content: 'submatches';
      }
    | {
        content: 'candidates';
      }
    | {
        content: 'question';
        question_id: QuestionInCardContent['question'];
        question_hideLabel?: QuestionInCardContent['hideLabel'];
        question_format?: QuestionInCardContent['format'];
      }
  >;
} {
  const candidateCardContents = [];
  dynamicSettings.results.cardContents.candidate.forEach((item) => {
    if (item === 'submatches') {
      candidateCardContents.push({ content: item });
    } else {
      candidateCardContents.push({
        content: 'question',
        question_id: item.question,
        question_hideLabel: item.hideLabel,
        question_format: item.format
      });
    }
  });
  const organizationCardContents = [];
  dynamicSettings.results.cardContents.organization.forEach((item) => {
    if (item === 'submatches' || item === 'candidates') {
      organizationCardContents.push({ content: item });
    } else {
      organizationCardContents.push({
        content: 'question',
        question_id: item.question,
        question_hideLabel: item.hideLabel,
        question_format: item.format
      });
    }
  });

  return { candidateCardContents, organizationCardContents };
}

/**
 * Gets `cardContents` from Strapi and returns them in format used in `DynamicSettings`. The returned values are `null` if not defined.
 */
export async function getCardContentsFromStrapi(id: number): Promise<{
  candidate: DynamicSettings['results']['cardContents']['candidate'] | null;
  organization: DynamicSettings['results']['cardContents']['organization'] | null;
} | null> {
  const appSettings = await strapi.entityService.findOne(API.AppSettings, id, {
    populate: ['results', 'results.candidateCardContents', 'results.organizationCardContents']
  });

  if (!appSettings?.results) return null;

  let candidateCardContents: DynamicSettings['results']['cardContents']['candidate'] | null = null;
  appSettings.results?.candidateCardContents?.forEach((item) => {
    candidateCardContents ??= [];
    if (item.content === 'submatches') {
      candidateCardContents.push(item.content);
    } else {
      candidateCardContents.push({
        question: item.question_id,
        hideLabel: item.question_hideLabel,
        format: item.question_format
      });
    }
  });

  let organizationCardContents: DynamicSettings['results']['cardContents']['organization'] | null = null;
  appSettings.results?.organizationCardContents?.forEach((item) => {
    organizationCardContents ??= [];
    if (item.content === 'submatches' || item.content === 'candidates') {
      organizationCardContents.push(item.content);
    } else {
      organizationCardContents.push({
        question: item.question_id,
        hideLabel: item.question_hideLabel,
        format: item.question_format
      });
    }
  });

  return { candidate: candidateCardContents, organization: organizationCardContents };
}
