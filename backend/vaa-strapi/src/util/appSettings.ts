import { type DynamicSettings, dynamicSettings } from '@openvaa/app-shared';
import type { QuestionInCardContent } from '@openvaa/app-shared';
import type { Data } from '@strapi/strapi';

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
export function parseStrapiCardContents(results: Data.ContentType<'api::app-setting.app-setting'>['results']): {
  candidate: DynamicSettings['results']['cardContents']['candidate'] | null;
  organization: DynamicSettings['results']['cardContents']['organization'] | null;
} {
  let candidateCardContents: DynamicSettings['results']['cardContents']['candidate'] | null = null;
  results.candidateCardContents?.forEach((item) => {
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
  results.organizationCardContents?.forEach((item) => {
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

/**
 * A `null` values for missing `candidate` and `organization` properties in some of the settings to satisfy Strapi requirements.
 */
export function addMissingPartialRecords(settings: DynamicSettings): ExplicitPartials {
  const out = structuredClone(settings);
  for (const subkey of ['showMissingElectionSymbol', 'showMissingAnswers'] as const) {
    out.entityDetails[subkey] ??= {};
    for (const entityType of ['candidate', 'organization'] as const) {
      out.entityDetails[subkey][entityType] ??= null;
    }
  }
  return out as ExplicitPartials;
}

type ExplicitPartials = DynamicSettings & {
  entityDetails: {
    showMissingElectionSymbol: {
      candidate: boolean | null;
      organization: boolean | null;
    };
    showMissingAnswers: {
      candidate: boolean | null;
      organization: boolean | null;
    };
  };
};
