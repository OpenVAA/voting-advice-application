/**
 * Filenames for example questions used in prompts
 */
export const FILENAMES_FOR_EXAMPLES = ['transactionFees'];

/**
 * Default topics for info sections when none are specified
 *
 * @example
 * ```ts
 * // Use default topics
 * const options = { operations: [QUESTION_INFO_OPERATION.InfoSections] };
 *
 * // Or override with custom topics
 * const options = {
 *   operations: [QUESTION_INFO_OPERATION.InfoSections],
 *   sectionTopics: ['History', 'Policy implications', 'Economic impact']
 * };
 * ```
 */
export const DEFAULT_SECTION_TOPICS = ['Background', 'Current situation'];

/**
 * Supported languages for question info generation
 * Currently only English is supported
 *
 * @todo Add language support for other languages
 */
export const SUPPORTED_QINFO_LANG = ['en'];
