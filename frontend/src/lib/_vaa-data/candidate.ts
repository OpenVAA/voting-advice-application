import {
  type Answers,
  type CandidateData,
  type DataAccessor,
  type DataRoot,
  Entity
} from './internal';

export class Candidate extends Entity implements DataAccessor<CandidateData> {
  constructor(
    public readonly data: CandidateData,
    public readonly parent: DataRoot
  ) {
    super(data, parent);
  }

  get answers(): Answers {
    return this.data.answers ?? {};
  }

  get firstName(): string {
    return this.data.firstName;
  }

  get lastName(): string {
    return this.data.lastName;
  }

  get name(): string {
    return this.data.name ?? this.root.format.name(this);
  }

  get shortName(): string {
    return this.data.shortName ?? this.root.format.initials(this);
  }
}
