/**
 * English language constants for question info generation prompts
 *
 * This file contains instruction strings and examples used by the prompts
 * in generateTerms.yaml, generateInfoSections.yaml, and generateBoth.yaml
 */

/**
 * General instructions for the LLM about its role and task
 */
export const GENERAL_INSTRUCTIONS = `You are a political expert tasked with generating helpful explanations for a question to help voting advice application users understand a question related to the election.

You will be given a question and relevant context. Based on this information, generate helpful explanations that give the user a better understanding of the question.`;

/**
 * Neutrality requirements that apply to all outputs
 */
export const NEUTRALITY_REQUIREMENTS = `- Be informative and factual
- Neutral in tone (avoid bias)
- Written in clear, accessible language
- Relevant to the specific question`;

/**
 * Instructions for term definition generation
 */
export const TERM_DEF_INSTRUCTIONS = `Extract terms that are important for the user to understand the question. This includes (but is not limited to):
  - Technical or legal terms
  - Political jargon or acronyms
  - Economic or social concepts
  - Policy-specific terminology

The term triggers should be written in the same way they are used in the question.
Example: Question: "The state should increase transaction fees" should result in the term "transaction fees".
If the same term is used in multiple ways, include all of them as triggers.

The title of the term, however, should be the noun or concept that is being defined, not its inflected form.

Each term definition should:
- Be written in simple, clear language
- Be neutral and factual
- Help voters understand the question better

## Important note:
The TERMS should ONLY be extracted FROM THE QUESTION text itself, not any other text.`;

/**
 * Instructions for info sections generation
 */
export const INFO_SECTIONS_INSTRUCTIONS = `Generate 2-3 informative sections that cover:
  - Background context and history (if relevant)
  - Key stakeholders and their positions (if relevant)
  - Economic, social, or political implications (if relevant)
  - Current status and recent developments (if relevant)

  The title of the section should be a short, descriptive title that captures the main idea of the section.`;

/**
 * Example question and outputs for few-shot learning
 */
export const EXAMPLE_TRANSACTION_FEES = {
  question: 'The state should increase transaction fees on financial market operations.',

  infoSections: [
    {
      title: 'Background',
      content: 'Financial transaction fees (or taxes) are small charges on trades of assets such as stocks, bonds, or derivatives. They are often proposed to raise public revenue and discourage speculative trading. In the EU, common rules have been debated for years, but only a few countries have implemented broad-based transaction taxes.'
    },
    {
      title: 'Current situation',
      content: 'In Finland, a transfer tax of 1.6% applies to share purchases in Finnish companies, but trades on regulated markets like the Helsinki Stock Exchange are exempt. Finland also has a bank levy, but no wide-ranging financial transaction tax. Proposals to raise fees spark debate between boosting public funds and financial stability versus risking lower liquidity and competitiveness.'
    }
  ],

  terms: [
    {
      triggers: ['transaction fees'],
      title: 'Transaction fees',
      content: 'Charges applied to financial transactions, such as buying or selling stocks, bonds, or other securities. These fees are typically collected by governments to generate revenue and can also be used to regulate market activity by making certain transactions more expensive.'
    },
    {
      triggers: ['financial market operations'],
      title: 'Financial market operations',
      content: 'Activities involving the buying and selling of financial instruments like stocks, bonds, currencies, and derivatives. These operations facilitate the flow of capital between investors and companies, helping businesses raise funds and allowing individuals to invest their money.'
    }
  ]
};

/**
 * All examples available for few-shot learning
 */
export const EXAMPLES = [EXAMPLE_TRANSACTION_FEES];
