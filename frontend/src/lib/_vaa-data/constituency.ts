import type {
  Collection,
  ConstituencyData,
  DataAccessor,
  Election,
  NominationData
} from './internal';
import {NamedObject, Nomination} from './internal';
import {order} from './order';

export class Constituency extends NamedObject implements DataAccessor<ConstituencyData> {
  protected children: {
    nominations?: Collection<Nomination>;
  } = {};

  constructor(
    public data: ConstituencyData,
    public parent: Election
  ) {
    super(data, parent);
  }

  get nominations(): Collection<Nomination> | undefined {
    return this.children.nominations ? [...this.children.nominations] : undefined;
  }

  /**
   * Provide constituency data to the Election. Can only be called once unless reset.
   */
  provideNominationData(data: Readonly<Array<NominationData>>): Collection<Nomination> {
    if (!this.children.nominations)
      console.info(`[debug] Constituency.provideNominationData() with ${data.length} nominations`);
    if (!this.children.nominations)
      this.update(
        () =>
          (this.children.nominations = [...data].sort(order).map((d) => new Nomination(d, this)))
      );
    return this.nominations!;
  }
}
