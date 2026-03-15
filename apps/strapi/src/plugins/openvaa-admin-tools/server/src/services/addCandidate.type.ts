import type { ActionResult } from './actionResult.type';

export interface FormOptionItem {
  documentId: string;
  name: string;
  externalId: string;
}

export interface FormOptions {
  parties: Array<FormOptionItem>;
  constituencies: Array<FormOptionItem>;
  election: FormOptionItem | null;
}

export interface FormOptionsResult extends ActionResult {
  formOptions?: FormOptions;
}

export interface AddCandidateInput {
  firstName: string;
  lastName: string;
  email: string;
  partyExternalId: string;
  constituencyExternalId: string;
}

export interface AddCandidateResult extends ActionResult {
  registrationUrl?: string;
}
