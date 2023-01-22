export type Candidate = {
  candidateId: string;
  party: {data: {attributes: {party: any}}};
  candidatePhoto: {data: {attributes: {formats: {thumbnail: {url: any}}}}};
  firstName: string;
  lastName: string;
};
