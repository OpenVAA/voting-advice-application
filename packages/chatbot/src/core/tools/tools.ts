import { z } from 'zod';
import type { Tool } from './tool.type';

interface FindCandidateInfoInput {
  candidateId: string;
}

interface FindCandidateInfoOutput {
  name: string;
  party: string;
}

export const findCandidateInfo: Tool<FindCandidateInfoInput, FindCandidateInfoOutput> = {
  description: 'Find information about a candidate',
  inputSchema: z.object({
    candidateId: z.string()
  }),
  execute: async ({ candidateId }) => {
    console.info(`[findCandidateInfo.execute]: searching DB for candidateId: ${candidateId}`);
    const candidate = { name: 'John Doe', party: { name: 'Democratic Party' } };
    return {
      name: candidate.name,
      party: candidate.party?.name
    };
  }
};

export const tools = {
  findCandidateInfo
};
