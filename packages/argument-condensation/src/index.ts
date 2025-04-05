import { processComments } from './utils/commentProcessor';

// Export main functionality
export { processComments };
export { Condenser } from './Condenser';
export { exportResults } from './utils/fileOperations';

// Export types
export type { Argument } from './types/Argument';
export { CONDENSATION_TYPE } from './types/CondensationType';

// Export language namespace
export { LanguageConfigs } from './languageOptions/configs';

// Export errors
export { ArgumentCondensationError, LLMError, ParsingError } from './types/Errors';
