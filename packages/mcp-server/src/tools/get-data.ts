/**
 * Election data retrieval tool
 *
 * Currently returns mock data. This will be replaced with actual database
 * access in future iterations.
 */

export interface ElectionData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  candidates: Array<Candidate>;
  questions: Array<Question>;
  statistics: ElectionStatistics;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  biography: string;
  positions: Record<string, string>;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  type: 'multiple_choice' | 'ranking' | 'text';
  options?: Array<string>;
}

export interface ElectionStatistics {
  totalCandidates: number;
  totalQuestions: number;
  participationRate?: number;
  lastUpdated: string;
}

/**
 * Retrieve election data by ID
 *
 * @param electionId - The unique identifier for the election
 * @returns Promise<ElectionData> - The election data
 */
export async function getElectionData(electionId: string): Promise<ElectionData> {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Mock data - this will be replaced with actual database queries
  const mockData: ElectionData = {
    id: electionId,
    name: `Election ${electionId}`,
    description: `Mock election data for election ID: ${electionId}. This is a voting advice application election with candidate information, policy questions, and voter guidance.`,
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2024-02-15T23:59:59Z',
    status: 'active',
    candidates: [
      {
        id: 'candidate-1',
        name: 'Alice Johnson',
        party: 'Progressive Party',
        biography: 'Environmental lawyer with 10 years of experience in climate policy.',
        positions: {
          'climate-change': 'Supports aggressive carbon reduction targets',
          healthcare: 'Advocates for universal healthcare system',
          education: 'Increased funding for public schools'
        }
      },
      {
        id: 'candidate-2',
        name: 'Bob Smith',
        party: 'Conservative Alliance',
        biography: 'Former business executive focusing on economic growth and job creation.',
        positions: {
          'climate-change': 'Supports market-based environmental solutions',
          healthcare: 'Prefers private healthcare options',
          education: 'School choice and charter school expansion'
        }
      },
      {
        id: 'candidate-3',
        name: 'Carol Martinez',
        party: 'Independent',
        biography: 'Community organizer with focus on social justice and equality.',
        positions: {
          'climate-change': 'Green New Deal supporter',
          healthcare: 'Single-payer healthcare system',
          education: 'Free college tuition and student debt forgiveness'
        }
      }
    ],
    questions: [
      {
        id: 'q1',
        text: 'What is your position on climate change policy?',
        category: 'Environment',
        type: 'multiple_choice',
        options: [
          'Aggressive government intervention needed',
          'Market-based solutions preferred',
          'Current policies are sufficient',
          'Climate change is not a priority'
        ]
      },
      {
        id: 'q2',
        text: 'How should healthcare be reformed?',
        category: 'Healthcare',
        type: 'multiple_choice',
        options: [
          'Universal government-run healthcare',
          'Regulated private insurance market',
          'Free market healthcare system',
          'Current system needs minor adjustments'
        ]
      },
      {
        id: 'q3',
        text: 'What is your education policy priority?',
        category: 'Education',
        type: 'multiple_choice',
        options: [
          'Increase public school funding',
          'Expand school choice programs',
          'Focus on vocational training',
          'Higher education affordability'
        ]
      }
    ],
    statistics: {
      totalCandidates: 3,
      totalQuestions: 3,
      participationRate: 67.5,
      lastUpdated: new Date().toISOString()
    }
  };

  return mockData;
}

/**
 * List all available elections
 * This could be another tool in the future
 */
export async function listElections(): Promise<Array<{ id: string; name: string; status: string }>> {
  return [
    { id: 'election-2024-municipal', name: '2024 Municipal Elections', status: 'active' },
    { id: 'election-2024-state', name: '2024 State Elections', status: 'upcoming' },
    { id: 'election-2023-local', name: '2023 Local Elections', status: 'completed' }
  ];
}
