export async function load({ params, url }) {
  return {
    questionId: params.questionId,
    setQuestionAsFirst: url.searchParams.has('start')
  };
}
