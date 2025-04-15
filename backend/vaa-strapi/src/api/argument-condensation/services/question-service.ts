/**
 * Question retrieval service for argument condensation
 */

// Add an interface at the top of the file
export interface CandidateAnswer {
  candidateId: string;
  value: string | number; // Using 'any' since values could be strings, numbers, booleans, etc.
  openAnswer: { fi: string } | null;
}

/**
 * Fetches processable Likert questions (single choice ordinal type), filtered by documentIds if provided
 * @param documentIds Optional array of document IDs to filter by
 * @returns All Likert questions if no IDs provided, otherwise only matching questions
 */
async function fetchProcessableQuestions(documentIds?: Array<string>) {
  const questions = await strapi.db.query('api::question.question').findMany({
    select: ['id', 'documentId', 'text'],
    populate: {
      questionType: {
        select: ['id', 'name', 'settings']
      }
    }
  });

  const processableQuestions = questions.filter((q) => q.questionType?.settings?.type === 'singleChoiceOrdinal');

  if (!documentIds?.length) {
    return processableQuestions;
  }

  return processableQuestions.filter((q) => documentIds.includes(q.documentId));
}

/**
 * Fetches all answers for the specified question IDs from all candidates
 */
async function fetchAnswersForQuestions(
  questionDocumentIds: Array<string>
): Promise<Record<string, Array<CandidateAnswer>>> {
  const candidates = await strapi.db.query('api::candidate.candidate').findMany({
    select: ['id', 'answers'],
    where: {
      answers: {
        $notNull: true
      }
    }
  });

  const answersMap: Record<string, Array<CandidateAnswer>> = Object.fromEntries(
    questionDocumentIds.map((qId) => [qId, []])
  );

  candidates
    .filter((candidate) => typeof candidate.answers === 'object')
    .forEach((candidate) => {
      questionDocumentIds.forEach((qId) => {
        const answer = candidate.answers[qId];
        if (answer) {
          answersMap[qId].push({
            candidateId: candidate.id,
            value: answer.value,
            openAnswer: answer.info?.fi ? { fi: answer.info.fi } : null
          });
        }
      });
    });

  return answersMap;
}

/**
 * Logs detailed information about retrieved questions
 */
function logQuestionDetails(questions) {
  // Log full details of the first question to inspect structure
  if (questions.length > 0) {
    console.info('FIRST QUESTION DETAILS:');
    console.info(JSON.stringify(questions[0], null, 2));

    // Log all questions with key properties
    console.info('\nALL QUESTIONS:');
    questions.forEach((q, index) => {
      console.info(
        `[${index}] id: ${q.id}, documentId: ${q.documentId}, type: ${q.questionType?.settings?.type || 'unknown'}, text: ${JSON.stringify(q.text).substring(0, 50)}...`
      );
    });
  }
}

/**
 * Test function to verify question retrieval
 */
async function testQuestionRetrieval() {
  try {
    console.info('\n============ TESTING QUESTION RETRIEVAL ============');
    const questions = await fetchProcessableQuestions();
    logQuestionDetails(questions);
    console.info('============ TEST COMPLETE ============\n');
    return questions;
  } catch (error) {
    console.error('Error testing question retrieval:', error);
    throw error;
  }
}

/**
 * Test function to verify answer retrieval for questions
 */
async function testAnswerRetrieval() {
  const questions = await fetchProcessableQuestions();
  if (questions.length === 0) {
    return { success: false, message: 'No questions found to test' };
  }

  try {
    const testQuestionIds = questions.map((q) => q.documentId);
    const answersMap = await fetchAnswersForQuestions(testQuestionIds);
    const totalAnswers = Object.values(answersMap).reduce((sum, answers) => sum + answers.length, 0);

    return {
      success: true,
      message: 'Answer retrieval test completed successfully',
      questionsChecked: testQuestionIds.length,
      totalAnswers,
      answersByQuestion: Object.fromEntries(Object.entries(answersMap).map(([qId, answers]) => [qId, answers.length])),
      sampleAnswers: Object.fromEntries(
        Object.entries(answersMap).map(([qId, answers]) => [
          qId,
          answers[0]
            ? {
                candidateId: answers[0].candidateId,
                value: answers[0].value,
                hasOpenAnswer: !!answers[0].openAnswer
              }
            : null
        ])
      )
    };
  } catch (error) {
    return {
      success: false,
      message: `Error fetching answers: ${error.message}`,
      error: error.toString()
    };
  }
}

export default {
  fetchProcessableQuestions,
  fetchAnswersForQuestions,
  logQuestionDetails,
  testQuestionRetrieval,
  testAnswerRetrieval
};
