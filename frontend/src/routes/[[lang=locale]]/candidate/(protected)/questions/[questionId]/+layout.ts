export async function load({ params, url }) {
  return {
    questionId: params.questionId,
    editMode: url.searchParams.get('edit') === 'true'
  };
}
