/*
 * Contains both the data type and the final object class for a
 * candidate.
 */

import type {HasId} from '../dataProvider.types';

export interface CandidateData extends HasId {
  familyName: string;
  givenName?: string;
  imageUrl?: string;
  electionSymbol?: string | number;
  namePrefix?: string;
  nameSuffix?: string;
  type?: string;
  electionRound?: number;
}

// export type EntityType = 'ElectoralAlliance' | 'PoliticalOrganisation' | 'OrganisationFaction' | 'Person';

// Should also implement the HasMatchableAnswers interface from the mathing algorithm
//   getMatchableAnswer: (question: MatchableQuestion) => MatchableAnswer;
//   get matchableAnswers: () => MatchableAnswer[];
// Might also be a subclass in a chain Entity > Person > { Candidate, Voter }
export class Candidate {
  constructor(public data: CandidateData) {}

  get id() {
    return this.data.id;
  }

  get familyName() {
    return this.data.familyName;
  }

  get givenName() {
    return this.data.givenName ?? '';
  }

  get imageUrl() {
    return this.data.imageUrl ?? '';
  }

  get electionSymbol() {
    return this.data.electionSymbol ?? '';
  }

  get namePrefix() {
    return this.data.namePrefix ?? '';
  }

  get nameSuffix() {
    return this.data.nameSuffix ?? '';
  }

  get type() {
    return this.data.type ?? '';
  }

  get electionRound() {
    return this.data.electionRound ?? 0;
  }

  // Here we will define more methods that can be used in the frontend.

  // get fullName(): string // Return the full name in the proper order and with suffix and prefix

  // getPortrait(size?): urlString

  // getAnswer
}
