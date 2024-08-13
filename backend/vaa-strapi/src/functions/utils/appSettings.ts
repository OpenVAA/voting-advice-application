import {type DynamicSettings, dynamicSettings} from 'vaa-shared';
import {API} from './api';

/**
 * Gets `results.cardContents` from `dynamicSettings.ts` and returns them in format used in Strapi
 */
export function getCardContentsFromFile() {
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
 * Gets `cardContents` from Strapi and returns them in format used in `DynamicSettings`
 */
export async function getCardContentsFromStrapi(id: number) {
  const appSettings = await strapi.entityService.findOne(API.AppSettings, id, {
    populate: ['results', 'results.candidateCardContents', 'results.partyCardContents']
  });

  const candidateCardContents: DynamicSettings['results']['cardContents']['candidate'] = [];
  appSettings.results.candidateCardContents.forEach((item) => {
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

  const partyCardContents: DynamicSettings['results']['cardContents']['party'] = [];
  appSettings.results.partyCardContents.forEach((item) => {
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
