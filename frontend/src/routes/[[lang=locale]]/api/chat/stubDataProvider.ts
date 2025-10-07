import type { CustomData } from '@openvaa/app-shared';
import type { ChatDataProvider } from '@openvaa/chatbot';
import type { AnyQuestionVariantData } from '@openvaa/data';

export const stubDataProvider: ChatDataProvider = {
  getCandidateInfo: async (id: string) => {
    if (id === '1') {
      return { name: 'Max Lehtinen', party: 'Communist Party' };
    }

    if (id === '2') {
      return { name: 'Kalle', party: 'OpenVAA Party' };
    }

    if (id === '123') {
      return { name: 'John Doe', party: 'Independent' };
    }

    throw new Error(`Candidate with id ${id} not found`);
  },
  findCandidates: async (name: string) => {
    if (name === 'Max Lehtinen') {
      return [{ name: 'Max Lehtinen', id: '1', party: 'Communist Party' }];
    }

    if (name === 'Kalle') {
      return [{ name: 'Kalle', id: '2', party: 'OpenVAA Party' }];
    }

    return [];
  },
  listCandidatesFor: async (opts: { electionId: string; constituencyId?: string }) => {
    // Stub implementation - return all candidates for any election/constituency
    if (opts.electionId === '1') {
      return [
        { name: 'Max Lehtinen', party: 'Communist Party' },
        { name: 'Kalle', party: 'OpenVAA Party' }
      ];
    }

    return [];
  },
  getCandidateAnswer: async (candidateId: string, questionId: string) => {
    // Stub implementation - return mock answers
    if (candidateId === '1' && questionId === 'q1') {
      return {
        questionId: 'q1',
        answer: { value: 'Yes', info: 'Strongly supports this policy' }
      };
    }
    if (candidateId === '2' && questionId === 'q1') {
      return {
        questionId: 'q1',
        answer: { value: 'No', info: 'Opposes this policy' }
      };
    }
    return { questionId, answer: undefined };
  },
  getCandidateAnswers: async (candidateId: string) => {
    // Stub implementation - return mock answers for all questions
    if (candidateId === '1') {
      return [
        { questionId: 'q1', answer: { value: 'Yes', info: 'Strongly supports this policy' } },
        { questionId: 'q2', answer: { value: 'Maybe', info: 'Needs more information' } }
      ];
    }
    if (candidateId === '2') {
      return [
        { questionId: 'q1', answer: { value: 'No', info: 'Opposes this policy' } },
        { questionId: 'q2', answer: { value: 'Yes', info: 'Fully supports this initiative' } }
      ];
    }
    return [];
  },
  findQuestions: async (query: string, opts?: { electionId?: string }) => {
    let mockQuestions: Array<AnyQuestionVariantData> = [];
    // Stub implementation - return mock questions
    if (opts?.electionId === '1') {
      mockQuestions = [
        {
          id: 'q1',
          name: 'Climate Change Policy',
          categoryId: 'cat1',
          entityType: 'candidate' as const,
          constituencyIds: [],
          customData: {
            fillingInfo: 'How should we address climate change?',
            required: true,
            filterable: true,
            allowOpen: false
          }
        },
        {
          id: 'q2',
          name: 'Healthcare Reform',
          categoryId: 'cat1',
          entityType: 'candidate' as const,
          constituencyIds: [],
          customData: {
            fillingInfo: 'What is your position on healthcare reform?',
            required: true,
            filterable: true,
            allowOpen: false
          }
        }
      ] as unknown as Array<AnyQuestionVariantData>;
    }

    // Simple text matching for stub
    return mockQuestions.filter(
      (q) =>
        q.name.toLowerCase().includes(query.toLowerCase()) ||
        (q.customData as CustomData['Question'])?.fillingInfo?.toLowerCase().includes(query.toLowerCase())
    );
  }
};
