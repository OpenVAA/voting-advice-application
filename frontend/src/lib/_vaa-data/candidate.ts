import type {CandidateData, _AnswerDict} from './candidate.type';
import {DataObject} from './dataObject';
import type {DataAccessor} from './dataObject.type';
import type {DataRoot} from './dataRoot';

export class Candidate extends DataObject implements DataAccessor<CandidateData> {
  constructor(
    public readonly data: CandidateData,
    public readonly parent: DataRoot
  ) {
    super(data, parent);
  }

  get answers(): _AnswerDict {
    return this.data.answers ?? 0;
  }

  get electionRound(): number {
    return this.data.electionRound ?? 0;
  }

  get electionSymbol(): string {
    return this.data.electionSymbol ?? '';
  }

  get firstName(): string {
    return this.data.firstName;
  }

  get lastName(): string {
    return this.data.lastName;
  }

  get name() {
    return `${this.firstName} ${this.lastName}`;
  }

  get shortName() {
    return initials(this.name);
  }

  get photo(): ImageProps | null {
    return this.data.photo ?? null;
  }
}

function initials(text: string) {
  if (!text) return '';
  return text
    .split(/ +/)
    .map((word) => `${word.substring(0, 1)}.`)
    .join(' ');
}
