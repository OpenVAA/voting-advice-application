export interface CandidateProps {
  answers: {
    questionId: string;
    answer: number;
    openAnswer?: string;
  }[];
  candidateNumber: string | number;
  firstName: string;
  id: string;
  lastName: string;
  motherTongues: string[];
  otherLanguages: string[];
  party: {
    name: string;
    shortName: string;
  };
  // photo
  politicalExperience: string;
}
