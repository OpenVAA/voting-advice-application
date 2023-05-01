export type Candidate = {
  candidateId: string;
  party: {data: {attributes: {party: unknown}}};
  candidatePhoto: {data: {attributes: {formats: {thumbnail: {url: string}}}}};
  firstName: string;
  lastName: string;
};
