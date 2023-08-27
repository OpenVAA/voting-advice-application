/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question-type`.
 */
export interface StrapiQuestionTypeData {
  id: number;
  attributes: {
    name: string;
    info: string;
    questions: {
      // To get StrapiQuestionData.category property populated, we need a more specific call
      data: StrapiQuestionData[];
    };
    // TODO: Change to match new specs {type: string, values: [{key: number, label: string}]}
    settings: {
      data: {
        key: number;
        label: string;
      }[];
    };
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question`.
 */
export interface StrapiQuestionData {
  id: number;
  attributes: {
    text: string;
    info: string;
    category: {
      data: {
        attributes: {
          name: string;
        };
      };
    };
  };
}
