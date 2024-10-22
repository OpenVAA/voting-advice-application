import {type DynamicSettings, dynamicSettings, QuestionInCardContent} from 'vaa-shared';
import {API} from './api';

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
  partyCardContents: Array<
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
      candidateCardContents.push({content: item});
    } else {
      candidateCardContents.push({
        content: 'question',
        question_id: item.question,
        question_hideLabel: item.hideLabel,
        question_format: item.format
      });
    }
  });
  const partyCardContents = [];
  dynamicSettings.results.cardContents.party.forEach((item) => {
    if (item === 'submatches' || item === 'candidates') {
      partyCardContents.push({content: item});
    } else {
      partyCardContents.push({
        content: 'question',
        question_id: item.question,
        question_hideLabel: item.hideLabel,
        question_format: item.format
      });
    }
  });

  return {candidateCardContents, partyCardContents};
}

/**
 * Gets `cardContents` from Strapi and returns them in format used in `DynamicSettings`. The returned values are `null` if not defined.
 */
export async function getCardContentsFromStrapi(id: number): Promise<{
  candidate: DynamicSettings['results']['cardContents']['candidate'] | null;
  party: DynamicSettings['results']['cardContents']['party'] | null;
} | null> {
  const appSettings = await strapi.entityService.findOne(API.AppSettings, id, {
    populate: ['results', 'results.candidateCardContents', 'results.partyCardContents']
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

  let partyCardContents: DynamicSettings['results']['cardContents']['party'] | null = null;
  appSettings.results?.partyCardContents?.forEach((item) => {
    partyCardContents ??= [];
    if (item.content === 'submatches' || item.content === 'candidates') {
      partyCardContents.push(item.content);
    } else {
      partyCardContents.push({
        question: item.question_id,
        hideLabel: item.question_hideLabel,
        format: item.question_format
      });
    }
  });

  return {candidate: candidateCardContents, party: partyCardContents};
}
