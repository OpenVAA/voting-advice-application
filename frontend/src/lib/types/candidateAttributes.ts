export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  candidate?: Candidate;
}

export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthday: string;
  photo?: Photo;
  manifesto: LocalizedString;
  motherTongues: Language[];
  unaffiliated: boolean;
  politicalExperience: string;
  email: string;
  nomination: Nomination;
  locale: string;
  party?: Party;
  appLanguage?: Language;
}

export interface Language {
  id: number;
  localisationCode: string;
  name: string;
}

export interface Gender {
  id: number;
  name: string;
}

export interface PhotoFormat {
  ext: string;
  url: string;
  hash: string;
  height: number;
  width: number;
  mime: string;
  name: string;
  size: number;
}

export interface Photo {
  id: number;
  hash: string;
  height: number;
  width: number;
  mime: string;
  name: string;
  previewUrl?: string;
  provider: string;
  size: number;
  updatedAt: string;
  url: string;
  formats: {
    large: PhotoFormat;
    medium: PhotoFormat;
    small: PhotoFormat;
    thumbnail: PhotoFormat;
  };
}

export interface Nomination {
  id: number;
  electionSymbol: string;
  electionRound: number;
  party: Party;
  election: Election;
  constituency?: Constituency;
}

export interface Party {
  id: number;
  name: LocalizedString;
  shortName: LocalizedString;
  info: LocalizedString;
  partyColor: string;
}

export interface Election {
  id: number;
  canEditQuestions: boolean;
}

export interface Constituency {
  id: number;
  name: LocalizedString;
  shortName: LocalizedString;
  type: string;
}

export interface Answer {
  id: string; // Id of the answer in the database
  key: AnswerOption['key']; // Selected answer option
  openAnswer: LocalizedString | null; // Optional free-form answer
}

export type candidateAnswer = AnswerProps & {
  id: string;
};

export interface Question {
  id: string;
  text: LocalizedString;
  shortName: LocalizedString;
  category: QuestionCategoryProps;
  info?: LocalizedString;
  fillingInfo?: string;
  type: QuestionSettingsProps['type'];
  values?: QuestionChoiceProps[];
  min?: number | Date;
  max?: number | Date;
  notLocalizable?: boolean;
  dateType?: DateType;
}

interface QuestionChoiceProps {
  key: number;
  label: LocalizedString;
}

export interface Progress {
  progress: number;
  max: number;
}
