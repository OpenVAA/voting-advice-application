import { LanguageConfig } from '../types/LanguageConfig';

/**
 * English language configuration for argument condensation
 * Provides instructions and formatting for English language processing
 */
export const englishConfig: LanguageConfig = {
    instructions: `Go through the following comments on the topic: "{topic}".
If the comments contain perspectives that are not already present in the existing arguments:
- Create a new argument for each new perspective
- Ensure that the new argument is clearly different from the existing ones
- Write the argument in a single sentence
- Use two most relevant comments as sources for each new argument
Note:
- Do not modify existing arguments
- Create a new argument only if it presents a completely new perspective
- Clearly mark which comments (numbers) relate to each new argument`,
    recursiveInstructions: 'Go through the following comments on the claim: "{topic}". Condense them into 20 concise arguments, which cover different perspectives on the claim well. The arguments should be short but comprehensive. A good argument focuses on specific reasons why the claim is true or false.',
    existingArgumentsHeader: 'Existing arguments',
    newCommentsHeader: 'New comments',
    outputFormatHeader: 'Output format',
    outputFormat: {
      argumentPrefix: 'ARGUMENT',
      argumentExplanation: '[New argument if a new perspective is found]',
      sourcesPrefix: 'Sources',
      sourcesExplanation: '[Comment numbers]'
    },
    inputCommentPrefix: 'Comment',
    outputArgumentPrefix: 'Argument'
};