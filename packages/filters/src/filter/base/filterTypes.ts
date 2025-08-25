import type {
  ChoiceQuestionFilter,
  NumberQuestionFilter,
  ObjectFilter,
  TextFilter,
  TextPropertyFilter,
  TextQuestionFilter
} from '../';

/**
 * The `type` of any concrete filter object.
 */
export const FILTER_TYPE = {
  // NB! When editing these, be sure to update `/utils/typeGuard.ts` as well.
  TextQuestionFilter: 'textQuestionFilter',
  TextPropertyFilter: 'textPropertyFilter',
  TextFilter: 'textFilter',
  NumberQuestionFilter: 'numberQuestionFilter',
  ObjectFilter: 'objectFilter',
  ChoiceQuestionFilter: 'choiceQuestionFilter'
} as const;

/**
 * The `type` of any concrete filter object.
 */
export type FilterType = (typeof FILTER_TYPE)[keyof typeof FILTER_TYPE];

/**
 * A map of the concrete filter classes by their filter type.
 */
export type FilterTypeMap = {
  // NB! When editing these, be sure to update `/utils/typeGuard.ts` as well.
  [FILTER_TYPE.TextQuestionFilter]: TextQuestionFilter;
  [FILTER_TYPE.TextPropertyFilter]: TextPropertyFilter;
  [FILTER_TYPE.TextFilter]: TextFilter;
  [FILTER_TYPE.NumberQuestionFilter]: NumberQuestionFilter;
  [FILTER_TYPE.ObjectFilter]: ObjectFilter;
  [FILTER_TYPE.ChoiceQuestionFilter]: ChoiceQuestionFilter;
};
