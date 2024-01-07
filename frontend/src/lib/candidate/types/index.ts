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
  politicalExperience: string;
  email: string;
  nominations: Nomination[];
  locale: string;
  party?: Party;
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
  name: string;
  shortName: string;
  info: string;
  partyColor: string;
}

export interface Constituency {
  name: string;
  shortName: string;
  type: string;
}
