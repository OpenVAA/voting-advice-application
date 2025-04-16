/**
 * English language configuration for argument condensation
 * Provides instructions and formatting for English language processing
 */
// TO DO: Optimize the instructions for English
export const ENGLISH_CONFIG = {
    instructionsGeneral: `Go through the following comments on the topic "{topic}".
    If the comments contain perspectives that are not already present in the existing arguments:
    - Create a new argument for each new perspective
    - Ensure that the new argument is clearly different from the existing ones
    - Write the argument in a single sentence
    Note:
    - Do not modify existing arguments
    - Create a new argument only if it presents a completely new perspective
    `,
    instructionsSupportive: 'Go through the following comments on the claim: "{topic}". Condense them into 20 concise arguments, which cover different perspectives on the claim well. The arguments should be short but comprehensive. A good argument focuses on specific reasons why the claim is true or false.',
    instructionsOpposing: 'Go through the following comments on the claim: "{topic}". Condense them into 20 concise arguments, which cover different perspectives on the claim well. The arguments should be short but comprehensive. A good argument focuses on specific reasons why the claim is true or false.',
    reduceInstructionsGeneral: 'Go through the following comments on the claim: "{topic}". Condense them into 20 concise arguments, which cover different perspectives on the claim well. The arguments should be short but comprehensive. A good argument focuses on specific reasons why the claim is true or false.',
    reduceInstructionsSupporting: 'Go through the following comments on the claim: "{topic}". Condense them into 20 concise arguments, which cover different perspectives on the claim well. The arguments should be short but comprehensive. A good argument focuses on specific reasons why the claim is true or false.',
    reduceInstructionsOpposing: 'Go through the following comments on the claim: "{topic}". Condense them into 20 concise arguments, which cover different perspectives on the claim well. The arguments should be short but comprehensive. A good argument focuses on specific reasons why the claim is true or false.',
    opposingReminder: '### REMEMBER: You are not allowed to support the claim "{topic}" with arguments. This is forbidden.',
    existingArgumentsHeader: 'Existing arguments',
    newCommentsHeader: 'New comments',
    outputFormatHeader: 'Output format',
    outputFormat: {
        argumentPrefix: 'ARGUMENT',
        argumentPlaceholder: '[New argument]'
    },
    inputCommentPrefix: 'Comment',
    existingArgumentPrefix: 'Argument'
};
