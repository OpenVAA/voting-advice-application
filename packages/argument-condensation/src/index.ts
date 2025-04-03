import { processComments } from './utils/commentProcessor';

// Export main functionality
export { processComments };
export { Condenser } from './Condenser';
export { exportResults } from './utils/fileOperations';

// Export types
export type { Argument } from './types/Argument';
export type { LanguageConfig, SupportedLanguage } from './languageOptions/LanguageConfig';
export { CondensationType } from './types/CondensationType';

// Export language configs
export { finnishConfig } from './languageOptions/finnish';
export { englishConfig } from './languageOptions/english';

// Export errors
export { ArgumentCondensationError, LLMError, ParsingError } from './types/Errors';
