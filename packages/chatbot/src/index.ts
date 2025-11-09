export type { ChatbotAPIInput } from './api.type';
export type { ConversationState } from './controller/chatbotController.type';

// Query categorization
export { CANNED_RESPONSES, getCannedResponse } from './core/cannedResponses';
export type {
  NonQueryableCategory,
  QueryableCategory,
  QueryCategorizationResult,
  QueryCategory
} from './core/queryCategories';
export {
  ALL_CATEGORY_VALUES,
  isQueryable,
  LLMOnlyCategory,
  needsCannedResponse,
  NON_QUERYABLE_CATEGORIES as NON_QUERYABLE_CATEGORY_VALUES,
  QUERYABLE_CATEGORIES as QUERYABLE_CATEGORY_VALUES
} from './core/queryCategories';

// Browser-safe default config
export { getOnboardingMessage } from './defaultConfig/onboardingMessages';