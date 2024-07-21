import {type Answers} from '$lib/_vaa-data';
import {type HasMatchableAnswers} from '$voter/vaa-matching';

export class Voter implements HasMatchableAnswers {
  constructor(public readonly answers: Answers) {}
}
