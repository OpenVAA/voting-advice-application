export type Candidate = {
  candidateNumber: string;
  party: {data: {attributes: {party: unknown}}};
  candidatePhoto: {data: {attributes: {formats: {thumbnail: {url: string}}}}};
  firstName: string;
  lastName: string;
};
