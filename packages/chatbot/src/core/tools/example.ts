import { tool } from 'ai';
import { z } from 'zod';

// Example tool - replace with actual OpenVAA functionality
export const askForPartyTool = tool({
  description: 'Ask the user for their favorite party',
  inputSchema: z.object({
    party: z.string()
  }),
  execute: async ({ party }) => {
    return `The user's favorite party is ${party}! Maybe we can do something with that information.`;
  }
});
