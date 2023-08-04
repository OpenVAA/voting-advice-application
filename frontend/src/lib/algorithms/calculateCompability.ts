import {answeredQuestions, candidateRankings} from '$lib/utils/stores';

//  Function which will get questions from frontend (via store),
//  call the calculation function
// and finally return an array of candidates with their comapatibility scores
export function calculateCandidateCompatibilities(): Promise<unknown> {
  return new Promise((resolve) => {
    // Get answers from store
    let answeredQuestionsValues;
    answeredQuestions.subscribe((value) => {
      answeredQuestionsValues = value;
    });

    // TODO: Do some stuff in here in calculating the actual score based on the answers
    console.info('Got answers from user: ', answeredQuestionsValues);

    // TODO: Return meaningful data back instead of dummy data
    const rankedCandidates = [
      {id: 1, score: 99},
      {id: 2, score: 37}
    ];

    candidateRankings.update(() => rankedCandidates);

    resolve(rankedCandidates);
  });
}
