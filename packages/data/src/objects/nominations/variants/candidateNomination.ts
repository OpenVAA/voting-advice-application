import {
  type CandidateNominationData,
  type DataAccessor,
  ENTITY_TYPE,
  FactionNomination,
  OrganizationNomination
} from '../../../internal';
import { Nomination } from '../../../internal';

/**
 * A nomination for a `Candidate`. The nomination may be part of an `OrganizationNomination`, i.e., a party list, or a `FactionNomination`.
 * NB. The same `Candidate` may be nominated multiple times in the same `Election`-`Constituency` pair if it has different parent nominations.
 */
export class CandidateNomination
  extends Nomination<
    typeof ENTITY_TYPE.Candidate,
    typeof ENTITY_TYPE.Faction | typeof ENTITY_TYPE.Organization,
    CandidateNominationData
  >
  implements DataAccessor<CandidateNominationData>
{
  /**
   * A utility synonym for `parentNomination` in the case when the `Candidate` is nominated on a `Faction`.
   */
  get factionList(): FactionNomination | null {
    return this.data.parentNominationType === ENTITY_TYPE.Faction ? (this.parentNomination as FactionNomination) : null;
  }

  /**
   * A utility synonym for `parentNomination` in the case when the `Candidate` is nominated on an `Organization`.
   */
  get list(): OrganizationNomination | null {
    return this.data.parentNominationType === ENTITY_TYPE.Organization
      ? (this.parentNomination as OrganizationNomination)
      : null;
  }
}
