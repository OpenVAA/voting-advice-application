import {Constituency, NamedObject} from './internal';
import type {Collection, ConstituencyData, DataAccessor, DataRoot, ElectionData} from './internal';
import {order} from './order';

export class Election extends NamedObject implements DataAccessor<ElectionData> {
  protected children: {
    constituencies?: Collection<Constituency>;
  } = {};

  constructor(
    public data: ElectionData,
    parent: DataRoot
  ) {
    super(data, parent);
  }

  get constituencies(): Collection<Constituency> | undefined {
    return this.children.constituencies ? [...this.children.constituencies] : undefined;
  }

  /**
   * Provide constituency data to the Election. Can only be called once unless reset.
   */
  provideConstituencyData(data: Readonly<Array<ConstituencyData>>): Collection<Constituency> {
    if (!this.children.constituencies)
      console.info(`[debug] Election.provideConstituencyData() with ${data.length} constituencies`);
    if (!this.children.constituencies)
      this.update(
        () =>
          (this.children.constituencies = [...data]
            .sort(order)
            .map((d) => new Constituency(d, this)))
      );
    return this.constituencies!;
  }
}
