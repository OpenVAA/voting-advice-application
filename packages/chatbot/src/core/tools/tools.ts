import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import type { AnyQuestionVariantData } from '@openvaa/data';
import type { ChatDataProvider } from './chatDataProvider.type';
import type { CandidateInfo } from './chatDataProvider.type';
import type { Tool } from './tool.type';

// ES module directory path
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);

// Load party information from text files
const PARTY_INFO = {
  "European People's Party": readFileSync(join(currentDirPath, 'tmpDB', 'epp.txt'), 'utf-8'),
  'Progressive Alliance of Socialists and Democrats': readFileSync(
    join(currentDirPath, 'tmpDB', 'progressives.txt'),
    'utf-8'
  ),
  'Patriots for Europe': readFileSync(join(currentDirPath, 'tmpDB', 'patriots.txt'), 'utf-8')
};

export function getTools(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, Tool<any, any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, Tool<any, any>> = {
    getAvailableParties: getAvailableParties(),
    getPartyInfo: getPartyInfo()
  };

  return tools;
}

export function getAvailableParties(): Tool<object, Array<string>> {
  return {
    description: 'Get all available parties in the 2024 European Parliament election.',
    inputSchema: z.object({}), // 
    execute: () => Object.keys(PARTY_INFO)
  };
}

export function getPartyInfo(): Tool<{ name: string }, { name: string; information: string }> {
  return {
    description: 'Get information about a party by name in the 2024 European Parliament election.',
    inputSchema: z.object({
      name: z.string().describe('The name of the party')
    }),
    execute: (input) => {
      // Get the party information from the PARTY_INFO object
      // TODO: store in DB or redis cache (this information is probably needed often)
      const name = input.name;
      const information = PARTY_INFO[name as keyof typeof PARTY_INFO];

      if (!information) {
        throw new Error(`Party with name ${name} not found`);
      }

      return {
        name,
        information
      };
    }
  };
}

export function getCandidateInfo(dataProvider: ChatDataProvider): Tool<{ id: string }, CandidateInfo> {
  return {
    description: 'Get information about a candidate by ID.',
    inputSchema: z.object({
      id: z.string().describe('The candidate ID')
    }),
    execute: (input) => dataProvider.getCandidateInfo(input.id)
  };
}

export function findCandidateByName(dataProvider: ChatDataProvider): Tool<{ name: string }, Array<CandidateInfo>> {
  return {
    description: 'Find candidates by name.',
    inputSchema: z.object({
      name: z.string().describe('The name to search for')
    }),
    execute: (input) => dataProvider.findCandidates(input.name)
  };
}

export function listCandidatesFor(
  dataProvider: ChatDataProvider
): Tool<{ electionId: string; constituencyId?: string }, Array<CandidateInfo>> {
  return {
    description: 'List candidates for a specific election and optionally constituency.',
    inputSchema: z.object({
      electionId: z.string().describe('The election ID'),
      constituencyId: z.string().optional().describe('The constituency ID (optional)')
    }),
    execute: (input) => dataProvider.listCandidatesFor(input)
  };
}

export function getCandidateAnswer(
  dataProvider: ChatDataProvider
): Tool<
  { candidateId: string; questionId: string },
  { questionId: string; answer?: { value: unknown; info?: string | null } }
> {
  return {
    description: "Get a candidate's answer to a specific question.",
    inputSchema: z.object({
      candidateId: z.string().describe('The candidate ID'),
      questionId: z.string().describe('The question ID')
    }),
    execute: (input) => dataProvider.getCandidateAnswer(input.candidateId, input.questionId)
  };
}

export function getCandidateAnswers(
  dataProvider: ChatDataProvider
): Tool<{ candidateId: string }, Array<{ questionId: string; answer?: { value: unknown; info?: string | null } }>> {
  return {
    description: 'Get all answers for a candidate.',
    inputSchema: z.object({
      candidateId: z.string().describe('The candidate ID')
    }),
    execute: (input) => dataProvider.getCandidateAnswers(input.candidateId)
  };
}

export function findQuestions(
  dataProvider: ChatDataProvider
): Tool<{ query: string; electionId?: string }, Array<AnyQuestionVariantData>> {
  return {
    description: 'Find questions by searching their text content.',
    inputSchema: z.object({
      query: z.string().describe('The search query for questions'),
      electionId: z.string().optional().describe('The election ID to filter by (optional)')
    }),
    execute: (input) =>
      dataProvider.findQuestions(input.query, input.electionId ? { electionId: input.electionId } : undefined)
  };
}

export const toolFactories = {
  getCandidateInfo,
  findCandidateByName,
  listCandidatesFor,
  getCandidateAnswer,
  getCandidateAnswers,
  findQuestions
} as const;
