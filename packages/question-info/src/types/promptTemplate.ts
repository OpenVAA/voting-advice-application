/**
 * Base prompt template for the question info package. Any YAML prompt file
 * in this package is loaded and parsed into one of the extensions of this interface (see below).
 */
export interface PromptTemplateBase {
  systemPrompt: string;
  userPrompt: string;
  examples: string;
}

/**
 * Prompt template for info sections generation
 */
export interface InfoSectionsPromptTemplate extends PromptTemplateBase {
  defaultSectionTopics: Array<string>;
}

/**
 * Prompt template for terms generation
 */
export type TermsPromptTemplate = PromptTemplateBase;

/**
 * Prompt template for both operations (terms+info sections)
 */
export interface BothOperationsPromptTemplate extends PromptTemplateBase {
  defaultSectionTopics: Array<string>;
}

/**
 * This is the union of all possible prompt templates in the question info package.
 */
export type PromptTemplate = InfoSectionsPromptTemplate | TermsPromptTemplate | BothOperationsPromptTemplate;



