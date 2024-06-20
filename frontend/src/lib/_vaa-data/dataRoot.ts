/*
 * DataRoot is the root for all of the DataObjects. Data passed by the DataProvider is passed to the DataRoot, which converts it into DataObjects and organises them.
 *
 * TODO: Add an id checking whenever objects are added to the data root. Set this as an option of the constructor.
 */

import {Candidate} from './candidate';
import type {CandidateData} from './candidate.type';

export class DataRoot {
  protected subscriptions = new Array<UpdateHandler>();
  readonly candidates = new Array<Candidate>();

  // TODO: Maybe allow Promises to be provided as well?
  // TODO: Enforce idempotency
  provideCandidateData(data: CandidateData[]) {
    const ids = this.candidates.map((d) => d.id);
    console.info(
      `[debug] dataRoot.ts: DataRoot.provideCandidateData() with ${data.length} candidates, currently ${ids.length}`
    );
    this.candidates.push(
      ...data.filter(({id}) => !ids.includes(id)).map((d) => new Candidate(d, this))
    );
    console.info(
      `[debug] dataRoot.ts: DataRoot.provideCandidateData() after update ${this.candidates.length} candidates`
    );
    this.onUpdate();
  }

  // TODO: Check whether we should provide these updates on all levels of data as part of the DataObject class or the Collections
  subscribe(handler: UpdateHandler): () => number {
    this.subscriptions.push(handler);
    return () => this.unsubscribe(handler);
  }

  unsubscribe(handler: UpdateHandler): number {
    this.subscriptions = this.subscriptions.filter((h) => h !== handler);
    return this.subscriptions.length;
  }

  protected onUpdate() {
    this.subscriptions.forEach((handler) => handler(this));
  }
}

type UpdateHandler = (dataRoot: DataRoot) => void;
