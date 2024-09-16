import type {
  Answers,
  Candidate,
  Constituency,
  DataAccessor,
  NominationData,
  Party
} from './internal';
import {DataObject} from './internal';

// TODO: Extend to <TNominee extends Entity = Candidate, TNominator extends Entity = Party>. Remove as-clauses at the same time and possibly create subclasses such as `PartyNomination` and `CandidateNomination`.
export class Nomination<TNominee extends Candidate = Candidate, TNominator extends Party = Party>
  extends DataObject
  implements DataAccessor<NominationData>
{
  constructor(
    public data: NominationData,
    public parent: Constituency
  ) {
    super(data, parent);
  }

  /**
   * A utility getter for compatibility with the `vaa-matching.HasMatchableAnswers` interface.
   */
  get answers(): Answers {
    return this.entity?.answers ?? {};
  }

  get electionSymbol(): string {
    return this.data.electionSymbol ?? '';
  }

  get nominee(): TNominee | undefined {
    const id = this.data.candidateId;
    return id != null ? (this.root.getCandidate(id) as TNominee) : undefined;
  }

  get nominator(): TNominator | undefined {
    const id = this.data.partyId;
    return id != null ? (this.root.getParty(id) as TNominator) : undefined;
  }

  // For compatibility
  get entity(): TNominee | undefined {
    return this.nominee;
  }
}
