import type { LLMResponseContract } from '@openvaa/llm';

export const TABLE_JSON_FORMAT: LLMResponseContract<{
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

/**
 * Extracted TypeScript type for the table JSON structure expected/produced by the LLM.
 * This makes it easy to type functions that consume the parsed response without using `any`.
 */
export type TableJsonData = typeof TABLE_JSON_FORMAT extends LLMResponseContract<infer T> ? T : never;
