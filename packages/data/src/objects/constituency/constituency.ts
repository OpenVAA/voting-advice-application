import { DataObject } from '../../internal';
import type { ConstituencyData, DataAccessor } from '../../internal';

/**
 * An electoral district, usually representing a geographical area, in which candidates can be nominated. In the case of simultaneous elections, the same constituencies are often used. `Nomination`s are specific to both a `Constituency` and an `Election`.
 */
export class Constituency extends DataObject<ConstituencyData> implements DataAccessor<ConstituencyData> {
  /**
   * An optional list of keywords associated with the constituency, e.g., the names of the municipalities contained within a regional constituency. @defaultValue null
   */
  get keywords(): Array<string> {
    return this.data.keywords ?? new Array<string>();
  }

  /**
   * The possible `Constituency` this one is nested within. This is mainly useful in situation where multiple elections take place on differing levels of a country’s regional hierarchy, such as state-wide, regional and municipal.
   */
  get parentConstituency(): Constituency | null {
    return this.data.parentId ? this.root.getConstituency(this.data.parentId) : null;
  }
}
