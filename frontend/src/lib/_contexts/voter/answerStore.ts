import {writable, type Readable, type Writable} from 'svelte/store';
import {type Answers, type Answer} from '$lib/_vaa-data';

/**
 * TODO:
 * Convert localStorageWritable =>
 * const w = writable();
 * bindToStorage(w, 'voterAnswers', STORAGE.Local);
 */

/**
 * A store for holding the voter's answers. The contents are frozen so that they can only be changed using the provided methods.
 */
export class AnswerStore implements Readable<Answers> {
  readonly subscribe: Writable<Answers>['subscribe'];
  protected update: Writable<Answers>['update'];
  protected set: Writable<Answers>['set'];

  constructor() {
    const {update, set, subscribe} = writable<Answers>(Object.freeze({}));
    this.update = update;
    this.set = set;
    this.subscribe = subscribe;
  }

  setAnswer(questionId: string, value?: Answer['value']): void {
    this.update(({...answers}) => {
      if (value === undefined) {
        delete answers[questionId];
      } else {
        answers[questionId] = {value};
      }
      return Object.freeze(answers);
    });
  }

  deleteAnswer(questionId: string): void {
    this.setAnswer(questionId);
  }

  reset(): void {
    this.set(Object.freeze({}));
  }
}
