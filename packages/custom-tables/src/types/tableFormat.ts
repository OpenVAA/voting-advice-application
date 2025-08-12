import type { LLMResponseContract } from '@openvaa/llm';

export const TABLE_JSON_FORMAT_NO_EVICENCE: LLMResponseContract<{
  reasoning: string;
  categories: Array<{
    label: string;
    description: string;
    alternatives: Array<string>;
  }>;
  candidate_positions: {
    [key: string]: {
      [key: string]: string;
    };
  };
}> = {
  validate: (
    response: unknown
  ): response is {
    reasoning: string;
    categories: Array<{
      label: string;
      description: string;
      alternatives: Array<string>;
    }>;
    candidate_positions: {
      [key: string]: {
        [key: string]: string;
      };
    };
  } => {
    return (
      typeof response === 'object' &&
      response !== null &&
      'reasoning' in response &&
      'categories' in response &&
      'candidate_positions' in response &&
      Array.isArray(response.categories) &&
      response.categories.every(
        (category) =>
          typeof category === 'object' &&
          category !== null &&
          'label' in category &&
          'description' in category &&
          'alternatives' in category
      ) &&
      typeof response.candidate_positions === 'object' &&
      response.candidate_positions !== null &&
      Object.keys(response.candidate_positions).length > 0
    );
  }
};

export const TABLE_JSON_FORMAT_WITH_EVICENCE: LLMResponseContract<{
  reasoning: string;
  categories: Array<{
    label: string;
    description: string;
    alternatives: Array<string>;
  }>;
  candidate_positions: {
    [candidate: string]: {
      [category: string]: {
        position: string;
        supporting_excerpts: Array<string>;
      };
    };
  };
}> = {
  validate: (
    response: unknown
  ): response is {
    reasoning: string;
    categories: Array<{
      label: string;
      description: string;
      alternatives: Array<string>;
    }>;
    candidate_positions: {
      [candidate: string]: {
        [category: string]: {
          position: string;
          supporting_excerpts: Array<string>;
        };
      };
    };
  } => {
    const r = response as {
      reasoning: string;
      categories: Array<{
        label: string;
        description: string;
        alternatives: Array<string>;
      }>;
      candidate_positions: {
        [candidate: string]: {
          [category: string]: {
            position: string;
            supporting_excerpts: Array<string>;
          };
        };
      };
    };

    const isCategoriesValid =
      Array.isArray(r?.categories) &&
      r.categories.every(
        (category: {
          label: string;
          description: string;
          alternatives: Array<string>;
        }) =>
          category &&
          typeof category === 'object' &&
          typeof category.label === 'string' &&
          typeof category.description === 'string' &&
          Array.isArray(category.alternatives) &&
          category.alternatives.every((a: string) => typeof a === 'string')
      );

    const isCandidatePositionsValid =
      r?.candidate_positions &&
      typeof r.candidate_positions === 'object' &&
      r.candidate_positions !== null &&
      Object.keys(r.candidate_positions).length > 0 &&
      Object.values(r.candidate_positions).every((byCategory: {
        [key: string]: {
          position: string;
          supporting_excerpts: Array<string>;
        };
      }) => {
        return (
          byCategory &&
          typeof byCategory === 'object' &&
          Object.values(byCategory).every((entry: {
            position: string;
            supporting_excerpts: Array<string>;
          }) => {
            return (
              entry &&
              typeof entry === 'object' &&
              typeof entry.position === 'string' &&
              Array.isArray(entry.supporting_excerpts) &&
              entry.supporting_excerpts.every((ex: string) => typeof ex === 'string')
            );
          })
        );
      });

    return (
      r && typeof r === 'object' && typeof r.reasoning === 'string' && isCategoriesValid && isCandidatePositionsValid
    );
  }
};

/**
 * Extracted TypeScript type for the table JSON structure expected/produced by the LLM.
 * This makes it easy to type functions that consume the parsed response without using `any`.
 */
export type TableJsonData = typeof TABLE_JSON_FORMAT_NO_EVICENCE extends LLMResponseContract<infer T> ? T : never;

/**
 * Extracted TypeScript type for the table JSON structure expected/produced by the LLM.
 * This makes it easy to type functions that consume the parsed response without using `any`.
 */
export type TableJsonDataWithEvicence = typeof TABLE_JSON_FORMAT_WITH_EVICENCE extends LLMResponseContract<infer T> ? T : never;