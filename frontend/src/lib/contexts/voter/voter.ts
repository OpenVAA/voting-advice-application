import { type HasAnswers } from '@openvaa/core';
import { type Answers } from '@openvaa/data';

export class Voter implements HasAnswers {
  constructor(public readonly answers: Answers) {}
}
