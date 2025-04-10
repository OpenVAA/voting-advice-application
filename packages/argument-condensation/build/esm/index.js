import { processComments } from './utils/commentProcessor';
// Export main functionality
export { processComments };
export { Condenser } from './core/Condenser';
export { exportResults } from './utils/fileOperations';
export { CONDENSATION_TYPE } from './core/types/condensationType';
// Export language namespace
export { LanguageConfigs } from './languageOptions/configs';
// Export errors
export { ArgumentCondensationError, LLMError, ParsingError } from './core/types/errors';
