import { tool } from 'ai';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { performRAGRetrieval } from '../rag/ragService';
import type { AnyQuestionVariantData } from '@openvaa/data';
import type { VectorStore } from '@openvaa/vector-store/types';
import type { RAGRetrievalResult } from '../rag/ragService.type';
import type { ChatDataProvider } from './chatDataProvider.type';
import type { CandidateInfo } from './chatDataProvider.type';
import type { Tool } from './tool.type';

// ES module directory path
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);

// Load party information from text files (keep existing detailed files)
const PARTY_INFO_FILES = {
  "European People's Party": readFileSync(join(currentDirPath, 'tmpDB', 'epp.txt'), 'utf-8'),
  'Progressive Alliance of Socialists and Democrats': readFileSync(
    join(currentDirPath, 'tmpDB', 'progressives.txt'),
    'utf-8'
  ),
  'Patriots for Europe': readFileSync(join(currentDirPath, 'tmpDB', 'patriots.txt'), 'utf-8')
};

// All parties with basic info (detailed info from files where available)
const PARTY_INFO: Record<string, string> = {
  "European People's Party": PARTY_INFO_FILES["European People's Party"],

  'Socialists & Democrats':
    PARTY_INFO_FILES['Progressive Alliance of Socialists and Democrats'] ||
    `Socialists & Democrats (S&D)

The Progressive Alliance of Socialists and Democrats is the second-largest political group in the European Parliament. It represents center-left, social-democratic parties across Europe.

Orientation: Center-left, social democracy, pro-European integration
Key Policies: Workers' rights, social welfare, climate action, gender equality, fair taxation
Member Parties: German SPD, Spanish PSOE, Italian PD, French PS, and others
2024 Seats: Approximately 136 MEPs`,

  'Renew Europe': `Renew Europe

Renew Europe is the liberal, centrist political group in the European Parliament, formed in 2019 as a successor to ALDE. It is strongly pro-European and federalist.

Orientation: Liberal, centrist, pro-European federalism
Key Policies: Free markets, civil liberties, digital economy, rule of law, European integration
Member Parties: French Renaissance (Macron's party), German FDP, Dutch VVD/D66, and others
2024 Seats: Approximately 77 MEPs`,

  'Greens/European Free Alliance': `Greens/European Free Alliance (Greens/EFA)

The Greens/EFA is a political group combining green/environmentalist parties with regionalist and minority nationalist parties. They are strong advocates for climate action and social justice.

Orientation: Green politics, progressive, pro-European, regionalist
Key Policies: Climate action (European Green Deal), biodiversity, social justice, minority rights, sustainable economy
Member Parties: German Greens, French EELV, Swedish Greens, Scottish National Party, and others
2024 Seats: Approximately 53 MEPs`,

  'European Conservatives and Reformists': `European Conservatives and Reformists (ECR)

The ECR is a right-wing, Eurosceptic political group. It favors EU reform and national sovereignty while remaining within the EU framework.

Orientation: Conservative, Eurosceptic, national-conservative
Key Policies: National sovereignty, reduced EU bureaucracy, traditional values, strong borders, free market economics
Member Parties: Italian Fratelli d'Italia (Meloni), Polish PiS, Spanish Vox, Swedish Democrats, and others
2024 Seats: Approximately 78 MEPs`,

  'Identity and Democracy': `Identity and Democracy (ID)

Identity and Democracy is a right-wing to far-right nationalist political group. It is strongly Eurosceptic and focuses on immigration restriction and national identity.

Orientation: Right-wing populist, nationalist, Eurosceptic
Key Policies: Immigration restriction, national sovereignty, opposition to EU federalism, traditional values, protectionism
Member Parties: French Rassemblement National (Le Pen), Italian Lega, Austrian FPÖ, and others
2024 Seats: Approximately 58 MEPs`,

  'The Left in the European Parliament': `The Left in the European Parliament (GUE/NGL)

The Left group represents socialist, communist, and left-wing parties that advocate for radical social and economic transformation. They are critical of EU neoliberal policies.

Orientation: Left-wing, democratic socialist, Eurosceptic (from the left)
Key Policies: Anti-austerity, workers' rights, public services, wealth redistribution, peace, climate justice
Member Parties: German Die Linke, French La France Insoumise, Spanish Podemos, Greek Syriza, and others
2024 Seats: Approximately 46 MEPs`,

  'Non-affiliated': `Non-affiliated MEPs (NI)

Non-affiliated (Non-Inscrits) MEPs are those who do not belong to any political group in the European Parliament. They sit independently for various reasons.

Composition: Includes MEPs from parties that don't fit existing groups, newly elected parties seeking a group, expelled members, or those ideologically isolated
Notable Members: Can include far-right parties excluded from ID, single-issue MEPs, or independents
2024 Seats: Approximately 45 MEPs
Note: Non-affiliated MEPs have limited influence as they cannot participate in group activities or hold certain leadership positions.`,

  'Patriots for Europe': PARTY_INFO_FILES['Patriots for Europe']
};

/**
 * Dependencies required for RAG tool
 */
export interface RAGDependencies {
  vectorStore: VectorStore;
  nResultsTarget?: number;
  rerankConfig?: { enabled: boolean; apiKey: string; model?: string };
  /** Optional metadata collector to capture full RAG retrieval results */
  metadataCollector?: Array<RAGRetrievalResult>;
}

/**
 * Get available tools for the chatbot
 *
 * @param ragDeps - RAG tool dependencies
 * @returns Record of tool name to tool instance
 */

export function getTools(ragDeps: RAGDependencies) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {
    getAvailableParties: getAvailableParties(),
    getPartyInfo: getPartyManifesto()
  };

  // Add RAG tool if dependencies are provided
  if (ragDeps) {
    tools.vectorSearchForElectionInfo = vectorSearchForElectionInfo(ragDeps);
    console.info('RAG tool added!:', tools.vectorSearchForElectionInfo);
  }

  return tools;
}

/**
 * Create RAG search context tool
 *
 * Allows LLM to autonomously retrieve relevant context from vector store.
 * The tool handles query reformulation, vector search, and context formatting.
 *
 * @param deps - RAG tool dependencies (vector store, LLM provider, etc.)
 * @returns Tool instance for RAG retrieval
 */
export function vectorSearchForElectionInfo(deps: RAGDependencies) {
  return tool({
    description:
      'Every time you are answering a question that requires ANY information that is not available in the conversation history, use this tool. It takes in a search query and returns the most relevant information from the vector store. If the information is multi-faceted or requires multi-step reasoning, use this tool multiple times with different queries.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Search query describing the information needed. Be specific and focused (e.g., "climate change policies of European parties" rather than just "climate").'
        )
    }),
    execute: async (input) => {
      console.info('RAG tool executing with query:', input.query);
      const result = await performRAGRetrieval({
        query: input.query,
        vectorStore: deps.vectorStore,
        nResultsTarget: deps.nResultsTarget,
        rerankConfig: deps.rerankConfig
      });
      console.info('RAG tool executed with result:', result.formattedContext);
      // Store full result in metadata collector if provided
      if (deps.metadataCollector) {
        deps.metadataCollector.push(result);
      }
      console.info('RAG retrieval result:', result.formattedContext);

      // Return ONLY formatted context for LLM (keep response clean)
      return result.formattedContext;
    }
  });
}

export function getAvailableParties() {
  return tool({
    description: 'Get all available parties in the 2024 European Parliament election.',
    inputSchema: z.object({}),
    execute: () => Object.keys(PARTY_INFO)
  });
}

export function getPartyManifesto() {
  return tool({
    description:
      'Get the manifesto of a party by name in the 2024 European Parliament election. If looking for more specific information, use the vectorSearchForElectionInfo tool.',
    inputSchema: z.object({
      name: z.string().describe('The name of the party (e.g., "European People\'s Party", "Patriots for Europe")')
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
  });
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
