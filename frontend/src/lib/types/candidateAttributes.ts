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
  gender: string;
  age: number;
  photo?: Photo;
  manifesto: Text;
  motherTongues: string[];
  unaffiliated: boolean;
  politicalExperience: string;
  email: string;
  nominations: Nomination[];
  locale: string;
  party?: Party;
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
  locale: string;
  constituency?: Constituency;
}

export interface Party {
  id: number;
  name: string;
  shortName: string;
  info: string;
  partyColor: string;
}

export interface Constituency {
  id: number;
  name: string;
  shortName: string;
  type: string;
}
